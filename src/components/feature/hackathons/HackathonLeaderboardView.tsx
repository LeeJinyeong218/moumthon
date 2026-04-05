import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/formatDate"
import { RankBadge } from "@/components/common"
import type { Leaderboard, HackathonDetail } from "@/types/hackathonDetail"

interface Props {
  leaderboard?: Leaderboard
  note: string
  timezone: string
}

export default function HackathonLeaderboardView({ leaderboard, note, timezone }: Props) {
  return (
    <div>
      {leaderboard && leaderboard.entries.length > 0 ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-primary-600" />
              <span className="text-sm font-semibold">Public 리더보드</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(leaderboard.updatedAt, timezone)} 기준
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="text-center py-3 pl-5 pr-3 w-12">순위</th>
                <th className="text-left py-3 px-3">팀</th>
                <th className="text-right py-3 pl-3 pr-5">점수</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.entries.map((entry) => (
                <tr
                  key={entry.teamName}
                  className={cn(
                    "border-b border-border last:border-0",
                    entry.rank <= 3 ? "bg-primary-50/50" : "hover:bg-muted/20",
                  )}
                >
                  <td className="py-4 pl-5 pr-3 text-center">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="py-4 px-3 font-medium">{entry.teamName}</td>
                  <td className="py-4 pl-3 pr-5 text-right font-mono font-semibold text-primary-600">
                    {entry.score < 1 ? entry.score.toFixed(4) : entry.score.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">아직 제출된 결과가 없습니다.</p>
      )}
      {note && (
        <p className="mt-3 text-xs text-muted-foreground px-1">* {note}</p>
      )}
    </div>
  )
}
