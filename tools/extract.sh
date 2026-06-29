#!/usr/bin/env bash
#
# extract.sh — deterministic, LOCAL-ONLY extraction of the Cosmere rulebook PDF
# into plain text for the normalization pass.
#
# This script is the ONLY part of the pipeline that touches the copyrighted PDF.
# Its output goes to raw/ which is gitignored and must NEVER be committed:
#   - it is verbatim copyrighted prose, and
#   - the PDF carries a personalized purchase watermark (buyer name + order #).
#
# Only paraphrased, mechanics-only JSON under data/ is allowed into git, and
# tools/check-verbatim.sh enforces that nothing from raw/ leaks into it.
#
# Usage:
#   tools/extract.sh                 # extract the whole book
#   tools/extract.sh 40 120          # extract pages 40-120 only
#
# Requires: pdftotext (xpdf or poppler). No node/python needed.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PDF="${COSMERE_PDF:-Cosmere_RPG_Stormlight_Handbook.pdf}"
OUT_DIR="raw"
FIRST="${1:-}"
LAST="${2:-}"

if ! command -v pdftotext >/dev/null 2>&1; then
  echo "error: pdftotext not found on PATH (install xpdf or poppler-utils)" >&2
  exit 1
fi
if [[ ! -f "$PDF" ]]; then
  echo "error: source PDF not found: $PDF" >&2
  echo "       set COSMERE_PDF=/path/to/file.pdf or place it in the repo root." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

range=()
suffix="full"
if [[ -n "$FIRST" && -n "$LAST" ]]; then
  range=(-f "$FIRST" -l "$LAST")
  suffix="p${FIRST}-${LAST}"
fi

# Watermark scrubber. The PDF stamps a personalized line on every page,
# e.g. "isaac bly (Order #52383267)". Drop any line that looks like a
# purchase watermark so it can never reach raw/ (defense in depth — raw/ is
# gitignored anyway). Tune COSMERE_WATERMARK if your copy differs.
WM_REGEX="${COSMERE_WATERMARK:-\(Order #[0-9]+\)}"

scrub() {
  # Remove watermark lines and collapse runs of blank lines.
  grep -vE "$WM_REGEX" | cat -s
}

# Two passes: reading-order (good for linear prose / lists) and -layout
# (preserves columns/tables but interleaves two-column pages). The
# normalization pass picks whichever reads more cleanly for a given section.
echo "extracting reading-order text -> $OUT_DIR/${suffix}.txt"
pdftotext "${range[@]}" "$PDF" - 2>/dev/null | scrub > "$OUT_DIR/${suffix}.txt"

echo "extracting layout text       -> $OUT_DIR/${suffix}.layout.txt"
pdftotext -layout "${range[@]}" "$PDF" - 2>/dev/null | scrub > "$OUT_DIR/${suffix}.layout.txt"

echo "done. raw/ is gitignored — do not commit it."
