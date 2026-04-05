import { cn } from "@/lib/utils"

interface Props {
  rank: number
}

export function RankBadge({ rank }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
        rank === 1
          ? "bg-yellow-400/20 text-yellow-600"
          : rank === 2
          ? "bg-zinc-200 text-zinc-600"
          : rank === 3
          ? "bg-orange-200/60 text-orange-600"
          : "text-muted-foreground font-normal",
      )}
    >
      {rank}
    </span>
  )
}
