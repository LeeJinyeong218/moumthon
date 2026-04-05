export type Team = {
  teamCode: string
  hackathonSlug: string
  name: string
  isOpen: boolean
  memberCount: number
  lookingFor: string[]
  intro: string
  contact: { type: "link"; url: string }
  createdAt: string
}
