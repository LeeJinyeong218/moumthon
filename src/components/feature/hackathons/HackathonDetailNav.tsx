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

  useEffect(() => {
    if (pathname.includes("/submit/")) {
      setActiveSection("submit")
    }
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
      <div className="absolute left-0 top-1 bottom-1 w-px bg-gray-100" />

      <nav className="flex flex-col gap-0.5">
        {scrollItems.map(({ id, label }) => {
          const isActive = activeSection === id

          if (id === "submit") {
            return (
              <div key="submit" className="group/submit relative">
                <button
                  data-testid="hackathon-nav-submit-btn"
                  onClick={() => handleScrollSectionClick("submit")}
                  className={cn(
                    "w-full text-left pl-5 pr-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-r-lg",
                    "inline-flex items-center justify-between gap-1",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
                    isActive
                      ? "translate-x-2 text-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-gray-800 hover:translate-x-1 hover:bg-gray-50",
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

                <div
                  data-testid="hackathon-nav-submit-dropdown"
                  className={cn(
                    "pointer-events-none opacity-0",
                    "group-hover/submit:pointer-events-auto group-hover/submit:opacity-100",
                    "transition-opacity duration-150",
                    "absolute left-full top-0 ml-2 min-w-[220px]",
                    "bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1",
                  )}
                >
                  {submissionItems.map((item) => (
                    <button
                      key={item.key}
                      data-testid={`hackathon-nav-submit-item-${item.key}`}
                      onClick={() => handleSubmitItemClick(item.key)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
              data-testid={`hackathon-nav-${id}-btn`}
              onClick={() => handleScrollSectionClick(id)}
              className={cn(
                "text-left pl-5 pr-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-r-lg",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
                isActive
                  ? "translate-x-2 text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-800 hover:translate-x-1 hover:bg-gray-50",
              )}
            >
              {label}
            </button>
          )
        })}

        <button
          data-testid="hackathon-nav-leaderboard-btn"
          onClick={handleLeaderboardClick}
          className={cn(
            "text-left pl-5 pr-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-r-lg",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
            activeSection === "leaderboard"
              ? "translate-x-2 text-blue-600 bg-blue-50"
              : "text-gray-500 hover:text-gray-800 hover:translate-x-1 hover:bg-gray-50",
          )}
        >
          리더보드
        </button>
      </nav>
    </div>
  )
}
