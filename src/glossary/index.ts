import { loadGlossary } from "../data/loader";
import type { GlossaryTerm } from "../data/types";

let indexPromise: Promise<Map<string, GlossaryTerm>> | null = null;

function buildIndex(terms: GlossaryTerm[]): Map<string, GlossaryTerm> {
  const map = new Map<string, GlossaryTerm>();
  for (const t of terms) {
    map.set(t.term.toLowerCase(), t);
    for (const alias of t.aliases ?? []) map.set(alias.toLowerCase(), t);
  }
  return map;
}

function getIndex(): Promise<Map<string, GlossaryTerm>> {
  if (!indexPromise) indexPromise = loadGlossary().then(buildIndex);
  return indexPromise;
}

export async function lookupTerm(term: string): Promise<GlossaryTerm | undefined> {
  const idx = await getIndex();
  return idx.get(term.toLowerCase());
}

/**
 * Makes known glossary terms tappable inside rendered manual text (section 11).
 * Longest-match-first so multi-word terms win over single-word substrings.
 */
export async function linkifyGlossaryTerms(html: string): Promise<string> {
  const idx = await getIndex();
  if (idx.size === 0) return html;
  const terms = [...idx.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`\\b(${terms.map(escapeRegExp).join("|")})\\b`, "gi");
  return html.replace(pattern, (match) => {
    const entry = idx.get(match.toLowerCase());
    if (!entry) return match;
    return `<span class="term-link" data-term="${escapeAttr(entry.term)}">${match}</span>`;
  });
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}
