import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link href="/hackathons" className="hover:text-primary">
        해커톤 탐색
      </Link>
      <Link href="/team" className="hover:text-primary">
        팀 구성
      </Link>
      <Link href="/ranking" className="hover:text-primary">
        랭킹
      </Link>
    </nav>
  );
}