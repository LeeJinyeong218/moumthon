import { redirect, notFound } from "next/navigation"
import hackathonDetailData from "@/assets/data/public_hackathon_detail.json"
import teamsData from "@/assets/data/public_teams.json"
import leaderboardData from "@/assets/data/public_leaderboard.json"
import type { HackathonDetail, Leaderboard } from "@/types/hackathonDetail"
import type { Team } from "@/types/team"
import HackathonDetailClient from "@/components/feature/hackathons/HackathonDetailClient"

const SCROLL_SECTIONS = ["overview", "eval", "schedule", "prize", "teams", "submit"]

const allDetails: HackathonDetail[] = [
  hackathonDetailData as HackathonDetail,
  ...(hackathonDetailData.extraDetails ?? []) as HackathonDetail[],
]

const allLeaderboards: Leaderboard[] = [
  { hackathonSlug: leaderboardData.hackathonSlug, updatedAt: leaderboardData.updatedAt, entries: leaderboardData.entries },
  ...(leaderboardData.extraLeaderboards ?? []) as Leaderboard[],
]

export default async function HackathonSectionPage({
  params,
}: {
  params: Promise<{ slug: string; section: string }>
}) {
  const { slug, section } = await params

  if (!SCROLL_SECTIONS.includes(section)) {
    redirect(`/hackathons/${slug}/overview`)
  }

  const detail = allDetails.find((d) => d.slug === slug)
  if (!detail) notFound()

  const teams = (teamsData as Team[]).filter((t) => t.hackathonSlug === slug)
  const leaderboard = allLeaderboards.find((l) => l.hackathonSlug === slug) ?? allLeaderboards[0]

  return <HackathonDetailClient detail={detail} slug={slug} initialSection={section} teams={teams} leaderboard={leaderboard} />
}
