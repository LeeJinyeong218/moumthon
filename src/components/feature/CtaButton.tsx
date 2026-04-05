import Link from "next/link";
import { Card, CardContent } from "@/components/common";
import { cn } from "@/lib/utils";

type CtaButtonVariant = "hackathon" | "team" | "ranking";

interface CtaButtonProps {
  variant: CtaButtonVariant;
  className?: string;
}

const CTA_CONFIG: Record<
  CtaButtonVariant,
  { href: string; icon: string; title: string; desc: string }
> = {
  hackathon: {
    href: "/hackathons",
    icon: "🏆",
    title: "해커톤 들어가기",
    desc: "진행 중인 대회를 확인하고\n지금 바로 참가하세요.",
  },
  team: {
    href: "/team",
    icon: "🤝",
    title: "팀 찾기",
    desc: "포지션별로 팀원을 모집하거나\n원하는 팀에 합류하세요.",
  },
  ranking: {
    href: "/ranking",
    icon: "📊",
    title: "랭킹 보기",
    desc: "참가자 점수와 순위를\n한눈에 확인하세요.",
  },
};

export function CtaButton({ variant, className }: CtaButtonProps) {
  const { href, icon, title, desc } = CTA_CONFIG[variant];

  return (
    <Link href={href} className={cn("group", className)}>
      <Card className="h-full cursor-pointer border border-white/40 bg-white/60 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/80 hover:shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="text-3xl">{icon}</span>
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
              {title}
            </p>
            <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
              {desc}
            </p>
          </div>
          <span className="mt-auto text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
            바로가기 →
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
