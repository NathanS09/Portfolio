

// src/components/dashboard/rootme-widget.tsx
import { getRootMeLeaderboard } from "@/src/lib/rootme"
import { getFcscLeaderboard } from "@/src/lib/fcsc"
import LeaderboardClient from "./leaderboard"

export default async function RootMeWidget() {
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
  let rootmePlayers = [];
  let fcscPlayers = [];

  try {
    const res = await fetch(`${pbUrl}/api/collections/pf_players/records?perPage=50`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const allPlayers = data.items || [];
      
     rootmePlayers = allPlayers
        .filter((p: any) => p.platform === 'rootme')
        .map((p: any) => ({ 
          pseudo: p.pseudo, 
          login: p.account_id,
          // BLINDAGE : On s'assure que c'est bien un nombre valide et non vide
          id: (p.numeric_id && p.numeric_id !== 0) ? Number(p.numeric_id) : undefined 
        }));

      console.log(rootmePlayers)
        
      fcscPlayers = allPlayers
        .filter((p: any) => p.platform === 'fcsc')
        .map((p: any) => parseInt(p.account_id));
    }
  } catch(e) { console.error("Erreur chargement joueurs PB"); }

  const [rootmeData, fcscData] = await Promise.all([
    getRootMeLeaderboard(rootmePlayers),
    getFcscLeaderboard(fcscPlayers)
  ]);

  return <LeaderboardClient rootme={rootmeData} fcsc={fcscData} />
}