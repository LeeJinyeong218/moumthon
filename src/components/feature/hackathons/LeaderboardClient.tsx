"use client"

import { Trophy, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/formatDate"
import { RankBadge } from "@/components/common"
import type { Leaderboard } from "@/types/hackathonDetail"

interface Props {
  leaderboard: Leaderboard
  slug: string
  hackathonTitle: string
  note: string
}

export default function LeaderboardClient({ leaderboard, hackathonTitle, note }: Props) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{hackathonTitle}</h1>
        <p className="mt-1 text-sm text-gray-400">리더보드</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">Public 리더보드</span>
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={11} />
            {formatDate(leaderboard.updatedAt, "Asia/Seoul")} 기준
          </span>
        </div>

        {leaderboard.entries.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            아직 제출된 결과가 없습니다.
          </div>
        ) : (
          <table data-testid="hackathon-leaderboard-table" className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-center py-3 pl-5 pr-3 w-12">순위</th>
                <th className="text-left py-3 px-3">팀</th>
                <th className="text-right py-3 px-3">점수</th>
                {leaderboard.entries.some((e) => e.scoreBreakdown) && (
                  <th className="text-right py-3 px-3 hidden sm:table-cell">세부 점수</th>
                )}
                <th className="text-right py-3 pl-3 pr-5">제출 시각</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.entries.map((entry, i) => {
                const isNoSubmission = entry.status === "no-submission"
                const isTop3 = !isNoSubmission && entry.rank <= 3
                const rowKey = entry.teamName.toLowerCase().replace(/\s+/g, "-")
                return (
                  <tr
                    key={i}
                    data-testid={`hackathon-leaderboard-row-${rowKey}`}
                    className={cn(
                      "border-b border-gray-100 last:border-0 transition-colors",
                      isTop3 ? "bg-blue-50/40" : "hover:bg-gray-50",
                    )}
                  >
                    <td className="py-4 pl-5 pr-3 text-center">
                      {isNoSubmission ? (
                        <span className="text-xs text-gray-400">-</span>
                      ) : (
                        <RankBadge rank={entry.rank} />
                      )}
                    </td>
                    <td className="py-4 px-3 font-medium text-gray-800">{entry.teamName}</td>
                    <td className="py-4 px-3 text-right font-mono text-sm">
                      {isNoSubmission ? (
                        <span data-testid={`hackathon-leaderboard-no-submission-${rowKey}`} className="text-xs text-gray-400">
                          미제출
                        </span>
                      ) : (
                        <span data-testid={`hackathon-leaderboard-score-${rowKey}`} className={cn("font-semibold", isTop3 ? "text-blue-600" : "text-gray-800")}>
                          {typeof entry.score === "number" && entry.score < 1
                            ? entry.score.toFixed(4)
                            : entry.score.toFixed(1)}
                        </span>
                      )}
                    </td>
                    {leaderboard.entries.some((e) => e.scoreBreakdown) && (
                      <td className="py-4 px-3 text-right text-xs text-gray-400 hidden sm:table-cell">
                        {entry.scoreBreakdown
                          ? Object.entries(entry.scoreBreakdown)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" / ")
                          : "—"}
                      </td>
                    )}
                    <td className="py-4 pl-3 pr-5 text-right text-xs text-gray-400">
                      {isNoSubmission ? "-" : formatDate(entry.submittedAt, "Asia/Seoul")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {note && (
        <p className="mt-3 text-xs text-gray-400 px-1">* {note}</p>
      )}
    </div>
  )
}
