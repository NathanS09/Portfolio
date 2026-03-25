// src/components/dashboard/rootme-widget.tsx
import { getRootMeLeaderboard } from "@/src/lib/rootme"

const PROMO_SRSI = [
  { pseudo: "NathanS09", login: "nathan.sanchez" },
  { pseudo: "Artemis", login: "mayline.haas", id: 330976},
  { pseudo: "mant04", login: "antoine.mallet" },
  { pseudo: "Elioxus", login: "emile.boisard"}
]

export default async function RootMeWidget() {
  const leaderboard = await getRootMeLeaderboard(PROMO_SRSI)

  if (!leaderboard || leaderboard.length === 0) {
    return <p className="text-sm text-destructive">Impossible de charger le classement.</p>
  }

  return (
    <div className="w-full">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
          <tr>
            <th className="px-4 py-3 font-medium">Rang</th>
            <th className="px-4 py-3 font-medium">Pseudo (Login)</th>
            <th className="px-4 py-3 font-medium text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((student, index) => (
            <tr 
              key={student.login} 
              className="border-b border-border/20 hover:bg-muted/10 transition-colors"
            >
              <td className="px-4 py-3 font-mono font-bold text-green-500">
                #{index + 1}
              </td>
              <td className="px-4 py-3">
                <a 
                  href={student.profileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground hover:text-primary transition-colors block"
                >
                  {student.pseudo}
                </a>
                <span className="text-xs text-muted-foreground font-mono">{student.login}</span>
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold">
                {student.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}