import { notFound } from "next/navigation"
import hackathonDetailData from "@/assets/data/public_hackathon_detail.json"
import hackathonsData from "@/assets/data/public_hackathons.json"
import type { HackathonDetail } from "@/types/hackathonDetail"
import SubmitClient from "@/components/feature/hackathons/SubmitClient"

const allDetails: HackathonDetail[] = [
  hackathonDetailData as HackathonDetail,
  ...(hackathonDetailData.extraDetails ?? []) as HackathonDetail[],
]

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string; milestone: string }>
}) {
  const { slug, milestone: key } = await params
  const detail = allDetails.find((d) => d.slug === slug)
  if (!detail) notFound()

  const items = detail.sections.submit.submissionItems
  if (items && !items.some((item) => item.key === key)) notFound()

  const hackathon = hackathonsData.find((h) => h.slug === slug)
  const hackathonStatus = hackathon?.status ?? "ended"

  return <SubmitClient detail={detail} slug={slug} itemKey={key} hackathonStatus={hackathonStatus} />
}
