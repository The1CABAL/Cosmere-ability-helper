#!/usr/bin/env bash
#
# check-verbatim.sh — fail if committed data/ echoes a source rulebook PDF.
#
# The guarantee: no run of N+ consecutive words in any committed data file may
# also appear, in order, in the locally-extracted rulebook text. This makes
# "mechanics only, no verbatim prose" a programmatically enforced invariant
# rather than a promise. Run it before every commit (see tools/pre-commit).
#
# How it works: shingle the source (raw text) and the candidate (data JSON) into
# N-word grams, then report any gram they share. Short mechanical phrases
# ("1 focus", "range 10") are < N words and never match; copyrighted sentences
# do. Schema key names live in data/ but are too short/sparse to form a shared
# N-gram with prose.
#
# MULTI-RULESET: every book registered in tools/rulesets.sh is checked against
# ITS OWN raw text (Stormlight data vs Stormlight raw, Mistborn data vs Mistborn
# raw, …) so books never cross-contaminate. Books whose source hasn't been
# extracted locally are skipped (you can't verify what you can't compare). The
# shared app source (app.js, index.html) is checked against the union of ALL
# extracted books, since its labels could echo any of them.
#
# Usage:
#   tools/check-verbatim.sh              # check ALL rulesets, N=6 (default)
#   tools/check-verbatim.sh 5            # all rulesets, stricter 5-word overlap
#   RULESET=mistborn tools/check-verbatim.sh     # check only one ruleset
#   RULESET=mistborn tools/check-verbatim.sh 5
#
# Exit codes: 0 clean, 1 violations found, 2 nothing could be verified
#             (no source extracted for any requested ruleset).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=tools/rulesets.sh
. "$ROOT/tools/rulesets.sh"

N="${1:-6}"

# Which rulesets to check: one (RULESET=<id>) or all registered (default).
if [[ -n "${RULESET:-}" ]]; then
  targets=("$RULESET")
else
  # Read the registry's list into an array without a subshell-only var.
  targets=()
  while IFS= read -r _id; do targets+=("$_id"); done < <(ruleset_all)
fi

shopt -s nullglob

# Scratch files: the shingled source DB for the current book, and the candidate.
src_db="$(mktemp)"
cand="$(mktemp)"
# Union of every book's raw text — the shared app source is checked against this.
all_src_db="$(mktemp)"
trap 'rm -f "$src_db" "$cand" "$all_src_db"' EXIT

# Track the worst outcome across all rulesets. Start optimistic; downgrade only.
overall=0          # 0 clean, 1 violation, 2 nothing verifiable
verified_any=0     # did at least one ruleset actually get compared?
any_raw=0          # did we find raw text for ANY book (for the app-source pass)?

# compare_shingles <source-db> <candidate-file> <label>
# Prints violations (candidate shingles present in the source) and returns 1 if
# any were found, else 0.
compare_shingles() {
  local sdb="$1" cfile="$2" label="$3"
  local violations
  violations="$(grep -Fxf "$sdb" "$cfile" || true)"
  if [[ -n "$violations" ]]; then
    echo "VERBATIM GUARD FAILED [$label] — committed text shares $N-word runs with the source:" >&2
    echo "$violations" | sed 's/^/  • /' >&2
    echo >&2
    return 1
  fi
  return 0
}

for id in "${targets[@]}"; do
  # Resolve this book's raw/data folders from the registry.
  if ! ruleset_config "$id"; then
    overall=1   # an explicitly-requested unknown id is an error, not a skip.
    continue
  fi

  raw_files=("$RS_RAWDIR"/*.txt)
  data_files=("$RS_DATADIR"/*.json)

  if [[ ${#raw_files[@]} -eq 0 ]]; then
    # No local extraction for this book -> can't verify it. Not fatal on its own.
    echo "check-verbatim [$id]: no $RS_RAWDIR/*.txt — run tools/extract.sh first (skipped)." >&2
    [[ $overall -eq 0 ]] && overall=2
    continue
  fi

  # We have raw text for this book; fold it into the union for the app-source pass.
  any_raw=1
  cat "${raw_files[@]}" | awk -v N="$N" -f tools/ngrams.awk | sort -u >> "$all_src_db"

  if [[ ${#data_files[@]} -eq 0 ]]; then
    echo "check-verbatim [$id]: no $RS_DATADIR/*.json yet — nothing to check. OK."
    verified_any=1
    continue
  fi

  # Shingle this book's source and candidate data, then diff.
  cat "${raw_files[@]}"  | awk -v N="$N" -f tools/ngrams.awk | sort -u > "$src_db"
  cat "${data_files[@]}" | awk -v N="$N" -f tools/ngrams.awk | sort -u > "$cand"

  if compare_shingles "$src_db" "$cand" "$id"; then
    echo "check-verbatim [$id]: OK — no $N-word overlap between $RS_DATADIR/ and its source."
    verified_any=1
  else
    overall=1
  fi
done

# Shared UI source isn't owned by any single book, but its preset labels could
# echo mechanics from any of them — check it against the union of all raw text.
# (Only meaningful once at least one book has been extracted.)
if [[ $any_raw -eq 1 ]]; then
  app_files=(app.js index.html)
  present=()
  for f in "${app_files[@]}"; do [[ -f "$f" ]] && present+=("$f"); done
  if [[ ${#present[@]} -gt 0 ]]; then
    sort -u "$all_src_db" -o "$all_src_db"
    cat "${present[@]}" | awk -v N="$N" -f tools/ngrams.awk | sort -u > "$cand"
    if compare_shingles "$all_src_db" "$cand" "app source"; then
      echo "check-verbatim [app source]: OK — app.js/index.html add no $N-word overlap."
      verified_any=1
    else
      overall=1
    fi
  fi
fi

if [[ $overall -eq 1 ]]; then
  echo >&2
  echo "Paraphrase or drop the flagged text. Mechanics (numbers, tags) are fine;" >&2
  echo "copy the rules' wording and this fails. Re-run after fixing." >&2
  exit 1
fi

if [[ $verified_any -eq 0 ]]; then
  # Nothing could be compared (no raw extracted for any requested book).
  echo "check-verbatim: nothing verifiable — extract a source with tools/extract.sh." >&2
  exit 2
fi

echo "check-verbatim: OK — no $N-word overlap for the checked ruleset(s)."
exit 0
