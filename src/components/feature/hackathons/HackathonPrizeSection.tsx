import { forwardRef } from "react"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HackathonDetail } from "@/types/hackathonDetail"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  prize: NonNullable<HackathonDetail["sections"]["prize"]>
}

const SIZES = ["h-56", "h-48", "h-40", "h-32"]
const ICON_SIZES = ["text-6xl", "text-5xl", "text-4xl", "text-3xl"]
const PLACE_SIZES = ["text-base", "text-sm", "text-xs", "text-xs"]
const AMOUNT_SIZES = ["text-2xl", "text-xl", "text-base", "text-sm"]
const STYLES = [
  "bg-gradient-to-b from-yellow-400/30 via-yellow-300/20 to-yellow-200/10 border-yellow-300 text-yellow-800",
  "bg-gradient-to-b from-sky-200/40 via-sky-100/20 to-sky-50/10 border-sky-300 text-sky-700",
  "bg-gradient-to-b from-green-300/30 via-green-200/20 to-green-100/10 border-green-300 text-green-700",
]
const PLACE_ICONS = ["🥇", "🥈", "🥉"]

const HackathonPrizeSection = forwardRef<HTMLElement, Props>(({ prize }, ref) => {
  return (
    <section ref={ref} id="prize" data-testid="hackathon-section-prize">
      <HackathonSectionHeading icon={Trophy}>상금</HackathonSectionHeading>
      <div className="flex items-end gap-3">
        {prize.items.slice(0, 3).map((item, i) => (
          <div
            key={item.place}
            className={cn(
              "flex-1 rounded-xl border flex flex-col items-start justify-center gap-2 px-5 transition-transform hover:-translate-y-1",
              SIZES[i] ?? "h-20",
              STYLES[i] ?? "bg-muted/30 border-border text-muted-foreground",
            )}
          >
            <span className={ICON_SIZES[i] ?? "text-base"}>{PLACE_ICONS[i] ?? "🏅"}</span>
            <span className={cn("font-semibold opacity-70", PLACE_SIZES[i] ?? "text-xs")}>{item.place}</span>
            <span className={cn("font-bold", AMOUNT_SIZES[i] ?? "text-xs")}>
              {(item.amountKRW / 10000).toLocaleString("ko-KR")}만원
            </span>
          </div>
        ))}
      </div>

      {prize.items.length > 3 && (
        <div className="space-y-2 mt-3">
          {prize.items.slice(3).map((item) => (
            <div
              key={item.place}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-3.5"
            >
              <span className="text-sm font-semibold text-foreground">{item.place}</span>
              <span className="text-sm font-bold text-foreground">
                {(item.amountKRW / 10000).toLocaleString("ko-KR")}만원
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
})
HackathonPrizeSection.displayName = "HackathonPrizeSection"
export default HackathonPrizeSection
