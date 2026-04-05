import leaderboardData from "@/assets/data/public_leaderboard.json"
import teamsData from "@/assets/data/public_teams.json"
import teamMembersData from "@/assets/data/public_team_members.json"
import usersData from "@/assets/data/public_users.json"
import RankingClient from "@/components/feature/ranking/RankingClient"

export default function RankingPage() {
  return (
    <RankingClient
      leaderboardData={leaderboardData}
      teams={teamsData}
      teamMembersData={teamMembersData}
      users={usersData}
    />
  )
}
