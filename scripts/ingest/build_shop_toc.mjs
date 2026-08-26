#!/usr/bin/env node
// Builds data/toc.json's DOC-SPYDER-SHOP tree from the shop manual's own
// printed Table of Contents wording + page numbers (data below, transcribed
// directly from compilation pages 5-15 of the source PDF) combined with
// verified compilation-page anchors read from the manual's own running
// "Section NN NAME / Subsection NN (NAME)" page headers (see
// scan_section_headers.py) -- not a guessed page-offset formula
// (BUILD.md section 5).
//
// destination resolves to the first data/pages.json entry at or after each
// subsection's verified anchor page (and before the next subsection's
// anchor), since a few pages inside any given subsection may have gone to
// the human-review queue instead of pages.json.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const dataPath = (name) => path.join(root, "data", name);
const readJson = (name) => JSON.parse(readFileSync(dataPath(name), "utf8"));

// [section label as printed, [ [subsection label as printed, source_page|null, verified compilation anchor] ... ]]
const SECTIONS = [
  ["01 MAINTENANCE", [
    ["01 - MAINTENANCE SCHEDULE", 7, 34],
    ["02 - STORAGE PROCEDURE", 11, 37],
    ["03 - PRESEASON PREPARATION", 13, 39],
  ]],
  ["02 ENGINE", [
    ["01 - ENGINE REMOVAL AND INSTALLATION", 15, 41],
    ["02 - AIR INTAKE SYSTEM", 27, 54],
    ["03 - EXHAUST SYSTEM", 33, 59],
    ["04 - LUBRICATION SYSTEM", 45, 71],
    ["05 - COOLING SYSTEM", null, 97],
    ["06 - MAGNETO AND STARTER", null, 113],
    ["07 - CYLINDER HEAD AND CYLINDER", null, 127],
    ["08 - CRANKCASE AND CRANKSHAFT", 133, 159],
    ["09 - CLUTCH (SM5)", 157, 183],
    ["10 - CLUTCH (SE5)", 195, 221],
    ["11 - HYDRAULIC CONTROL MODULE (SE5)", 223, 249],
    ["12 - GEARBOX", 249, 275],
  ]],
  ["03 ELECTRONIC MANAGEMENT SYSTEMS", [
    ["01 - OVERVIEW", 269, 295],
    ["02 - CONTROLLER AREA NETWORK (CAN)", 273, 299],
    ["03 - COMMUNICATION TOOLS AND B.U.D.S.", 275, 301],
    ["04 - DIAGNOSTIC AND FAULT CODES", 281, 307],
  ]],
  ["04 FUEL SYSTEM", [
    ["01 - ELECTRONIC FUEL INJECTION (EFI)", 343, 369],
    ["02 - FUEL TANK AND FUEL PUMP", 389, 415],
  ]],
  ["05 ELECTRICAL SYSTEM", [
    ["01 - POWER DISTRIBUTION AND GROUNDS", 413, 439],
    ["02 - WIRING HARNESS AND CONNECTORS", 419, 445],
    ["03 - IGNITION SYSTEM", 451, 477],
    ["04 - CHARGING SYSTEM", 459, 485],
    ["05 - STARTING SYSTEM", 467, 494],
    ["06 - DIGITALLY ENCODED SECURITY SYSTEM (D.E.S.S.)", 475, 502],
    ["07 - LIGHTS, GAUGE AND ACCESSORIES", 481, 508],
    ["08 - ELECTRONIC SHIFT SYSTEM (SE5)", 543, 570],
  ]],
  ["06 DRIVE SYSTEM", [
    ["01 - DRIVE BELT AND REAR WHEEL", 551, 578],
  ]],
  ["07 CHASSIS", [
    ["01 - VEHICLE STABILITY SYSTEM (VSS)", 569, 596],
    ["02 - STEERING (DPS) AND WHEELS", 587, 614],
    ["03 - FRONT SUSPENSION", 627, 654],
    ["04 - REAR SUSPENSION", 639, 666],
    ["05 - BRAKES", 665, 692],
    ["06 - BODY", 703, 730],
    ["07 - FRAME", 739, 766],
  ]],
  ["08 TECHNICAL SPECIFICATIONS", [
    ["01 - SPYDER RT (SM5/SE5)", 745, 772],
  ]],
];

// Known gap per data/source-gaps.json GAP-0001 -- rendered as missing, not guessed.
const WIRING_DIAGRAM_SECTION = ["09 WIRING DIAGRAM", [
  ["01 - WIRING DIAGRAM INFORMATION", 753, null],
]];

const pages = readJson("pages.json").pages.filter((p) => p.document === "DOC-SPYDER-SHOP");
const byCompPage = new Map(pages.map((p) => [p.compilation_page, p.id]));

// Flatten anchors in document order to compute each subsection's page range.
const flatAnchors = [];
for (const [, subs] of SECTIONS) {
  for (const [, , anchor] of subs) flatAnchors.push(anchor);
}

function resolveDestination(anchor, nextAnchor) {
  const end = nextAnchor ? nextAnchor - 1 : 779;
  for (let cp = anchor; cp <= end; cp++) {
    if (byCompPage.has(cp)) return byCompPage.get(cp);
  }
  return null;
}

let anchorCursor = 0;
const nodes = SECTIONS.map(([sectionLabel, subs]) => ({
  label: sectionLabel,
  source_page: null,
  destination: null,
  children: subs.map(([subLabel, sourcePage, anchor]) => {
    anchorCursor++;
    const nextAnchor = flatAnchors[anchorCursor] ?? null;
    const destination = resolveDestination(anchor, nextAnchor);
    return {
      label: subLabel,
      source_page: sourcePage,
      destination,
    };
  }),
}));

// Append the documented gap as its own top-level section entry.
nodes.push({
  label: WIRING_DIAGRAM_SECTION[0],
  source_page: null,
  destination: null,
  children: WIRING_DIAGRAM_SECTION[1].map(([label, sourcePage]) => ({
    label,
    source_page: sourcePage,
    destination: null,
    missing: true,
  })),
});

const tocDoc = readJson("toc.json");
const others = tocDoc.documents.filter((d) => d.document !== "DOC-SPYDER-SHOP");
tocDoc.documents = [...others, { document: "DOC-SPYDER-SHOP", nodes }];

writeFileSync(dataPath("toc.json"), JSON.stringify(tocDoc, null, 2) + "\n");

const total = nodes.reduce((n, s) => n + s.children.length, 0);
const resolved = nodes.reduce((n, s) => n + s.children.filter((c) => c.destination).length, 0);
console.log(`Wrote data/toc.json: ${nodes.length} sections, ${total} subsections, ${resolved} resolved destinations.`);
