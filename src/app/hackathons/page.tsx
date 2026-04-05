"use client"

import { useState, useMemo } from "react"
import { RotateCcw } from "lucide-react"
import hackathonsData from "@/assets/data/public_hackathons.json"
import teamMembersData from "@/assets/data/public_team_members.json"
import { HackathonCard } from "@/components/feature/hackathons/HackathonCard"
import { cn } from "@/lib/utils"
import type { Hackathon, HackathonStatus } from "@/types/hackathon"
import { STATUS_LABEL, STATUS_ICON } from "@/lib/hackathonStatus"

const hackathons = hackathonsData as Hackathon[]

// 해커톤별 고유 참가자 수 (팀 멤버 데이터 기반)
const _slugUserSets: Record<string, Set<string>> = {}
for (const teamEntry of teamMembersData) {
  const slug = teamEntry.hackathonSlug
  if (!_slugUserSets[slug]) _slugUserSets[slug] = new Set()
  for (const m of teamEntry.members) _slugUserSets[slug].add(m.userId)
}
const participantCountMap: Record<string, number> = Object.fromEntries(
  Object.entries(_slugUserSets).map(([slug, set]) => [slug, set.size])
)

const STATUS_OPTIONS: HackathonStatus[] = ["upcoming", "ongoing", "ended"]
const ALL_TAGS = Array.from(new Set(hackathons.flatMap((h) => h.tags))).sort()

const PAGE_SIZE = 6

export default function HackathonsPage() {
  const [statusFilter, setStatusFilter] = useState<HackathonStatus | null>(null)
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return hackathons.filter((h) => {
      if (statusFilter && h.status !== statusFilter) return false
      if (tagFilters.length > 0 && !tagFilters.every((t) => h.tags.includes(t)))
        return false
      return true
    })
  }, [statusFilter, tagFilters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function toggleStatus(s: HackathonStatus) {
    setStatusFilter((prev) => (prev === s ? null : s))
    setPage(1)
  }

  function toggleTag(tag: string) {
    setTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    setPage(1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-green-50 px-4 py-16">
      <div className="mx-auto w-full max-w-6xl">

        {/* 헤더 */}
        <div className="mb-10">
          <p className="text-sm text-gray-400">해커톤 / Hackathons</p>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            해커톤 탐색
          </h1>

          <p className="mt-2 max-w-xl text-sm text-gray-500">
            진행 중이거나 참가 예정인 해커톤을 찾아보고, 상태와 태그로 필터링해보세요.
          </p>
        </div>

        {/* 필터 카드 */}
        <section className="mb-8 rounded-2xl border border-white/40 bg-white/60 p-6 backdrop-blur-md shadow-sm space-y-6">

          {/* 상태 필터 */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-400">상태</span>

            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((value) => {
                const active = statusFilter === value
                const Icon = STATUS_ICON[value]
                return (
                  <button
                    key={value}
                    onClick={() => toggleStatus(value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-sm font-medium transition-colors",
                      active
                        ? "bg-green-100 text-green-600"
                        : "text-gray-500 hover:bg-gray-100",
                    )}
                  >
                    <Icon size={14} />
                    {STATUS_LABEL[value]}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => { setStatusFilter(null); setPage(1) }}
              className={cn(
                "ml-auto inline-flex items-center gap-1 text-xs",
                statusFilter
                  ? "text-gray-400 hover:text-gray-600"
                  : "invisible"
              )}
            >
              <RotateCcw size={12} />
              초기화
            </button>
          </div>


          {/* 태그 필터 */}
          <div className="flex flex-wrap items-start gap-3">
            <span className="text-sm font-semibold text-gray-400 mt-1">태그</span>

            <div className="flex gap-2 flex-wrap flex-1">
              {ALL_TAGS.map((tag) => {
                const active = tagFilters.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full px-4 py-1 text-sm font-medium transition-colors",
                      active
                        ? "bg-green-100 text-green-600"
                        : "text-gray-500 hover:bg-gray-100",
                    )}
                  >
                    #{tag}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => { setTagFilters([]); setPage(1) }}
              className={cn(
                "inline-flex items-center gap-1 text-xs mt-1",
                tagFilters.length > 0
                  ? "text-gray-400 hover:text-gray-600"
                  : "invisible"
              )}
            >
              <RotateCcw size={12} />
              초기화
            </button>
          </div>
        </section>

        {/* 결과 */}
        <p className="text-sm text-gray-500 mb-4">
          총 <span className="text-gray-900 font-semibold">{filtered.length}</span>개의 해커톤
        </p>

        {/* 카드 영역 */}
        <div className="rounded-2xl border border-white/40 bg-white/60 p-6 backdrop-blur-md shadow-sm">

          {paged.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paged.map((h) => (
                <HackathonCard key={h.slug} hackathon={h} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              조건에 맞는 해커톤이 없습니다.
            </div>
          )}


        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-100"
            >
              이전
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-9 h-9 rounded-md text-sm border transition-colors",
                    p === currentPage
                      ? "bg-green-500 text-white border-green-500"
                      : "border-gray-200 hover:bg-gray-100",
                  )}
                >
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-100"
            >
              다음
            </button>
          </div>
        )}

      </div>
    </main>
  )
}