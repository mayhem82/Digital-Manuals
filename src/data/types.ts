export type Verification = "VERIFIED" | "PARTIAL" | "UNVERIFIED" | "SOURCE MISSING";

export interface DocumentEntry {
  id: string;
  title: string;
  group: string;
  applicability: string[];
  compilation_page_range: [number, number] | null;
  pages_total_expected: number | null;
  pages_ingested: number;
  status: string;
  verification: Verification;
}

export interface PageEntry {
  id: string;
  document: string;
  source_page: number | string;
  compilation_page: number;
  text: string;
  verification: Verification;
}

export interface TocNode {
  label: string;
  source_page: number | string | null;
  destination: string | null;
  missing?: boolean;
  children?: TocNode[];
}

export interface TocDocument {
  document: string;
  nodes: TocNode[];
}

export interface SourceGap {
  id: string;
  document: string;
  description: string;
  source_manual_pages: (number | string)[];
  compilation_page: number | null;
  status: Verification;
}

export interface Procedure {
  id: string;
  title: string;
  type: string;
  system: string;
  applicability: string[];
  prerequisites: string[];
  warnings: string[];
  tools: string[];
  steps: string[];
  torque_values: { spec: string; value: string }[];
  measurements: { spec: string; value: string }[];
  related_diagrams: string[];
  related_parts: string[];
  related_procedures: string[];
  sources: { document: string; source_page: number | string; compilation_page: number }[];
  verification: Verification;
}

export interface Specification {
  id: string;
  category: string;
  applies_to: string;
  value: string;
  system: string;
  applicability: string[];
  sources: { document: string; source_page: number | string; compilation_page: number }[];
  verification: Verification;
}

export interface FaultCode {
  id: string;
  code: string;
  system: string;
  source_wording: string;
  conditions: string[];
  checks: string[];
  related_procedures: string[];
  applicability: string[];
  sources: { document: string; source_page: number | string; compilation_page: number }[];
  verification: Verification;
}

export interface GlossaryTerm {
  term: string;
  expanded: string;
  plain: string;
  aliases: string[];
  systems: string[];
  sources: { document: string; source_page: number | string; compilation_page: number }[];
  related_terms: string[];
}

export interface VisualAsset {
  id: string;
  document: string;
  source_page: number | string;
  compilation_page: number;
  type: string;
  title: string;
  system: string;
  applicability: string[];
  asset: string;
  verified: boolean;
}

export interface PartsLink {
  id: string;
  component: string;
  procedure: string | null;
  diagram: string | null;
  part_name: string;
  part_number: string;
  applicability: string[];
  related_technical_update: string | null;
}

export interface TechnicalUpdateRelationship {
  id: string;
  update_reference: string;
  target_procedure: string;
  relationship_state: "supplements" | "modifies" | "supersedes" | "clarification" | "related_only";
  note: string;
}

export interface CrossReference {
  id: string;
  from: string;
  to: string;
  relation: string;
}

export interface AliasEntry {
  from: string;
  to: string;
}

export interface BuildManifest {
  source_pages_total: number;
  pages_ingested: number;
  pages_text_verified: number;
  pages_visual_verified: number;
  procedures: number;
  diagrams: number;
  fault_codes: number;
  glossary_terms: number;
  specifications: number;
  cross_references: number;
  source_gaps: string[];
  build_timestamp: string;
  commit: string;
}
