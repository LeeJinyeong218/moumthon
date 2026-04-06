import hackathonDetailData from "@/assets/data/public_hackathon_detail.json";

type HackathonDetail = {
  slug: string;
  sections: { overview: { teamPolicy: { maxTeamSize: number } } };
  extraDetails?: HackathonDetail[];
};

export function findMaxTeamSize(slug: string): number {
  function search(detail: HackathonDetail): number | null {
    if (detail.slug === slug) return detail.sections.overview.teamPolicy.maxTeamSize;
    for (const extra of detail.extraDetails ?? []) {
      const found = search(extra);
      if (found !== null) return found;
    }
    return null;
  }
  return search(hackathonDetailData as HackathonDetail) ?? 20;
}
