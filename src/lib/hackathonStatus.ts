import { Clock, Zap, CheckCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { HackathonStatus } from "@/types/hackathon"

export const STATUS_LABEL: Record<HackathonStatus, string> = {
  upcoming: "예정",
  ongoing:  "진행 중",
  ended:    "종료",
}

export const STATUS_ICON: Record<HackathonStatus, LucideIcon> = {
  upcoming: Clock,
  ongoing:  Zap,
  ended:    CheckCircle,
}

export const STATUS_BADGE_CLASS: Record<HackathonStatus, string> = {
  upcoming: "bg-primary text-white border-transparent",
  ongoing:  "bg-emerald-500 text-white border-transparent",
  ended:    "bg-muted-foreground text-white border-transparent",
}
