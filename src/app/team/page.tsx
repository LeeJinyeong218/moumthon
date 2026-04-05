"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeamCard } from "@/components/feature/team/TeamCard";
import { MyTeamCard, MyTeam } from "@/components/feature/team/MyTeamCard";
import teamsData from "@/assets/data/public_teams.json";
import teamMembersData from "@/assets/data/public_team_members.json";
import { createLocalStore } from "@/lib/storage";
import { useMemberStore } from "@/stores/memberStore";

type StatusFilter = "all" | "recruiting" | "closed";
type TypeFilter = "all" | "hackathon" | "open";

type RawTeam = {
  teamCode: string;
  hackathonSlug: string;
  name: string;
  isOpen: boolean;
  memberCount: number;
  lookingFor: string[];
  intro: string;
  contact: { type: string; url: string };
  createdAt: string;
};

type RawMember = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
};

type RawTeamMembers = {
  teamCode: string;
  hackathonSlug: string;
  members: RawMember[];
};

type MySessionTeam = {
  hackathonSlug: string;
  teamCode: string;
  teamName: string;
  role: string;
};

type MySession = {
  userId: string;
  myTeams: MySessionTeam[];
  [key: string]: unknown;
};

// 멤버 조회 헬퍼
function getMembersForTeam(teamCode: string) {
  const found = (teamMembersData as RawTeamMembers[]).find(
    (tm) => tm.teamCode === teamCode
  );
  return found?.members ?? [];
}

function buildMyTeam(teamCode: string): MyTeam {
  const raw = (teamsData as RawTeam[]).find((t) => t.teamCode === teamCode);
  // Also check localStorage teams store for newly created teams
  const stored = createLocalStore<RawTeam>("teams", "teamCode").getById(teamCode).data;
  const team = stored ?? raw;
  const members = getMembersForTeam(teamCode);
  return {
    teamCode,
    title: team?.name ?? teamCode,
    description: team?.intro ?? "",
    teamType: "hackathon" as const,
    status: team?.isOpen ? ("recruiting" as const) : ("closed" as const),
    positions: team?.lookingFor ?? [],
    members: members.map((m) => ({
      id: m.userId,
      image: m.avatarUrl,
      name: m.displayName,
    })),
    maxMembers: 5,
    contactUrl: team?.contact?.url ?? "",
  };
}

export default function TeamPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const router = useRouter();
  const member = useMemberStore((s) => s.member);

  const [myTeamCodes, setMyTeamCodes] = useState<string[]>([]);
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);

  // Load myTeams from localStorage
  useEffect(() => {
    if (!member?.userId) {
      setMyTeamCodes([]);
      setMyTeams([]);
      return;
    }
    const { data: session } = createLocalStore<MySession>("my", "userId").getById(member.userId);
    const codes = session?.myTeams?.map((t) => t.teamCode) ?? [];
    setMyTeamCodes(codes);
    setMyTeams(codes.map(buildMyTeam));
  }, [member?.userId]);

  const handleUpdate = (teamCode: string, updated: Partial<MyTeam>) => {
    const teamsStore = createLocalStore<RawTeam>("teams", "teamCode");
    const patch: Partial<RawTeam> = {};
    if (updated.status !== undefined) patch.isOpen = updated.status === "recruiting";
    if (updated.title !== undefined) patch.name = updated.title;
    if (updated.description !== undefined) patch.intro = updated.description;

    const result = teamsStore.update(teamCode, patch);
    if (result.error) {
      // Not in localStorage yet — seed from static JSON then update
      const raw = (teamsData as RawTeam[]).find((t) => t.teamCode === teamCode);
      if (raw) {
        teamsStore.create(raw);
        teamsStore.update(teamCode, patch);
      }
    }
    setMyTeams((prev) =>
      prev.map((t) => (t.teamCode === teamCode ? { ...t, ...updated } : t))
    );
  };

  const handleDelete = (teamCode: string) => {
    // Remove from teams store
    createLocalStore<RawTeam>("teams", "teamCode").remove(teamCode);
    // Remove from my session
    if (member?.userId) {
      const myStore = createLocalStore<MySession>("my", "userId");
      const { data: session } = myStore.getById(member.userId);
      if (session) {
        myStore.update(member.userId, {
          myTeams: session.myTeams.filter((t) => t.teamCode !== teamCode),
        });
      }
    }
    setMyTeamCodes((prev) => prev.filter((c) => c !== teamCode));
    setMyTeams((prev) => prev.filter((t) => t.teamCode !== teamCode));
  };

  // Other teams (excluding user's teams)
  const otherTeams = (teamsData as RawTeam[]).filter(
    (t) => !myTeamCodes.includes(t.teamCode)
  );

  const filteredTeams = otherTeams.filter((team) => {
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "recruiting" && team.isOpen) ||
      (statusFilter === "closed" && !team.isOpen);
    const typeMatch = typeFilter === "all" || typeFilter === "hackathon";
    return statusMatch && typeMatch;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-green-50 px-4 py-16">
      <div className="mx-auto w-full max-w-6xl">

        {/* 헤더 */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm text-gray-400">팀 / 탐색</p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">팀 탐색</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-500">
              다양한 팀을 탐색하고, 원하는 팀에 참여하거나 직접 팀을 만들어보세요.
            </p>
          </div>
          <button
            onClick={() => router.push("/team/new")}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-green-400 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105"
          >
            + 팀 만들기
          </button>
        </div>

        {/* My Team 섹션 */}
        {myTeams.length > 0 && (
          <div className="mb-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              My Team
            </p>
            <div className="flex flex-col gap-4">
              {myTeams.map((team) => (
                <MyTeamCard
                  key={team.teamCode}
                  team={team}
                  onUpdate={(updated) => handleUpdate(team.teamCode, updated)}
                  onDelete={() => handleDelete(team.teamCode)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 모집 여부 필터 */}
        <div className="mb-3 flex gap-2 text-sm">
          {(["all", "recruiting", "closed"] as const).map((f) => (
            <button
              key={f}
              className={`rounded-full px-4 py-1 font-medium transition-colors ${
                statusFilter === f
                  ? "bg-green-100 text-green-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              onClick={() => setStatusFilter(f)}
            >
              {f === "all" ? "전체" : f === "recruiting" ? "모집 중" : "마감"}
            </button>
          ))}
        </div>

        {/* 팀 유형 필터 */}
        <div className="mb-8 flex gap-2 text-sm">
          {(["all", "hackathon", "open"] as const).map((t) => (
            <button
              key={t}
              className={`rounded-full px-4 py-1 font-medium transition-colors ${
                typeFilter === t
                  ? t === "hackathon"
                    ? "bg-orange-100 text-orange-600"
                    : t === "open"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-gray-200 text-gray-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "전체 유형" : t === "hackathon" ? "🏆 해커톤팀" : "🔓 오픈팀"}
            </button>
          ))}
        </div>

        {/* 카드 리스트 */}
        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => {
              const members = getMembersForTeam(team.teamCode);
              return (
                <TeamCard
                  key={team.teamCode}
                  teamCode={team.teamCode}
                  title={team.name}
                  description={team.intro}
                  status={team.isOpen ? "recruiting" : "closed"}
                  teamType="hackathon"
                  positions={team.lookingFor}
                  members={members.map((m) => ({
                    id: Number(m.userId.replace("U-", "")),
                    image: m.avatarUrl,
                    name: m.displayName,
                  }))}
                  maxMembers={5}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">조건에 맞는 팀이 없어요.</p>
          </div>
        )}
      </div>
    </main>
  );
}
