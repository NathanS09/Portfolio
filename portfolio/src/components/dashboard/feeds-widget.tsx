// src/components/dashboard/feeds-widget.tsx
"use client"

import { useState } from "react"
import type { AlertItem } from "@/src/lib/feeds"

type FeedTab = 'anssi' | 'geo' | 'record'

const TAB_META: Record<FeedTab, { label: string; dot: string; border: string }> = {
  anssi: { label: 'CERT-FR', dot: 'bg-orange-500', border: 'border-orange-500' },
  geo: { label: 'GÉOPOLITIQUE', dot: 'bg-purple-500', border: 'border-purple-500' },
  record: { label: 'THE RECORD', dot: 'bg-blue-500', border: 'border-blue-500' },
}

export default function FeedsWidget({
  anssi,
  geo,
  record,
}: {
  anssi: AlertItem[],
  geo: AlertItem[],
  record: AlertItem[],
}) {
  const [activeTab, setActiveTab] = useState<FeedTab>('anssi')
  const feeds: Record<FeedTab, AlertItem[]> = { anssi, geo, record }
  const currentFeed = feeds[activeTab]

  return (
    <div className="flex flex-col h-full w-full">

      {/* Les Onglets */}
      <div className="flex gap-4 mb-4 shrink-0 border-b border-border/40 pb-2">
        {(Object.keys(TAB_META) as FeedTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-semibold flex items-center gap-2 pb-2 border-b-2 transition-all -mb-[9px] ${
              activeTab === tab ? `${TAB_META[tab].border} text-foreground` : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${activeTab === tab ? TAB_META[tab].dot : 'bg-muted'}`}></span>
            {TAB_META[tab].label}
          </button>
        ))}
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
                ) : activeTab === 'record' ? (
                  <>
                    <span className="text-blue-400/80 truncate max-w-[65%]" title={item.summary}>{item.summary}</span>
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
