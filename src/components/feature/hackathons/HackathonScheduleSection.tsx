import { forwardRef } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/formatDate"
import type { HackathonDetail } from "@/types/hackathonDetail"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  schedule: HackathonDetail["sections"]["schedule"]
}

const HackathonScheduleSection = forwardRef<HTMLElement, Props>(({ schedule }, ref) => {
  return (
    <section ref={ref} id="schedule">
      <HackathonSectionHeading icon={Clock}>일정</HackathonSectionHeading>
      <div className="space-y-0">
        {schedule.milestones.map((milestone, i) => {
          const isLast = i === schedule.milestones.length - 1
          return (
            <div key={milestone.at} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-primary-400 ring-2 ring-background shrink-0" />
                {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className={cn("flex-1 min-w-0", isLast ? "pb-0" : "pb-5")}>
                <p className="text-sm font-medium text-foreground">{milestone.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(milestone.at, schedule.timezone)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
})
HackathonScheduleSection.displayName = "HackathonScheduleSection"
export default HackathonScheduleSection
