// Deterministic, layered search per BUILD.md section 10.
// No LLM ever reinterprets the query — every expansion here is explicit stored data.

import {
  loadPages, loadProcedures, loadSpecifications, loadFaultCodes,
  loadGlossary, loadPartsLinks, loadAliases, loadToc
} from "../data/loader";

export type ResultKind =
  | "page" | "procedure" | "specification" | "fault-code" | "glossary" | "part" | "toc-heading";

export interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  snippet: string;
  matchLayer: string;
}

const FAULT_CODE_PATTERN = /^[A-Za-z]\d{3,5}$/;

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function snippetAround(text: string, query: string, radius = 60): string {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + query.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export async function search(rawQuery: string): Promise<SearchResult[]> {
  const query = normalize(rawQuery);
  if (!query) return [];

  const results: SearchResult[] = [];

  // Layer 6: fault-code lookup (exact code shape, checked first — cheapest and most specific)
  if (FAULT_CODE_PATTERN.test(rawQuery.trim())) {
    const codes = await loadFaultCodes();
    for (const c of codes) {
      if (c.code.toLowerCase() === query) {
        results.push({
          kind: "fault-code", id: c.id, title: c.code,
          snippet: c.source_wording, matchLayer: "fault-code-exact"
        });
      }
    }
  }

  // Layer 7: part-number lookup
  const partsLinks = await loadPartsLinks();
  for (const p of partsLinks) {
    if (p.part_number && p.part_number.toLowerCase() === query) {
      results.push({
        kind: "part", id: p.id, title: `${p.part_name} (${p.part_number})`,
        snippet: p.component, matchLayer: "part-number-exact"
      });
    }
  }

  // Layers 3-5: alias table (glossary/component/owner-language aliases -> canonical term)
  const aliases = await loadAliases();
  const expansions = new Set<string>([query]);
  for (const a of aliases) {
    if (a.from.toLowerCase() === query) expansions.add(a.to.toLowerCase());
  }

  // Glossary term + its own aliases (also functions as an alias layer)
  const glossary = await loadGlossary();
  for (const term of glossary) {
    const haystack = [term.term, ...(term.aliases ?? [])].map((s) => s.toLowerCase());
    if (haystack.some((h) => expansions.has(h) || h.includes(query))) {
      results.push({
        kind: "glossary", id: term.term, title: term.term,
        snippet: term.plain, matchLayer: "glossary-alias"
      });
      expansions.add(term.term.toLowerCase());
    }
  }

  // Layer 2: title/heading search (TOC)
  const tocDocs = await loadToc();
  for (const doc of tocDocs) {
    walkToc(doc.nodes, (node) => {
      const label = node.label.toLowerCase();
      if ([...expansions].some((e) => label.includes(e))) {
        results.push({
          kind: "toc-heading", id: `${doc.document}:${node.label}`, title: node.label,
          snippet: doc.document, matchLayer: "heading"
        });
      }
    });
  }

  // Procedures (title + steps) and specifications (applies_to) count as structured "title" hits
  const procedures = await loadProcedures();
  for (const proc of procedures) {
    const text = [proc.title, proc.system, ...proc.steps].join(" ").toLowerCase();
    if ([...expansions].some((e) => text.includes(e))) {
      results.push({
        kind: "procedure", id: proc.id, title: proc.title,
        snippet: snippetAround(proc.steps.join(" "), query), matchLayer: "procedure-text"
      });
    }
  }

  const specifications = await loadSpecifications();
  for (const spec of specifications) {
    const text = `${spec.category} ${spec.applies_to} ${spec.system}`.toLowerCase();
    if ([...expansions].some((e) => text.includes(e))) {
      results.push({
        kind: "specification", id: spec.id, title: `${spec.category}: ${spec.applies_to}`,
        snippet: spec.value, matchLayer: "specification-text"
      });
    }
  }

  // Fault codes: also allow free-text matching against conditions/source wording, not just exact code
  const faultCodes = await loadFaultCodes();
  for (const c of faultCodes) {
    if (results.some((r) => r.kind === "fault-code" && r.id === c.id)) continue;
    const text = `${c.code} ${c.system} ${c.source_wording} ${c.conditions.join(" ")}`.toLowerCase();
    if ([...expansions].some((e) => text.includes(e))) {
      results.push({
        kind: "fault-code", id: c.id, title: c.code,
        snippet: snippetAround(c.source_wording, query), matchLayer: "fault-code-text"
      });
    }
  }

  // Layer 1: exact source text, across ingested pages — the widest, lowest-priority net
  const pages = await loadPages();
  for (const page of pages) {
    if (page.text.toLowerCase().includes(query)) {
      results.push({
        kind: "page", id: page.id, title: `${page.document} — p.${page.source_page}`,
        snippet: snippetAround(page.text, query), matchLayer: "exact-text"
      });
    }
  }

  return dedupe(results);
}

function walkToc(nodes: import("../data/types").TocNode[], visit: (n: import("../data/types").TocNode) => void) {
  for (const n of nodes) {
    visit(n);
    if (n.children) walkToc(n.children, visit);
  }
}

function dedupe(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of results) {
    const key = `${r.kind}:${r.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
