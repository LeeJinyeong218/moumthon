"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHackathonDetailStore } from "@/stores/hackathonDetailStore"
import type { SubmissionItem } from "@/types/hackathonDetail"

const SCROLL_NAV_ITEMS = [
  { id: "overview", label: "개요" },
  { id: "eval", label: "평가" },
  { id: "schedule", label: "일정" },
  { id: "prize", label: "상금" },
  { id: "teams", label: "팀" },
  { id: "submit", label: "제출" },
] as const

type ScrollSectionId = (typeof SCROLL_NAV_ITEMS)[number]["id"]

interface Props {
  slug: string
  hasPrize: boolean
  submissionItems: SubmissionItem[]
}

export default function HackathonDetailNav({ slug, hasPrize, submissionItems }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { activeSection, setActiveSection, requestScroll } = useHackathonDetailStore()

  // Sync active section from pathname on mount / route change
  useEffect(() => {
    if (pathname.includes("/submit/")) {
      setActiveSection("submit")
    }
    // scroll sections are managed by HackathonDetailClient via scroll detection
  }, [pathname, setActiveSection])

  const isDetailPage = !pathname.includes("/submit/")

  const handleScrollSectionClick = (id: ScrollSectionId) => {
    setActiveSection(id)
    if (isDetailPage) {
      requestScroll(id)
      window.history.replaceState(null, "", `/hackathons/${slug}#${id}`)
    } else {
      router.push(`/hackathons/${slug}#${id}`)
    }
  }

  const handleSubmitItemClick = (milestone: string) => {
    router.push(`/hackathons/${slug}/submit/${milestone}`)
  }

  const handleLeaderboardClick = () => {
    setActiveSection("leaderboard")
    if (isDetailPage) {
      window.history.replaceState(null, "", `/hackathons/${slug}#leaderboard`)
    } else {
      router.push(`/hackathons/${slug}#leaderboard`)
    }
  }

  const scrollItems = SCROLL_NAV_ITEMS.filter(
    (item) => item.id !== "prize" || hasPrize,
  )

  return (
    <div className="relative w-44 shrink-0">
      <div className="absolute left-0 top-1 bottom-1 w-px bg-border" />

      <nav className="flex flex-col gap-0.5">
        {scrollItems.map(({ id, label }) => {
          const isActive = activeSection === id

          if (id === "submit") {
            return (
              <div key="submit" className="group/submit relative">
                <button
                  onClick={() => handleScrollSectionClick("submit")}
                  className={cn(
                    "w-full text-left pl-5 pr-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-r-lg",
                    "inline-flex items-center justify-between gap-1",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "translate-x-2 text-primary-600 bg-primary-50"
                      : "text-muted-foreground hover:text-foreground hover:translate-x-1 hover:bg-muted/50",
                  )}
                >
                  {label}
                  <ChevronRight
                    size={12}
                    className={cn(
                      "shrink-0 transition-opacity",
                      isActive ? "opacity-70" : "opacity-40 group-hover/submit:opacity-80",
                    )}
                  />
                </button>

                {/* Hover dropdown */}
                <div
                  className={cn(
                    "pointer-events-none opacity-0",
                    "group-hover/submit:pointer-events-auto group-hover/submit:opacity-100",
                    "transition-opacity duration-150",
                    "absolute left-full top-0 ml-2 min-w-[220px]",
                    "bg-card border border-border rounded-lg shadow-lg z-20 py-1",
                  )}
                >
                  {submissionItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleSubmitItemClick(item.key)}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <button
              key={id}
              onClick={() => handleScrollSectionClick(id)}
              className={cn(
                "text-left pl-5 pr-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-r-lg",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "translate-x-2 text-primary-600 bg-primary-50"
                  : "text-muted-foreground hover:text-foreground hover:translate-x-1 hover:bg-muted/50",
              )}
            >
              {label}
            </button>
          )
        })}

        {/* 리더보드 */}
        <button
          onClick={handleLeaderboardClick}
          className={cn(
            "text-left pl-5 pr-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-r-lg",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            activeSection === "leaderboard"
              ? "translate-x-2 text-primary-600 bg-primary-50"
              : "text-muted-foreground hover:text-foreground hover:translate-x-1 hover:bg-muted/50",
          )}
        >
          리더보드
        </button>
      </nav>
    </div>
  )
}
