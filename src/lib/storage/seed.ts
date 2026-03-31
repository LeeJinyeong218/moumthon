import { createLocalStore } from "@/lib/storage"
import hackathonsData from "@/assets/data/public_hackathons.json"
import hackathonDetailData from "@/assets/data/public_hackathon_detail.json"
import leaderboardData from "@/assets/data/public_leaderboard.json"
import teamsData from "@/assets/data/public_teams.json"

export function seedAll() {
  // 해커톤 목록
  createLocalStore<(typeof hackathonsData)[number]>("hackathons", "slug")
    .seed(hackathonsData)

  // 해커톤 상세 — extraDetails를 꺼내 메인 항목과 함께 평탄화
  const { extraDetails, ...mainDetail } = hackathonDetailData
  createLocalStore<Record<string, unknown>>("hackathon_details", "slug")
    .seed([mainDetail, ...(extraDetails ?? [])] as Record<string, unknown>[])

  // 리더보드 — extraLeaderboards를 꺼내 평탄화
  const { extraLeaderboards, ...mainLeaderboard } = leaderboardData
  createLocalStore<Record<string, unknown>>("leaderboards", "hackathonSlug")
    .seed([mainLeaderboard, ...(extraLeaderboards ?? [])] as Record<string, unknown>[])

  // 팀 목록
  createLocalStore<(typeof teamsData)[number]>("teams", "teamCode")
    .seed(teamsData)
}
