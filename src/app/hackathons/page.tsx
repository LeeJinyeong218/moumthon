"use client"

import { useState, useMemo } from "react"
import { RotateCcw } from "lucide-react"
import hackathonsData from "@/assets/data/public_hackathons.json"
import { HackathonCard } from "@/components/feature/hackathons/HackathonCard"
import { cn } from "@/lib/utils"
import type { Hackathon, HackathonStatus } from "@/types/hackathon"
import { STATUS_LABEL, STATUS_ICON } from "@/lib/hackathonStatus"

const hackathons = hackathonsData as Hackathon[]

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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">해커톤 탐색</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
        진행 중이거나 참가 예정인 해커톤을 찾아보세요. 상태와 태그로 필터링할 수 있습니다.
      </p>

      {/* Filters */}
      <section className="mb-8 space-y-5">
        {/* Status filter */}
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-primary-600 shrink-0">상태</span>
          <div className="w-px self-stretch bg-border shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((value) => {
              const active = statusFilter === value
              const Icon = STATUS_ICON[value]
              return (
                <button
                  key={value}
                  onClick={() => toggleStatus(value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-6 py-1.5 text-sm font-medium border transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
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
              "inline-flex items-center gap-1 text-xs transition-colors px-2 py-1",
              statusFilter
                ? "text-muted-foreground hover:text-foreground"
                : "invisible pointer-events-none",
            )}
          >
            <RotateCcw size={11} />
            초기화
          </button>
        </div>

        {/* Tag filter */}
        <div className="flex items-start gap-3">
          <span className="text-base font-bold text-primary-600 shrink-0 pt-1">태그</span>
          <div className="w-px self-stretch bg-border shrink-0" />
          <div className="flex gap-2 flex-wrap flex-1">
            {ALL_TAGS.map((tag) => {
              const active = tagFilters.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-5 py-1.5 text-sm font-medium border transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground",
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
              "inline-flex items-center gap-1 text-xs transition-colors px-2 py-1 pt-1",
              tagFilters.length > 0
                ? "text-muted-foreground hover:text-foreground"
                : "invisible pointer-events-none",
            )}
          >
            <RotateCcw size={11} />
            초기화
          </button>
        </div>
      </section>

      {/* Results count */}
      <p className="text-base font-medium text-muted-foreground mb-4">
        총 <span className="text-foreground">{filtered.length}</span>개의 해커톤
      </p>

      {/* Card grid */}
      {paged.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {paged.map((h) => (
            <HackathonCard key={h.slug} hackathon={h} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-base">조건에 맞는 해커톤이 없습니다.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-md text-sm border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            이전
          </button>

          {(() => {
            const pages: (number | "...")[] = []
            const delta = 2

            for (let p = 1; p <= totalPages; p++) {
              if (
                p === 1 ||
                p === totalPages ||
                (p >= currentPage - delta && p <= currentPage + delta)
              ) {
                pages.push(p)
              } else if (
                pages[pages.length - 1] !== "..."
              ) {
                pages.push("...")
              }
            }

            return pages.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-9 h-9 rounded-md text-sm border transition-colors",
                    p === currentPage
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "border-border hover:bg-muted",
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
            className="px-3 py-1.5 rounded-md text-sm border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </main>
  )
}
