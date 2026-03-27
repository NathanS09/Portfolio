// src/lib/fcsc.ts
"use server"

export interface CtfProfile {
  pseudo: string;
  login?: string;
  rank: number;
  score: number;
  profileUrl: string;
}

export async function getFcscLeaderboard(ids: number[]): Promise<CtfProfile[]> {
  const results: CtfProfile[] = [];

  for (const id of ids) {
    try {
      // Appel direct à l'API CTFd du FCSC
      const res = await fetch(`https://fcsc.fr/api/v1/users/${id}`, {
        next: { revalidate: 3600 } // Cache d'une heure pour soulager leurs serveurs
      });

      if (!res.ok) continue;

      const json = await res.json();
      
      // Sécurité : on vérifie que l'API a bien répondu avec succès
      if (!json.success || !json.data) continue;

      const userData = json.data;

      results.push({
        pseudo: userData.name || `Hacker_${id}`,
        rank: userData.place || 0,   // "place" est null si 0 point
        score: userData.score || 0,
        // On garde l'URL HTML classique pour que le lien dans le widget soit cliquable par l'utilisateur !
        profileUrl: `https://fcsc.fr/users/${id}` 
      });
    } catch (error) {
      console.error(`Erreur API FCSC pour l'ID ${id}:`, error);
    }
  }

  // Tri par ordre décroissant (le plus grand score en premier)
  return results.sort((a, b) => b.score - a.score);
}