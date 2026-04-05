"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HackathonDetail } from "@/types/hackathonDetail"
import { useMemberStore } from "@/stores/memberStore"
import { createLocalStore } from "@/lib/storage"

interface Props {
  detail: HackathonDetail
  slug: string
  itemKey: string
}

type MyTeam = { hackathonSlug: string; teamCode: string; teamName: string; role: string }
type MySubmissionSummary = { hackathonSlug: string; teamCode: string; latestSubmissionId: string; latestScore: number }
type MySession = { userId: string; displayName: string; myTeams: MyTeam[]; mySubmissions: MySubmissionSummary[]; [key: string]: unknown }
type Submission = { submissionId: string; itemKey?: string; submittedAt: string; artifactType: string; artifactUrl?: string; artifactContent?: string; score?: number; status: string; note?: string; isBest?: boolean }
type TeamSubmissions = { hackathonSlug: string; teamCode: string; teamName: string; submissions: Submission[]; [key: string]: unknown }
type LeaderboardEntry = { rank: number; teamName: string; score: number; submittedAt: string; [key: string]: unknown }
type LeaderboardRecord = { hackathonSlug: string; updatedAt: string; entries: LeaderboardEntry[]; [key: string]: unknown }

// ── Format parsing ──────────────────────────────────────────────────────────
// "text_or_url" → { mode: "or", tokens: ["text", "url"] }
// "pdf_url"     → { mode: "and", tokens: ["pdf", "url"] }
// "url"         → { mode: "single", tokens: ["url"] }

type ParsedFormat =
  | { mode: "single"; token: string }
  | { mode: "or"; tokens: string[] }
  | { mode: "and"; tokens: string[] }

function parseFormat(format: string): ParsedFormat {
  if (format.includes("_or_")) {
    return { mode: "or", tokens: format.split("_or_") }
  }
  const tokens = format.split("_")
  if (tokens.length > 1) {
    return { mode: "and", tokens }
  }
  return { mode: "single", token: format }
}

const TOKEN_LABEL: Record<string, string> = {
  text: "텍스트",
  url: "URL",
  pdf: "PDF URL",
  zip: "ZIP URL",
}

function tokenLabel(token: string) {
  return TOKEN_LABEL[token] ?? token.toUpperCase()
}

function tokenPlaceholder(token: string) {
  if (token === "text") return "내용을 입력하세요..."
  if (token === "pdf") return "https://example.com/solution.pdf"
  if (token === "zip") return "https://example.com/model.zip"
  return "https://..."
}

// ── Field component ─────────────────────────────────────────────────────────
function FieldInput({ token, value, onChange }: { token: string; value: string; onChange: (v: string) => void }) {
  if (token === "text") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={tokenPlaceholder(token)}
        rows={5}
        className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
    )
  }
  return (
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={tokenPlaceholder(token)}
      className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function SubmitClient({ detail, slug, itemKey }: Props) {
  const router = useRouter()
  const member = useMemberStore((s) => s.member)

  const submitSection = detail.sections.submit
  const items = submitSection.submissionItems ?? [{ key: "default", title: "제출하기", format: submitSection.allowedArtifactTypes[0] ?? "url" }]
  const currentItem = items.find((i) => i.key === itemKey) ?? items[0]
  const parsed = parseFormat(currentItem.format)

  // "or" 모드: 선택된 토큰
  const [selectedToken, setSelectedToken] = useState<string>(
    parsed.mode === "or" ? parsed.tokens[0] : "",
  )
  // 토큰별 입력값
  const [values, setValues] = useState<Record<string, string>>({})
  const setValue = (token: string, v: string) => setValues((prev) => ({ ...prev, [token]: v }))

  const [newScore, setNewScore] = useState<number | null>(null)
  const [error, setError] = useState("")

  // 이미 제출된 항목인지 확인
  const [existingSubmission, setExistingSubmission] = useState<Submission | null | undefined>(undefined)
  useEffect(() => {
    if (!member?.userId) return
    const { data: session } = createLocalStore<MySession>("my", "userId").getById(member.userId)
    const myTeam = session?.myTeams.find((t) => t.hackathonSlug === slug)
    if (!myTeam) { setExistingSubmission(null); return }
    const { data: ts } = createLocalStore<TeamSubmissions>("submissions", "teamCode").getById(myTeam.teamCode)
    if (!ts) { setExistingSubmission(null); return }
    // itemKey로 찾거나, seed 데이터처럼 itemKey 없는 경우 submissionItems 순서로 대응
    const items = detail.sections.submit.submissionItems ?? []
    const itemIndex = items.findIndex((i) => i.key === itemKey)
    const found = ts.submissions.find((s) => {
      const rec = s as Record<string, unknown>
      if (rec.itemKey) return rec.itemKey === itemKey
      // itemKey 없는 seed 데이터: submissionItems 순서와 submissions 순서를 매핑
      return itemIndex >= 0 && ts.submissions.indexOf(s) === itemIndex
    })
    setExistingSubmission(found ?? null)
  }, [member?.userId, slug, itemKey, detail])

  const submitted = existingSubmission !== undefined && existingSubmission !== null || newScore !== null
  const displayScore = newScore ?? existingSubmission?.score ?? null

  const handleSubmit = () => {
    // 유효성 검사
    if (parsed.mode === "single") {
      if (!values[parsed.token]?.trim()) { setError("내용을 입력해주세요."); return }
    } else if (parsed.mode === "or") {
      if (!values[selectedToken]?.trim()) { setError("내용을 입력해주세요."); return }
    } else {
      for (const token of parsed.tokens) {
        if (!values[token]?.trim()) { setError(`${tokenLabel(token)} 항목을 입력해주세요.`); return }
      }
    }
    if (!member?.userId) { setError("로그인이 필요합니다."); return }

    const myStore = createLocalStore<MySession>("my", "userId")
    const submissionsStore = createLocalStore<TeamSubmissions>("submissions", "teamCode")
    const leaderboardsStore = createLocalStore<LeaderboardRecord>("leaderboards", "hackathonSlug")

    const { data: mySession } = myStore.getById(member.userId)
    if (!mySession) { setError("세션 정보를 찾을 수 없습니다."); return }

    const myTeam = mySession.myTeams.find((t) => t.hackathonSlug === slug)
    if (!myTeam) { setError("이 해커톤에 참가한 팀이 없습니다."); return }

    const submittedAt = new Date().toISOString()
    const submissionId = `SUB-${myTeam.teamCode}-${itemKey.toUpperCase()}-${Date.now()}`

    // 제출 artifact 구성
    let artifactType: string
    let artifactUrl: string | undefined
    let artifactContent: string | undefined

    if (parsed.mode === "or") {
      artifactType = selectedToken
      if (selectedToken === "text") artifactContent = values[selectedToken]
      else artifactUrl = values[selectedToken]
    } else if (parsed.mode === "and") {
      // 복합 제출: 모든 항목을 JSON으로 artifactContent에 저장
      artifactType = "multi"
      const structured: Record<string, string> = {}
      for (const token of parsed.tokens) {
        structured[token] = values[token]
      }
      artifactContent = JSON.stringify(structured)
    } else {
      artifactType = parsed.token
      if (parsed.token === "text") artifactContent = values[parsed.token]
      else artifactUrl = values[parsed.token]
    }

    const newSubmission: Submission = {
      submissionId,
      itemKey,
      submittedAt,
      artifactType,
      status: "received",
      ...(artifactUrl ? { artifactUrl } : {}),
      ...(artifactContent ? { artifactContent } : {}),
    }

    const { data: existing } = submissionsStore.getById(myTeam.teamCode)
    if (existing) {
      submissionsStore.update(myTeam.teamCode, { submissions: [...existing.submissions, newSubmission] })
    } else {
      submissionsStore.create({ hackathonSlug: slug, teamCode: myTeam.teamCode, teamName: myTeam.teamName, submissions: [newSubmission] })
    }

    const simulatedScore = Math.round((Math.random() * 8 + 82) * 10) / 10
    setNewScore(simulatedScore)

    const { data: lb } = leaderboardsStore.getById(slug)
    if (lb) {
      const teamName = myTeam.teamName
      const hasEntry = lb.entries.some((e) => e.teamName === teamName)
      const updatedEntries: LeaderboardEntry[] = hasEntry
        ? lb.entries.map((e) => e.teamName === teamName ? { ...e, score: simulatedScore, submittedAt } : e)
        : [...lb.entries, { rank: lb.entries.length + 1, teamName, score: simulatedScore, submittedAt }]
      leaderboardsStore.update(slug, { entries: updatedEntries, updatedAt: submittedAt })
    }

    const updatedSubmissions = mySession.mySubmissions.some((s) => s.hackathonSlug === slug)
      ? mySession.mySubmissions.map((s) => s.hackathonSlug === slug ? { ...s, latestSubmissionId: submissionId, latestScore: simulatedScore } : s)
      : [...mySession.mySubmissions, { hackathonSlug: slug, teamCode: myTeam.teamCode, latestSubmissionId: submissionId, latestScore: simulatedScore }]
    myStore.update(member.userId, { mySubmissions: updatedSubmissions })

    setNewScore(simulatedScore)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{detail.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{currentItem.title}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary-50">
              <Upload size={16} className="text-primary-600" />
            </div>
            <h2 className="text-base font-semibold">{currentItem.title}</h2>
          </div>
        </div>

        {submitSection.guide.length > 0 && (
          <div className="rounded-lg bg-muted/30 border border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">제출 가이드</p>
            <ul className="space-y-1.5">
              {submitSection.guide.map((g, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="text-primary-400 shrink-0 mt-0.5">{i + 1}.</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle size={36} className="text-primary-600" />
            <p className="text-base font-semibold">제출이 완료되었습니다!</p>
            {displayScore != null && (
              <p className="text-sm text-muted-foreground">
                점수: <span className="font-mono font-semibold text-primary-600">
                  {displayScore < 1 ? displayScore.toFixed(4) : displayScore.toFixed(1)}
                </span>점
              </p>
            )}
            <button
              onClick={() => router.back()}
              className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              돌아가기
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* or 모드: 탭 선택 */}
            {parsed.mode === "or" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {parsed.tokens.map((token) => (
                    <button
                      key={token}
                      onClick={() => { setSelectedToken(token); setError("") }}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        selectedToken === token
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {tokenLabel(token)}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {tokenLabel(selectedToken)} 입력
                  </label>
                  <FieldInput
                    token={selectedToken}
                    value={values[selectedToken] ?? ""}
                    onChange={(v) => { setValue(selectedToken, v); setError("") }}
                  />
                </div>
              </div>
            )}

            {/* and 모드: 모든 항목 입력 */}
            {parsed.mode === "and" && parsed.tokens.map((token) => (
              <div key={token} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {tokenLabel(token)} <span className="text-destructive">*</span>
                </label>
                <FieldInput
                  token={token}
                  value={values[token] ?? ""}
                  onChange={(v) => { setValue(token, v); setError("") }}
                />
              </div>
            ))}

            {/* single 모드 */}
            {parsed.mode === "single" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {tokenLabel(parsed.token)} 입력
                </label>
                <FieldInput
                  token={parsed.token}
                  value={values[parsed.token] ?? ""}
                  onChange={(v) => { setValue(parsed.token, v); setError("") }}
                />
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              onClick={handleSubmit}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-700 transition-colors"
            >
              제출하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
