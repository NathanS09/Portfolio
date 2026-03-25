// src/components/dashboard/feeds-widget.tsx
"use client"

import { useState } from "react"
import type { AlertItem } from "@/src/lib/feeds"

export default function FeedsWidget({ 
  anssi, 
  geo 
}: { 
  anssi: AlertItem[], 
  geo: AlertItem[] 
}) {
  const [activeTab, setActiveTab] = useState<'anssi' | 'geo'>('anssi')
  const currentFeed = activeTab === 'anssi' ? anssi : geo

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* Les Onglets */}
      <div className="flex gap-4 mb-4 shrink-0 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab('anssi')}
          className={`text-sm font-semibold flex items-center gap-2 pb-2 border-b-2 transition-all -mb-[9px] ${
            activeTab === 'anssi' ? 'border-orange-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${activeTab === 'anssi' ? 'bg-orange-500' : 'bg-muted'}`}></span>
          CERT-FR
        </button>
        <button
          onClick={() => setActiveTab('geo')}
          className={`text-sm font-semibold flex items-center gap-2 pb-2 border-b-2 transition-all -mb-[9px] ${
            activeTab === 'geo' ? 'border-purple-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${activeTab === 'geo' ? 'bg-purple-500' : 'bg-muted'}`}></span>
          GÉOPOLITIQUE
        </button>
      </div>

      {/* La liste des articles */}
      <div className="flex-1 overflow-y-auto pr-2">
        <ul className="space-y-4">
          {currentFeed.map((item) => (
            <li key={item.id} className="border-b border-border/20 pb-3 last:border-0">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors leading-tight block mb-1">
                {item.title}
              </a>
              {/* Le bas de la carte (Source et Date) */}
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mt-2">
                {activeTab === 'geo' ? (
                  <>
                    <span className="text-purple-400/80 truncate max-w-[65%]" title={item.summary}>{item.summary}</span>
                    <span className="shrink-0">{item.date}</span>
                  </>
                ) : (
                  <>
                    <span>{item.date}</span>
                    <span className="text-orange-500/80">Alerte</span>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      
    </div>
  )
}