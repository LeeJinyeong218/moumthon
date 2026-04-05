"use client"

import { forwardRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, LogIn, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HackathonDetail } from "@/types/hackathonDetail"
import { useMemberStore } from "@/stores/memberStore"
import { createLocalStore } from "@/lib/storage"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  submit: HackathonDetail["sections"]["submit"]
  slug: string
}

type MyTeam = { hackathonSlug: string; teamCode: string; [key: string]: unknown }
type MySession = { userId: string; myTeams: MyTeam[]; [key: string]: unknown }
type Submission = { submissionId: string; itemKey?: string; [key: string]: unknown }
type TeamSubmissions = { teamCode: string; submissions: Submission[]; [key: string]: unknown }

const HackathonSubmitSection = forwardRef<HTMLElement, Props>(({ submit, slug }, ref) => {
  const router = useRouter()
  const member = useMemberStore((s) => s.member)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [submittedKeys, setSubmittedKeys] = useState<Set<string>>(new Set())

  const items = submit.submissionItems ?? [{ key: "default", title: "제출하기", format: submit.allowedArtifactTypes[0] ?? "url" }]

  useEffect(() => {
    if (!member?.userId) { setSubmittedKeys(new Set()); return }
    const { data: session } = createLocalStore<MySession>("my", "userId").getById(member.userId)
    const myTeam = session?.myTeams.find((t) => t.hackathonSlug === slug)
    if (!myTeam) return
    const { data: ts } = createLocalStore<TeamSubmissions>("submissions", "teamCode").getById(myTeam.teamCode as string)
    if (!ts) return
    const keys = new Set<string>()
    ts.submissions.forEach((s, idx) => {
      const key = (s as Record<string, unknown>).itemKey as string | undefined
      if (key) {
        keys.add(key)
      } else if (items[idx]) {
        keys.add(items[idx].key)
      }
    })
    setSubmittedKeys(keys)
  }, [member?.userId, slug])

  const handleSubmitClick = (key: string) => {
    if (!member) { setLoginDialogOpen(true); return }
    router.push(`/hackathons/${slug}/submit/${key}`)
  }

  return (
    <section ref={ref} id="submit">
      <HackathonSectionHeading icon={Upload}>제출</HackathonSectionHeading>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {submit.allowedArtifactTypes.map((type) => (
            <span
              key={type}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {type}
            </span>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">제출 가이드</p>
          <ul className="space-y-2">
            {submit.guide.map((g, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-primary-400 shrink-0 mt-0.5">{i + 1}.</span>
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">제출 항목</p>
          {items.map((item, i) => {
            const isDone = submittedKeys.has(item.key)
            return (
              <button
                key={item.key}
                onClick={() => handleSubmitClick(item.key)}
                className={cn(
                  "w-full flex items-center justify-between rounded-lg border px-5 py-3.5 transition-colors group",
                  isDone
                    ? "border-primary-200 bg-primary-50/40"
                    : "border-border bg-card hover:border-primary-200 hover:bg-primary-50/50",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary-400 w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                </div>
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
                    <CheckCircle2 size={13} />
                    제출 완료
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground group-hover:text-primary-600 transition-colors">
                    제출하기 →
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {loginDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setLoginDialogOpen(false)}
        >
          <div
            className="rounded-xl bg-card border border-border p-6 w-80 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-primary-50 p-3">
                <LogIn size={22} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold">로그인이 필요합니다</h3>
                <p className="mt-1 text-sm text-muted-foreground">제출은 로그인 후 이용할 수 있습니다.</p>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setLoginDialogOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => setLoginDialogOpen(false)}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-700 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
})
HackathonSubmitSection.displayName = "HackathonSubmitSection"
export default HackathonSubmitSection
