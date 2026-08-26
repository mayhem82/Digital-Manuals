#!/usr/bin/env python3
"""Heuristic scan of the source PDF to find pages likely to contain diagrams,
photos, or other non-text visuals, and emit a candidate manifest in the shape
extract_visuals.py expects.

This is NOT a substitute for human review (BUILD.md section 8 wants a
reviewer picking pages/regions) -- it's a starting point so a 1,603-page
compilation doesn't have to be scrolled page-by-page by hand before any
visual gets extracted. Every entry is generic ("diagram") until someone
retitles it; extract_visuals.py still marks everything verified:false.

Heuristic: a page counts as visual if it has embedded raster images above a
minimum size, OR a high ratio of vector drawing commands to text length
(catches line-art wiring diagrams / exploded views that aren't raster
images).
"""
import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--min-image-area", type=float, default=40000,
                         help="min (w*h) pixels for an embedded image to count")
    parser.add_argument("--min-drawings", type=int, default=40,
                         help="min vector drawing paths to count as line-art")
    args = parser.parse_args()

    try:
        import fitz
    except ImportError:
        print("Missing dependency: pip install pymupdf", file=sys.stderr)
        return 1

    if not args.pdf.exists():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    doc = fitz.open(args.pdf)
    candidates = []

    for i in range(doc.page_count):
        page = doc[i]
        page_num = i + 1

        images = page.get_images(full=True)
        has_big_image = False
        for img in images:
            xref = img[0]
            try:
                base = doc.extract_image(xref)
                if base["width"] * base["height"] >= args.min_image_area:
                    has_big_image = True
                    break
            except Exception:
                continue

        drawing_count = 0
        if not has_big_image:
            drawing_count = len(page.get_drawings())

        text_len = len(page.get_text().strip())

        if has_big_image:
            candidates.append({
                "compilation_page": page_num,
                "type": "photo",
                "title": f"Page {page_num} image",
                "system": "",
                "reason": "embedded-raster-image",
            })
        elif drawing_count >= args.min_drawings and text_len < 400:
            candidates.append({
                "compilation_page": page_num,
                "type": "diagram",
                "title": f"Page {page_num} diagram",
                "system": "",
                "reason": f"vector-drawing-heavy (paths={drawing_count}, text_len={text_len})",
            })

    args.out.write_text(json.dumps(candidates, indent=2) + "\n", encoding="utf-8")
    print(f"Scanned {doc.page_count} pages, flagged {len(candidates)} candidate visual pages -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
