"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { Upload, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HackathonDetail } from "@/types/hackathonDetail"
import { useMemberStore } from "@/stores/memberStore"
import { createLocalStore } from "@/lib/storage"

interface Props {
  detail: HackathonDetail
  slug: string
  itemKey: string
  hackathonStatus: string
}

type MyTeam = { hackathonSlug: string; teamCode: string; teamName: string; role: string }
type MySubmissionSummary = { hackathonSlug: string; teamCode: string; latestSubmissionId: string; latestScore: number }
type MySession = { userId: string; displayName: string; myTeams: MyTeam[]; mySubmissions: MySubmissionSummary[]; [key: string]: unknown }
type Submission = { submissionId: string; itemKey?: string; submittedAt: string; artifactType: string; artifactUrl?: string; artifactContent?: string; score?: number; status: string; note?: string; isBest?: boolean }
type TeamSubmissions = { hackathonSlug: string; teamCode: string; teamName: string; submissions: Submission[]; [key: string]: unknown }
type LeaderboardEntry = { rank: number; teamName: string; score: number; submittedAt: string; [key: string]: unknown }
type LeaderboardRecord = { hackathonSlug: string; updatedAt: string; entries: LeaderboardEntry[]; [key: string]: unknown }

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

function FieldInput({ token, value, onChange }: { token: string; value: string; onChange: (v: string) => void }) {
  if (token === "text") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={tokenPlaceholder(token)}
        rows={5}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
      />
    )
  }
  return (
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={tokenPlaceholder(token)}
      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
    />
  )
}

export default function SubmitClient({ detail, slug, itemKey, hackathonStatus }: Props) {
  const router = useRouter()
  const member = useMemberStore((s) => s.member)

  const submitSection = detail.sections.submit
  const items = submitSection.submissionItems ?? [{ key: "default", title: "제출하기", format: submitSection.allowedArtifactTypes[0] ?? "url" }]
  const currentItem = items.find((i) => i.key === itemKey) ?? items[0]
  const parsed = parseFormat(currentItem.format)

  const [selectedToken, setSelectedToken] = useState<string>(
    parsed.mode === "or" ? parsed.tokens[0] : "",
  )
  const [values, setValues] = useState<Record<string, string>>({})
  const setValue = (token: string, v: string) => setValues((prev) => ({ ...prev, [token]: v }))
  const [newScore, setNewScore] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [error, setError] = useState("")
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!showCelebration) return
    if (!confettiCanvasRef.current) return

    const colors = ["#22c55e", "#16a34a", "#0ea5e9", "#f59e0b", "#ef4444"]
    const fire = confetti.create(confettiCanvasRef.current, { resize: true, useWorker: true })

    const burst = (particleCount: number) => {
      fire({
        particleCount,
        startVelocity: 45,
        spread: 70,
        angle: 60,
        origin: { x: 0, y: 0.65 },
        colors,
      })
      fire({
        particleCount,
        startVelocity: 45,
        spread: 70,
        angle: 120,
        origin: { x: 1, y: 0.65 },
        colors,
      })
    }

    burst(32)
    const endTimer = window.setTimeout(() => setShowCelebration(false), 380)

    return () => {
      window.clearTimeout(endTimer)
    }
  }, [showCelebration])

  // 이미 제출된 항목인지 확인
  const [existingSubmission, setExistingSubmission] = useState<Submission | null | undefined>(undefined)

  useEffect(() => {
    if (!member?.userId) return
    const { data: session } = createLocalStore<MySession>("my", "userId").getById(member.userId)
    const myTeam = session?.myTeams.find((t) => t.hackathonSlug === slug)
    if (!myTeam) { setExistingSubmission(null); return }
    const { data: ts } = createLocalStore<TeamSubmissions>("submissions", "teamCode").getById(myTeam.teamCode)
    if (!ts) { setExistingSubmission(null); return }
    const items = detail.sections.submit.submissionItems ?? []
    const itemIndex = items.findIndex((i) => i.key === itemKey)
    const found = ts.submissions.find((s) => {
      const rec = s as Record<string, unknown>
      if (rec.itemKey) return rec.itemKey === itemKey
      return itemIndex >= 0 && ts.submissions.indexOf(s) === itemIndex
    })
    setExistingSubmission(found ?? null)
  }, [member?.userId, slug, itemKey, detail])

  const submitted = existingSubmission !== undefined && existingSubmission !== null || newScore !== null
  const displayScore = newScore ?? existingSubmission?.score ?? null

  const handleSubmit = () => {
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

    let artifactType: string
    let artifactUrl: string | undefined
    let artifactContent: string | undefined

    if (parsed.mode === "or") {
      artifactType = selectedToken
      if (selectedToken === "text") artifactContent = values[selectedToken]
      else artifactUrl = values[selectedToken]
    } else if (parsed.mode === "and") {
      artifactType = "multi"
      const structured: Record<string, string> = {}
      for (const token of parsed.tokens) { structured[token] = values[token] }
      artifactContent = JSON.stringify(structured)
    } else {
      artifactType = parsed.token
      if (parsed.token === "text") artifactContent = values[parsed.token]
      else artifactUrl = values[parsed.token]
    }

    const newSubmission: Submission = {
      submissionId, itemKey, submittedAt, artifactType, status: "received",
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
    setShowCelebration(true)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{detail.title}</h1>
        <p className="mt-1 text-sm text-gray-400">{currentItem.title}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-50">
              <Upload size={16} className="text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">{currentItem.title}</h2>
          </div>
        </div>

        {submitSection.guide.length > 0 && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">제출 가이드</p>
            <ul className="space-y-1.5">
              {submitSection.guide.map((g, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-blue-400 shrink-0 mt-0.5">{i + 1}.</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hackathonStatus !== "ongoing" ? (
          <div data-testid="submit-status-blocked-msg" className="flex flex-col items-center gap-3 py-8 text-center text-gray-400">
            <p className="text-base font-semibold text-gray-700">
              {hackathonStatus === "ended" ? "종료된 해커톤입니다." : "아직 시작되지 않은 해커톤입니다."}
            </p>
            <p className="text-sm">진행 중인 해커톤에서만 제출할 수 있습니다.</p>
          </div>
        ) : submitted ? (
          <div className="relative overflow-visible rounded-lg flex flex-col items-center gap-3 py-8 text-center">
            <canvas
              ref={confettiCanvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 -inset-y-6 h-[calc(100%+3rem)] w-[calc(100%+5rem)]"
            />
            <CheckCircle size={36} className="relative z-10 text-blue-500" />
            <p className="text-base font-semibold text-gray-800">제출이 완료되었습니다!</p>
            {displayScore != null && (
              <p className="relative z-10 text-sm text-gray-500">
                점수: <span className="font-mono font-semibold text-blue-600">
                  {displayScore < 1 ? displayScore.toFixed(4) : displayScore.toFixed(1)}
                </span>점
              </p>
            )}
            <button
              onClick={() => router.back()}
              className="relative z-10 mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              돌아가기
            </button>
          </div>
        ) : (
          <div className="space-y-5">
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
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50",
                      )}
                    >
                      {tokenLabel(token)}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
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

            {parsed.mode === "and" && parsed.tokens.map((token) => (
              <div key={token} className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {tokenLabel(token)} <span className="text-red-400">*</span>
                </label>
                <FieldInput
                  token={token}
                  value={values[token] ?? ""}
                  onChange={(v) => { setValue(token, v); setError("") }}
                />
              </div>
            ))}

            {parsed.mode === "single" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {tokenLabel(parsed.token)} 입력
                </label>
                <FieldInput
                  token={parsed.token}
                  value={values[parsed.token] ?? ""}
                  onChange={(v) => { setValue(parsed.token, v); setError("") }}
                />
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={handleSubmit}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-green-400 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              제출하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
