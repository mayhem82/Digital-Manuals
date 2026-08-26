#!/usr/bin/env python3
"""Extract text per compilation page from the source PDF into data/pages.json.

Never guesses a source/manual page number from a global offset — that mapping
is only ever applied when explicitly supplied via --page-map (BUILD.md section 5).
Never marks extracted text VERIFIED — that is a human review step (section 24).
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGES_PATH = ROOT / "data" / "pages.json"
REVIEW_QUEUE_PATH = ROOT / "scripts" / "ingest" / "human-review-queue.json"

GARBLED_SIGNS = (
    re.compile(r"\.{5,}"),          # long dot leaders that didn't collapse
    re.compile(r"(?:\d\s){6,}\d"),  # scattered single-digit runs
    re.compile(r"\(cid:\d+\)"),  # unmapped glyph ref -- broken/subsetted font, no ToUnicode CMap
)


def looks_garbled(text: str) -> bool:
    if not text.strip():
        return True
    hits = sum(1 for pattern in GARBLED_SIGNS if pattern.search(text))
    return hits > 0


def load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--document", required=True, help="documents.json id, e.g. DOC-SPYDER-SHOP")
    parser.add_argument("--compilation-range", nargs=2, type=int, metavar=("START", "END"),
                         help="1-indexed inclusive compilation-page range to process")
    parser.add_argument("--page-map", type=Path,
                         help='JSON file: {"<compilation_page>": "<source_page>"}')
    args = parser.parse_args()

    try:
        import pdfplumber
    except ImportError:
        print("Missing dependency: pip install pdfplumber", file=sys.stderr)
        return 1

    if not args.pdf.exists():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    page_map = {}
    if args.page_map:
        page_map = {int(k): v for k, v in json.loads(args.page_map.read_text(encoding="utf-8")).items()}

    pages_doc = load_json(PAGES_PATH, {"schema_version": 1, "pages": []})
    existing_ids = {p["id"] for p in pages_doc["pages"]}
    review_queue = load_json(REVIEW_QUEUE_PATH, [])

    added = 0
    with pdfplumber.open(args.pdf) as pdf:
        start, end = args.compilation_range or (1, len(pdf.pages))
        for compilation_page in range(start, end + 1):
            index = compilation_page - 1
            if index < 0 or index >= len(pdf.pages):
                continue
            page_id = f"PG-{args.document}-{compilation_page:05d}"
            if page_id in existing_ids:
                continue

            text = pdf.pages[index].extract_text() or ""

            if looks_garbled(text):
                review_queue.append({
                    "compilation_page": compilation_page,
                    "document": args.document,
                    "reason": "text layer appears garbled or empty; needs visual retention or manual reconstruction"
                })
                continue

            pages_doc["pages"].append({
                "id": page_id,
                "document": args.document,
                "source_page": page_map.get(compilation_page, None),
                "compilation_page": compilation_page,
                "text": text,
                "verification": "UNVERIFIED"
            })
            added += 1

    PAGES_PATH.write_text(json.dumps(pages_doc, indent=2) + "\n", encoding="utf-8")
    REVIEW_QUEUE_PATH.write_text(json.dumps(review_queue, indent=2) + "\n", encoding="utf-8")
    print(f"Added {added} page(s). {len(review_queue)} page(s) queued for human review.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
