export function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);

  const nameMap: Record<string, string> = {
    hackathons: "해커톤",
    team: "팀 구성",
    ranking: "랭킹",
    rankings: "랭킹",
    camp: "캠프",
    submit: "제출",
    idea: "아이디어",
    prototype: "프로토타입",
    plan: "기획서",
    web: "웹링크",
    pdf: "PDF 제출",
    final: "최종",
    default: "제출",
  };

  const prev = segments[segments.length - 2];
  const current = segments[segments.length - 1];

  return (
    <div className="flex items-center rounded-full border border-white/30 bg-gradient-to-r from-blue-100/60 via-green-100/60 to-lime-100/60 px-3 py-1 text-sm backdrop-blur-sm">
      
      {prev && (
        <>
          <span className="text-gray-500">
            {nameMap[prev] || prev}
          </span>
          <span className="mx-2 h-4 w-px bg-white/40" />
        </>
      )}

      <span className="font-semibold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
        {nameMap[current] || current}
      </span>
    </div>
  );
}