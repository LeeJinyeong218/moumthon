import { createLocalStore } from "@/lib/storage"
import hackathonsData from "@/assets/data/public_hackathons.json"
import hackathonDetailData from "@/assets/data/public_hackathon_detail.json"
import leaderboardData from "@/assets/data/public_leaderboard.json"
import teamsData from "@/assets/data/public_teams.json"
import submissionsData from "@/assets/data/public_submissions.json"
import notificationsData from "@/assets/data/my_notifications.json"
import myData from "@/assets/data/my.json"

export function seedAll() {
  createLocalStore<(typeof hackathonsData)[number]>("hackathons", "slug")
    .seed(hackathonsData)

  const { extraDetails, ...mainDetail } = hackathonDetailData
  createLocalStore<Record<string, unknown>>("hackathon_details", "slug")
    .seed([mainDetail, ...(extraDetails ?? [])] as Record<string, unknown>[])

  const { extraLeaderboards, ...mainLeaderboard } = leaderboardData
  createLocalStore<Record<string, unknown>>("leaderboards", "hackathonSlug")
    .seed([mainLeaderboard, ...(extraLeaderboards ?? [])] as Record<string, unknown>[])

  createLocalStore<(typeof teamsData)[number]>("teams", "teamCode")
    .seed(teamsData)

  createLocalStore<(typeof submissionsData)[number]>("submissions", "teamCode")
    .seed(submissionsData)

  createLocalStore<(typeof notificationsData)[number]>("notifications", "notificationId")
    .seed(notificationsData)

  createLocalStore<(typeof myData)[number]>("my", "userId")
    .seed(myData)
}
