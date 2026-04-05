"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

type TeamType = "hackathon" | "open";

const HACKATHONS = [
  "Aimers 8기 : 모델 경량화 온라인 해커톤",
  "월간 해커톤 : 바이브 코딩 개선 AI 아이디어 공모전 (2026.02)",
  "긴급 인수인계 해커톤: 명세서만 보고 구현하라",
];

function TagField({
  label,
  placeholder,
  tags,
  onAdd,
  onRemove,
  tagClassName,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  tagClassName: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !tags.includes(trimmed)) onAdd(trimmed);
      setInput("");
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">
        {label}
      </label>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${tagClassName}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400"
      />
      <p className="mt-1 text-xs text-gray-400">Enter 키로 추가</p>
    </div>
  );
}

export default function NewTeamPage() {
  const router = useRouter();

  const [teamType, setTeamType] = useState<TeamType>("hackathon");
  const [hackathon, setHackathon] = useState("");
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [positions, setPositions] = useState<string[]>([]);
  const [stacks, setStacks] = useState<string[]>([]);
  const [contactLink, setContactLink] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);

  const handleSubmit = () => {
    if (!teamName.trim()) return alert("팀명을 입력해주세요.");
    if (teamType === "hackathon" && !hackathon) return alert("참여할 해커톤을 선택해주세요.");
    if (!contactLink.trim()) return alert("연락처 링크를 입력해주세요.");
    alert("팀이 생성됐습니다!");
    router.push("/team");
  };

  const inputClass = "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400";
  const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500";
  const sectionClass = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";
  const sectionTitleClass = "mb-4 text-xs font-bold uppercase tracking-widest text-gray-400";

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-green-50 px-4 py-16">
      <div className="mx-auto w-full max-w-2xl">

        {/* 타이틀 */}
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">캠프 / 팀 만들기</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">새 팀 만들기</h1>
          <p className="mt-1 text-sm text-gray-500">함께할 팀원을 모집하고 프로젝트를 시작하세요.</p>
        </div>

        <div className="flex flex-col gap-5">

          {/* 1. 팀 유형 */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>팀 유형</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setTeamType("hackathon"); setHackathon(""); }}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                  teamType === "hackathon"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700"
                }`}
              >
                🏆 해커톤팀
              </button>
              <button
                type="button"
                onClick={() => { setTeamType("open"); setHackathon(""); }}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                  teamType === "open"
                    ? "border-amber-500 bg-amber-100 text-amber-700"
                    : "border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700"
                }`}
              >
                🔓 오픈팀
              </button>
            </div>
          </div>

          {/* 2. 기본 정보 */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>기본 정보</p>
            <div className="flex flex-col gap-4">
              {teamType === "hackathon" && (
                <div>
                  <label className={labelClass}>참여 해커톤</label>
                  <select
                    value={hackathon}
                    onChange={(e) => setHackathon(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">해커톤을 선택하세요</option>
                    {HACKATHONS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>팀명</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="팀 이름을 입력하세요"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>팀 소개</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="팀을 간단히 소개해주세요."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* 3. 모집 포지션 + 기술 스택 */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>모집 정보</p>
            <div className="grid grid-cols-2 gap-6">
              <TagField
                label="모집 포지션"
                placeholder="예) 프론트엔드"
                tags={positions}
                onAdd={(t) => setPositions([...positions, t])}
                onRemove={(t) => setPositions(positions.filter((p) => p !== t))}
                tagClassName="bg-green-100 text-green-800 border border-green-200"
              />
              <TagField
                label="기술 스택"
                placeholder="예) React"
                tags={stacks}
                onAdd={(t) => setStacks([...stacks, t])}
                onRemove={(t) => setStacks(stacks.filter((s) => s !== t))}
                tagClassName="bg-blue-100 text-blue-800 border border-blue-200"
              />
            </div>
          </div>

          {/* 4. 연락처 */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>연락처</p>
            <label className={labelClass}>구글폼 또는 오픈채팅 링크</label>
            <input
              type="url"
              value={contactLink}
              onChange={(e) => setContactLink(e.target.value)}
              placeholder="https://open.kakao.com/... 또는 https://forms.gle/..."
              className={inputClass}
            />
          </div>

          {/* 5. 모집 인원 */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>모집 인원</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">최대 팀원 수</p>
                <p className="text-xs text-gray-500">본인 포함 최대 인원을 설정하세요.</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMaxMembers(Math.max(1, maxMembers - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors text-lg font-semibold"
                >
                  −
                </button>
                <span className="w-8 text-center text-2xl font-bold text-gray-800">{maxMembers}</span>
                <button
                  type="button"
                  onClick={() => setMaxMembers(Math.min(20, maxMembers + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors text-lg font-semibold"
                >
                  +
                </button>
                <span className="text-sm font-medium text-gray-600">명</span>
              </div>
            </div>
          </div>

          {/* 6. 버튼 */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => router.push("/team")}
              className="flex-1 rounded-xl border-2 border-gray-300 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-green-400 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              팀 생성하기
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
