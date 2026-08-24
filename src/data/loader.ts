import type {
  DocumentEntry, PageEntry, TocDocument, SourceGap, Procedure, Specification,
  FaultCode, GlossaryTerm, VisualAsset, PartsLink, TechnicalUpdateRelationship,
  CrossReference, AliasEntry, BuildManifest
} from "./types";

const base = import.meta.env.BASE_URL;
const cache = new Map<string, Promise<unknown>>();

function loadJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(`${base}${path}`).then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
        return r.json();
      })
    );
  }
  return cache.get(path) as Promise<T>;
}

export const loadDocuments = () =>
  loadJson<{ documents: DocumentEntry[] }>("data/documents.json").then((d) => d.documents);

export const loadPages = () =>
  loadJson<{ pages: PageEntry[] }>("data/pages.json").then((d) => d.pages);

export const loadToc = () =>
  loadJson<{ documents: TocDocument[] }>("data/toc.json").then((d) => d.documents);

export const loadSourceGaps = () =>
  loadJson<{ gaps: SourceGap[] }>("data/source-gaps.json").then((d) => d.gaps);

export const loadProcedures = () =>
  loadJson<{ procedures: Procedure[] }>("data/procedures.json").then((d) => d.procedures);

export const loadSpecifications = () =>
  loadJson<{ specifications: Specification[] }>("data/specifications.json").then((d) => d.specifications);

export const loadFaultCodes = () =>
  loadJson<{ fault_codes: FaultCode[] }>("data/fault-codes.json").then((d) => d.fault_codes);

export const loadGlossary = () =>
  loadJson<{ terms: GlossaryTerm[] }>("data/glossary.json").then((d) => d.terms);

export const loadVisuals = () =>
  loadJson<{ visuals: VisualAsset[] }>("data/diagrams.json").then((d) => d.visuals);

export const loadPartsLinks = () =>
  loadJson<{ links: PartsLink[] }>("data/parts-links.json").then((d) => d.links);

export const loadTechnicalUpdates = () =>
  loadJson<{ relationships: TechnicalUpdateRelationship[] }>("data/technical-updates.json").then((d) => d.relationships);

export const loadCrossReferences = () =>
  loadJson<{ references: CrossReference[] }>("data/cross-references.json").then((d) => d.references);

export const loadAliases = () =>
  loadJson<{ aliases: AliasEntry[] }>("data/search-aliases.json").then((d) => d.aliases);

export const loadManifest = () => loadJson<BuildManifest>("data/manifest.json");
