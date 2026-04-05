export type HackathonStatus = "upcoming" | "ongoing" | "ended"

export type Hackathon = {
  slug: string
  title: string
  status: HackathonStatus
  tags: string[]
  thumbnailUrl: string
  period: {
    timezone: string
    submissionDeadlineAt: string
    endAt: string
  }
  links: {
    detail: string
    rules: string
    faq: string
  }
}
