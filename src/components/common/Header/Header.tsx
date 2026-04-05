"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/common";
import { useMemberStore } from "@/stores/memberStore";
import { createLocalStore } from "@/lib/storage";
import myInitialData from "@/assets/data/my.json";
import { Nav } from "./Nav";
import { Breadcrumb } from "./Breadcrumb";

type MySession = {
  userId: string
  displayName: string
  avatarUrl: string
  notifications: { unreadCount: number; listUrl: string }
  [key: string]: unknown
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

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export function Header() {
  const pathname = usePathname();
  const isMain = pathname === "/";

  const { member, setMember, clearMember, updateMember } = useMemberStore();
  const isLogin = !!member;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [invites, setInvites] = useState<ReceivedInvite[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = member?.unreadCount ?? 0;

  // 알림 드롭다운 열릴 때 receivedInvites 로드
  useEffect(() => {
    if (!notifOpen || !member?.userId) return

    const { data: session } = createLocalStore<MySession>("my", "userId").getById(member.userId)
    const all = (session?.receivedInvites as ReceivedInvite[] | undefined) ?? []
    setInvites([...all].sort((a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime()))

    // pending 초대가 있으면 unreadCount 0으로
    const hasPending = all.some((i) => i.status === "pending")
    if (hasPending && (member.unreadCount ?? 0) > 0) {
      updateMember({ unreadCount: 0 })
    }
  }, [notifOpen, member?.userId, member?.unreadCount, updateMember])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [notifOpen])

  const handleLogin = () => {
    const { data } = createLocalStore<MySession>("my", "userId").getAll();
    const session = data?.[0];
    if (session) {
      setMember({
        userId: session.userId,
        nickname: session.displayName,
        avatarUrl: session.avatarUrl,
        unreadCount: session.notifications?.unreadCount ?? 0,
      });
    } else {
      setMember({ nickname: "현현" });
    }
  };

  const handleLogout = () => {
    clearMember();
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4">

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-base font-semibold hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-400 hover:text-white transition-colors px-2 py-1 rounded-md"
          >
            MoumThon
          </Link>
          {!isMain && <Breadcrumb pathname={pathname} />}
          <Nav />
        </div>

        <div className="flex items-center gap-2">
          {isLogin && (
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <Bell size={18} className="text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold">알림</span>
                    <Link
                      href="/mypage"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      전체 보기
                    </Link>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {invites.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-muted-foreground text-center">받은 초대가 없습니다.</p>
                    ) : (
                      invites.map((invite) => (
                        <Link
                          key={invite.inviteId}
                          href={`/hackathons/${invite.hackathonSlug}#teams`}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                        >
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${invite.status === "pending" ? "bg-primary-500" : "bg-transparent"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-primary-600">팀 초대</span>
                              <span className="text-xs text-muted-foreground">{relativeTime(invite.invitedAt)}</span>
                            </div>
                            <p className="text-sm font-medium mt-0.5 truncate">{invite.teamName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {invite.status === "pending" ? "수락 대기 중" : invite.status === "accepted" ? "수락함" : "거절함"}
                            </p>
                          </div>
                          <ChevronRight size={13} className="text-muted-foreground shrink-0 mt-1" />
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            {isLogin ? (
              <>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-sm hover:text-primary"
                >
                  {member!.nickname}님!
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-32 rounded-md border bg-white shadow-md z-50">
                    <Link
                      href="/mypage"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleLogin}
                className="bg-gradient-to-r from-blue-500 to-green-400 text-white hover:from-blue-600 hover:to-green-500 transition-colors"
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
