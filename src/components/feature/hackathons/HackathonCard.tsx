"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_LABEL, STATUS_ICON, STATUS_BADGE_CLASS } from "@/lib/hackathonStatus"
import { formatDate } from "@/lib/formatDate"
import type { Hackathon } from "@/types/hackathon"

function CardExternalLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/20 hover:text-gray-100 transition-colors flex-1 justify-center"
    >
      {children}
    </a>
  )
}

interface HackathonCardProps {
  hackathon: Hackathon
  participantCount?: number
}

export function HackathonCard({ hackathon, participantCount = 0 }: HackathonCardProps) {
  const { period, links } = hackathon
  const StatusIcon = STATUS_ICON[hackathon.status]

  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <Image
        src={hackathon.thumbnailUrl}
        alt={hackathon.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-black/60 to-black/10" />

      <Link
        href={links.detail}
        className="absolute inset-0 z-0"
        aria-label={hackathon.title}
      />

      {/* 상단 상태 + 참여중 */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm font-semibold backdrop-blur-sm",
            STATUS_BADGE_CLASS[hackathon.status]
          )}
        >
          <StatusIcon size={11} />
          {STATUS_LABEL[hackathon.status]}
        </span>
        {(hackathon.status === "ongoing" || hackathon.status === "upcoming") && participantCount > 0 && (
          <span className="inline-flex items-center rounded-lg bg-primary px-3 py-1 text-sm font-bold text-white shadow-md">
            {participantCount}명 {hackathon.status === "ongoing" ? "참여중!" : "참여 준비중!"}
          </span>
        )}

      </div>

      {/* 하단 내용 */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 gap-2 pointer-events-none">
        <h3 className="text-lg font-bold leading-snug line-clamp-2 text-white drop-shadow">
          {hackathon.title}
        </h3>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-7">
          {hackathon.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-gray-500/40 px-3 py-1 text-xs font-medium text-white" // 변경
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="border-t bg-gradient-to-r from-blue-500 via-green-400 to-lime-400 " />

        {/* 기간 */}
        <div className="text-xs text-white"> {/* text-gray-200 → text-white */}
          {formatDate(period.submissionDeadlineAt, period.timezone)}
          <span className="mx-1.5 opacity-50">~</span>
          {formatDate(period.endAt, period.timezone)}
        </div>

        {/* 링크 */}
        <div className="flex gap-3 pointer-events-auto">
          <CardExternalLink href={links.rules}>
            <BookOpen size={13} />
            규칙
          </CardExternalLink>
          <CardExternalLink href={links.faq}>
            <HelpCircle size={13} />
            FAQ
          </CardExternalLink>
        </div>
      </div>
    </div>
  )
}