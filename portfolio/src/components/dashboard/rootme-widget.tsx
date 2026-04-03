// src/components/dashboard/rootme-widget.tsx
import { getRootMeLeaderboard } from "@/src/lib/rootme"
import { getFcscLeaderboard } from "@/src/lib/fcsc"
import LeaderboardClient from "./leaderboard"

export default async function RootMeWidget() {
  // 🛠️ LE CORRECTIF : On cherche l'URL interne en priorité (pour Docker), sinon l'URL externe, sinon localhost
  const pbUrl = process.env.PB_INTERNAL_URL || process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
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
          id: (p.numeric_id && p.numeric_id !== 0) ? Number(p.numeric_id) : undefined 
        }));
        
      fcscPlayers = allPlayers
        .filter((p: any) => p.platform === 'fcsc')
        .map((p: any) => parseInt(p.account_id));
    } else {
      console.error("[Dashboard] PocketBase a refusé la connexion HTTP:", res.status);
    }
  } catch(e) { 
    // Si Hairpin NAT bloque la requête, on le verra clairement dans 'docker logs' !
    console.error("[Dashboard] Erreur réseau critique vers PocketBase :", e); 
  }

  const [rootmeData, fcscData] = await Promise.all([
    getRootMeLeaderboard(rootmePlayers),
    getFcscLeaderboard(fcscPlayers)
  ]);

  return <LeaderboardClient rootme={rootmeData} fcsc={fcscData} />
}