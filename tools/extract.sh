#!/usr/bin/env bash
#
# extract.sh — deterministic, LOCAL-ONLY extraction of a Cosmere rulebook PDF
# into plain text for the normalization pass.
#
# This script is the ONLY part of the pipeline that touches the copyrighted PDF.
# Its output goes to a raw/ folder which is gitignored and must NEVER be committed:
#   - it is verbatim copyrighted prose, and
#   - the PDF carries a personalized purchase watermark (buyer name + order #).
#
# Only paraphrased, mechanics-only JSON under data/ is allowed into git, and
# tools/check-verbatim.sh enforces that nothing from raw/ leaks into it.
#
# MULTI-RULESET: which book we extract is chosen by the RULESET env var (default
# "stormlight"). Every book is described once in tools/rulesets.sh — its source
# PDF, watermark, and output folder — so this script never hardcodes a title.
# The Mistborn Handbook (unreleased) is already registered there: once its PDF
# exists, `RULESET=mistborn tools/extract.sh` just works, no edits here.
#
# Usage:
#   tools/extract.sh                      # extract the whole default book
#   tools/extract.sh 40 120               # extract pages 40-120 of the default book
#   RULESET=mistborn tools/extract.sh     # extract the whole Mistborn book
#   RULESET=mistborn tools/extract.sh 40 120
#   COSMERE_PDF=/path/to/book.pdf tools/extract.sh   # override the source path
#
# Requires: pdftotext (xpdf or poppler). No node/python needed.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Pull in the ruleset registry (RS_* vars, ruleset_config, ruleset_default).
# shellcheck source=tools/rulesets.sh
. "$ROOT/tools/rulesets.sh"

# Resolve which book to extract. RULESET names the book; its per-book defaults
# (PDF filename, watermark, raw output dir) come from the registry.
RULESET="${RULESET:-$(ruleset_default)}"
if ! ruleset_config "$RULESET"; then
  exit 1
fi

# COSMERE_PDF overrides the registry's default PDF path (handy if your copy has a
# different filename); otherwise use the book's registered default.
PDF="${COSMERE_PDF:-$RS_PDF}"
OUT_DIR="$RS_RAWDIR"
FIRST="${1:-}"
LAST="${2:-}"

if ! command -v pdftotext >/dev/null 2>&1; then
  echo "error: pdftotext not found on PATH (install xpdf or poppler-utils)" >&2
  exit 1
fi
if [[ ! -f "$PDF" ]]; then
  echo "error: source PDF for '$RS_ID' ($RS_NAME) not found: $PDF" >&2
  echo "       set COSMERE_PDF=/path/to/file.pdf or place it in the repo root." >&2
  # A friendlier hint for the book that isn't out yet.
  if [[ "$RS_RELEASED" != "1" ]]; then
    echo "       note: '$RS_ID' is not released yet — there is no PDF to extract." >&2
  fi
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
# gitignored anyway). The pattern comes from the registry (RS_WATERMARK) but
# COSMERE_WATERMARK still overrides it for a one-off odd copy.
WM_REGEX="${COSMERE_WATERMARK:-$RS_WATERMARK}"

scrub() {
  # Remove watermark lines and collapse runs of blank lines.
  grep -vE "$WM_REGEX" | cat -s
}

echo "ruleset: $RS_ID ($RS_NAME) — source: $PDF"

# Two passes: reading-order (good for linear prose / lists) and -layout
# (preserves columns/tables but interleaves two-column pages). The
# normalization pass picks whichever reads more cleanly for a given section.
echo "extracting reading-order text -> $OUT_DIR/${suffix}.txt"
pdftotext "${range[@]}" "$PDF" - 2>/dev/null | scrub > "$OUT_DIR/${suffix}.txt"

echo "extracting layout text       -> $OUT_DIR/${suffix}.layout.txt"
pdftotext -layout "${range[@]}" "$PDF" - 2>/dev/null | scrub > "$OUT_DIR/${suffix}.layout.txt"

echo "done. $OUT_DIR/ is gitignored — do not commit it."
