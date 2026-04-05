import { forwardRef } from "react"
import { Users, FileText } from "lucide-react"
import type { HackathonDetail } from "@/types/hackathonDetail"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  overview: HackathonDetail["sections"]["overview"]
  info: HackathonDetail["sections"]["info"]
}

const HackathonOverviewSection = forwardRef<HTMLElement, Props>(({ overview, info }, ref) => {
  return (
    <section ref={ref} id="overview" data-testid="hackathon-section-overview">
      <HackathonSectionHeading icon={FileText}>개요</HackathonSectionHeading>
      <div className="space-y-6">
        <p className="text-base leading-relaxed text-gray-700">{overview.summary}</p>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Users size={15} className="text-blue-500 shrink-0" />
            <span className="text-sm text-gray-400">팀 구성</span>
            <span className="text-sm font-medium text-gray-800">
              {overview.teamPolicy.allowSolo ? "개인 참가 가능" : "팀 참가만 가능"}
              {" · "}최대 {overview.teamPolicy.maxTeamSize}명
            </span>
          </div>
        </div>

        {info.notice.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">공지사항</p>
            <ul className="space-y-2">
              {info.notice.map((n, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
})
HackathonOverviewSection.displayName = "HackathonOverviewSection"
export default HackathonOverviewSection
