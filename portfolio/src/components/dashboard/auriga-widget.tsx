// src/components/dashboard/auriga-widget.tsx
"use client"

import { useState, useEffect } from "react"
import { getAurigaSchedule, updateAurigaTokenManually, type Course } from "@/src/lib/auriga"

export default function AurigaWidget() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCachedData, setIsCachedData] = useState(false)

  // Fetch des données
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsCachedData(false);
    
    getAurigaSchedule(weekOffset).then((response) => {
      if (isMounted) {
        setCourses(response.courses);
        setIsCachedData(response.isCached);
        setIsLoading(false);
      }
    });

    return () => { isMounted = false };
  }, [weekOffset]);


  const groupedCourses = courses.reduce((acc, course) => {
    if (!acc[course.dateStr]) acc[course.dateStr] = [];
    acc[course.dateStr].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  return (
    <div className="flex flex-col h-full w-full relative">
      
      {/* HEADER: Navigation avec Chevrons */}
      <div className="flex items-center justify-between mb-4 shrink-0 border-b border-border/40 pb-3 relative">
        <button 
          onClick={() => setWeekOffset(prev => prev - 1)}
          className="text-xs font-mono font-semibold px-3 py-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground border border-border/50"
        >
          &lt; SEMAINE PREC.
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-foreground tracking-widest text-blue-500">
            {weekOffset === 0 ? "SEMAINE EN COURS" : `SEMAINE ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
          </span>
          {isCachedData && (
            <span className="text-[10px] bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded mt-1">
              ⚠️ MODE HORS-LIGNE (CACHE)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="text-xs font-mono font-semibold px-3 py-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground border border-border/50"
          >
            SEMAINE SUIV. &gt;
          </button>
        </div>
      </div>

      {/* ZONE KANBAN (Jours) */}
      <div className="flex gap-6 w-full h-full overflow-x-auto pb-4 snap-x snap-mandatory">
        
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center font-mono text-sm text-muted-foreground animate-pulse">
            // Synchronisation...
          </div>
        ) : Object.keys(groupedCourses).length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center font-mono text-sm text-muted-foreground gap-2">
            <span>// Aucun cours disponible.</span>
            {isCachedData && <span className="text-xs opacity-50">Le cache est vide.</span>}
          </div>
        ) : (
          Object.entries(groupedCourses).map(([date, dayCourses]) => (
            <div key={date} className="min-w-[320px] max-w-[320px] flex flex-col snap-start shrink-0 h-full">
              <div className="sticky top-0 bg-card z-10 pb-3 mb-2 border-b border-border/40">
                <span className="text-sm font-mono font-bold text-foreground bg-muted/30 px-3 py-1.5 rounded">
                  {date.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
                {dayCourses.map((course) => (
                  <div key={course.id} className="flex flex-col justify-between p-4 rounded-lg border border-border/50 bg-muted/10 border-l-4 border-l-blue-500 hover:bg-muted/20 transition-colors">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{course.startTime} - {course.endTime}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">{course.type}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground mb-3 leading-tight">{course.title}</h4>
                    </div>
                    <div className="flex justify-between items-end mt-2 pt-3 border-t border-border/40">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">📍 {course.room}</span>
                      <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={course.professor}>👨‍🏫 {course.professor}</span>
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