# Ingestion pipeline

These scripts run locally against the actual source PDF compilation once it is
available on disk — nothing in this repo fabricates manual content, and no
ingestion has run yet (see `data/manifest.json`: `pages_ingested` reflects
reality, not a target).

## 1. Text extraction — `extract_text.py`

```
python3 scripts/ingest/extract_text.py \
  --pdf /path/to/compilation.pdf \
  --document DOC-SPYDER-SHOP \
  --compilation-range 1 400 \
  --page-map path/to/page-map.json   # optional, see below
```

- Extracts text per compilation page with `pdfplumber`.
- Appends one entry per page to `data/pages.json` with `verification: "UNVERIFIED"`
  — automatic extraction is never marked VERIFIED. A human reviewer promotes a
  page to VERIFIED/PARTIAL after checking it against the source, per BUILD.md
  section 24.
- `compilation_page` is the physical position in the 1,603-page compilation.
  `source_page` (the number printed in the original document) is **only**
  filled in when an explicit `--page-map` is supplied — this script never
  guesses a global offset formula (BUILD.md section 5). Build the page-map by
  reading the actual printed page numbers for a document's start/end and any
  internal renumbering; store it as `{"<compilation_page>": "<source_page>"}`.
- Pages whose text layer comes out garbled (broken dot leaders, scattered
  numbers, duplicated lines) are flagged into `human-review-queue.json`
  instead of being written as unreadable body text (BUILD.md section 7 & 26).

## 2. Visual extraction — `extract_visuals.py`

Visual extraction is deliberately **not** "screenshot every page." A human
reviewer first identifies which compilation pages/regions are genuinely
visual (wiring diagrams, exploded views, photos, connector layouts, etc.) and
records that in a small manifest:

```json
[
  { "compilation_page": 477, "type": "wiring-diagram", "title": "Ignition circuit", "system": "Ignition", "bbox": [36, 72, 560, 740] }
]
```

`bbox` is optional — omit it to capture the full page region.

```
python3 scripts/ingest/extract_visuals.py \
  --pdf /path/to/compilation.pdf \
  --document DOC-SPYDER-SHOP \
  --manifest path/to/visuals-manifest.json
```

- Renders each listed region at high resolution (300 DPI) with PyMuPDF so
  labels stay legible when zoomed.
- Saves the image under `assets/<type-folder>/` and appends a metadata entry
  to `data/diagrams.json` with `verified: false` until a human confirms it
  against the source.

## 3. After ingestion

Run, in order:

```
npm run validate   # scripts/validate/validate.mjs — fails the build on broken refs/IDs
npm run manifest    # scripts/build/generate-manifest.mjs — regenerates data/manifest.json from real counts
```

Neither script accepts hand-edited counts — they only ever read what's
actually in `data/`.
