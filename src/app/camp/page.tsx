"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeamCard } from "@/components/feature/team/TeamCard";
import { MyTeamCard, MyTeam } from "@/components/feature/team/MyTeamCard";
import teamsData from "@/assets/data/public_teams.json";
import teamMembersData from "@/assets/data/public_team_members.json";
import sessionData from "@/assets/data/my.json";

type StatusFilter = "all" | "recruiting" | "closed";

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

function CampContent() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const router = useRouter();
  const searchParams = useSearchParams();
  const hackathonFilter = searchParams.get("hackathon");

  const session = (sessionData as any[])[0];
  const myTeamCodes = session?.myTeams?.map((t: any) => t.teamCode) ?? [];

  const getMembersForTeam = (teamCode: string) => {
    const found = (teamMembersData as RawTeamMembers[]).find(
      (tm) => tm.teamCode === teamCode
    );
    return found?.members ?? [];
  };

  // 내 팀 목록
  const myTeams: MyTeam[] = session?.myTeams?.map((myTeam: any) => {
    const raw = (teamsData as RawTeam[]).find(
      (t) => t.teamCode === myTeam.teamCode
    );
    const members = getMembersForTeam(myTeam.teamCode);
    return {
      teamCode: myTeam.teamCode,
      title: raw?.name ?? myTeam.teamName,
      description: raw?.intro ?? "",
      teamType: "hackathon" as const,
      status: raw?.isOpen ? ("recruiting" as const) : ("closed" as const),
      positions: raw?.lookingFor ?? [],
      members: members.map((m) => ({
        id: m.userId,
        image: m.avatarUrl,
        name: m.displayName,
      })),
      maxMembers: 5,
      contactUrl: raw?.contact?.url ?? "",
    };
  }) ?? [];

  // 전체 팀 (내 팀 제외)
  const otherTeams = (teamsData as RawTeam[]).filter(
    (t) => !myTeamCodes.includes(t.teamCode)
  );

  const filteredTeams = otherTeams.filter((team) => {
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "recruiting" && team.isOpen) ||
      (statusFilter === "closed" && !team.isOpen);
    const hackathonMatch =
      !hackathonFilter || team.hackathonSlug === hackathonFilter;
    return statusMatch && hackathonMatch;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-green-50 px-4 py-16">
      <div className="mx-auto w-full max-w-6xl">

        {/* 헤더 */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm text-gray-400">캠프 / 팀 찾기</p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">팀 찾기</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-500">
              {hackathonFilter
                ? `해커톤 팀만 표시됩니다.`
                : "다양한 팀을 탐색하고, 원하는 팀에 참여하거나 직접 팀을 만들어보세요."}
            </p>
          </div>
          <button
            data-testid="camp-create-team-btn"
            onClick={() => router.push("/camp/new")}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-green-400 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105"
          >
            + 팀 만들기
          </button>
        </div>

        {/* My Team 섹션 */}
        {myTeams.length > 0 && (
          <div data-testid="camp-my-team-section" className="mb-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              My Team
            </p>
            <div className="flex flex-col gap-4">
              {myTeams.map((team) => (
                <MyTeamCard
                  key={team.teamCode}
                  team={team}
                  onUpdate={(updated) => console.log("update", updated)}
                  onDelete={() => console.log("delete", team.teamCode)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 모집 여부 필터 */}
        <div className="mb-8 flex gap-2 text-sm">
          {(["all", "recruiting", "closed"] as const).map((f) => (
            <button
              key={f}
              data-testid={`camp-status-filter-${f}-btn`}
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

        {/* 카드 리스트 */}
        {filteredTeams.length > 0 ? (
          <div data-testid="camp-team-list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <div data-testid="camp-team-empty-msg" className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">조건에 맞는 팀이 없어요.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CampPage() {
  return (
    <Suspense>
      <CampContent />
    </Suspense>
  );
}
