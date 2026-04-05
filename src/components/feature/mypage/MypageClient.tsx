"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Trophy, Send, Users, Bell, Check, X,
  ExternalLink, ChevronRight, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemberStore } from "@/stores/memberStore"
import { createLocalStore } from "@/lib/storage"
import hackathonsData from "@/assets/data/public_hackathons.json"
import usersData from "@/assets/data/public_users.json"

// ── Types ─────────────────────────────────────────────────────
type MyTeam = {
  hackathonSlug: string
  teamCode: string
  teamName: string
  role: string
}
type MySubmission = {
  hackathonSlug: string
  teamCode: string
  latestSubmissionId: string
  latestScore: number
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
  displayName: string
  avatarUrl: string
  role: string
  myTeams: MyTeam[]
  mySubmissions: MySubmission[]
  joinRequests: JoinRequest[]
  receivedInvites: ReceivedInvite[]
  notifications: { unreadCount: number; listUrl: string }
  [key: string]: unknown
}
type Notification = {
  notificationId: string
  type: string
  isRead: boolean
  createdAt: string
  title: string
  body: string
  linkUrl: string
  relatedEntity: { type: string; slug?: string; teamCode?: string; submissionId?: string }
  [key: string]: unknown
}
type TeamSubmissions = {
  hackathonSlug: string
  teamCode: string
  teamName: string
  submissions: {
    submissionId: string
    submittedAt: string
    artifactType: string
    artifactUrl?: string
    artifactContent?: string
    score?: number
    status: string
    note?: string
    isBest?: boolean
  }[]
  [key: string]: unknown
}

// ── Helpers ───────────────────────────────────────────────────
const hackathonMap = Object.fromEntries(hackathonsData.map((h) => [h.slug, h]))

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

const NOTIF_TYPE_LABEL: Record<string, string> = {
  hackathon_new: "새 해커톤",
  hackathon_upcoming: "마감 임박",
  leaderboard_updated: "리더보드",
  submission_scored: "채점 완료",
  team_member_joined: "팀원 합류",
  team_invite: "팀 초대",
}

// ── Data helpers ──────────────────────────────────────────────
type PageData = {
  session: MySession
  invites: ReceivedInvite[]
  notifications: Notification[]
  teamSubmissionsMap: Record<string, TeamSubmissions>
}

/** Pure read — no side effects, safe to call in useMemo */
function readPageData(userId: string): PageData | null {
  const { data } = createLocalStore<MySession>("my", "userId").getById(userId)
  if (!data) return null

  const { data: notifData } = createLocalStore<Notification>("notifications", "notificationId").getAll()
  const notifications = (notifData ?? []).map((n) => ({ ...n, isRead: true }))

  const submissionsStore = createLocalStore<TeamSubmissions>("submissions", "teamCode")
  const teamSubmissionsMap: Record<string, TeamSubmissions> = {}
  for (const t of data.myTeams) {
    const { data: ts } = submissionsStore.getById(t.teamCode)
    if (ts) teamSubmissionsMap[t.teamCode] = ts
  }

  return { session: data, invites: data.receivedInvites ?? [], notifications, teamSubmissionsMap }
}

/** Write-only side effect — marks notifications as read in localStorage */
function persistNotificationsRead(userId: string, updateMember: (patch: Record<string, unknown>) => void) {
  const myStore = createLocalStore<MySession>("my", "userId")
  const notifStore = createLocalStore<Notification>("notifications", "notificationId")
  const { data } = myStore.getById(userId)
  const { data: notifData } = notifStore.getAll()
  const allNotifs = notifData ?? []
  const hasUnread = allNotifs.some((n) => !n.isRead)
  if (hasUnread) {
    notifStore.setAll(allNotifs.map((n) => ({ ...n, isRead: true })))
    myStore.update(userId, { notifications: { listUrl: data?.notifications?.listUrl ?? "", unreadCount: 0 } })
    updateMember({ unreadCount: 0 })
  }
}

export default function MypageClient() {
  const { member, updateMember } = useMemberStore()
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((k) => k + 1)

  const pageData = useMemo<PageData | null>(() => {
    if (typeof window === "undefined" || !member?.userId) return null
    return readPageData(member.userId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.userId, refreshKey])

  // Write side effect only — no setState
  useEffect(() => {
    if (!member?.userId) return
    persistNotificationsRead(member.userId, updateMember as (patch: Record<string, unknown>) => void)
  }, [member?.userId, updateMember])

  const session = pageData?.session ?? null
  const invites = pageData?.invites ?? []
  const notifications = pageData?.notifications ?? []
  const teamSubmissionsMap = pageData?.teamSubmissionsMap ?? {}

  const handleAcceptInvite = (invite: ReceivedInvite) => {
    if (!member?.userId || !session) return
    const myStore = createLocalStore<MySession>("my", "userId")
    const newTeam: MyTeam = { hackathonSlug: invite.hackathonSlug, teamCode: invite.teamCode, teamName: invite.teamName, role: "member" }
    const updatedInvites = (session.receivedInvites ?? []).map((i) =>
      i.inviteId === invite.inviteId ? { ...i, status: "accepted" as const } : i,
    )
    const updatedMyTeams = [...session.myTeams, newTeam]
    myStore.update(member.userId, { receivedInvites: updatedInvites, myTeams: updatedMyTeams })
    refresh()
  }

  const handleRejectInvite = (inviteId: string) => {
    if (!member?.userId || !session) return
    const myStore = createLocalStore<MySession>("my", "userId")
    const updatedInvites = (session.receivedInvites ?? []).map((i) =>
      i.inviteId === inviteId ? { ...i, status: "rejected" as const } : i,
    )
    myStore.update(member.userId, { receivedInvites: updatedInvites })
    refresh()
  }

  if (!member) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <p className="text-lg font-semibold">로그인이 필요합니다</p>
          <p className="text-sm text-muted-foreground">마이페이지는 로그인 후 이용할 수 있습니다.</p>
        </div>
      </main>
    )
  }

  const user = usersData.find((u) => u.userId === member.userId)
  const pendingInvites = invites.filter((i) => i.status === "pending")

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">

      {/* 프로필 헤더 */}
      <div className="rounded-xl border border-border bg-card px-6 py-5 mb-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700 shrink-0">
          {member.nickname.slice(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{member.nickname}</h1>
            {user?.role === "admin" && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">관리자</span>
            )}
          </div>
          {user && <p className="text-sm text-muted-foreground mt-0.5">{user.bio}</p>}
        </div>
        {user && (
          <div className="flex gap-6 shrink-0">
            <div className="text-center">
              <p className="text-xl font-bold">{user.stats.hackathonsJoined}</p>
              <p className="text-xs text-muted-foreground mt-0.5">참가</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{user.stats.hackathonsWon}</p>
              <p className="text-xs text-muted-foreground mt-0.5">수상</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{user.stats.submissionsTotal}</p>
              <p className="text-xs text-muted-foreground mt-0.5">제출</p>
            </div>
          </div>
        )}
      </div>

      {/* 대시보드 그리드 */}
      <div className="grid grid-cols-3 gap-4">

        {/* 참가 팀 목록 */}
        <div className="col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
            <Users size={14} className="text-primary-600" />
            <span className="text-sm font-semibold">참가 팀</span>
            <span className="ml-auto text-xs text-muted-foreground">{session?.myTeams.length ?? 0}개</span>
          </div>
          {session?.myTeams.length ? (
            <div className="divide-y divide-border">
              {session.myTeams.map((team) => {
                const hackathon = hackathonMap[team.hackathonSlug]
                return (
                  <div key={team.teamCode} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{team.teamName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {hackathon?.title ?? team.hackathonSlug}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                      team.role === "leader" ? "bg-primary-50 text-primary-700" : "bg-muted text-muted-foreground",
                    )}>
                      {team.role === "leader" ? "팀장" : "팀원"}
                    </span>
                    {hackathon && (
                      <Link href={hackathon.links.detail} className="shrink-0 text-muted-foreground hover:text-foreground">
                        <ChevronRight size={15} />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">참가 중인 팀이 없습니다.</p>
          )}
        </div>

        {/* 받은 초대 */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
            <Bell size={14} className="text-primary-600" />
            <span className="text-sm font-semibold">받은 초대</span>
            {pendingInvites.length > 0 && (
              <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                {pendingInvites.length}
              </span>
            )}
          </div>
          {invites.length ? (
            <div className="divide-y divide-border">
              {invites.map((invite) => (
                <div key={invite.inviteId} className="px-4 py-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{invite.teamName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {hackathonMap[invite.hackathonSlug]?.title ?? invite.hackathonSlug}
                    </p>
                  </div>
                  {invite.status === "pending" ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAcceptInvite(invite)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-700 transition-colors"
                      >
                        <Check size={11} /> 수락
                      </button>
                      <button
                        onClick={() => handleRejectInvite(invite.inviteId)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X size={11} /> 거절
                      </button>
                    </div>
                  ) : (
                    <span className={cn(
                      "text-xs font-medium",
                      invite.status === "accepted" ? "text-primary-600" : "text-muted-foreground",
                    )}>
                      {invite.status === "accepted" ? "수락함" : "거절함"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">받은 초대가 없습니다.</p>
          )}
        </div>

        {/* 제출 내역 */}
        <div className="col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
            <Send size={14} className="text-primary-600" />
            <span className="text-sm font-semibold">제출 내역</span>
          </div>
          {session?.myTeams.length ? (
            <div className="divide-y divide-border">
              {session.myTeams.map((team) => {
                const hackathon = hackathonMap[team.hackathonSlug]
                const ts = teamSubmissionsMap[team.teamCode]
                const mySub = session.mySubmissions.find((s) => s.hackathonSlug === team.hackathonSlug)
                return (
                  <div key={team.teamCode}>
                    <div className="flex items-center gap-3 px-5 py-3 bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
                        {hackathon?.title ?? team.hackathonSlug} — {team.teamName}
                      </p>
                      {mySub && (
                        <span className="text-xs font-mono font-semibold text-primary-600">
                          최고 점수: {mySub.latestScore.toFixed(mySub.latestScore < 1 ? 4 : 1)}
                        </span>
                      )}
                    </div>
                    {ts?.submissions.length ? (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b border-border">
                            <th className="text-left py-2 pl-5 pr-3 font-medium">ID</th>
                            <th className="text-left py-2 px-3 font-medium hidden sm:table-cell">형식</th>
                            <th className="text-left py-2 px-3 font-medium hidden md:table-cell">내용</th>
                            <th className="text-right py-2 px-3 font-medium">점수</th>
                            <th className="text-right py-2 px-3 font-medium hidden sm:table-cell">상태</th>
                            <th className="text-right py-2 pl-3 pr-5 font-medium">제출 시각</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ts.submissions.map((sub) => (
                            <tr key={sub.submissionId} className={cn(
                              "border-b border-border last:border-0",
                              sub.isBest && "bg-primary-50/40",
                            )}>
                              <td className="py-3 pl-5 pr-3 text-xs font-mono text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  {sub.isBest && (
                                    <Trophy size={11} className="text-primary-600 shrink-0" />
                                  )}
                                  {sub.submissionId}
                                </div>
                              </td>
                              <td className="py-3 px-3 hidden sm:table-cell">
                                <span className="text-xs uppercase bg-muted px-1.5 py-0.5 rounded font-medium text-muted-foreground">
                                  {sub.artifactType}
                                </span>
                              </td>
                              <td className="py-3 px-3 hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                                {sub.artifactUrl ? (
                                  <a href={sub.artifactUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                                    <ExternalLink size={11} /> 링크
                                  </a>
                                ) : sub.artifactType === "multi" && sub.artifactContent ? (() => {
                                  try {
                                    const parsed = JSON.parse(sub.artifactContent) as Record<string, string>
                                    return (
                                      <span className="truncate">
                                        {Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                                      </span>
                                    )
                                  } catch {
                                    return <span className="truncate">{sub.artifactContent}</span>
                                  }
                                })() : sub.artifactContent ? (
                                  <span className="truncate">{sub.artifactContent}</span>
                                ) : "—"}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-xs">
                                {sub.score != null
                                  ? <span className="font-semibold text-primary-600">{sub.score < 1 ? sub.score.toFixed(4) : sub.score.toFixed(1)}</span>
                                  : <span className="text-muted-foreground">—</span>
                                }
                              </td>
                              <td className="py-3 px-3 text-right hidden sm:table-cell">
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium",
                                  sub.status === "scored" ? "bg-primary-50 text-primary-700" : "bg-muted text-muted-foreground",
                                )}>
                                  {sub.status === "scored" ? "채점 완료" : "접수"}
                                </span>
                              </td>
                              <td className="py-3 pl-3 pr-5 text-right text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Clock size={10} />
                                  {relativeTime(sub.submittedAt)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="px-5 py-4 text-sm text-muted-foreground">아직 제출 내역이 없습니다.</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">제출 내역이 없습니다.</p>
          )}
        </div>

        {/* 알림 */}
        <div className="col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
            <Bell size={14} className="text-primary-600" />
            <span className="text-sm font-semibold">알림</span>
            <span className="ml-auto text-xs text-muted-foreground">{notifications.length}개</span>
          </div>
          {notifications.length ? (
            <div className="divide-y divide-border">
              {[...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notif) => (
                <Link
                  key={notif.notificationId}
                  href={notif.linkUrl}
                  className={cn(
                    "flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors",
                  )}
                >
                  <div className={cn(
                    "mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
                    notif.isRead ? "bg-transparent" : "bg-primary-500",
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary-600">
                        {NOTIF_TYPE_LABEL[notif.type] ?? notif.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{relativeTime(notif.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium mt-0.5">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">알림이 없습니다.</p>
          )}
        </div>
      </div>
    </main>
  )
}
