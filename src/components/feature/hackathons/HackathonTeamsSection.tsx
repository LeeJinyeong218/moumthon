"use client"

import { forwardRef, useState, useEffect, useCallback } from "react"
import { Users, Clock, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HackathonDetail } from "@/types/hackathonDetail"
import type { Team } from "@/types/team"
import { useMemberStore } from "@/stores/memberStore"
import { createLocalStore } from "@/lib/storage"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  teamsSection: HackathonDetail["sections"]["teams"]
  teams: Team[]
  slug: string
}

type MyTeam = {
  hackathonSlug: string
  teamCode: string
  teamName: string
  role: string
}

type JoinRequest = {
  requestId: string
  hackathonSlug: string
  teamCode: string
  teamName: string
  status: "pending" | "accepted" | "rejected"
  requestedAt: string
}

type ReceivedInvite = {
  inviteId: string
  hackathonSlug: string
  teamCode: string
  teamName: string
  fromDisplayName?: string
  status: "pending" | "accepted" | "rejected"
  invitedAt: string
}

type MySession = {
  userId: string
  myTeams: MyTeam[]
  joinRequests: JoinRequest[]
  receivedInvites: ReceivedInvite[]
  [key: string]: unknown
}

const HackathonTeamsSection = forwardRef<HTMLElement, Props>(({ teamsSection, teams, slug }, ref) => {
  const member = useMemberStore((s) => s.member)

  const [myTeam, setMyTeam] = useState<MyTeam | null>(null)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInvite[]>([])

  useEffect(() => {
    if (!member?.userId) {
      setMyTeam(null)
      setJoinRequests([])
      setReceivedInvites([])
      return
    }
    const { data } = createLocalStore<MySession>("my", "userId").getById(member.userId)
    if (!data) return
    setMyTeam(data.myTeams.find((t) => t.hackathonSlug === slug) ?? null)
    setJoinRequests((data.joinRequests ?? []).filter((r) => r.hackathonSlug === slug))
    setReceivedInvites((data.receivedInvites ?? []).filter((i) => i.hackathonSlug === slug))
  }, [member?.userId, slug])

  const updateSession = useCallback((patch: Partial<MySession>) => {
    if (!member?.userId) return
    createLocalStore<MySession>("my", "userId").update(member.userId, patch)
  }, [member?.userId])

  const getFullSession = useCallback((): MySession | null => {
    if (!member?.userId) return null
    const { data } = createLocalStore<MySession>("my", "userId").getById(member.userId)
    return data ?? null
  }, [member?.userId])

  const handleJoinRequest = (team: Team) => {
    const session = getFullSession()
    if (!session) return
    const requestId = `REQ-${team.teamCode}-${Date.now()}`
    const newRequest: JoinRequest = {
      requestId,
      hackathonSlug: slug,
      teamCode: team.teamCode,
      teamName: team.name,
      status: "pending",
      requestedAt: new Date().toISOString(),
    }
    const updated = [...(session.joinRequests ?? []), newRequest]
    updateSession({ joinRequests: updated })
    setJoinRequests((prev) => [...prev, newRequest])
  }

  const handleCancelRequest = (teamCode: string) => {
    const session = getFullSession()
    if (!session) return
    const updated = (session.joinRequests ?? []).filter(
      (r) => !(r.teamCode === teamCode && r.hackathonSlug === slug),
    )
    updateSession({ joinRequests: updated })
    setJoinRequests((prev) => prev.filter((r) => r.teamCode !== teamCode))
  }

  const handleAcceptInvite = (invite: ReceivedInvite) => {
    const session = getFullSession()
    if (!session) return
    const updatedInvites = (session.receivedInvites ?? []).map((i) =>
      i.inviteId === invite.inviteId ? { ...i, status: "accepted" as const } : i,
    )
    const newTeam: MyTeam = {
      hackathonSlug: slug,
      teamCode: invite.teamCode,
      teamName: invite.teamName,
      role: "member",
    }
    const updatedMyTeams = [...session.myTeams, newTeam]
    updateSession({ receivedInvites: updatedInvites, myTeams: updatedMyTeams })
    setReceivedInvites((prev) =>
      prev.map((i) => i.inviteId === invite.inviteId ? { ...i, status: "accepted" } : i),
    )
    setMyTeam(newTeam)
  }

  const handleRejectInvite = (inviteId: string) => {
    const session = getFullSession()
    if (!session) return
    const updatedInvites = (session.receivedInvites ?? []).map((i) =>
      i.inviteId === inviteId ? { ...i, status: "rejected" as const } : i,
    )
    updateSession({ receivedInvites: updatedInvites })
    setReceivedInvites((prev) =>
      prev.map((i) => i.inviteId === inviteId ? { ...i, status: "rejected" } : i),
    )
  }

  const hasPendingInvites = receivedInvites.some((i) => i.status === "pending")

  return (
    <section ref={ref} id="teams">
      <HackathonSectionHeading icon={Users}>팀</HackathonSectionHeading>
      <div className="space-y-3">

        {/* 받은 초대 알림 */}
        {hasPendingInvites && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span className="text-sm text-amber-800 font-medium">
              {receivedInvites.filter((i) => i.status === "pending").length}개의 팀 초대가 있습니다.
            </span>
          </div>
        )}

        {/* 내 팀 카드 */}
        {myTeam && (
          <div className="relative rounded-xl overflow-hidden border border-primary-200">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-4 w-36 h-36 rounded-full bg-white/5" />
            <div className="relative px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-primary-200 uppercase tracking-widest">내 팀</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full bg-white/15 text-white px-2.5 py-1 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  {myTeam.role === "leader" ? "팀장" : "팀원"}
                </span>
              </div>
              <p className="text-xl font-bold text-white mb-3">{myTeam.teamName}</p>
              <div className="flex items-center">
                <span className="text-xs text-primary-200">{myTeam.teamCode}</span>
              </div>
            </div>
          </div>
        )}

        {/* 팀 목록 */}
        {teams.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {teams.map((team) => {
              const request = joinRequests.find((r) => r.teamCode === team.teamCode)
              const invite = receivedInvites.find((i) => i.teamCode === team.teamCode)
              const isMyTeam = myTeam?.teamCode === team.teamCode

              return (
                <div
                  key={team.teamCode}
                  className={cn(
                    "rounded-lg border bg-card p-4 flex flex-col gap-3",
                    invite?.status === "pending" ? "border-amber-200 bg-amber-50/30" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-snug">{team.name}</span>
                    <span className={cn(
                      "shrink-0 text-xs px-2 py-0.5 rounded-full font-medium",
                      team.isOpen ? "bg-primary-50 text-primary-600" : "bg-muted text-muted-foreground",
                    )}>
                      {team.isOpen ? "모집 중" : "모집 완료"}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{team.intro}</p>

                  {team.lookingFor.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {team.lookingFor.map((role) => (
                        <span key={role} className="text-xs border border-border rounded-md px-2 py-0.5 text-muted-foreground">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-xs text-muted-foreground">{team.memberCount}명</span>

                    {/* 액션 영역 */}
                    {isMyTeam ? (
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                        내 팀
                      </span>
                    ) : invite?.status === "pending" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-amber-700 font-medium mr-0.5">초대받음</span>
                        <button
                          onClick={() => handleAcceptInvite(invite)}
                          className="inline-flex items-center gap-0.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-700 transition-colors"
                        >
                          <Check size={11} />
                          수락
                        </button>
                        <button
                          onClick={() => handleRejectInvite(invite.inviteId)}
                          className="inline-flex items-center gap-0.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <X size={11} />
                          거절
                        </button>
                      </div>
                    ) : invite?.status === "accepted" ? (
                      <span className="text-xs text-primary-600 font-medium">합류 완료</span>
                    ) : invite?.status === "rejected" ? (
                      <span className="text-xs text-muted-foreground">거절함</span>
                    ) : request?.status === "pending" ? (
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">신청 중</span>
                        <button
                          onClick={() => handleCancelRequest(team.teamCode)}
                          className="text-xs text-destructive hover:underline ml-0.5"
                        >
                          취소
                        </button>
                      </div>
                    ) : team.isOpen && !myTeam && member ? (
                      <button
                        onClick={() => handleJoinRequest(team)}
                        className="text-xs rounded-lg border border-border px-3 py-1 hover:bg-muted transition-colors"
                      >
                        합류 신청
                      </button>
                    ) : team.isOpen && !myTeam && !member ? (
                      <span className="text-xs text-muted-foreground">로그인 필요</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">아직 등록된 팀이 없습니다.</p>
        )}

        {teamsSection.campEnabled && (
          <a
            href={teamsSection.listUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Users size={14} />
            팀 목록 전체 보기
          </a>
        )}
      </div>
    </section>
  )
})
HackathonTeamsSection.displayName = "HackathonTeamsSection"
export default HackathonTeamsSection
