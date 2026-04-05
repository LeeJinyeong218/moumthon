import { notFound } from "next/navigation"
import hackathonDetailData from "@/assets/data/public_hackathon_detail.json"
import leaderboardData from "@/assets/data/public_leaderboard.json"
import type { HackathonDetail, Leaderboard } from "@/types/hackathonDetail"
import LeaderboardClient from "@/components/feature/hackathons/LeaderboardClient"

const allDetails: HackathonDetail[] = [
  hackathonDetailData as HackathonDetail,
  ...(hackathonDetailData.extraDetails ?? []) as HackathonDetail[],
]

const allLeaderboards: Leaderboard[] = [
  {
    hackathonSlug: leaderboardData.hackathonSlug,
    updatedAt: leaderboardData.updatedAt,
    entries: leaderboardData.entries,
  },
  ...(leaderboardData.extraLeaderboards ?? []) as Leaderboard[],
]

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const detail = allDetails.find((d) => d.slug === slug)
  if (!detail) notFound()

  const leaderboard =
    allLeaderboards.find((l) => l.hackathonSlug === slug) ?? allLeaderboards[0]

  return (
    <LeaderboardClient
      leaderboard={leaderboard}
      slug={slug}
      hackathonTitle={detail.title}
      note={detail.sections.leaderboard.note}
    />
  )
}
