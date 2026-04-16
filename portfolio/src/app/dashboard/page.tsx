import RootMeWidget from "@/src/components/dashboard/rootme-widget"
import FeedsWidget from "@/src/components/dashboard/feeds-widget"
import EdusignWidget from "@/src/components/dashboard/edusign-widget" // IMPORT EDUSIGN
import { getAnssiAlerts, getGeopoliticsFeed } from "@/src/lib/feeds"

export default async function DashboardPage() {
  const anssiData = await getAnssiAlerts()
  const geoData = await getGeopoliticsFeed()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-[400px] flex flex-col rounded-xl border border-border/50 bg-card p-6 shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2"><RootMeWidget /></div>
      </div>
      <div className="h-[400px] flex flex-col rounded-xl border border-border/50 bg-card p-6 pt-5 shadow-sm overflow-hidden">
        <FeedsWidget anssi={anssiData} geo={geoData} />
      </div>

      {/* LIGNE 2 - PLEINE LARGEUR : Emploi du temps EDUSIGN */}
      <div className="min-h-[500px] h-[60vh] flex flex-col rounded-xl border border-border/50 bg-card p-6 shadow-sm md:col-span-2 overflow-hidden">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 shrink-0 border-b border-border/40 pb-2">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          Planning
        </h3>
        <div className="flex-1 overflow-hidden">
          <EdusignWidget />
        </div>
      </div>
    </div>
  )
}