"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import hackathonsData from "@/assets/data/public_hackathons.json";
import myData from "@/assets/data/my.json";
import { createLocalStore } from "@/lib/storage";
import { useMemberStore } from "@/stores/memberStore";
import { isValidUrl } from "@/lib/validateUrl";
import { findMaxTeamSize } from "@/lib/hackathonTeamSize";

type TeamType = "hackathon" | "open";

type RawTeam = {
  teamCode: string;
  hackathonSlug: string;
  name: string;
  isOpen: boolean;
  memberCount: number;
  lookingFor: string[];
  intro: string;
  contact: { type: "link"; url: string };
  createdAt: string;
};

type MySessionTeam = {
  hackathonSlug: string;
  teamCode: string;
  teamName: string;
  role: "leader" | "member";
};

type MySession = {
  userId: string;
  myTeams: MySessionTeam[];
  [key: string]: unknown;
};

const hackathons = hackathonsData as { slug: string; title: string; status: string }[];

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
  const member = useMemberStore((s) => s.member);

  const [teamType, setTeamType] = useState<TeamType>("hackathon");
  const [hackathonSlug, setHackathonSlug] = useState("");
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [positions, setPositions] = useState<string[]>([]);
  const [stacks, setStacks] = useState<string[]>([]);
  const [contactLink, setContactLink] = useState("");
  const [contactLinkError, setContactLinkError] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [maxMembersWarning, setMaxMembersWarning] = useState("");

  const hackathonMaxSize = teamType === "hackathon" && hackathonSlug
    ? findMaxTeamSize(hackathonSlug)
    : 20;

  const handleHackathonChange = (slug: string) => {
    setHackathonSlug(slug);
    if (slug) {
      const limit = findMaxTeamSize(slug);
      setMaxMembers((prev) => Math.min(prev, limit));
    }
    setMaxMembersWarning("");
  };

  const handleMaxMembersIncrease = () => {
    if (maxMembers >= hackathonMaxSize) {
      setMaxMembersWarning(`이 해커톤의 최대 팀원 수는 ${hackathonMaxSize}명입니다.`);
      return;
    }
    setMaxMembersWarning("");
    setMaxMembers((v) => v + 1);
  };

  const handleMaxMembersDecrease = () => {
    setMaxMembersWarning("");
    setMaxMembers((v) => Math.max(1, v - 1));
  };

  const handleContactLinkChange = (value: string) => {
    setContactLink(value);
    if (value && !isValidUrl(value)) {
      setContactLinkError("올바른 URL 형식이 아닙니다. (예: https://...)");
    } else {
      setContactLinkError("");
    }
  };

  const handleSubmit = () => {
    if (!teamName.trim()) return alert("팀명을 입력해주세요.");
    if (teamType === "hackathon" && !hackathonSlug) return alert("참여할 해커톤을 선택해주세요.");
    if (!contactLink.trim()) return alert("연락처 링크를 입력해주세요.");
    if (!isValidUrl(contactLink)) return;

    const teamCode = `T-${Date.now()}`;
    const teamsStore = createLocalStore<RawTeam>("teams", "teamCode");

    const newTeam: RawTeam = {
      teamCode,
      hackathonSlug: teamType === "hackathon" ? hackathonSlug : "",
      name: teamName.trim(),
      isOpen: true,
      memberCount: 1,
      lookingFor: positions,
      intro: description.trim(),
      contact: { type: "link", url: contactLink.trim() },
      createdAt: new Date().toISOString(),
    };
    teamsStore.create(newTeam);

    const myStore = createLocalStore<MySession>("my", "userId");
    myStore.seed(myData as unknown as MySession[]);

    const userId = member?.userId ?? (myData as any[])[0]?.userId;
    if (userId) {
      const { data: session } = myStore.getById(userId);
      if (session) {
        myStore.update(userId, {
          myTeams: [
            ...session.myTeams,
            { hackathonSlug: newTeam.hackathonSlug, teamCode, teamName: newTeam.name, role: "leader" },
          ],
        });
      }
    }

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
                onClick={() => { setTeamType("hackathon"); setHackathonSlug(""); }}
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
                onClick={() => { setTeamType("open"); setHackathonSlug(""); }}
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
                    value={hackathonSlug}
                    onChange={(e) => handleHackathonChange(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">해커톤을 선택하세요</option>
                    {hackathons.map((h) => (
                      <option key={h.slug} value={h.slug} disabled={h.status === "ended"}>
                        {h.title}{h.status === "ended" ? " (종료)" : ""}
                      </option>
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
              onChange={(e) => handleContactLinkChange(e.target.value)}
              placeholder="https://open.kakao.com/... 또는 https://forms.gle/..."
              className={`${inputClass} ${contactLinkError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
            />
            {contactLinkError && (
              <p className="mt-1 text-xs text-red-500">{contactLinkError}</p>
            )}
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
                  onClick={handleMaxMembersDecrease}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors text-lg font-semibold"
                >
                  −
                </button>
                <span className="w-8 text-center text-2xl font-bold text-gray-800">{maxMembers}</span>
                <button
                  type="button"
                  onClick={handleMaxMembersIncrease}
                  disabled={maxMembers >= hackathonMaxSize}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors text-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <span className="text-sm font-medium text-gray-600">명</span>
              </div>
            </div>
            {teamType === "hackathon" && hackathonSlug && (
              <p className="mt-2 text-xs text-gray-400">최대 {hackathonMaxSize}명 (해커톤 제한)</p>
            )}
            {maxMembersWarning && (
              <p className="mt-1 text-xs text-red-500">{maxMembersWarning}</p>
            )}
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
