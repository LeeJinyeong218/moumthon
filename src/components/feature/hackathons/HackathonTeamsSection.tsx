"use client"

import { forwardRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Users, Clock, Check, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HackathonDetail } from "@/types/hackathonDetail"
import type { HackathonStatus } from "@/types/hackathon"
import type { Team } from "@/types/team"
import { useMemberStore } from "@/stores/memberStore"
import { createLocalStore } from "@/lib/storage"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  teamsSection: HackathonDetail["sections"]["teams"]
  teams: Team[]
  slug: string
  hackathonStatus?: HackathonStatus
  allowSolo?: boolean
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

type MySubmission = {
  hackathonSlug: string
}

type MySession = {
  userId: string
  myTeams: MyTeam[]
  joinRequests: JoinRequest[]
  receivedInvites: ReceivedInvite[]
  mySubmissions?: MySubmission[]
  [key: string]: unknown
}

const HackathonTeamsSection = forwardRef<HTMLElement, Props>(({ teamsSection, teams, slug, hackathonStatus = "upcoming", allowSolo = false }, ref) => {
  const member = useMemberStore((s) => s.member)

  const isEnded = hackathonStatus === "ended"
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null)
  const [hasSubmission, setHasSubmission] = useState(false)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInvite[]>([])
  const [joinCautionTarget, setJoinCautionTarget] = useState<Team | null>(null)

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
    setHasSubmission((data.mySubmissions ?? []).some((s: { hackathonSlug: string }) => s.hackathonSlug === slug))
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

  const handleJoinRequestClick = (team: Team) => {
    setJoinCautionTarget(team)
  }

  const handleJoinCautionConfirm = () => {
    if (!joinCautionTarget) return
    handleJoinRequest(joinCautionTarget)
    setJoinCautionTarget(null)
  }

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
    <section ref={ref} id="teams" data-testid="hackathon-section-teams">
      <HackathonSectionHeading icon={Users}>팀</HackathonSectionHeading>
      <div className="space-y-3">

        {/* 받은 초대 알림 */}
        {hasPendingInvites && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span className="text-sm text-amber-800 font-medium">
              {receivedInvites.filter((i) => i.status === "pending").length}개의 팀 초대가 있습니다.
            </span>
          </div>
        )}

        {/* 내 팀 카드 */}
        {myTeam && (
          <div className="relative rounded-xl overflow-hidden border border-blue-200">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-green-500" />
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-4 w-36 h-36 rounded-full bg-white/5" />
            <div className="relative px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-widest">내 팀</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full bg-white/15 text-white px-2.5 py-1 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 shrink-0" />
                  {myTeam.role === "leader" ? "팀장" : "팀원"}
                </span>
              </div>
              <p className="text-xl font-bold text-white mb-3">{myTeam.teamName}</p>
              <div className="flex items-center">
                <span className="text-xs text-blue-100">{myTeam.teamCode}</span>
              </div>
            </div>
          </div>
        )}

        {/* 종료 / 제출 완료 안내 */}
        {(isEnded || hasSubmission) && (
          <div className="rounded-lg border border-muted bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {isEnded
              ? "종료된 해커톤입니다. 팀 만들기·초대·합류가 불가합니다."
              : "제출을 완료했습니다. 팀 만들기·초대·합류가 불가합니다."}
          </div>
        )}

        {/* 팀 만들기 버튼 */}
        {!myTeam && !isEnded && !hasSubmission && member && (
          <Link
            href={`/camp/new?hackathon=${slug}`}
            data-testid="hackathon-teams-create-btn"
            className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50/60 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <Plus size={14} />
            팀 만들기
          </Link>
        )}

        {/* 팀 목록 */}
        {teams.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {teams.map((team) => {
              const request = joinRequests.find((r) => r.teamCode === team.teamCode)
              const invite = receivedInvites.find((i) => i.teamCode === team.teamCode)
              const isMyTeam = myTeam?.teamCode === team.teamCode
              const actionsBlocked = isEnded || hasSubmission

              return (
                <div
                  key={team.teamCode}
                  className={cn(
                    "rounded-xl border bg-white p-4 flex flex-col gap-3 shadow-sm",
                    invite?.status === "pending" ? "border-amber-200 bg-amber-50/30" : "border-gray-200",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800 leading-snug">{team.name}</span>
                    <span className={cn(
                      "shrink-0 text-xs px-2 py-0.5 rounded-full font-medium",
                      team.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400",
                    )}>
                      {team.isOpen ? "모집 중" : "모집 완료"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed flex-1">{team.intro}</p>

                  {team.lookingFor.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {team.lookingFor.map((role) => (
                        <span key={role} className="text-xs border border-gray-200 rounded-md px-2 py-0.5 text-gray-500">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{team.memberCount}명</span>

                    {isMyTeam ? (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        내 팀
                      </span>
                    ) : actionsBlocked ? (
                      null
                    ) : invite?.status === "pending" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-amber-700 font-medium mr-0.5">초대받음</span>
                        <button
                          data-testid="hackathon-teams-invite-accept-btn"
                          onClick={() => handleAcceptInvite(invite)}
                          className="inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r from-blue-500 to-green-400 px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                        >
                          <Check size={11} />
                          수락
                        </button>
                        <button
                          data-testid="hackathon-teams-invite-reject-btn"
                          onClick={() => handleRejectInvite(invite.inviteId)}
                          className="inline-flex items-center gap-0.5 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          <X size={11} />
                          거절
                        </button>
                      </div>
                    ) : invite?.status === "accepted" ? (
                      <span className="text-xs text-blue-600 font-medium">합류 완료</span>
                    ) : invite?.status === "rejected" ? (
                      <span className="text-xs text-gray-400">거절함</span>
                    ) : request?.status === "pending" ? (
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-gray-400" />
                        <span className="text-xs text-gray-400">신청 중</span>
                        <button
                          onClick={() => handleCancelRequest(team.teamCode)}
                          className="text-xs text-red-400 hover:underline ml-0.5"
                        >
                          취소
                        </button>
                      </div>
                    ) : team.isOpen && !myTeam && member ? (
                      <button
                        data-testid={`hackathon-teams-join-btn-${team.teamCode}`}
                        onClick={() => handleJoinRequestClick(team)}
                        className="text-xs rounded-lg border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        합류 신청
                      </button>
                    ) : team.isOpen && !myTeam && !member ? (
                      <span className="text-xs text-gray-400">로그인 필요</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-2">아직 등록된 팀이 없습니다.</p>
        )}

        {teamsSection.campEnabled && (
          <a
            href={teamsSection.listUrl}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Users size={14} />
            팀 목록 전체 보기
          </a>
        )}
      </div>

      {joinCautionTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setJoinCautionTarget(null)}
        >
          <div
            data-testid="hackathon-teams-join-caution-dialog"
            className="rounded-2xl bg-white border border-gray-200 p-6 w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold text-gray-800">합류 신청 유의사항</h3>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>• 신청 후 팀장의 승인이 필요합니다.</li>
                <li>• 한 해커톤에 하나의 팀에만 합류할 수 있습니다.</li>
                <li>• 신청은 언제든 취소할 수 있습니다.</li>
              </ul>
              <div className="flex gap-2">
                <button
                  data-testid="hackathon-teams-join-caution-cancel-btn"
                  onClick={() => setJoinCautionTarget(null)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  data-testid="hackathon-teams-join-caution-confirm-btn"
                  onClick={handleJoinCautionConfirm}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-green-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  신청하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
})
HackathonTeamsSection.displayName = "HackathonTeamsSection"
export default HackathonTeamsSection
