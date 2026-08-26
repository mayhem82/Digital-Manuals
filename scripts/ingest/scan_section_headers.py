#!/usr/bin/env python3
"""Scan a compilation-page range for the shop manual's own running
Section/Subsection headers and record the first compilation page each
(section, subsection) pair appears on.

This is used to resolve data/toc.json destinations from the source's own
printed structure -- not a guessed page-offset formula (BUILD.md section 5).
Every page in this manual carries "Section NN NAME" / "Subsection NN (NAME)"
as its first two lines, so the first page a given pair appears on is the
verified start of that subsection.
"""
import argparse
import json
import re
import sys
from pathlib import Path

SECTION_RE = re.compile(r"Section\s*[A-Za-z0-9]{1,2}\s+(.+)", re.IGNORECASE)
SUBSECTION_RE = re.compile(r"Subsection\s*[A-Za-z0-9]{1,2}\s*\((.+)\)", re.IGNORECASE)


def normalize(name: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", name.upper())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--compilation-range", nargs=2, type=int, required=True, metavar=("START", "END"))
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    try:
        import pdfplumber
    except ImportError:
        print("Missing dependency: pip install pdfplumber", file=sys.stderr)
        return 1

    sections = []
    section_index = {}

    with pdfplumber.open(args.pdf) as pdf:
        start, end = args.compilation_range
        for compilation_page in range(start, end + 1):
            index = compilation_page - 1
            if index < 0 or index >= len(pdf.pages):
                continue
            text = pdf.pages[index].extract_text() or ""
            lines = [l for l in text.splitlines() if l.strip()][:3]

            section_name = None
            subsection_name = None
            for line in lines:
                m = SECTION_RE.match(line.strip())
                if m and section_name is None:
                    section_name = m.group(1).strip()
                m2 = SUBSECTION_RE.match(line.strip())
                if m2 and subsection_name is None:
                    subsection_name = m2.group(1).strip()

            if not section_name:
                continue

            skey = normalize(section_name)
            if skey not in section_index:
                entry = {"section_name_raw": section_name, "section_key": skey,
                         "first_page": compilation_page, "subsections": [], "_sub_index": {}}
                sections.append(entry)
                section_index[skey] = entry
            section_entry = section_index[skey]

            if subsection_name:
                sub_key = normalize(subsection_name)
                if sub_key not in section_entry["_sub_index"]:
                    sub_entry = {"subsection_name_raw": subsection_name, "subsection_key": sub_key,
                                 "first_page": compilation_page}
                    section_entry["subsections"].append(sub_entry)
                    section_entry["_sub_index"][sub_key] = sub_entry

    for s in sections:
        del s["_sub_index"]

    args.out.write_text(json.dumps(sections, indent=2) + "\n", encoding="utf-8")
    print(f"Found {len(sections)} section(s). Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
