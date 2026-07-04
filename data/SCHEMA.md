# Data schema — Cosmere RPG combat/ability helper

This folder holds the **only** rulebook-derived data allowed in git. It is a
**mechanics-only, paraphrased index** of the *Cosmere RPG* handbooks. The source
PDFs and their raw extraction (`raw/`, `raw/<ruleset>/`) stay local and gitignored.

## Rulesets (multiple books)

The pipeline is **ruleset-aware** so more than one similarly-structured book can
live side by side:

- `data/rulesets.json` — registry the browser reads: each ruleset's `id`, `name`,
  `released` flag, `base` folder, and `index` filename.
- `tools/rulesets.sh` — the matching registry for the tools (PDF, watermark, raw
  and data folders per book). Add a ruleset in **both** places.
- **Stormlight** predates this and stays flat: its files are directly under
  `data/` and its raw text under `raw/`.
- **Every later book is namespaced**, e.g. `data/mistborn/` + `raw/mistborn/`.
  The Mistborn Handbook is registered as an unreleased scaffold
  (`data/mistborn/index.json` with empty `files`) so the app can list it as
  "coming soon" until the book ships and its data is paraphrased in.

Everything below describes the files **within one ruleset's folder** (identical
schema for each book).

## What may and may not go here

**Allowed (not copyrightable expression):**
- System facts: attribute names, formulas (`Physical defense = 10 + Strength + Speed`), skill→attribute mappings, the action economy.
- Per-option mechanics: cost, action type, range, prerequisite, dice, conditions applied, numeric effects.
- Short proper names / titles of options (e.g. "Reactive Strike", "Stormform"). Titles and short phrases are not copyrightable.

**Forbidden:**
- Verbatim or near-verbatim rules prose, flavor text, lore, or quotes.
- Anything copied as a sentence. Effects are written as **coded shorthand in our own words**, never the book's wording.
- Page numbers, book ordering, art, the buyer watermark.

The verbatim guard (`tools/check-verbatim.sh`) enforces this: if any 6 consecutive
words in any file here also appear in the source, the commit is blocked.

## Shorthand conventions (the "terse" in terse JSON)

Effects use a compact, consistent shorthand so they read as data, not prose:

| Code | Meaning |
|------|---------|
| `act` field: `1a` `2a` `3a` | costs 1 / 2 / 3 actions |
| `act`: `rea` | reaction (has a trigger) |
| `act`: `free` | free action |
| `act`: `none` | passive / always-on |
| `cost`: `1F` | spend 1 Focus |
| `cost`: `1I` | spend 1 Investiture |
| `cost`: `1F|1I` | spend 1 Focus **or** 1 Investiture |
| `cost`: `""` | no resource cost |
| `rng`: `self` `reach` `melee` `N` (feet) | range |
| `vs`: `phys` `cog` `spir` | targeted defense |
| `dmg`: `2d8 energy` | damage dice + type |
| condition codes in `eff` | `Disoriented`, `Slowed`, `Restrained`, etc. (game terms) |
| `EONT` | "until the end of [its] next turn" (duration shorthand) |
| `SONT` | "until the start of [its] next turn" |

Attribute abbreviations: `STR SPD INT WIL AWA PRE`. Defenses: `phys cog spir`.

## Files

- `system.json` — attributes, defenses, resources, skills, action economy. Pure facts. Each skill also carries `use` (what it tests), `examples` (short Gain-Advantage / application bullets), and `combat` (a skill-specific combat/rest action where one exists) — all in our own terse words.
- `origins.json` — ancestries (Human, Singer) and their mechanical hooks; cultures.
- `paths.json` — the 6 heroic paths and 10 Radiant orders: key stat + one-line mechanical theme (our words).
- `surges.json` — the 10 Surges. Per surge: `attr` (governing attribute, a fact), `gist` (one-line theme), `basic` (terse paraphrase of the base surge ability), and `talents` (the surge talent tree as `{ name, gist }`, mechanics only). In a `gist`, `[ranks]` = ranks in that surge and `scales` = the die grows per the Surge Scaling table.
- `abilities.json` — the working dataset the app consumes: general combat actions/reactions + path/order/surge **talents**, each a terse record (below).
- `index.json` — manifest the app loads: lists the data files + dataset version.

## Talent / ability record

```jsonc
{
  "id": "warrior-reactive-strike",   // kebab: <source>-<name>
  "name": "Reactive Strike",          // proper title (fact)
  "src": "warrior",                   // path/order/surge/general key
  "kind": "talent",                   // talent | action | reaction | form
  "key": false,                       // true = key talent of its path/order
  "tier": 1,                          // rank/tier where gained (0 = general/always; 1 for path specialty talents — real gating is in `pre` + tree order)
  "spec": "Investigator",             // optional: specialty within the path (Investigator/Spy/Thief, etc.); omitted for general/key talents
  "pre": "Discipline 3+",             // prerequisite, coded; "" if the only prereq is the preceding talent
  "act": "rea",                       // action-economy code (table above)
  "cost": "1F",                       // resource cost code
  "rng": "reach",                     // range code
  "vs": "phys",                       // targeted defense, or "" 
  "eff": "trigger: foe leaves reach -> melee Weaponry atk; hit -> dmg"  // OUR shorthand
}
```

`eff` is the only free-text field. Keep it terse, mechanical, and in our own
words. If you find yourself writing a sentence that reads like the book, you're
doing it wrong — and the guard will reject it.

## Workflow to add data

Default ruleset is Stormlight; prefix with `RULESET=<id>` for another book.

1. `tools/extract.sh [firstPage lastPage]` → updates local `raw/` (never committed).
   - Mistborn: `RULESET=mistborn tools/extract.sh [firstPage lastPage]` → `raw/mistborn/`.
2. Read the relevant raw `*.txt` section; paraphrase each option into a record above,
   writing into that ruleset's data folder (`data/` for Stormlight, `data/mistborn/` …).
3. `tools/check-verbatim.sh` → checks every ruleset; must print OK before committing.
4. Bump `version` in that ruleset's `index.json` (and register the ruleset in both
   `data/rulesets.json` and `tools/rulesets.sh` if it's new).
