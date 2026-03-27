// src/app/dashboard/page.tsx
import RootMeWidget from "@/src/components/dashboard/rootme-widget"
import FeedsWidget from "@/src/components/dashboard/feeds-widget"
import AurigaWidget from "@/src/components/dashboard/auriga-widget"
import { getAnssiAlerts, getGeopoliticsFeed } from "@/src/lib/feeds"

export default async function DashboardPage() {
  const anssiData = await getAnssiAlerts()
  const geoData = await getGeopoliticsFeed()

  return (
    // Suppression de auto-rows-[400px] pour des hauteurs personnalisées
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* LIGNE 1 - COLONNE 1 : Root-Me */}
      <div className="h-[400px] flex flex-col rounded-xl border border-border/50 bg-card p-6 shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2">
          <RootMeWidget />
        </div>
      </div>

      {/* LIGNE 1 - COLONNE 2 : Flux */}
      <div className="h-[400px] flex flex-col rounded-xl border border-border/50 bg-card p-6 pt-5 shadow-sm overflow-hidden">
        <FeedsWidget anssi={anssiData} geo={geoData} />
      </div>

      {/* LIGNE 2 - PLEINE LARGEUR : Emploi du temps Auriga */}
      {/* On utilise min-h-[500px] et une hauteur relative à l'écran (60vh) */}
      <div className="min-h-[500px] h-[60vh] flex flex-col rounded-xl border border-border/50 bg-card p-6 shadow-sm md:col-span-2 overflow-hidden">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 shrink-0 border-b border-border/40 pb-2">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          Planning
        </h3>
        {/* On enlève l'overflow ici, car c'est le widget lui-même qui gérera ses scrolls */}
        <div className="flex-1 overflow-hidden">
          <AurigaWidget />
        </div>
      </div>

    </div>
  )
}