#!/usr/bin/env python3
"""OCR-based text extraction for compilation pages whose embedded font has no
usable ToUnicode CMap (pdfplumber/PyMuPDF can only recover unmapped glyph
references or scrambled characters from them -- see documents.json's
TEXT_LAYER_UNUSABLE_BROKEN_FONT status).

Renders each page to a high-resolution image and runs EasyOCR against it.
Text recovered this way is still written with verification: "UNVERIFIED" --
OCR is not perfect and a human still has to check it against the source
(BUILD.md section 24). Pages where OCR finds no reliable text (often a pure
diagram/photo page) are left in the human-review queue for visual retention
instead of forcing empty or garbage text into pages.json.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGES_PATH = ROOT / "data" / "pages.json"
REVIEW_QUEUE_PATH = ROOT / "scripts" / "ingest" / "human-review-queue.json"

def looks_reliable(text: str) -> bool:
    """A minimum length is enough here: EasyOCR doesn't hallucinate coherent
    text out of a blank or pure-diagram page -- it returns little or nothing.
    A stopword-density check was tried and dropped: it wrongly rejected
    legitimate short content (parts lists, tool tables) that has few common
    words but is perfectly real. Length alone catches the actual failure mode
    (blank/near-blank OCR output) without false-rejecting real short pages."""
    return len(text.strip()) >= 15


def load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--document", required=True)
    parser.add_argument("--compilation-range", nargs=2, type=int, metavar=("START", "END"), required=True)
    parser.add_argument("--dpi", type=int, default=300)
    parser.add_argument("--save-every", type=int, default=10, help="write progress to disk every N pages")
    args = parser.parse_args()

    try:
        import fitz
    except ImportError:
        print("Missing dependency: pip install pymupdf", file=sys.stderr)
        return 1

    try:
        import easyocr
    except ImportError:
        print("Missing dependency: pip install easyocr", file=sys.stderr)
        return 1

    if not args.pdf.exists():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    pages_doc = load_json(PAGES_PATH, {"schema_version": 1, "pages": []})
    existing_ids = {p["id"] for p in pages_doc["pages"]}
    review_queue = load_json(REVIEW_QUEUE_PATH, [])

    print("Loading EasyOCR model...", flush=True)
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)

    doc = fitz.open(args.pdf)
    zoom = args.dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    start, end = args.compilation_range
    added = 0
    reviewed = 0

    for i, compilation_page in enumerate(range(start, end + 1), start=1):
        page_id = f"PG-{args.document}-{compilation_page:05d}"
        if page_id in existing_ids:
            continue
        index = compilation_page - 1
        if index < 0 or index >= doc.page_count:
            continue

        pix = doc[index].get_pixmap(matrix=matrix)
        img_bytes = pix.tobytes("png")
        result = reader.readtext(img_bytes, detail=0, paragraph=True)
        text = "\n".join(result)

        review_queue[:] = [e for e in review_queue if not (e.get("document") == args.document and e.get("compilation_page") == compilation_page)]

        if looks_reliable(text):
            pages_doc["pages"].append({
                "id": page_id,
                "document": args.document,
                "source_page": None,
                "compilation_page": compilation_page,
                "text": text,
                "verification": "UNVERIFIED"
            })
            existing_ids.add(page_id)
            added += 1
        else:
            page = doc[index]
            # get_images()/get_drawings() list resources, not what's actually
            # drawn -- this PDF has ~42 tiny repeating watermark-tile images
            # on nearly every page regardless of content, so a bare
            # bool(get_images()) is always true. get_image_info() reports
            # only images actually placed on the page; require a real
            # minimum size (same threshold as scan_visual_pages.py) so a
            # watermark tile doesn't count as a diagram.
            has_visual_content = any(
                (info["bbox"][2] - info["bbox"][0]) * (info["bbox"][3] - info["bbox"][1]) >= 40000
                for info in page.get_image_info()
            ) or bool(page.get_drawings())
            if has_visual_content:
                reason = "OCR found no reliable text on this page; it has embedded images/drawings, likely a diagram/photo page needing visual retention"
            else:
                reason = "OCR found no reliable text and no embedded images/drawings; page appears blank in the source"
            review_queue.append({
                "compilation_page": compilation_page,
                "document": args.document,
                "reason": reason
            })
            reviewed += 1

        if i % args.save_every == 0:
            PAGES_PATH.write_text(json.dumps(pages_doc, indent=2) + "\n", encoding="utf-8")
            REVIEW_QUEUE_PATH.write_text(json.dumps(review_queue, indent=2) + "\n", encoding="utf-8")
            print(f"...{i}/{end - start + 1} pages processed ({added} added, {reviewed} queued)", flush=True)

    PAGES_PATH.write_text(json.dumps(pages_doc, indent=2) + "\n", encoding="utf-8")
    REVIEW_QUEUE_PATH.write_text(json.dumps(review_queue, indent=2) + "\n", encoding="utf-8")
    print(f"Done. Added {added} page(s) via OCR. {reviewed} page(s) queued for human review.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
