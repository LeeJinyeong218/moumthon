import type leaderboardJson from "@/assets/data/public_leaderboard.json"
import type teamsJson from "@/assets/data/public_teams.json"
import type teamMembersJson from "@/assets/data/public_team_members.json"
import type usersJson from "@/assets/data/public_users.json"

type LeaderboardData = typeof leaderboardJson
type Team = (typeof teamsJson)[number]
type TeamMembers = (typeof teamMembersJson)[number]
type User = (typeof usersJson)[number]

type FlatLeaderboard = {
  hackathonSlug: string
  entries: { teamName: string; score: number; submittedAt: string }[]
}

export type UserRankEntry = {
  rank: number
  userId: string
  username: string
  displayName: string
  avatarUrl: string
  points: number
}

export function computeUserRankings(
  leaderboardData: LeaderboardData,
  teams: Team[],
  teamMembersData: TeamMembers[],
  users: User[],
  sinceDate?: Date,
): UserRankEntry[] {
  const allLeaderboards: FlatLeaderboard[] = [
    { hackathonSlug: leaderboardData.hackathonSlug, entries: leaderboardData.entries },
    ...(leaderboardData.extraLeaderboards ?? []),
  ]

  // userId -> hackathonSlug -> best score
  const userBestPerHackathon = new Map<string, Map<string, number>>()

  for (const lb of allLeaderboards) {
    for (const entry of lb.entries) {
      if (sinceDate && new Date(entry.submittedAt) < sinceDate) continue

      const team = teams.find(
        (t) => t.name === entry.teamName && t.hackathonSlug === lb.hackathonSlug,
      )
      if (!team) continue

      const teamMembersRecord = teamMembersData.find((tm) => tm.teamCode === team.teamCode)
      if (!teamMembersRecord) continue

      for (const member of teamMembersRecord.members) {
        if (!userBestPerHackathon.has(member.userId)) {
          userBestPerHackathon.set(member.userId, new Map())
        }
        const hackathonScores = userBestPerHackathon.get(member.userId)!
        const currentBest = hackathonScores.get(lb.hackathonSlug) ?? 0
        if (entry.score > currentBest) {
          hackathonScores.set(lb.hackathonSlug, entry.score)
        }
      }
    }
  }

  const userTotals = Array.from(userBestPerHackathon.entries()).map(
    ([userId, hackathonScores]) => ({
      userId,
      points: Array.from(hackathonScores.values()).reduce((a, b) => a + b, 0),
    }),
  )

  userTotals.sort((a, b) => b.points - a.points)

  return userTotals.map(({ userId, points }, i) => {
    const user = users.find((u) => u.userId === userId)
    return {
      rank: i + 1,
      userId,
      username: user?.username ?? userId,
      displayName: user?.displayName ?? userId,
      avatarUrl: user?.avatarUrl ?? "",
      points,
    }
  })
}
