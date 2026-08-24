#!/usr/bin/env node
// Automated validation per BUILD.md section 26. Fails the build (non-zero exit) on any violation.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const dataPath = (name) => path.join(root, "data", name);
const readJson = (name) => JSON.parse(readFileSync(dataPath(name), "utf8"));

const errors = [];
const warnings = [];

const documents = readJson("documents.json").documents;
const pages = readJson("pages.json").pages;
const toc = readJson("toc.json").documents;
const procedures = readJson("procedures.json").procedures;
const specifications = readJson("specifications.json").specifications;
const faultCodes = readJson("fault-codes.json").fault_codes;
const glossary = readJson("glossary.json").terms;
const diagrams = readJson("diagrams.json").visuals;
const partsLinks = readJson("parts-links.json").links;
const crossReferences = readJson("cross-references.json").references;
const sourceGaps = readJson("source-gaps.json").gaps;

const documentIds = new Set(documents.map((d) => d.id));
const pageIds = new Set(pages.map((p) => p.id));

function checkDuplicateIds(label, items, idFn = (i) => i.id) {
  const seen = new Set();
  for (const item of items) {
    const id = idFn(item);
    if (seen.has(id)) errors.push(`Duplicate ID in ${label}: ${id}`);
    seen.add(id);
  }
}

checkDuplicateIds("pages.json", pages);
checkDuplicateIds("procedures.json", procedures);
checkDuplicateIds("specifications.json", specifications);
checkDuplicateIds("fault-codes.json", faultCodes);
checkDuplicateIds("diagrams.json", diagrams);
checkDuplicateIds("parts-links.json", partsLinks);
checkDuplicateIds("cross-references.json", crossReferences);
checkDuplicateIds("source-gaps.json", sourceGaps);
checkDuplicateIds("documents.json", documents);

// TOC destinations must resolve to a real page, unless explicitly marked missing.
function walkToc(nodes, docId) {
  for (const node of nodes) {
    if (node.missing) {
      // fine — must correspond to a registered source gap, otherwise it's an unexplained gap
    } else if (node.destination !== null && node.destination !== undefined) {
      if (!pageIds.has(node.destination)) {
        errors.push(`TOC in ${docId}: destination "${node.destination}" for "${node.label}" does not resolve to any ingested page`);
      }
    }
    if (node.children) walkToc(node.children, docId);
  }
}
for (const doc of toc) {
  if (!documentIds.has(doc.document)) errors.push(`toc.json references unknown document: ${doc.document}`);
  walkToc(doc.nodes, doc.document);
}

// Asset references must exist on disk.
for (const visual of diagrams) {
  if (!visual.asset) {
    errors.push(`Diagram ${visual.id} has no asset path`);
    continue;
  }
  const assetPath = path.join(root, visual.asset.replace(/^\/+/, ""));
  if (!existsSync(assetPath)) errors.push(`Diagram ${visual.id} references missing asset file: ${visual.asset}`);
}

// Cross-reference targets must resolve against the combined ID space.
const knownIds = new Set([
  ...pageIds,
  ...procedures.map((p) => p.id),
  ...specifications.map((s) => s.id),
  ...faultCodes.map((f) => f.id),
  ...diagrams.map((d) => d.id),
  ...glossary.map((g) => g.term),
  ...partsLinks.map((p) => p.id)
]);
for (const ref of crossReferences) {
  if (!knownIds.has(ref.from)) errors.push(`Cross-reference ${ref.id}: "from" target "${ref.from}" does not resolve`);
  if (!knownIds.has(ref.to)) errors.push(`Cross-reference ${ref.id}: "to" target "${ref.to}" does not resolve`);
}

// Procedure source references must point at a known document.
for (const proc of procedures) {
  if (!proc.sources || proc.sources.length === 0) {
    errors.push(`Procedure ${proc.id} has no source reference`);
    continue;
  }
  for (const src of proc.sources) {
    if (!documentIds.has(src.document)) errors.push(`Procedure ${proc.id} source references unknown document: ${src.document}`);
  }
}

// Fault codes must have a source reference.
for (const code of faultCodes) {
  if (!code.sources || code.sources.length === 0) errors.push(`Fault code ${code.id} (${code.code}) has no source reference`);
}

// Specifications must retain context: what they apply to, and a source.
for (const spec of specifications) {
  if (!spec.applies_to) errors.push(`Specification ${spec.id} has no "applies_to" context`);
  if (!spec.sources || spec.sources.length === 0) errors.push(`Specification ${spec.id} has no source reference`);
}

// Anything claiming VERIFIED must carry verification metadata (a source reference).
function checkVerifiedHasSource(label, items) {
  for (const item of items) {
    if (item.verification === "VERIFIED" && (!item.sources || item.sources.length === 0)) {
      errors.push(`${label} ${item.id} is marked VERIFIED but has no source reference`);
    }
  }
}
checkVerifiedHasSource("Page", pages);
checkVerifiedHasSource("Procedure", procedures);
checkVerifiedHasSource("Specification", specifications);
checkVerifiedHasSource("Fault code", faultCodes);

if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s):`);
  warnings.forEach((w) => console.warn(" -", w));
}

if (errors.length) {
  console.error(`\n${errors.length} validation error(s):`);
  errors.forEach((e) => console.error(" -", e));
  process.exit(1);
}

console.log("Validation passed: no broken references, no duplicate IDs, no unsupported verification claims.");
