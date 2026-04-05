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
      data-testid={`ranking-row-${entry.userId}`}
      style={{ height }}
      className={cn(
        `grid ${COLS} items-center border-b border-gray-100 last:border-0 transition-colors shrink-0`,
        isMe
          ? "bg-gradient-to-r from-blue-50 via-green-50 to-lime-50"
          : entry.rank <= 3
          ? "bg-blue-50/40"
          : "hover:bg-gray-50",
      )}
    >
      <div data-testid={`ranking-rank-${entry.userId}`} className="flex justify-center px-6">
        <RankBadge rank={entry.rank} />
      </div>
      <div data-testid={`ranking-nickname-${entry.userId}`} className="flex items-center gap-4 px-6">
        <Avatar
          src={entry.avatarUrl}
          alt={entry.displayName}
          fallback={entry.displayName.slice(0, 2)}
          size="lg"
        />
        <div>
          <p className={cn("text-base font-semibold text-gray-800", isMe && "text-blue-600")}>
            {entry.displayName}
          </p>
          <p className="text-sm text-gray-400">@{entry.username}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 px-8">
        <span
          data-testid={`ranking-points-${entry.userId}`}
          className="font-mono text-xl font-black text-blue-500"
        >
          {entry.points.toFixed(1)}
        </span>
        <span className="text-sm text-gray-400">pts</span>
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
    <main className="flex h-[calc(100vh-3.5rem)] w-full flex-col bg-gradient-to-b from-white via-blue-50 to-green-50 px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col min-h-0">

        {/* 헤더 */}
        <div className="mb-6 shrink-0">
          <p className="text-sm text-gray-400">랭킹</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={22} className="text-blue-400" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">랭킹</h1>
            </div>
            {/* 필터 */}
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  data-testid={`ranking-filter-${f.value}-btn`}
                  onClick={() => handleFilterChange(f.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    filter === f.value
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* 컬럼 헤더 */}
          <div className={`grid ${COLS} shrink-0 border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-widest text-gray-400`}>
            <div className="px-6 py-3 text-center">순위</div>
            <div className="px-6 py-3">닉네임</div>
            <div className="px-8 py-3 text-right">포인트</div>
          </div>

          {rankings.length === 0 ? (
            <div
              data-testid="ranking-empty-msg"
              className="flex flex-1 items-center justify-center text-sm text-gray-400"
            >
              해당 기간에 제출된 결과가 없습니다.
            </div>
          ) : (
            <div ref={contentRef} data-testid="ranking-table" className="min-h-0 flex-1">
              {/* 내 순위 고정 */}
              {myEntry && (
                <>
                  <RankRow entry={myEntry} isMe height={rowHeight} />
                  <div className="h-px bg-gradient-to-r from-blue-200 via-green-200 to-lime-200" />
                </>
              )}
              {paged.map((entry) => (
                <RankRow key={entry.userId} entry={entry} isMe={false} height={rowHeight} />
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{ height: rowHeight }}
                  className="shrink-0 border-b border-gray-100 last:border-0"
                />
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-4 flex shrink-0 items-center justify-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
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
                  <span key={`e-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "h-9 w-9 rounded-lg border text-sm transition-colors",
                      p === currentPage
                        ? "border-transparent bg-gradient-to-r from-blue-500 to-green-400 font-semibold text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {p}
                  </button>
                )
              )
            })()}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
