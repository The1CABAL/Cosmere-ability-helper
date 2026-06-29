#!/usr/bin/env bash
#
# check-verbatim.sh — fail if committed data/ echoes the source PDF.
#
# The guarantee: no run of N+ consecutive words in any committed data file may
# also appear, in order, in the locally-extracted rulebook text. This makes
# "mechanics only, no verbatim prose" a programmatically enforced invariant
# rather than a promise. Run it before every commit (see tools/pre-commit).
#
# How it works: shingle the source (raw/*.txt) and the candidate (data/*.json)
# into N-word grams, then report any gram they share. Short mechanical phrases
# ("1 focus", "range 10") are < N words and never match; copyrighted sentences
# do. Schema key names live in data/ but are too short/sparse to form a shared
# N-gram with prose.
#
# Usage:
#   tools/check-verbatim.sh           # N=6 (default)
#   tools/check-verbatim.sh 5         # stricter: flag 5-word overlaps
#
# Exit codes: 0 clean, 1 violations found, 2 cannot run (no source extracted).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

N="${1:-6}"
RAW_DIR="raw"
DATA_DIR="data"

shopt -s nullglob
raw_files=("$RAW_DIR"/*.txt)
# Candidate = everything that could carry rulebook-derived text into git:
# the data index AND app source (the preset/labels reference mechanics too).
data_files=("$DATA_DIR"/*.json app.js index.html)

if [[ ${#raw_files[@]} -eq 0 ]]; then
  echo "check-verbatim: no $RAW_DIR/*.txt found — run tools/extract.sh first." >&2
  echo "  The guard cannot verify data/ without the local source to compare against." >&2
  exit 2
fi
if [[ ${#data_files[@]} -eq 0 ]]; then
  echo "check-verbatim: no $DATA_DIR/*.json yet — nothing to check. OK."
  exit 0
fi

src_db="$(mktemp)"
cand="$(mktemp)"
trap 'rm -f "$src_db" "$cand"' EXIT

cat "${raw_files[@]}"  | awk -v N="$N" -f tools/ngrams.awk | sort -u > "$src_db"
cat "${data_files[@]}" | awk -v N="$N" -f tools/ngrams.awk | sort -u > "$cand"

# Violations = candidate shingles that also exist in the source.
violations="$(grep -Fxf "$src_db" "$cand" || true)"

if [[ -n "$violations" ]]; then
  echo "VERBATIM GUARD FAILED — committed data shares $N-word runs with the source PDF:" >&2
  echo "$violations" | sed 's/^/  • /' >&2
  echo >&2
  echo "Paraphrase or drop these. Mechanics (numbers, tags) are fine; copy the" >&2
  echo "rules' wording and this fails. Re-run after fixing." >&2
  exit 1
fi

echo "check-verbatim: OK — no $N-word overlap between data/ and the source."
