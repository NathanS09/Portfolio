// src/components/dashboard/leaderboard-client.tsx
"use client"

import { useState } from "react"
import type { CtfProfile } from "@/src/lib/fcsc"

export default function LeaderboardClient({ 
  rootme, 
  fcsc 
}: { 
  rootme: CtfProfile[], 
  fcsc: CtfProfile[] 
}) {
  const [activeTab, setActiveTab] = useState<'rootme' | 'fcsc'>('rootme')

  const currentData = activeTab === 'rootme' ? rootme : fcsc;

  return (
    <div className="flex flex-col w-full h-full">
      
      {/* Les Onglets */}
      <div className="flex gap-4 mb-4 shrink-0 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab('rootme')}
          className={`text-sm font-semibold flex items-center gap-2 pb-2 border-b-2 transition-all -mb-[9px] ${
            activeTab === 'rootme' ? 'border-green-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${activeTab === 'rootme' ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></span>
          Root-Me
        </button>
        <button
          onClick={() => setActiveTab('fcsc')}
          className={`text-sm font-semibold flex items-center gap-2 pb-2 border-b-2 transition-all -mb-[9px] ${
            activeTab === 'fcsc' ? 'border-blue-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${activeTab === 'fcsc' ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`}></span>
          FCSC 2026
        </button>
      </div>

      {/* Le Tableau des Scores */}
      <div className="flex-1 overflow-y-auto pr-2">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/50">
            <tr>
              <th className="px-4 py-3 font-medium">Rang</th>
              <th className="px-4 py-3 font-medium">Joueur</th>
              <th className="px-4 py-3 font-medium text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((student, index) => (
              <tr key={student.pseudo} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-muted-foreground">
                  #{index + 1}
                  {/* Affiche le rang global de la plateforme en petit à côté */}
                  {student.rank > 0 && <span className="text-[10px] ml-2 opacity-50">(Global: #{student.rank})</span>}
                </td>
                <td className="px-4 py-3">
                  <a href={student.profileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors block">
                    {student.pseudo}
                  </a>
                  {student.login && <span className="text-xs text-muted-foreground font-mono">{student.login}</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                  {student.score}
                </td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-muted-foreground font-mono text-sm">
                  // Aucun joueur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  )
}