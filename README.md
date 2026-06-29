# Cosmere RPG — Combat Reminders

A browser-based helper for **Cosmere RPG** (*Stormlight Handbook*) characters:
track your resources, list the talents and actions you actually use in combat,
jot session notes, and browse a mechanics-only reference.

> Unofficial fan tool. Not affiliated with or endorsed by Brandon Sanderson,
> Dragonsteel, or Brotwise Games. No rulebook text, art, or PDF is included in
> this project — see **[Rules data & copyright](#rules-data--copyright)** below.

## How to run

No build step. Open `index.html` in a modern desktop browser, or serve the
folder with any static file server (`npx serve`, VS Code Live Server, etc.).
Serving (rather than `file://`) is recommended so the reference tab can load the
local `data/*.json` files.

## Sheet

- **Edit mode** — Fill in your character: the three resource pools
  (**Health**, **Focus**, **Investiture**) with current/max, your **recovery
  die**, plus reminder notes and a list of abilities (name, action type, cost,
  range, trigger, notes).
- **Play mode** — Compact cards for abilities and quick +/- trackers for your
  resources. **New round** clears per-round "used" flags.
- **Footer** — Data autosaves in the browser (`localStorage`). You can
  **Download JSON**, **Import JSON**, and optionally **Choose file for
  auto-backup** (Chromium browsers mirror saves to a file on disk).

## Notes

The **Notes** tab is a scratch pad: **Type** for text, **Ink** for drawing
(stylus pressure supported). Create or rename pages; content saves with the rest
of the app state.

## Reference

The **Reference** tab loads this repo's `data/*.json` — a **mechanics-only**
index of player options (attributes, defenses, resource formulas, skills,
paths, orders, surges, general actions, and talents). Search by name or effect.

## Rules data & copyright

This project deliberately contains **no rulebook prose, flavor text, art, or
PDF**. The committed `data/` files are a paraphrased, mechanics-only index:
game systems and numbers (which are facts, not copyrightable expression),
written in our own terse shorthand — never the book's wording.

The pipeline that produces it keeps the source local:

| Path | Purpose | Committed? |
|------|---------|-----------|
| `Cosmere_RPG_*.pdf` | your purchased source | **No** — gitignored |
| `raw/` | local `pdftotext` output (verbatim + watermark) | **No** — gitignored |
| `data/` | paraphrased mechanics-only JSON | Yes |
| `tools/` | extraction + verbatim guard | Yes |

- `tools/extract.sh` — runs `pdftotext` on your local PDF into `raw/`, stripping
  the personalized purchase watermark. Re-runnable; output never leaves disk.
- `tools/check-verbatim.sh` — **the guard**: blocks any commit where 6+
  consecutive words of `data/` also appear in the source. This makes
  "no verbatim text" an enforced invariant, not a promise. Install it as a
  pre-commit hook with `git config core.hooksPath tools`.

See **[data/SCHEMA.md](data/SCHEMA.md)** for the data format and the workflow to
extend coverage. Bring your own legally-obtained PDF; none is distributed here.

## License

The app code is yours to use. The `data/` index describes game mechanics
(uncopyrightable facts) in original wording. Trademarks and the *Stormlight
Archive* / *Cosmere* settings belong to their respective owners.
