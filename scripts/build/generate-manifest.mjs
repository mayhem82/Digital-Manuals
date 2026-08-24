#!/usr/bin/env node
// Generates data/manifest.json from the actual data files (BUILD.md section 25).
// Counts are never hard-coded — this script is the only thing allowed to write this file.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const dataPath = (name) => path.join(root, "data", name);

function readJson(name) {
  return JSON.parse(readFileSync(dataPath(name), "utf8"));
}

function gitCommit() {
  try {
    return execSync("git rev-parse HEAD", { cwd: root }).toString().trim();
  } catch {
    return "";
  }
}

const documents = readJson("documents.json").documents;
const pages = readJson("pages.json").pages;
const procedures = readJson("procedures.json").procedures;
const specifications = readJson("specifications.json").specifications;
const faultCodes = readJson("fault-codes.json").fault_codes;
const glossary = readJson("glossary.json").terms;
const diagrams = readJson("diagrams.json").visuals;
const crossReferences = readJson("cross-references.json").references;
const sourceGaps = readJson("source-gaps.json").gaps;

const SOURCE_PAGES_TOTAL = 1603; // fixed by BUILD.md section 3 — the supplied compilation's page count

const manifest = {
  source_pages_total: SOURCE_PAGES_TOTAL,
  pages_ingested: pages.length,
  pages_text_verified: pages.filter((p) => p.verification === "VERIFIED").length,
  pages_visual_verified: diagrams.filter((d) => d.verified === true).length,
  procedures: procedures.length,
  diagrams: diagrams.length,
  fault_codes: faultCodes.length,
  glossary_terms: glossary.length,
  specifications: specifications.length,
  cross_references: crossReferences.length,
  source_gaps: sourceGaps.map((g) => g.id),
  build_timestamp: new Date().toISOString(),
  commit: gitCommit(),
  documents_registered: documents.length
};

writeFileSync(dataPath("manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("Wrote data/manifest.json:", manifest);
