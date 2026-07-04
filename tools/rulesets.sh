#!/usr/bin/env bash
#
# rulesets.sh — the ONE place the tool pipeline learns about rulesets.
#
# This project started life around a single book (the Cosmere RPG *Stormlight
# Handbook*) but the same extract → paraphrase → verbatim-guard pipeline is meant
# to work for every similarly-structured Cosmere handbook. The next one is the
# not-yet-released **Mistborn Handbook**, which we assume ships with the same kind
# of sections (attributes, skills, paths, surges/powers, talents, …). Rather than
# hardcode "Stormlight" in every script, each ruleset is described once here and
# the scripts source this file.
#
# To add a ruleset when its book arrives: add one `case` arm below (and a matching
# entry in data/rulesets.json for the browser app). Nothing else in tools/ needs
# to change — extract.sh and check-verbatim.sh are already ruleset-agnostic.
#
# This file is meant to be *sourced*, not executed:  . tools/rulesets.sh
#
# It exposes:
#   ruleset_all                 -> prints every known ruleset id, one per line.
#   ruleset_default             -> prints the id used when RULESET is unset.
#   ruleset_config <id>         -> validates <id> and fills these globals:
#       RS_ID        canonical ruleset id (e.g. "stormlight")
#       RS_NAME      human-readable book name (for log lines only)
#       RS_PDF       default source PDF filename in the repo root
#       RS_WATERMARK extended-regex matching that book's purchase watermark line
#       RS_RAWDIR    where extract.sh writes / check-verbatim.sh reads plain text
#       RS_DATADIR   where this ruleset's committed data/ JSON lives
#       RS_RELEASED  "1" if the book is out, "0" if it is a placeholder
#     Returns non-zero (and prints to stderr) for an unknown id.
#
# Design notes on the directory layout:
#   * Stormlight predates multi-ruleset support, so its data stays FLAT at data/
#     and its raw text stays FLAT at raw/ — RS_DATADIR="data", RS_RAWDIR="raw".
#     Moving those would churn history for no benefit and break older checkouts.
#   * Every ruleset added afterwards is namespaced in its own subfolder, e.g.
#     data/mistborn/ and raw/mistborn/. That keeps books from colliding and lets
#     the verbatim guard compare each book only against its own source text.

# --- registry ---------------------------------------------------------------
# Bash 3.2 (the macOS default) has no associative arrays, so the registry is a
# plain case statement. Order here is also the order ruleset_all emits.
RULESET_IDS="mistborn"
RULESET_DEFAULT="stormlight"

ruleset_all() {
  # One id per line so callers can `while read` or `for` over the list.
  printf '%s\n' $RULESET_IDS
}

ruleset_default() {
  printf '%s\n' "$RULESET_DEFAULT"
}

ruleset_config() {
  local id="${1:-}"
  # The watermark line these books stamp on every page looks like
  # "isaac bly (Order #52383267)". It is identical across the current Cosmere
  # books, so it is the shared default; override per-ruleset below if a future
  # book stamps something different. Callers may also override at runtime with
  # COSMERE_WATERMARK (see extract.sh).
  local default_wm='\(Order #[0-9]+\)'

  case "$id" in
    stormlight)
      RS_ID="stormlight"
      RS_NAME="Cosmere RPG — Stormlight Handbook"
      RS_PDF="Cosmere_RPG_Stormlight_Handbook.pdf"
      RS_WATERMARK="$default_wm"
      RS_RAWDIR="raw"      # flat — predates multi-ruleset support (see above)
      RS_DATADIR="data"    # flat — data/*.json live directly under data/
      RS_RELEASED="1"
      ;;
    mistborn)
      # Placeholder for the unreleased Mistborn Handbook. We assume it is
      # structured like Stormlight, so the same pipeline applies unchanged;
      # only the source filename and output folders differ. Drop the real PDF
      # in the repo root (or point COSMERE_PDF at it) once the book is out.
      RS_ID="mistborn"
      RS_NAME="Cosmere RPG — Mistborn Handbook"
      RS_PDF="Cosmere_RPG_Mistborn_Handbook.pdf"
      RS_WATERMARK="$default_wm"
      RS_RAWDIR="raw/mistborn"    # namespaced so it never mixes with Stormlight
      RS_DATADIR="data/mistborn"  # committed JSON lives under data/mistborn/
      RS_RELEASED="0"             # not out yet — scaffold only
      ;;
    *)
      echo "rulesets: unknown ruleset '$id' (known: $RULESET_IDS)" >&2
      return 1
      ;;
  esac
  return 0
}
