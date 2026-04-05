import { forwardRef } from "react"
import { CheckCircle2 } from "lucide-react"
import type { HackathonDetail } from "@/types/hackathonDetail"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  eval: HackathonDetail["sections"]["eval"]
}

const HackathonEvalSection = forwardRef<HTMLElement, Props>(({ eval: evalSection }, ref) => {
  return (
    <section ref={ref} id="eval" data-testid="hackathon-section-eval">
      <HackathonSectionHeading icon={CheckCircle2}>평가</HackathonSectionHeading>
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">평가 지표</p>
          <p className="text-lg font-bold text-blue-600">{evalSection.metricName}</p>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{evalSection.description}</p>
        </div>

        {evalSection.scoreDisplay && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {evalSection.scoreDisplay.label}
            </p>
            <div className="space-y-2">
              {evalSection.scoreDisplay.breakdown.map((b) => (
                <div key={b.key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-16 shrink-0">{b.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-green-400"
                      style={{ width: `${b.weightPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-blue-600 w-10 text-right shrink-0">
                    {b.weightPercent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {evalSection.limits && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">최대 실행 시간</p>
              <p className="text-base font-semibold text-gray-800">
                {evalSection.limits.maxRuntimeSec >= 60
                  ? `${Math.round(evalSection.limits.maxRuntimeSec / 60)}분`
                  : `${evalSection.limits.maxRuntimeSec}초`}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-400 mb-1">일일 최대 제출</p>
              <p className="text-base font-semibold text-gray-800">{evalSection.limits.maxSubmissionsPerDay}회</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
})
HackathonEvalSection.displayName = "HackathonEvalSection"
export default HackathonEvalSection
