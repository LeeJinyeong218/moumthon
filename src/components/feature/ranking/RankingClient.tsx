"use client"

import { useState, useEffect, useRef } from "react"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, RankBadge } from "@/components/common"
import { useMemberStore } from "@/stores/memberStore"
import { computeUserRankings, type UserRankEntry } from "@/lib/rankingUtils"
import type leaderboardJson from "@/assets/data/public_leaderboard.json"
import type teamsJson from "@/assets/data/public_teams.json"
import type teamMembersJson from "@/assets/data/public_team_members.json"
import type usersJson from "@/assets/data/public_users.json"

type Filter = "7d" | "30d" | "all"

const FILTERS: { label: string; value: Filter }[] = [
  { label: "지난 7일", value: "7d" },
  { label: "지난 30일", value: "30d" },
  { label: "전체", value: "all" },
]

const TOTAL_ROWS = 10
const COLS = "grid-cols-[96px_1fr_200px]"

function getSinceDate(filter: Filter): Date | undefined {
  if (filter === "all") return undefined
  const d = new Date()
  d.setDate(d.getDate() - (filter === "7d" ? 7 : 30))
  return d
}

function RankRow({ entry, isMe, height }: { entry: UserRankEntry; isMe: boolean; height: number }) {
  return (
    <div
      style={{ height }}
      className={cn(
        `grid ${COLS} items-center border-b border-border last:border-0 transition-colors shrink-0`,
        isMe
          ? "bg-gradient-to-r from-blue-50 via-green-50 to-lime-50"
          : entry.rank <= 3
          ? "bg-blue-50/30"
          : "hover:bg-muted/20",
      )}
    >
      <div className="flex justify-center px-6">
        <RankBadge rank={entry.rank} />
      </div>
      <div className="flex items-center gap-4 px-6">
        <Avatar
          src={entry.avatarUrl}
          alt={entry.displayName}
          fallback={entry.displayName.slice(0, 2)}
          size="lg"
        />
        <div>
          <p className={cn("text-base font-semibold", isMe && "text-blue-600")}>
            {entry.displayName}
          </p>
          <p className="text-sm text-muted-foreground">@{entry.username}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 px-8">
        <span className="text-xl font-black font-mono text-blue-600">
          {entry.points.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">pts</span>
      </div>
    </div>
  )
}

interface Props {
  leaderboardData: typeof leaderboardJson
  teams: typeof teamsJson
  teamMembersData: typeof teamMembersJson
  users: typeof usersJson
}

export default function RankingClient({ leaderboardData, teams, teamMembersData, users }: Props) {
  const [filter, setFilter] = useState<Filter>("all")
  const [page, setPage] = useState(1)
  const [rowHeight, setRowHeight] = useState(72)
  const contentRef = useRef<HTMLDivElement>(null)
  const { member } = useMemberStore()
  const myUserId = member?.userId ?? null

  const rankings = computeUserRankings(leaderboardData, teams, teamMembersData, users, getSinceDate(filter))
  const myEntry = myUserId ? rankings.find((r) => r.userId === myUserId) : null
  const hasMyEntry = !!myEntry
  const listRankings = myEntry ? rankings.filter((r) => r.userId !== myUserId) : rankings

  const listPageSize = hasMyEntry ? TOTAL_ROWS - 1 : TOTAL_ROWS

  useEffect(() => {
    const recalc = () => {
      if (!contentRef.current) return
      const h = contentRef.current.clientHeight
      const rh = hasMyEntry ? (h - 1) / TOTAL_ROWS : h / TOTAL_ROWS
      setRowHeight(rh)
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    if (contentRef.current) ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [hasMyEntry])

  const totalPages = Math.max(1, Math.ceil(listRankings.length / listPageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = listRankings.slice((currentPage - 1) * listPageSize, currentPage * listPageSize)
  const emptySlots = listPageSize - paged.length

  function handleFilterChange(f: Filter) {
    setFilter(f)
    setPage(1)
  }

  return (
    <main className="h-[calc(100vh-3.5rem)] flex flex-col max-w-6xl mx-auto w-full px-4 py-8">
      {/* Header + Filter */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-blue-500" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 via-green-400 to-lime-400 bg-clip-text text-transparent">
            랭킹
          </h1>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-blue-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-600",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col rounded-xl border border-border overflow-hidden min-h-0">
        {/* Column labels */}
        <div className={`grid ${COLS} shrink-0 border-b border-border bg-muted/10 text-xs uppercase tracking-wide text-muted-foreground`}>
          <div className="text-center py-3 px-6">순위</div>
          <div className="py-3 px-6">닉네임</div>
          <div className="py-3 px-8 text-right">포인트</div>
        </div>

        {rankings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            해당 기간에 제출된 결과가 없습니다.
          </div>
        ) : (
          <div ref={contentRef} className="flex-1 min-h-0">
            {/* 내 순위 고정 */}
            {myEntry && (
              <>
                <RankRow entry={myEntry} isMe height={rowHeight} />
                <div className="h-px bg-gradient-to-r from-blue-200 via-green-200 to-lime-200" />
              </>
            )}

            {/* 목록 */}
            {paged.map((entry) => (
              <RankRow key={entry.userId} entry={entry} isMe={false} height={rowHeight} />
            ))}

            {/* 빈 슬롯 — 마지막 페이지에서 행 높이 유지 */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{ height: rowHeight }}
                className="border-b border-border last:border-0 shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1 shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-md text-sm border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            이전
          </button>
          {(() => {
            const pages: (number | "...")[] = []
            for (let p = 1; p <= totalPages; p++) {
              if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
                pages.push(p)
              } else if (pages[pages.length - 1] !== "...") {
                pages.push("...")
              }
            }
            return pages.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-muted-foreground">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={cn(
                    "w-9 h-9 rounded-md text-sm border transition-colors",
                    p === currentPage
                      ? "bg-blue-500 text-white border-blue-500 font-medium"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {p}
                </button>
              ),
            )
          })()}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-md text-sm border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </main>
  )
}
