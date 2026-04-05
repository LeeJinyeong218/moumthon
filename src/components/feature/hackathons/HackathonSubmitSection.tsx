"use client"

import { forwardRef, useState, useEffect } from "react"
import { Upload, LogIn, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HackathonDetail } from "@/types/hackathonDetail"
import type { HackathonStatus } from "@/types/hackathon"
import { useMemberStore } from "@/stores/memberStore"
import { createLocalStore } from "@/lib/storage"
import { useRouter } from "next/navigation"
import HackathonSectionHeading from "./HackathonSectionHeading"

interface Props {
  submit: HackathonDetail["sections"]["submit"]
  slug: string
  hackathonStatus?: HackathonStatus
  allowSolo?: boolean
}

type MyTeam = { hackathonSlug: string; teamCode: string; [key: string]: unknown }
type MySession = { userId: string; myTeams: MyTeam[]; [key: string]: unknown }
type Submission = { submissionId: string; itemKey?: string; [key: string]: unknown }
type TeamSubmissions = { teamCode: string; submissions: Submission[]; [key: string]: unknown }

const HackathonSubmitSection = forwardRef<HTMLElement, Props>(({ submit, slug, hackathonStatus = "upcoming", allowSolo = false }, ref) => {
  const router = useRouter()
  const member = useMemberStore((s) => s.member)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [submittedKeys, setSubmittedKeys] = useState<Set<string>>(new Set())
  const [hasTeam, setHasTeam] = useState(false)

  const isEnded = hackathonStatus === "ended"

  const items = submit.submissionItems ?? [{ key: "default", title: "제출하기", format: submit.allowedArtifactTypes[0] ?? "url" }]

  useEffect(() => {
    if (!member?.userId) { setSubmittedKeys(new Set()); return }
    const { data: session } = createLocalStore<MySession>("my", "userId").getById(member.userId)
    const myTeam = session?.myTeams.find((t) => t.hackathonSlug === slug)
    setHasTeam(!!myTeam)
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

  // 제출 가능 여부: 로그인 + (팀 있음 OR 개인참가 허용) + 미종료
  const canSubmit = !!member && (hasTeam || allowSolo) && !isEnded

  const handleSubmitClick = (key: string) => {
    if (!member) { setLoginDialogOpen(true); return }
    router.push(`/hackathons/${slug}/submit/${key}`)
  }

  return (
    <section ref={ref} id="submit" data-testid="hackathon-section-submit">
      <HackathonSectionHeading icon={Upload}>제출</HackathonSectionHeading>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {submit.allowedArtifactTypes.map((type) => (
            <span
              key={type}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              {type}
            </span>
          ))}
          {allowSolo && (
            <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              개인참가 가능
            </span>
          )}
        </div>


        {isEnded && (
          <div className="rounded-lg border border-muted bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            종료된 해커톤입니다. 제출이 불가합니다.
          </div>
        )}

        {!isEnded && member && !hasTeam && !allowSolo && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
            팀에 합류한 후 제출할 수 있습니다.
          </div>
        )}

        <div data-testid="hackathon-submit-guide" className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">제출 가이드</p>

          <ul className="space-y-2">
            {submit.guide.map((g, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-blue-400 shrink-0 mt-0.5">{i + 1}.</span>
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">제출 항목</p>
          {items.map((item, i) => {
            const isDone = submittedKeys.has(item.key)
            return (
              <button
                key={item.key}
                data-testid={`hackathon-submit-item-${item.key}`}
                onClick={() => canSubmit ? handleSubmitClick(item.key) : (!member ? setLoginDialogOpen(true) : undefined)}
                disabled={isEnded || (!hasTeam && !allowSolo)}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border px-5 py-3.5 transition-colors group shadow-sm",
                  isDone
                    ? "border-blue-200 bg-blue-50/40"
                    : canSubmit
                       ? "border-blue-200 bg-blue-50/30 hover:bg-blue-50/50"
                       : "border-gray-200 bg-white opacity-50 cursor-not-allowed",       

                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-400 w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-800">{item.title}</span>
                </div>
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                    <CheckCircle2 size={13} />
                    제출 완료
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setLoginDialogOpen(false)}
        >
          <div
            className="rounded-2xl bg-white border border-gray-200 p-6 w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-blue-50 p-3">
                <LogIn size={22} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">로그인이 필요합니다</h3>
                <p className="mt-1 text-sm text-gray-500">제출은 로그인 후 이용할 수 있습니다.</p>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setLoginDialogOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => setLoginDialogOpen(false)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-green-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
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
