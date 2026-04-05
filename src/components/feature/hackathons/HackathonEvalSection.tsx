import { forwardRef } from "react"
import { CheckCircle2 } from "lucide-react"
import type { HackathonDetail } from "@/types/hackathonDetail"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  eval: HackathonDetail["sections"]["eval"]
}

const HackathonEvalSection = forwardRef<HTMLElement, Props>(({ eval: evalSection }, ref) => {
  return (
    <section ref={ref} id="eval">
      <HackathonSectionHeading icon={CheckCircle2}>평가</HackathonSectionHeading>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">평가 지표</p>
          <p className="text-lg font-bold text-primary-600">{evalSection.metricName}</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{evalSection.description}</p>
        </div>

        {evalSection.scoreDisplay && (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {evalSection.scoreDisplay.label}
            </p>
            <div className="space-y-2">
              {evalSection.scoreDisplay.breakdown.map((b) => (
                <div key={b.key} className="flex items-center gap-3">
                  <span className="text-sm text-foreground w-16 shrink-0">{b.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary-400" style={{ width: `${b.weightPercent}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-primary-600 w-10 text-right shrink-0">
                    {b.weightPercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {evalSection.limits && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">최대 실행 시간</p>
              <p className="text-base font-semibold">
                {evalSection.limits.maxRuntimeSec >= 60
                  ? `${Math.round(evalSection.limits.maxRuntimeSec / 60)}분`
                  : `${evalSection.limits.maxRuntimeSec}초`}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">일일 최대 제출</p>
              <p className="text-base font-semibold">{evalSection.limits.maxSubmissionsPerDay}회</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
})
HackathonEvalSection.displayName = "HackathonEvalSection"
export default HackathonEvalSection
