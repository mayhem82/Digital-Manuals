# Can-Am Spyder RT / RT-S Digital Manual — BUILD.md

## 1. Project Goal

Build a true **digital workshop manual** from the supplied 2010–2011 Can-Am Spyder RT / RT-S source compilation.

The finished product must let an owner or mechanic use the manual **without needing to open or navigate the original PDF**.

This is not an AI diagnostic assistant. It is a deterministic digital manual.

The source PDF is the ingestion source only. The final application should present the source knowledge in a structured, searchable, linked, readable form.

---

## 2. Core Principle

**Digitise the manual. Do not wrap the PDF.**

The finished product should contain:

- extracted and cleaned text as the primary content;
- structured sections, headings, procedures, specifications, tables and indexes;
- diagrams, exploded views, photographs, wiring schematics, connector layouts and other genuinely visual material as retained images;
- internal links between related material;
- source provenance for every item;
- deterministic search and filtering;
- offline use after download or local installation.

Do not retain full-page screenshots for ordinary text pages merely to imitate the PDF.

---

## 3. Source Compilation

The supplied compilation contains **1,603 visually accessible source pages**.

Known document groups inside the compilation include:

- 2010–2011 Can-Am Spyder RT / RT-S shop manual;
- RT-622 trailer shop manual;
- flat-rate manuals;
- SM5 parts catalogues;
- SE5 parts catalogues;
- RT-622 parts catalogues;
- 2011 Technical Update Book.

Treat the 1,603-page compilation as the authoritative source set for this build.

Do not silently supplement missing source material from the internet unless the project owner explicitly requests that later.

---

## 4. Known Source Gaps

Do not fabricate missing content.

The supplied main Spyder shop manual references source/manual pages 753–754 in its contents, but those pages are not physically present in the supplied compilation.

The supplied 2011 Technical Update Book also contains known missing ranges.

Any absent source material must be shown as:

**SOURCE MATERIAL NOT PRESENT IN SUPPLIED COMPILATION**

Do not create replacement text, diagrams or procedures.

---

## 5. Navigation Rule

The build must preserve two separate concepts:

### Source/manual page number

This is the page number printed or referenced by the original document.

### Compilation file page

This is the physical page position within the 1–1603 combined source compilation.

Do not conflate the two.

The original table of contents must preserve the source/manual page numbers exactly as they appear in the source.

A mapping layer may resolve those entries to the correct internal compilation page, but that mapping must be explicit data, not a guessed global offset formula.

---

## 6. Required Product Architecture

The digital manual should be built from structured data rather than one giant manually authored HTML file.

Recommended repository structure:

```text
/
├─ README.md
├─ BUILD.md
├─ package.json
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ search/
│  ├─ indexes/
│  ├─ glossary/
│  ├─ storage/
│  └─ data/
├─ data/
│  ├─ documents.json
│  ├─ pages.json
│  ├─ toc.json
│  ├─ procedures.json
│  ├─ specifications.json
│  ├─ fault-codes.json
│  ├─ glossary.json
│  ├─ diagrams.json
│  ├─ parts-links.json
│  ├─ technical-updates.json
│  ├─ cross-references.json
│  └─ source-gaps.json
├─ assets/
│  ├─ diagrams/
│  ├─ photos/
│  ├─ exploded-views/
│  ├─ wiring/
│  ├─ connectors/
│  └─ tables/
├─ scripts/
│  ├─ ingest/
│  ├─ validate/
│  └─ build/
└─ public/
```

The exact framework is not important. The data model and deterministic behaviour are.

---

## 7. Text-First Requirement

For normal narrative and procedural pages:

- extract the source text;
- reconstruct headings and paragraphs;
- remove PDF text-layer artefacts;
- preserve warnings, cautions, notes and numbered steps;
- preserve units and symbols;
- preserve technical terminology;
- preserve tables structurally where possible.

Do not display raw PDF text extraction when it produces broken dot leaders, scattered numbers, duplicated lines or unreadable layout.

If a page cannot be reliably reconstructed as text, retain the source visual for that page or region and mark the text extraction state accordingly.

---

## 8. Visual Extraction Requirement

Retain images only when they carry information that text cannot adequately represent.

Required visual categories include:

- wiring diagrams;
- electrical schematics;
- connector pinouts;
- component-location diagrams;
- exploded parts views;
- photographs;
- assembly illustrations;
- service-tool illustrations;
- charts and graphs;
- layout-dependent diagnostic tables;
- any page or region whose text layer is corrupt or unusable.

Do not crop blindly.

Every retained visual must have metadata:

```json
{
  "id": "VIS-000001",
  "document": "Spyder RT Shop Manual",
  "source_page": 451,
  "compilation_page": 477,
  "type": "wiring-diagram",
  "title": "Ignition circuit",
  "system": "Ignition",
  "applicability": ["2010", "2011"],
  "asset": "/assets/wiring/...",
  "verified": true
}
```

The final application must support zooming visual material without making labels unreadable.

---

## 9. Table of Contents

Build a proper hierarchical digital contents tree.

Requirements:

- preserve original source wording;
- preserve source/manual page numbers;
- resolve each entry to the correct internal destination;
- support nested sections/subsections;
- make every valid destination tappable;
- mark genuinely missing destinations as missing;
- do not replace the original contents with a generated topic list.

Separate contents trees should be available for each source document in the compilation.

---

## 10. Search

Search must be deterministic.

Required search layers:

1. exact source text;
2. title and heading search;
3. glossary aliases;
4. component aliases;
5. owner/plain-language synonyms;
6. fault-code lookup;
7. part-number lookup where available.

Example deterministic aliases:

```text
gearbox computer -> TCM
air suspension -> ACS
temperature sensor -> CTS
turns over but will not fire -> crank/no-start
go backwards -> reverse
```

These aliases must be stored explicitly in data.

Do not use an LLM to reinterpret the user's query at runtime.

---

## 11. Glossary

Create a comprehensive glossary from the source material.

Each entry should support:

- abbreviation;
- full term;
- plain-language meaning;
- aliases;
- relevant systems;
- source references;
- related terms.

Technical terms in rendered manual text should be tappable where practical.

Example:

```json
{
  "term": "GBPS",
  "expanded": "Gearbox Position Sensor",
  "plain": "Sensor that tells the system which gearbox position is selected.",
  "aliases": ["gear position sensor"],
  "sources": [...]
}
```

---

## 12. Procedure Records

Do not leave all procedures as anonymous page text.

Create structured procedure records where the source supports them.

Each procedure should include:

- title;
- system;
- applicability;
- prerequisites;
- warnings/cautions;
- required tools;
- numbered steps;
- torque values;
- measurements/specifications;
- related diagrams;
- related parts;
- source references;
- links to referenced procedures.

Example procedure types:

- removal;
- installation;
- inspection;
- adjustment;
- testing;
- troubleshooting;
- replacement;
- reset/calibration.

Do not rewrite the technical meaning.

---

## 13. Specifications and Torque Values

Create dedicated indexes for:

- torque values;
- clearances;
- pressures;
- voltages;
- resistance values;
- capacities;
- dimensions;
- adjustment limits;
- wear limits.

Each value must retain its source context.

Never present an isolated numeric specification without identifying what it applies to.

---

## 14. Fault Codes

Create a dedicated fault-code register.

For every code that appears in the source, capture:

- code;
- system/module;
- source wording;
- conditions;
- checks/tests;
- related procedures;
- source references;
- applicability.

Do not infer causes not stated by the manual.

---

## 15. Wiring / Electrical Index

Create dedicated indexes for:

- wiring diagrams;
- circuit descriptions;
- connectors;
- terminal/pin information;
- relays;
- fuses;
- grounds;
- sensors;
- actuators;
- modules.

A mechanic should be able to search a component and immediately find all related electrical material.

---

## 16. Parts Integration

Where the source supports it, connect service-manual material to parts-catalogue material.

A component record should be able to link to:

- service procedure;
- exploded view;
- part name;
- part number;
- model/year/transmission applicability;
- related technical update.

Do not infer compatibility beyond the supplied source.

---

## 17. Technical Update Integration

The 2011 Technical Update Book must not merely sit as a separate searchable document.

Where the update explicitly modifies, adds to, supersedes or clarifies a base manual procedure, create an explicit relationship.

Relationship states should include:

- supplements;
- modifies;
- supersedes;
- clarification;
- related only.

Only assign these states when the source explicitly supports them.

---

## 18. Applicability Filters

Support deterministic filtering for:

- 2010;
- 2011;
- RT;
- RT-S;
- SM5;
- SE5;
- RT-622 where relevant.

Do not hide content based on guessed applicability.

If applicability is unknown, show it as unknown.

---

## 19. Bookmarks and Notes

Users should be able to:

- bookmark pages/sections;
- add workshop notes;
- export bookmarks and notes;
- import them on another device.

Do not rely on browser localStorage alone without export/import.

---

## 20. Offline / Distribution

The final product should be practical to share.

Do not build a 100+ MB single HTML file full of Base64 page screenshots.

Preferred deployment targets:

### GitHub-hosted version

Use GitHub Pages or another static-hosted build with assets stored separately.

### Offline version

Provide either:

- a PWA with offline caching;
- a downloadable static folder/package;
- or a generated offline bundle.

The project owner should be able to send someone a link for normal use.

An optional offline package can be provided for workshop use without internet.

---

## 21. Mobile Requirements

The primary interface must work well on Android phones.

Requirements:

- readable text without pinch zoom;
- large tap targets;
- sticky search/navigation;
- diagram zoom/pan;
- no horizontally overflowing procedure text;
- no giant raw text dumps;
- no 1,600-page scrolling page list;
- quick return to previous section/search result;
- dark mode acceptable;
- fast loading.

---

## 22. Desktop / Workshop Requirements

On a larger screen, support:

- side navigation;
- split text/diagram viewing;
- wider tables;
- multiple related references visible together;
- easy copying of specifications and part numbers;
- print-friendly procedure output.

---

## 23. What Must Not Be Built

Do not rebuild the failed concepts from earlier prototypes.

Do not:

- make a PDF viewer the primary interface;
- force users to select the original PDF;
- embed every PDF page as an image;
- dump raw PDF extraction into the UI;
- invent diagnostic reasoning;
- generate likely causes;
- ask symptom questions;
- use hidden AI to reinterpret the manual;
- invent missing source content;
- claim extraction is complete without verification;
- treat the table of contents as body extraction;
- assume one page-offset formula works for the entire compilation.

---

## 24. Verification States

Every ingested page or structured object must have an explicit status.

Use:

```text
VERIFIED
PARTIAL
UNVERIFIED
SOURCE MISSING
```

Do not use "complete" as a casual status.

A page is VERIFIED only when its text/visual representation has been checked against the source.

---

## 25. Coverage Manifest

Generate a machine-readable build manifest on every build.

Minimum fields:

```json
{
  "source_pages_total": 1603,
  "pages_ingested": 1603,
  "pages_text_verified": 0,
  "pages_visual_verified": 0,
  "procedures": 0,
  "diagrams": 0,
  "fault_codes": 0,
  "glossary_terms": 0,
  "specifications": 0,
  "cross_references": 0,
  "source_gaps": [],
  "build_timestamp": "",
  "commit": ""
}
```

Counts must come from actual data, not hard-coded claims.

---

## 26. Validation

Automated validation should fail the build if:

- a TOC destination points to a non-existent page;
- an asset reference is broken;
- a cross-reference target is missing;
- duplicate IDs exist;
- a procedure source reference is invalid;
- a fault code has no source reference;
- a specification has no source context;
- a supposedly verified object is missing verification metadata.

Also generate a human-review queue for pages or visuals that automated extraction could not confidently reconstruct.

---

## 27. Provenance

Every rendered piece of technical content should retain source provenance internally.

At minimum:

- source document;
- source/manual page;
- compilation file page;
- object ID;
- verification state.

The user does not need to see all provenance constantly, but it should be available.

---

## 28. Build Sequence

Use this order:

1. ingest and identify all source documents/pages;
2. create authoritative page/document map;
3. reconstruct every document TOC;
4. clean and structure text;
5. extract and classify necessary visuals;
6. create glossary and deterministic aliases;
7. structure procedures;
8. structure specifications/torques;
9. build fault-code register;
10. build wiring/connector indexes;
11. integrate parts catalogues;
12. integrate Technical Update relationships;
13. create applicability filters;
14. create cross-reference graph;
15. build UI;
16. add bookmarks/notes export/import;
17. build offline/PWA support;
18. run automated validation;
19. complete manual visual verification queue;
20. publish.

Do not skip directly to a polished UI while source ingestion remains unverified.

---

## 29. Acceptance Criteria

The project is ready only when all of the following are true:

- all 1,603 supplied compilation pages are accounted for;
- every source document has a digital contents structure;
- ordinary text pages are readable digital text, not screenshots;
- genuinely visual material is retained at readable resolution;
- corrupt text-layer pages have a verified fallback representation;
- all internal links resolve;
- source/manual page labels remain accurate;
- known source gaps are explicitly marked;
- search works across all source documents;
- glossary aliases work;
- procedures are navigable;
- specifications and torque values are indexed;
- fault codes are indexed;
- wiring/connectors are indexed;
- parts links are available where supported;
- Technical Update relationships are explicit where supported;
- mobile interface is usable;
- offline distribution works;
- manifest counts are generated from the actual build;
- verification status is visible to the build system;
- no unverified content is described as complete.

---

## 30. Product Behaviour

A user should be able to do things such as:

```text
Search: reverse actuator
Search: C0051
Search: starter solenoid
Search: gearbox position sensor
Search: oil pressure
Search: radiator fan
Search: front wheel torque
Search: windshield motor
Search: rear suspension compressor
Search: P0562
```

The result should take them directly to structured manual content, related procedures, specifications and relevant visuals.

The application should behave like a modern digital workshop manual, not like a PDF reader and not like a chatbot.

---

## 31. Current Prototype Warning

Existing HTML files produced during earlier experimentation should be treated as prototypes only.

They contain useful extracted material and may be mined for data, but their architecture should not be treated as authoritative.

Known prototype failures included:

- wrapping the PDF instead of digitising it;
- retaining too many full-page images;
- raw/unreadable PDF text rendering;
- oversized standalone HTML files;
- unreliable email sharing;
- incorrect navigation assumptions;
- premature completion claims.

Use the original source compilation plus verified extracted data as the basis of the new GitHub build.

---

## 32. Final Design Principle

The final test is simple:

**A mechanic should be able to use the digital manual without ever needing to open the original PDF.**

The source PDF should remain an archival ingestion source, not part of the normal workflow.
