// src/components/dashboard/edusign-widget.tsx
import Link from "next/link"
import type { Course } from "@/src/lib/edusign"

interface EdusignWidgetProps {
  courses: Course[];
  isCached: boolean;
  week: number;
  minWeek: number;
  maxWeek: number;
}

const navButtonClass = "text-xs font-mono font-semibold px-3 py-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground border border-border/50"
const navButtonDisabledClass = "text-xs font-mono font-semibold px-3 py-1.5 rounded text-muted-foreground/40 border border-border/30 cursor-not-allowed"

export default function EdusignWidget({ courses, isCached, week, minWeek, maxWeek }: EdusignWidgetProps) {
  const groupedCourses = courses.reduce((acc, course) => {
    if (!acc[course.dateStr]) acc[course.dateStr] = [];
    acc[course.dateStr].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex items-center justify-between mb-4 shrink-0 border-b border-border/40 pb-3 relative">
        {week > minWeek ? (
          <Link href={`?week=${week - 1}`} className={navButtonClass}>&lt; SEMAINE PREC.</Link>
        ) : (
          <span className={navButtonDisabledClass}>&lt; SEMAINE PREC.</span>
        )}

        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-foreground tracking-widest text-blue-500">
            {week === 0 ? "SEMAINE EN COURS" : `SEMAINE ${week > 0 ? '+' : ''}${week}`}
          </span>
          {isCached && <span className="text-[10px] bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded mt-1">⚠️ MODE HORS-LIGNE</span>}
        </div>

        {week < maxWeek ? (
          <Link href={`?week=${week + 1}`} className={navButtonClass}>SEMAINE SUIV. &gt;</Link>
        ) : (
          <span className={navButtonDisabledClass}>SEMAINE SUIV. &gt;</span>
        )}
      </div>

      <div className="flex gap-6 w-full h-full overflow-x-auto pb-4 snap-x snap-mandatory">
        {Object.keys(groupedCourses).length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center font-mono text-sm text-muted-foreground gap-2">
            <span>{"// Aucun cours disponible."}</span>
          </div>
        ) : (
          Object.entries(groupedCourses).map(([date, dayCourses]) => (
            <div key={date} className="min-w-[320px] max-w-[320px] flex flex-col snap-start shrink-0 h-full">
              <div className="sticky top-0 bg-card z-10 pb-3 mb-2 border-b border-border/40">
                <span className="text-sm font-mono font-bold text-foreground bg-muted/30 px-3 py-1.5 rounded">{date.toUpperCase()}</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
                {dayCourses.map((course) => (
                  <div key={course.id} className={`flex flex-col justify-between p-4 rounded-lg border transition-colors ${course.isPresent ? 'border-green-500/50 bg-green-500/5 border-l-4 border-l-green-500' : 'border-border/50 bg-muted/10 border-l-4 border-l-blue-500 hover:bg-muted/20'}`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{course.startTime} - {course.endTime}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${course.type === 'EXAM' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{course.type}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground mb-3 leading-tight flex items-start justify-between gap-2">
                        {course.title}
                        {course.isPresent && <span className="text-green-500 shrink-0" title="Présence validée">✓</span>}
                      </h4>
                    </div>
                    <div className="flex justify-between items-end mt-2 pt-3 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">📍 {course.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
