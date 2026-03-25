// src/lib/rootme.ts

export interface RootMeStudent {
  pseudo: string;
  login: string;
  id?: number; // Nouveau paramètre optionnel : l'ID direct !
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

  for (const student of students) {
    try {
      let userId = student.id;

      // 1. Si on n'a pas mis l'ID en dur, on le cherche via le pseudo
      if (!userId) {
        const searchRes = await fetch(`https://api.www.root-me.org/auteurs?nom=${student.pseudo}`, {
          headers: { Cookie: `api_key=${process.env.ROOTME_API_KEY}` },
          next: { revalidate: 3600 }
        });
        const searchData = await searchRes.json();
        
        if (!searchData || !searchData[0] || !searchData[0][0]) continue;
        userId = searchData[0][0]["id_auteur"];
      }

      // 2. Récupération des stats détaillées
      const statsRes = await fetch(`https://api.www.root-me.org/auteurs/${userId}`, {
        headers: { Cookie: `api_key=${process.env.ROOTME_API_KEY}` },
        next: { revalidate: 3600 }
      });
      const statsData = await statsRes.json();

      results.push({
        pseudo: student.pseudo,
        login: student.login,
        rank: statsData.position || 0,
        score: statsData.score || 0,
        profileUrl: `https://www.root-me.org/${student.id ? `${student.pseudo}-${student.id}` : student.pseudo}`
      });
    } catch (error) {
      console.error(`Erreur pour le joueur ${student.pseudo}:`, error);
    }
  }

  return results.sort((a, b) => b.score - a.score);
}