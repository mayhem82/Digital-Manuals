#!/usr/bin/env python3
"""Render human-identified visual regions from the source PDF into assets/,
and register them in data/diagrams.json. Never crops blindly (BUILD.md section 8) —
input is a manifest a reviewer prepared, not "every page."
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIAGRAMS_PATH = ROOT / "data" / "diagrams.json"

TYPE_TO_ASSET_DIR = {
    "wiring-diagram": "assets/wiring",
    "connector": "assets/connectors",
    "relay": "assets/wiring",
    "fuse": "assets/wiring",
    "ground": "assets/wiring",
    "sensor": "assets/wiring",
    "actuator": "assets/wiring",
    "module": "assets/wiring",
    "exploded-view": "assets/exploded-views",
    "photo": "assets/photos",
    "diagnostic-table": "assets/tables",
}
DEFAULT_DIR = "assets/diagrams"


def load_json(path: Path, default):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--document", required=True)
    parser.add_argument("--manifest", required=True, type=Path,
                         help="JSON list of {compilation_page, type, title, system, applicability?, bbox?}")
    parser.add_argument("--dpi", type=int, default=300)
    args = parser.parse_args()

    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("Missing dependency: pip install pymupdf", file=sys.stderr)
        return 1

    if not args.pdf.exists():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    entries = json.loads(args.manifest.read_text(encoding="utf-8"))
    diagrams_doc = load_json(DIAGRAMS_PATH, {"schema_version": 1, "visuals": []})
    existing_ids = {v["id"] for v in diagrams_doc["visuals"]}

    doc = fitz.open(args.pdf)
    zoom = args.dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    added = 0
    for i, entry in enumerate(entries, start=1):
        page_number = entry["compilation_page"]
        vis_type = entry["type"]
        vis_id = f"VIS-{args.document}-{page_number:05d}-{i:02d}"
        if vis_id in existing_ids:
            continue

        page = doc[page_number - 1]
        clip = fitz.Rect(*entry["bbox"]) if entry.get("bbox") else None
        pix = page.get_pixmap(matrix=matrix, clip=clip)

        out_dir = ROOT / TYPE_TO_ASSET_DIR.get(vis_type, DEFAULT_DIR)
        out_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{vis_id}.png"
        pix.save(out_dir / filename)

        diagrams_doc["visuals"].append({
            "id": vis_id,
            "document": args.document,
            "source_page": entry.get("source_page"),
            "compilation_page": page_number,
            "type": vis_type,
            "title": entry.get("title", ""),
            "system": entry.get("system", ""),
            "applicability": entry.get("applicability", []),
            "asset": f"/{out_dir.relative_to(ROOT).as_posix()}/{filename}",
            "verified": False
        })
        added += 1

    DIAGRAMS_PATH.write_text(json.dumps(diagrams_doc, indent=2) + "\n", encoding="utf-8")
    print(f"Rendered {added} visual(s). Each is marked verified:false until reviewed against the source.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
