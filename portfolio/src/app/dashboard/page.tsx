import { unstable_cache } from "next/cache"
import RootMeWidget from "@/src/components/dashboard/rootme-widget"
import FeedsWidget from "@/src/components/dashboard/feeds-widget"
import EdusignWidget from "@/src/components/dashboard/edusign-widget" // IMPORT EDUSIGN
import { getAnssiAlerts, getGeopoliticsFeed, getTheRecordFeed, getIcsCertFeed } from "@/src/lib/feeds"
import { getEdusignSchedule } from "@/src/lib/edusign"

const MIN_WEEK_OFFSET = -4
const MAX_WEEK_OFFSET = 8

const getCachedEdusignSchedule = unstable_cache(
  async (week: number) => getEdusignSchedule(week),
  ["edusign-schedule"],
  { revalidate: 900, tags: ["edusign"] }
)

function parseWeekOffset(raw: string | undefined): number {
  const week = Number(raw)
  if (!Number.isInteger(week) || week < MIN_WEEK_OFFSET || week > MAX_WEEK_OFFSET) return 0
  return week
}

interface DashboardPageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const week = parseWeekOffset(params.week)

  const [anssiData, geoData, recordData, icsCertData, { courses, isCached }] = await Promise.all([
    getAnssiAlerts(),
    getGeopoliticsFeed(),
    getTheRecordFeed(),
    getIcsCertFeed(),
    getCachedEdusignSchedule(week),
  ])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-[400px] flex flex-col rounded-xl border border-border/50 bg-card p-6 shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2"><RootMeWidget /></div>
      </div>
      <div className="h-[400px] flex flex-col rounded-xl border border-border/50 bg-card p-6 pt-5 shadow-sm overflow-hidden">
        <FeedsWidget anssi={anssiData} geo={geoData} record={recordData} icsCert={icsCertData} />
      </div>

      {/* LIGNE 2 - PLEINE LARGEUR : Emploi du temps EDUSIGN */}
      <div className="min-h-[500px] h-[60vh] flex flex-col rounded-xl border border-border/50 bg-card p-6 shadow-sm md:col-span-2 overflow-hidden">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 shrink-0 border-b border-border/40 pb-2">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          Planning
        </h3>
        <div className="flex-1 overflow-hidden">
          <EdusignWidget
            courses={courses}
            isCached={isCached}
            week={week}
            minWeek={MIN_WEEK_OFFSET}
            maxWeek={MAX_WEEK_OFFSET}
          />
        </div>
      </div>
    </div>
  )
}
