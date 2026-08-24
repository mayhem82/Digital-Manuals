// Deterministic applicability filtering (BUILD.md section 18).
// Never hides content on a guessed applicability — unknown stays visibly "unknown".

export const APPLICABILITY_TAGS = ["2010", "2011", "RT", "RT-S", "SM5", "SE5", "RT-622"] as const;
export type ApplicabilityTag = (typeof APPLICABILITY_TAGS)[number];

export function matchesApplicability(itemTags: string[], activeFilters: string[]): boolean {
  if (activeFilters.length === 0) return true;
  if (itemTags.length === 0) return true; // unknown applicability is shown, never hidden
  return itemTags.some((t) => activeFilters.includes(t));
}
