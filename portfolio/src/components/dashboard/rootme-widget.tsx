

// src/components/dashboard/rootme-widget.tsx
import { getRootMeLeaderboard } from "@/src/lib/rootme"
import { getFcscLeaderboard } from "@/src/lib/fcsc"
import LeaderboardClient from "./leaderboard"

const PROMO_SRSI = [
  { pseudo: "NathanS09", login: "nathan.sanchez" },
  { pseudo: "Artemis", login: "mayline.haas", id: 330976},
  { pseudo: "mant04", login: "antoine.mallet" },
  { pseudo: "Elioxus", login: "emile.boisard"},
  { pseudo: "Dalengo", login: "ange.mercoyrol-dol"},
  { pseudo: "thomasTheLex", login: "thomas.boquet"},
  { pseudo: "mathieu_morls", login: "mathieu.moralhes"},

]

const FCSC_PLAYERS = [
  246, // emile
  234, // nathan
  289, //antoine
  254, // mathieu


]

export default async function RootMeWidget() {
  // On lance les deux requêtes API en parallèle pour charger la page 2x plus vite
  const [rootmeData, fcscData] = await Promise.all([
    getRootMeLeaderboard(PROMO_SRSI),
    getFcscLeaderboard(FCSC_PLAYERS)
  ]);

  return <LeaderboardClient rootme={rootmeData} fcsc={fcscData} />
}