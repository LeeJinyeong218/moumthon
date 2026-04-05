"use client"

import { useCallback, useEffect, useRef } from "react"
import { BookOpen, HelpCircle } from "lucide-react"
import type { HackathonDetail, Leaderboard } from "@/types/hackathonDetail"
import type { Team } from "@/types/team"
import { useHackathonDetailStore } from "@/stores/hackathonDetailStore"
import HackathonOverviewSection from "./HackathonOverviewSection"
import HackathonEvalSection from "./HackathonEvalSection"
import HackathonScheduleSection from "./HackathonScheduleSection"
import HackathonPrizeSection from "./HackathonPrizeSection"
import HackathonTeamsSection from "./HackathonTeamsSection"
import HackathonSubmitSection from "./HackathonSubmitSection"
import HackathonLeaderboardView from "./HackathonLeaderboardView"

interface Props {
  detail: HackathonDetail
  slug: string
  initialSection?: string
  teams?: Team[]
  leaderboard?: Leaderboard
}

const SECTION_IDS = ["overview", "eval", "schedule", "prize", "teams", "submit"] as const
type SectionId = (typeof SECTION_IDS)[number]

const CONTENT_ID = "hackathon-content"

export default function HackathonDetailClient({ detail, slug, initialSection, teams = [], leaderboard }: Props) {
  const { activeSection, setActiveSection, scrollTarget, clearScrollTarget } = useHackathonDetailStore()
  const hasPrize = !!detail.sections.prize
  const scrollLockRef = useRef(false)
  const scrollLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sectionRefs = {
    overview: useRef<HTMLElement>(null),
    eval: useRef<HTMLElement>(null),
    schedule: useRef<HTMLElement>(null),
    prize: useRef<HTMLElement>(null),
    teams: useRef<HTMLElement>(null),
    submit: useRef<HTMLElement>(null),
  } satisfies Record<SectionId, React.RefObject<HTMLElement | null>>

  const getContainer = () => document.getElementById(CONTENT_ID)

  const scrollTo = useCallback((sectionId: SectionId) => {
    const container = getContainer()
    const el = sectionRefs[sectionId].current
    if (!container || !el) return
    const containerTop = container.getBoundingClientRect().top
    const elTop = el.getBoundingClientRect().top
    container.scrollTo({ top: container.scrollTop + elTop - containerTop - 32, behavior: "smooth" })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Determine initial section on mount (hash > prop > "overview")
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash === "leaderboard") {
      setActiveSection("leaderboard")
      return
    }
    const fromHash = hash && SECTION_IDS.includes(hash as SectionId)
    const section = (
      fromHash ? hash
      : initialSection && SECTION_IDS.includes(initialSection as SectionId) ? initialSection
      : "overview"
    ) as SectionId
    setActiveSection(section)
    window.history.replaceState(null, "", `/hackathons/${slug}#${section}`)
    if (section !== "overview") scrollTo(section)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React to nav scroll requests
  useEffect(() => {
    if (!scrollTarget) return
    if (SECTION_IDS.includes(scrollTarget as SectionId)) {
      scrollLockRef.current = true
      if (scrollLockTimerRef.current) clearTimeout(scrollLockTimerRef.current)
      scrollLockTimerRef.current = setTimeout(() => { scrollLockRef.current = false }, 800)
      scrollTo(scrollTarget as SectionId)
    }
    clearScrollTarget()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTarget])

  // Scroll spy — most-visible-area wins
  useEffect(() => {
    const container = getContainer()
    if (!container) return

    const sections = (hasPrize ? SECTION_IDS : SECTION_IDS.filter((s) => s !== "prize")) as SectionId[]

    const handleScroll = () => {
      if (useHackathonDetailStore.getState().activeSection === "leaderboard") return
      if (scrollLockRef.current) return
      const containerRect = container.getBoundingClientRect()
      let maxVisible = 0
      let activeId: SectionId = "overview"
      for (const id of sections) {
        const el = sectionRefs[id].current
        if (!el) continue
        const elRect = el.getBoundingClientRect()
        const visibleHeight = Math.max(
          0,
          Math.min(elRect.bottom, containerRect.bottom) - Math.max(elRect.top, containerRect.top),
        )
        if (visibleHeight > maxVisible) {
          maxVisible = visibleHeight
          activeId = id
        }
      }
      setActiveSection(activeId)
      window.history.replaceState(null, "", `/hackathons/${slug}#${activeId}`)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, hasPrize])

  const { sections } = detail

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-12">
        <h1 className="text-2xl font-bold leading-snug">{detail.title}</h1>
        <div className="flex gap-3 mt-3">
          <a
            href={sections.info.links.rules}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen size={14} />
            규칙
          </a>
          <a
            href={sections.info.links.faq}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle size={14} />
            FAQ
          </a>
        </div>
      </div>

      {/* 리더보드 뷰 전환 vs 스크롤 섹션 */}
      {activeSection === "leaderboard" ? (
        <HackathonLeaderboardView
          leaderboard={leaderboard}
          note={sections.leaderboard.note}
          timezone={sections.schedule.timezone}
        />
      ) : (
        <div className="space-y-16 pb-48">
          <HackathonOverviewSection
            ref={sectionRefs.overview}
            overview={sections.overview}
            info={sections.info}
          />
          <HackathonEvalSection
            ref={sectionRefs.eval}
            eval={sections.eval}
          />
          <HackathonScheduleSection
            ref={sectionRefs.schedule}
            schedule={sections.schedule}
          />
          {hasPrize && sections.prize && (
            <HackathonPrizeSection
              ref={sectionRefs.prize}
              prize={sections.prize}
            />
          )}
          <HackathonTeamsSection
            ref={sectionRefs.teams}
            teamsSection={sections.teams}
            teams={teams}
            slug={slug}
          />
          <HackathonSubmitSection
            ref={sectionRefs.submit}
            submit={sections.submit}
            slug={slug}
          />
        </div>
      )}
    </div>
  )
}
