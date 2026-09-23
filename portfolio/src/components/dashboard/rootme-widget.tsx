// src/components/dashboard/rootme-widget.tsx
import { getRootMeLeaderboard } from "@/src/lib/rootme"
// import { getFcscLeaderboard } from "@/src/lib/fcsc" // Gardé pour plus tard
import { pbFetch } from "@/src/lib/pocketbase"
import LeaderboardClient from "./leaderboard"
import type { RootMeStudent } from "@/src/lib/rootme"

interface PbPlayerRecord {
  platform: string;
  pseudo: string;
  account_id: string;
  numeric_id?: number;
}

export default async function RootMeWidget() {
  let rootmePlayers: RootMeStudent[] = [];
  // let fcscPlayers = []; // FCSC ARCHIVÉ

  try {
    const res = await pbFetch(`/api/collections/pf_players/records?perPage=50`, { next: { revalidate: 60 } });
    const data = await res.json();
    const allPlayers: PbPlayerRecord[] = data.items || [];

    rootmePlayers = allPlayers
      .filter((p) => p.platform === 'rootme')
      .map((p) => ({
        pseudo: p.pseudo,
        login: p.account_id,
        id: (p.numeric_id && p.numeric_id !== 0) ? Number(p.numeric_id) : undefined
      }));

    /* FCSC ARCHIVÉ
    fcscPlayers = allPlayers
      .filter((p: any) => p.platform === 'fcsc')
      .map((p: any) => parseInt(p.account_id));
    */
  } catch(e) {
    console.error("[Dashboard] Erreur réseau critique vers PocketBase :", e);
  }

  // On lance uniquement Root-Me
  const rootmeData = await getRootMeLeaderboard(rootmePlayers);
  // const fcscData = await getFcscLeaderboard(fcscPlayers); // FCSC ARCHIVÉ

  return <LeaderboardClient rootme={rootmeData} fcsc={[]} />
}