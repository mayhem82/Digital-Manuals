Put the source PDF compilation in this folder (e.g. `source-pdf/compilation.pdf`).

This folder is git-ignored — the PDF itself is never committed. Then run, from
the repo root:

    pip install pdfplumber pymupdf
    python3 scripts/ingest/extract_text.py --pdf source-pdf/compilation.pdf --document DOC-SPYDER-SHOP --compilation-range 1 400
    npm run validate
    npm run manifest

See scripts/ingest/README.md for the full pipeline.
