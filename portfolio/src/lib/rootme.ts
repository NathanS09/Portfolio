// src/lib/rootme.ts

export interface RootMeStudent {
  pseudo: string;
  login: string;
  id?: number; 
}

export interface RootMeProfile {
  pseudo: string;
  login: string;
  rank: number;
  score: number;
  profileUrl: string;
}

export async function getRootMeLeaderboard(
  students: RootMeStudent[]
): Promise<RootMeProfile[]> {
  const results: RootMeProfile[] = [];

  // On prépare un déguisement parfait de navigateur web
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "keep-alive"
  };

  // On ne met le cookie que si la clé existe dans le .env
  if (process.env.ROOTME_API_KEY) {
    headers["Cookie"] = `api_key=${process.env.ROOTME_API_KEY.trim()}`;
    console.log(process.env.ROOTME_API_KEY)
  } else {
    console.warn("[Root-Me] ⚠️ Attention: ROOTME_API_KEY est introuvable dans le .env !");
  }

  for (const student of students) {
    try {

      let userId = student.id;

      // 1. Recherche par pseudo si pas d'ID
      if (!userId || isNaN(userId)) {
        console.log(`[Root-Me] Recherche de ${student.pseudo} via API...`);
        
        const searchRes = await fetch(`https://api.www.root-me.org/auteurs?nom=${encodeURIComponent(student.pseudo)}`, {
          headers,
          next: { revalidate: 3600 }
        });
        
        if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status} sur la recherche`);
        const contentType = searchRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) throw new Error("Réponse non-JSON bloquée par un WAF");

        const searchData = await searchRes.json();
        if (!searchData || !searchData[0] || !searchData[0][0]) throw new Error("Joueur introuvable dans la recherche");
        userId = searchData[0][0]["id_auteur"];
      }

      // 2. Récupération des stats avec le BON userId
      const statsRes = await fetch(`https://api.www.root-me.org/auteurs/${userId}`, {
        headers,
        next: { revalidate: 300 }
      });

      if (!statsRes.ok) throw new Error(`HTTP ${statsRes.status} sur les stats`);
      const statsContentType = statsRes.headers.get("content-type");
      if (!statsContentType || !statsContentType.includes("application/json")) throw new Error("Réponse stats non-JSON");

      const statsData = await statsRes.json();
      // 3. L'algorithme des URL Root-Me
      let finalUrl = `https://www.root-me.org/${statsData.nom}`;
      if (student.id) {
        finalUrl = `https://www.root-me.org/${statsData.nom}-${student.id}`;
      }

      results.push({
        pseudo: student.pseudo,
        login: student.login,
        rank: statsData.position || 0,
        score: statsData.score || 0,
        profileUrl: finalUrl
      });
      
    } catch (error: any) {
      console.warn(`[Root-Me] Échec pour ${student.pseudo}. Cause :`, error.cause?.message || error.message || error);
    }
  }

  return results.sort((a, b) => b.score - a.score);
}