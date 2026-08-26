#!/usr/bin/env node
// Builds data/toc.json's DOC-RT622-SHOP tree from the source PDF's own
// embedded outline/bookmarks (reliable, exact wording + compilation pages --
// BUILD.md section 5). Unlike DOC-SPYDER-SHOP, this document's own running
// page headers can't be used to resolve destinations: every page in this
// document's compilation range (780-830) uses a font the source PDF embeds
// without a usable ToUnicode CMap, so pdfplumber/PyMuPDF cannot recover real
// characters from any page in range -- see documents.json's
// TEXT_LAYER_UNUSABLE_BROKEN_FONT status for this document. Destinations are
// therefore left unresolved (not "missing" -- the pages physically exist,
// they just aren't machine-readable yet) until OCR or another extraction
// method makes the text usable.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../../..");
const dataPath = (name) => path.join(root, "data", name);
const readJson = (name) => JSON.parse(readFileSync(dataPath(name), "utf8"));

// compilation page is from the PDF's own outline (reliable) -- kept as a
// parenthetical since it can't resolve to a destination yet.
const nodes = [
  {
    label: "Spyder Trailer Service Manual",
    source_page: null,
    destination: null,
    children: [
      { label: "Introduction (compilation p.783)", source_page: null, destination: null },
      { label: "Maintenance Schedule (compilation p.788)", source_page: null, destination: null },
      { label: "Wheels and Hubs (compilation p.792)", source_page: null, destination: null },
      { label: "Lights and Harness (compilation p.822)", source_page: null, destination: null },
      { label: "Procedures (compilation p.826)", source_page: null, destination: null },
      { label: "RT 622 Trailer Specifications (compilation p.829)", source_page: null, destination: null },
    ],
  },
];

const tocDoc = readJson("toc.json");
const others = tocDoc.documents.filter((d) => d.document !== "DOC-RT622-SHOP");
tocDoc.documents = [...others, { document: "DOC-RT622-SHOP", nodes }];

writeFileSync(dataPath("toc.json"), JSON.stringify(tocDoc, null, 2) + "\n");
console.log("Wrote data/toc.json: DOC-RT622-SHOP, 1 top-level entry, 6 children, 0 resolved destinations (broken font blocks all of them).");
