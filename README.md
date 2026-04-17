# Draw Steel — Combat Reminders

A browser-based helper for [Draw Steel](https://www.mcdmproductions.com/) heroes: track resources, list the abilities you care about in combat, jot session notes, and search community rules text.

Rules data in this project comes from the independent [Steel Compendium](https://steelcompendium.io) Markdown repo (not affiliated with MCDM). Source Markdown for rules and bestiary:

**[github.com/SteelCompendium/data-md](https://github.com/SteelCompendium/data-md)**

## How to run

There is no build step. Open `index.html` in a modern desktop browser (Chrome, Edge, Firefox, etc.), or serve the folder with any static file server if you prefer (`npx serve`, VS Code Live Server, etc.).

## Sheet

- **Edit mode** — Fill in heroic resource name and current value, Stamina / Recoveries / Surges / Fate / Victories, victory and passive reminder notes, and a list of abilities (name, activity type, cost, range, trigger, notes). Use **+ Add ability** to create rows. **Load Conduit preset** fills a sample Piety-based Conduit from the compendium-style class text (confirm if you already have data).
- **Play mode** — Compact cards for abilities; tap **Mark used** on non-free triggered abilities that share the once-per-round triggered budget. **New round** clears those flags.
- **Footer** — Your data saves automatically in the browser (`localStorage`). You can **Download JSON**, **Import JSON**, and optionally **Choose file for auto-backup** (Chromium browsers: mirrors saves to a file on disk).

## Notes

Switch to the **Notes** tab for a scratch pad: **Type** for text, **Ink** for drawing (stylus pressure supported). Create or rename pages; content is saved with the rest of the app state.

## Rules

The **Rules** tab searches Markdown from the [data-md](https://github.com/SteelCompendium/data-md) repository: it loads a file list from GitHub (cached for a day), optionally uses GitHub code search for text matches, and loads full files from `raw.githubusercontent.com`. Uncheck **Include bestiary content** to hide `Bestiary/` paths.

For fewer API limits and offline-friendly full-text search, use **Local data-md folder** (Chromium) and select a local clone of the repo. That folder is not part of this git repository; clone [SteelCompendium/data-md](https://github.com/SteelCompendium/data-md) yourself if you want a copy on disk.

## License

This helper app is separate from MCDM and from the Steel Compendium data. Refer to the [data-md LICENSE](https://github.com/SteelCompendium/data-md/blob/main/LICENSE) for the rules Markdown content.
