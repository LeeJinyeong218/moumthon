export type SubmissionItem = {
  key: string
  title: string
  format: string
}

export type ScheduleMilestone = {
  name: string
  at: string
}

export type ScoreDisplayBreakdown = {
  key: string
  label: string
  weightPercent: number
}

export type HackathonDetail = {
  slug: string
  title: string
  sections: {
    overview: {
      summary: string
      teamPolicy: { allowSolo: boolean; maxTeamSize: number }
    }
    info: {
      notice: string[]
      links: { rules: string; faq: string }
    }
    eval: {
      metricName: string
      description: string
      limits?: { maxRuntimeSec: number; maxSubmissionsPerDay: number }
      scoreSource?: string
      scoreDisplay?: {
        label: string
        breakdown: ScoreDisplayBreakdown[]
      }
    }
    schedule: {
      timezone: string
      milestones: ScheduleMilestone[]
    }
    prize?: {
      items: { place: string; amountKRW: number }[]
    }
    teams: { campEnabled: boolean; listUrl: string }
    submit: {
      allowedArtifactTypes: string[]
      submissionUrl: string
      guide: string[]
      submissionItems?: SubmissionItem[]
    }
    leaderboard: {
      publicLeaderboardUrl: string
      note: string
    }
  }
}

export type LeaderboardEntry = {
  rank: number
  teamName: string
  score: number
  submittedAt: string
  scoreBreakdown?: Record<string, number>
}

export type Leaderboard = {
  hackathonSlug: string
  updatedAt: string
  entries: LeaderboardEntry[]
}
