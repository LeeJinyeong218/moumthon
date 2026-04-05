import hackathonDetailData from "@/assets/data/public_hackathon_detail.json"
import type { HackathonDetail } from "@/types/hackathonDetail"
import HackathonDetailNav from "@/components/feature/hackathons/HackathonDetailNav"

const allDetails: HackathonDetail[] = [
  hackathonDetailData as HackathonDetail,
  ...(hackathonDetailData.extraDetails ?? []) as HackathonDetail[],
]

export default async function HackathonSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const detail = allDetails.find((d) => d.slug === slug) ?? allDetails[0]
  return (
    <div className="mx-auto w-full max-w-5xl px-4 flex h-screen overflow-hidden">
      <div className="py-8 shrink-0">
        <HackathonDetailNav
          slug={slug}
          hasPrize={!!detail.sections.prize}
          submissionItems={detail.sections.submit.submissionItems ?? [{ key: "default", title: "제출하기", format: detail.sections.submit.allowedArtifactTypes[0] ?? "url" }]}
        />
      </div>
      <div id="hackathon-content" className="scroll-overlay flex-1 min-w-0 py-8 pl-16">
        {children}
      </div>
    </div>
  )
}
