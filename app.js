/**
 * Local-only combat reminder sheet for Cosmere RPG characters.
 */

const STORAGE_KEY = "cosmereAbilityHelper.v1";

/**
 * One-click level-1 Warrior example. Fills the resource fields and a short
 * ability list drawn from the local data/ index (general actions/reactions +
 * the Warrior key talent). Notes are terse mechanical shorthand, not rulebook prose.
 */
const WARRIOR_PRESET = {
  characterName: "Example Warrior",
  level: "1",
  playerName: "",
  paths: "Warrior",
  ancestry: "Human",
  attrs: { STR: "2", SPD: "1", INT: "0", WIL: "2", AWA: "1", PRE: "0" },
  skills: { Athletics: "2", "Heavy Weaponry": "2", "Light Weaponry": "1", Discipline: "1", Perception: "1" },
  healthMax: "12",
  focusMax: "4",
  recoveryDie: "d6",
  physDef: "13",
  cogDef: "12",
  spirDef: "11",
  resourceNotes:
    "Focus fuels reactions (Reactive Strike, Dodge, Aid cost 1F). Recover (1+ action, once/scene): roll recovery die to regain Health/Focus.",
  passiveNotes:
    "Warrior path · Athletics start skill. Key talent: Vigilant Stance.\n\nOne reaction per round — spend it on Reactive Strike, Dodge, Aid, or Avoid Danger.",
  abilities: [
    {
      name: "Strike",
      activity: "1a",
      cost: "",
      rangeTargets: "reach · vs Physical",
      trigger: "",
      notes: "Weapon/unarmed atk vs Physical. Repeatable; offhand costs 2F.",
      nonFreeTriggered: false,
    },
    {
      name: "Vigilant Stance",
      activity: "1a",
      cost: "",
      rangeTargets: "self",
      trigger: "",
      notes: "Warrior key talent. Defensive stance: added responsiveness and flexibility.",
      nonFreeTriggered: false,
    },
    {
      name: "Reactive Strike",
      activity: "reaction",
      cost: "1F",
      rangeTargets: "reach · vs Physical",
      trigger: "A foe willingly steps out of your reach.",
      notes: "Melee/unarmed atk vs Physical. Not vs instantaneous movement. Uses your reaction.",
      nonFreeTriggered: true,
    },
    {
      name: "Dodge",
      activity: "reaction",
      cost: "1F",
      rangeTargets: "self",
      trigger: "An attack is aimed at you.",
      notes: "Impose disadvantage on the attack. Not vs area/multi-target. Uses your reaction.",
      nonFreeTriggered: true,
    },
  ],
};

/** The six attributes, grouped by the defense/resource category they feed. */
const ATTRIBUTES = [
  { key: "STR", name: "Strength", cat: "Physical" },
  { key: "SPD", name: "Speed", cat: "Physical" },
  { key: "INT", name: "Intellect", cat: "Cognitive" },
  { key: "WIL", name: "Willpower", cat: "Cognitive" },
  { key: "AWA", name: "Awareness", cat: "Spiritual" },
  { key: "PRE", name: "Presence", cat: "Spiritual" },
];

/** Skills as printed on the Stormlight sheet (Weaponry split into Heavy/Light). */
const SKILLS = [
  { name: "Agility", attr: "SPD" },
  { name: "Athletics", attr: "STR" },
  { name: "Heavy Weaponry", attr: "STR" },
  { name: "Light Weaponry", attr: "SPD" },
  { name: "Stealth", attr: "SPD" },
  { name: "Thievery", attr: "SPD" },
  { name: "Crafting", attr: "INT" },
  { name: "Deduction", attr: "INT" },
  { name: "Discipline", attr: "WIL" },
  { name: "Intimidation", attr: "WIL" },
  { name: "Lore", attr: "INT" },
  { name: "Medicine", attr: "INT" },
  { name: "Deception", attr: "PRE" },
  { name: "Insight", attr: "AWA" },
  { name: "Leadership", attr: "PRE" },
  { name: "Perception", attr: "AWA" },
  { name: "Persuasion", attr: "PRE" },
  { name: "Survival", attr: "AWA" },
];

/** Defense key -> { manual state field, attributes summed for the 10+a+b formula }. */
const DEFENSES = [
  { key: "phys", label: "Physical", field: "physDef", parts: ["STR", "SPD"] },
  { key: "cog", label: "Cognitive", field: "cogDef", parts: ["INT", "WIL"] },
  { key: "spir", label: "Spiritual", field: "spirDef", parts: ["AWA", "PRE"] },
];

const ACTIVITY_TYPES = [
  { value: "1a", label: "1 action" },
  { value: "2a", label: "2 actions" },
  { value: "3a", label: "3 actions" },
  { value: "reaction", label: "Reaction" },
  { value: "free", label: "Free action" },
  { value: "passive", label: "Passive" },
  { value: "other", label: "Other" },
];

const defaultState = () => ({
  characterName: "",
  level: "",
  playerName: "",
  paths: "",
  ancestry: "",
  attrs: {},
  skills: {},
  healthCurrent: "",
  healthMax: "",
  focusCurrent: "",
  focusMax: "",
  investitureCurrent: "",
  investitureMax: "",
  recoveryDie: "",
  physDef: "",
  cogDef: "",
  spirDef: "",
  deflect: "",
  movement: "",
  sensesRange: "",
  liftingCapacity: "",
  weapons: "",
  expertises: "",
  conditions: "",
  appearance: "",
  equipment: "",
  marks: "",
  purpose: "",
  obstacle: "",
  goals: "",
  connections: "",
  otherAbilities: "",
  characterNotes: "",
  radiantOrder: "",
  sprenName: "",
  sprenPersonality: "",
  sprenBondRange: "",
  ideals: "",
  surgesNotes: "",
  resourceNotes: "",
  passiveNotes: "",
  abilities: [],
  scratchCanvases: [],
  scratchActiveCanvasId: "",
  scratchLastNotesVisitDay: "",
  scratchInkLayout: 2,
});

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dateToDayKey(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDefaultCanvasTitle(dayKey) {
  const [Y, Mo, D] = dayKey.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(Y, Mo - 1, D);
  return dt.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function ensureScratchCanvasesArray() {
  if (!Array.isArray(state.scratchCanvases)) state.scratchCanvases = [];
}

function normalizeScratchCanvas(c) {
  const createdAt = c.createdAt || new Date().toISOString();
  const dayKey = c.createdDay || dateToDayKey(createdAt);
  return {
    id: c.id || uid(),
    name: String(c.name || formatDefaultCanvasTitle(dayKey)),
    createdDay: dayKey,
    createdAt,
    updatedAt: c.updatedAt || createdAt,
    notesText: c.notesText ?? "",
    inkStrokes: Array.isArray(c.inkStrokes) ? c.inkStrokes : [],
    composeMode: c.composeMode === "ink" ? "ink" : "type",
    inkErase: !!c.inkErase,
    inkCanvasW: typeof c.inkCanvasW === "number" && c.inkCanvasW > 0 ? c.inkCanvasW : 0,
    inkCanvasH: typeof c.inkCanvasH === "number" && c.inkCanvasH > 0 ? c.inkCanvasH : 0,
  };
}

function migrateLegacyScratchToCanvases(merged) {
  if (Array.isArray(merged.scratchCanvases) && merged.scratchCanvases.length > 0) {
    merged.scratchCanvases = merged.scratchCanvases.map(normalizeScratchCanvas);
    if (typeof merged.scratchLastNotesVisitDay !== "string") merged.scratchLastNotesVisitDay = "";
    if (!merged.scratchCanvases.some((c) => c.id === merged.scratchActiveCanvasId)) {
      merged.scratchActiveCanvasId = merged.scratchCanvases[0]?.id ?? "";
    }
    delete merged.scratchNotesText;
    delete merged.scratchInkStrokes;
    delete merged.scratchComposeMode;
    delete merged.scratchInkErase;
    return;
  }

  const legacyText = merged.scratchNotesText ?? "";
  const legacyInk = Array.isArray(merged.scratchInkStrokes) ? merged.scratchInkStrokes : [];
  const legacyCompose = merged.scratchComposeMode === "ink" ? "ink" : "type";
  const legacyErase = !!merged.scratchInkErase;
  const now = new Date();
  const dayKey = dateToDayKey(now);

  if ((legacyText || "").trim() || legacyInk.length) {
    merged.scratchCanvases = [
      normalizeScratchCanvas({
        id: uid(),
        name: formatDefaultCanvasTitle(dayKey),
        createdDay: dayKey,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        notesText: legacyText,
        inkStrokes: legacyInk,
        composeMode: legacyCompose,
        inkErase: legacyErase,
      }),
    ];
    merged.scratchActiveCanvasId = merged.scratchCanvases[0].id;
  } else {
    merged.scratchCanvases = [];
    merged.scratchActiveCanvasId = "";
  }
  if (typeof merged.scratchLastNotesVisitDay !== "string") merged.scratchLastNotesVisitDay = "";
  delete merged.scratchNotesText;
  delete merged.scratchInkStrokes;
  delete merged.scratchComposeMode;
  delete merged.scratchInkErase;
}

/** One-time Y scale for saves from before the notes canvas min-height was doubled. */
function migrateScratchInkDoubleCanvasHeight(merged) {
  if (!Array.isArray(merged.scratchCanvases)) return;
  for (const c of merged.scratchCanvases) {
    if (!Array.isArray(c.inkStrokes)) continue;
    for (const s of c.inkStrokes) {
      if (!Array.isArray(s.points)) continue;
      for (const p of s.points) {
        p.y *= 2;
      }
    }
    c.inkCanvasW = 0;
    c.inkCanvasH = 0;
  }
}

function scaleScratchInkStrokesForResize(page, sx, sy) {
  if (!page?.inkStrokes?.length || sx <= 0 || sy <= 0) return;
  const wScale = Math.sqrt(Math.max(sx * sy, 1e-8));
  for (const s of page.inkStrokes) {
    if (!Array.isArray(s.points)) continue;
    for (const p of s.points) {
      p.x *= sx;
      p.y *= sy;
    }
    if (typeof s.width === "number") s.width = Math.max(1, Math.round(s.width * wScale));
  }
}

/**
 * Play-mode +/- bars. Rows with maxKey use current / max; rows without maxKey are current only.
 */
const RESOURCE_PLAY_ROWS = [
  { label: "Health", curKey: "healthCurrent", maxKey: "healthMax" },
  { label: "Focus", curKey: "focusCurrent", maxKey: "focusMax" },
  { label: "Investiture", curKey: "investitureCurrent", maxKey: "investitureMax" },
];

let state = loadState();

/** Cleared on each bindFields so reminder inputs are not double-wired after import/preset. */
let fieldBindingsAbort;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const parsedHadInkLayout = Object.prototype.hasOwnProperty.call(parsed, "scratchInkLayout");
    const merged = {
      ...defaultState(),
      ...parsed,
      abilities: Array.isArray(parsed.abilities) ? parsed.abilities : [],
    };
    migrateLegacyScratchToCanvases(merged);
    if (!parsedHadInkLayout) {
      migrateScratchInkDoubleCanvasHeight(merged);
      merged.scratchInkLayout = 2;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
    }
    return merged;
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  flashSave();
  scheduleAutoFileSave();
}

/* —— Optional mirror to a user-chosen file (Chrome/Edge File System Access API) —— */

const IDB_NAME = "cosmereAbilityHelper";
const IDB_VERSION = 1;
const IDB_STORE = "handles";
const BACKUP_HANDLE_KEY = "backupJson";
const AUTO_FILE_DEBOUNCE_MS = 900;
const AUTO_FILE_INTERVAL_MS = 5 * 60 * 1000;

let backupFileHandle = null;
let autoFileSaveTimer = null;
let periodicBackupTimer = null;

function supportsFileSystemAccess() {
  return typeof window.showSaveFilePicker === "function";
}

function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSetBackupHandle(handle) {
  const db = await openIdb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(handle, BACKUP_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGetBackupHandle() {
  const db = await openIdb();
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const r = tx.objectStore(IDB_STORE).get(BACKUP_HANDLE_KEY);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return result;
}

async function idbClearBackupHandle() {
  const db = await openIdb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(BACKUP_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function writeStateToBackupFile() {
  if (!backupFileHandle || typeof backupFileHandle.createWritable !== "function") return;
  try {
    if (typeof backupFileHandle.queryPermission === "function") {
      let q = await backupFileHandle.queryPermission({ mode: "readwrite" });
      if (q !== "granted" && typeof backupFileHandle.requestPermission === "function") {
        q = await backupFileHandle.requestPermission({ mode: "readwrite" });
      }
      if (q !== "granted") return;
    }
    const writable = await backupFileHandle.createWritable();
    await writable.write(JSON.stringify(state, null, 2));
    await writable.close();
  } catch (e) {
    console.warn("Mirror to file failed:", e);
  }
}

function scheduleAutoFileSave() {
  if (!backupFileHandle) return;
  clearTimeout(autoFileSaveTimer);
  autoFileSaveTimer = setTimeout(() => {
    autoFileSaveTimer = null;
    void writeStateToBackupFile();
  }, AUTO_FILE_DEBOUNCE_MS);
}

function startPeriodicFileBackup() {
  stopPeriodicFileBackup();
  periodicBackupTimer = setInterval(() => void writeStateToBackupFile(), AUTO_FILE_INTERVAL_MS);
}

function stopPeriodicFileBackup() {
  if (periodicBackupTimer) {
    clearInterval(periodicBackupTimer);
    periodicBackupTimer = null;
  }
}

function updateBackupFooterUi() {
  const status = document.getElementById("backupStatus");
  const btnChoose = document.getElementById("btnChooseBackup");
  const btnStop = document.getElementById("btnStopBackup");
  if (!status) return;
  if (backupFileHandle) {
    status.textContent = `Mirroring every change (and every 5 min) to: ${backupFileHandle.name}`;
    if (btnStop) btnStop.hidden = false;
    if (btnChoose) btnChoose.textContent = "Change backup file…";
  } else {
    status.textContent = supportsFileSystemAccess()
      ? "Your sheet always saves in this browser. Optionally pick a JSON file below to also mirror changes to disk."
      : "Your sheet always saves in this browser. Use “Download JSON” for a file copy (this browser cannot link a live file).";
    if (btnStop) btnStop.hidden = true;
    if (btnChoose) btnChoose.textContent = "Choose file for auto-backup…";
  }
}

async function initBackupFileHandle() {
  if (!supportsFileSystemAccess()) {
    updateBackupFooterUi();
    return;
  }
  try {
    const h = await idbGetBackupHandle();
    if (h && typeof h.createWritable === "function") {
      backupFileHandle = h;
      startPeriodicFileBackup();
      void writeStateToBackupFile();
    }
  } catch {
    backupFileHandle = null;
  }
  updateBackupFooterUi();
}

async function chooseBackupFile() {
  if (!supportsFileSystemAccess()) {
    alert("Linking a file for automatic backups needs Chrome, Edge, or another Chromium-based browser.");
    return;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "cosmere-character.json",
      types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
    });
    backupFileHandle = handle;
    await idbSetBackupHandle(handle);
    await writeStateToBackupFile();
    startPeriodicFileBackup();
    updateBackupFooterUi();
  } catch (e) {
    if (e && e.name !== "AbortError") {
      alert(`Could not use that file: ${e.message || String(e)}`);
    }
  }
}

async function stopBackupFile() {
  backupFileHandle = null;
  clearTimeout(autoFileSaveTimer);
  autoFileSaveTimer = null;
  stopPeriodicFileBackup();
  try {
    await idbClearBackupHandle();
  } catch {
    /* ignore */
  }
  updateBackupFooterUi();
}

function flashSave() {
  const el = document.getElementById("saveStatus");
  if (!el) return;
  el.textContent = "Saved";
  el.classList.add("flash");
  clearTimeout(flashSave._t);
  flashSave._t = setTimeout(() => {
    el.textContent = "";
    el.classList.remove("flash");
  }, 900);
}

/* —— Sheet / Notes tabs + scratch pad (typed notes + ink canvas) —— */

let scratchNotesBindingsAbort = null;
let scratchInkCurrentStroke = null;
let notesPageResizeObserver = null;

/* —— Reference tab: searches the local mechanics-only data/ index (no external fetch). —— */
//
// MULTI-RULESET: the tab can browse more than one book. data/rulesets.json lists
// the available rulesets (Stormlight today, Mistborn once it ships) and each
// points at its own index.json under data/<base>. This mirrors the tool-side
// registry in tools/rulesets.sh so the two never drift. The picker in the
// toolbar switches the active ruleset; records for each are cached so flipping
// back and forth doesn't refetch.

/** Loaded data/rulesets.json: { default, rulesets: [{id,name,released,base,index}] }, or null. */
let rulesetsManifest = null;
/** Id of the ruleset currently shown in the Reference tab. */
let rulesActiveRulesetId = "";
/** Per-ruleset cache: id -> { records, sourceLine, emptyMsg }. Avoids refetching on switch. */
const rulesCacheByRuleset = new Map();

/** In-memory records for the ACTIVE ruleset: { id, title, sub, body }. */
let rulesRecords = null;
let rulesLoadPromise = null;
let rulesActiveRecordId = "";

function setRulesSearchStatus(message, isError = false) {
  const el = document.getElementById("rulesSearchStatus");
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("is-error", Boolean(isError));
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds a one-line mechanical body string from an ability record. */
function abilityToBody(a) {
  const parts = [];
  if (a.act) parts.push(`act: ${a.act}`);
  if (a.cost) parts.push(`cost: ${a.cost}`);
  if (a.rng) parts.push(`rng: ${a.rng}`);
  if (a.vs) parts.push(`vs: ${a.vs}`);
  if (a.pre) parts.push(`pre: ${a.pre}`);
  if (a.eff) parts.push(`eff: ${a.eff}`);
  return parts.join(" · ");
}

function buildRulesRecordsFromData(data) {
  const records = [];
  let n = 0;
  const push = (title, sub, body) => {
    records.push({ id: `r${n++}`, title: String(title || ""), sub: String(sub || ""), body: String(body || "") });
  };

  const abilities = data.abilities?.abilities;
  if (Array.isArray(abilities)) {
    for (const a of abilities) {
      const kind = a.key ? `${a.kind} (key)` : a.kind || "";
      push(a.name, [a.src, a.spec, kind].filter(Boolean).join(" · "), abilityToBody(a));
    }
  }

  const paths = data.paths;
  if (Array.isArray(paths?.heroicPaths)) {
    for (const p of paths.heroicPaths) {
      const body = [
        p.startSkill ? `start skill: ${p.startSkill}` : "",
        p.keyTalent ? `key talent: ${p.keyTalent}` : "",
        Array.isArray(p.specialties) ? `specialties: ${p.specialties.join(", ")}` : "",
        p.theme || "",
      ].filter(Boolean).join(" · ");
      push(p.name, "heroic path", body);
    }
  }
  if (Array.isArray(paths?.radiantOrders)) {
    for (const o of paths.radiantOrders) {
      push(o.name, "radiant order", Array.isArray(o.surges) ? `surges: ${o.surges.join(", ")}` : "");
    }
  }

  const surges = data.surges?.surges;
  if (Array.isArray(surges)) {
    for (const s of surges) {
      const orders = Array.isArray(s.orders) ? `orders: ${s.orders.join(", ")}` : "";
      const body = [
        s.attr ? `attr: ${s.attr}` : "",
        s.gist || "",
        orders,
        s.basic ? `basic: ${s.basic}` : "",
      ].filter(Boolean).join(" · ");
      push(s.name, "surge", body);
      if (Array.isArray(s.talents)) {
        for (const t of s.talents) push(t.name, `${s.name} surge talent`, t.gist || "");
      }
    }
  }

  const ancestries = data.origins?.ancestries;
  if (Array.isArray(ancestries)) {
    for (const a of ancestries) push(a.name, "ancestry", a.mech || "");
  }

  const sys = data.system;
  if (sys) {
    if (Array.isArray(sys.attributes)) {
      for (const at of sys.attributes) push(at.name, `attribute (${at.key})`, `category: ${at.category}`);
    }
    if (Array.isArray(sys.defenses)) {
      for (const d of sys.defenses) push(d.name + " defense", "defense", d.formula || "");
    }
    if (Array.isArray(sys.resources)) {
      for (const r of sys.resources) {
        push(r.name, "resource", [r.maxFormula ? `max: ${r.maxFormula}` : "", r.note || ""].filter(Boolean).join(" · "));
      }
    }
    if (Array.isArray(sys.skills)) {
      for (const sk of sys.skills) {
        const body = [
          `attr: ${sk.attr}`,
          sk.note || "",
          sk.use ? `use: ${sk.use}` : "",
          sk.combat ? `combat: ${sk.combat}` : "",
          Array.isArray(sk.examples) && sk.examples.length ? `e.g. ${sk.examples.join("; ")}` : "",
        ].filter(Boolean).join(" · ");
        push(sk.name, "skill", body);
      }
    }
  }

  return records;
}

/** One-line "which book am I looking at" note under the toolbar. */
function setRulesSourceLine(text) {
  const el = document.getElementById("rulesSourceLine");
  if (el) el.textContent = text || "";
}

/**
 * Loads data/rulesets.json once. If it is missing (older deploys predate
 * multi-ruleset support), fall back to a single implicit Stormlight ruleset
 * rooted at data/ so the tab keeps working unchanged.
 */
async function loadRulesetsManifest() {
  if (rulesetsManifest) return rulesetsManifest;
  try {
    const res = await fetch("data/rulesets.json");
    if (res.ok) {
      const m = await res.json();
      if (Array.isArray(m?.rulesets) && m.rulesets.length) {
        rulesetsManifest = m;
        return m;
      }
    }
  } catch {
    /* network/parse error -> fall through to the legacy single-ruleset shape */
  }
  // Legacy fallback: treat data/ as one unnamed Stormlight book (base "").
  rulesetsManifest = {
    default: "stormlight",
    rulesets: [{ id: "stormlight", name: "Stormlight Handbook", released: true, base: "", index: "index.json" }],
  };
  return rulesetsManifest;
}

/** Look up a ruleset entry by id from the loaded manifest. */
function getRuleset(id) {
  return rulesetsManifest?.rulesets.find((r) => r.id === id) || null;
}

/**
 * Fills the toolbar's ruleset <select> from the manifest and settles on an
 * active ruleset. Hides the picker when there's only one book (no choice).
 */
async function populateRulesetSelector() {
  const sel = document.getElementById("rulesRulesetSelect");
  if (!sel) return;
  const manifest = await loadRulesetsManifest();

  // With a single ruleset there is nothing to pick — hide the control.
  const field = sel.closest(".rules-ruleset-field");
  if (field) field.classList.toggle("is-hidden", manifest.rulesets.length < 2);

  sel.innerHTML = "";
  for (const r of manifest.rulesets) {
    const opt = document.createElement("option");
    opt.value = r.id;
    // Be honest about books that aren't out yet.
    opt.textContent = r.released ? r.name : `${r.name} (coming soon)`;
    sel.appendChild(opt);
  }
  if (!rulesActiveRulesetId) rulesActiveRulesetId = manifest.default || manifest.rulesets[0].id;
  sel.value = rulesActiveRulesetId;
}

/**
 * Ensures the ACTIVE ruleset's records are loaded and rendered. Serves from the
 * per-ruleset cache when possible; otherwise fetches that ruleset's index.json
 * (under data/<base>) and every data file it lists. Unreleased / unpopulated
 * books (empty `files`) resolve to a friendly placeholder rather than an error.
 */
function ensureRulesIndexLoaded() {
  // Cache hit: this ruleset was already indexed — reuse it, no fetch.
  const cached = rulesCacheByRuleset.get(rulesActiveRulesetId);
  if (cached) {
    rulesRecords = cached.records;
    setRulesSourceLine(cached.sourceLine);
    if (!rulesRecords.length) {
      setRulesSearchStatus(cached.emptyMsg || "No records for this ruleset yet.");
      renderRulesResults([]);
    } else {
      const q = document.getElementById("rulesSearchInput")?.value?.trim() || "";
      renderRulesResults(searchRulesRecords(q, 200));
      setRulesSearchStatus(`Indexed ${rulesRecords.length} mechanics records. Type to filter.`);
    }
    return Promise.resolve();
  }
  if (rulesLoadPromise) return rulesLoadPromise;

  rulesLoadPromise = (async () => {
    const manifest = await loadRulesetsManifest();
    const id = rulesActiveRulesetId || manifest.default || manifest.rulesets[0].id;
    rulesActiveRulesetId = id;
    const rs = getRuleset(id) || manifest.rulesets[0];
    const base = rs.base || "";          // e.g. "" for Stormlight, "mistborn/" for Mistborn
    const indexName = rs.index || "index.json";

    setRulesSearchStatus(`Loading ${rs.name}…`);
    const idxRes = await fetch(`data/${base}${indexName}`);
    if (!idxRes.ok) throw new Error(`Could not load data/${base}${indexName} (HTTP ${idxRes.status}).`);
    const index = await idxRes.json();
    const files = index.files || {};

    // No data files yet — typical for a not-yet-released book's scaffold index.
    // Cache a placeholder so we don't refetch, and tell the user why it's empty.
    if (!Object.keys(files).length) {
      const emptyMsg = rs.released
        ? "This ruleset has no mechanics indexed yet."
        : `${rs.name} isn't out yet — no mechanics to browse. It'll fill in once the book ships.`;
      const sourceLine = `Ruleset: ${rs.name}${index.version ? ` · v${index.version}` : ""} · no data yet`;
      rulesCacheByRuleset.set(id, { records: [], sourceLine, emptyMsg });
      rulesRecords = [];
      setRulesSourceLine(sourceLine);
      setRulesSearchStatus(emptyMsg);
      renderRulesResults([]);
      return;
    }

    // Load every data file for this ruleset; paths are relative to its base.
    const data = {};
    await Promise.all(
      Object.entries(files).map(async ([key, name]) => {
        const r = await fetch(`data/${base}${name}`);
        if (!r.ok) throw new Error(`Could not load data/${base}${name} (HTTP ${r.status}).`);
        data[key] = await r.json();
      })
    );
    const records = buildRulesRecordsFromData(data);
    const sourceLine = `Ruleset: ${rs.name}${index.version ? ` · v${index.version}` : ""} · ${records.length} records`;
    rulesCacheByRuleset.set(id, { records, sourceLine, emptyMsg: "" });
    rulesRecords = records;
    setRulesSourceLine(sourceLine);
    setRulesSearchStatus(`Indexed ${records.length} mechanics records. Type to filter.`);
    renderRulesResults(records);
  })()
    .catch((e) => {
      rulesRecords = null;
      const msg = /Failed to fetch|NetworkError|HTTP/i.test(e?.message || "")
        ? "Could not read the local data/ folder. Serve this folder over HTTP (e.g. run a local web server) rather than opening the file directly."
        : e?.message || String(e);
      setRulesSearchStatus(msg, true);
    })
    .finally(() => {
      // Clear the in-flight guard; a successful load is now served from cache.
      rulesLoadPromise = null;
    });
  return rulesLoadPromise;
}

/** Switches the active ruleset and (re)loads its records. */
function switchRuleset(id) {
  if (!id || id === rulesActiveRulesetId) return;
  rulesActiveRulesetId = id;
  rulesActiveRecordId = "";
  rulesRecords = null;
  rulesLoadPromise = null;
  const detail = document.getElementById("rulesDetail");
  if (detail) detail.innerHTML = "";
  const input = document.getElementById("rulesSearchInput");
  if (input) input.value = "";
  void ensureRulesIndexLoaded();
}

/** Drops the active ruleset's cache and reloads it from disk. */
function refreshRulesIndex() {
  rulesCacheByRuleset.delete(rulesActiveRulesetId);
  rulesRecords = null;
  rulesLoadPromise = null;
  void ensureRulesIndexLoaded();
}

function searchRulesRecords(query, limit = 200) {
  if (!rulesRecords?.length) return [];
  const q = query.trim().toLowerCase();
  if (!q) return rulesRecords.slice(0, limit);
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const rec of rulesRecords) {
    const title = rec.title.toLowerCase();
    const hay = `${title} ${rec.sub.toLowerCase()} ${rec.body.toLowerCase()}`;
    if (!tokens.every((t) => hay.includes(t))) continue;
    let score = 0;
    for (const t of tokens) {
      if (title.includes(t)) score += 12;
      else score += 3;
    }
    scored.push({ rec, score });
  }
  scored.sort((a, b) => b.score - a.score || a.rec.title.localeCompare(b.rec.title));
  return scored.slice(0, limit).map((x) => x.rec);
}

function renderRulesResults(records) {
  const ul = document.getElementById("rulesResults");
  if (!ul) return;
  ul.innerHTML = "";
  for (const rec of records) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rules-result-btn";
    btn.setAttribute("data-rules-id", rec.id);
    btn.innerHTML = `<span class="rules-result-title">${escapeHtml(rec.title)}</span><span class="rules-result-path">${escapeHtml(rec.sub)}</span>`;
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

function openRulesRecord(id) {
  const el = document.getElementById("rulesDetail");
  if (!el) return;
  const rec = rulesRecords?.find((r) => r.id === id);
  if (!rec) return;
  rulesActiveRecordId = id;
  const md = `## ${rec.title}\n\n${rec.sub ? `*${rec.sub}*\n\n` : ""}${rec.body || ""}`;
  if (typeof marked !== "undefined" && typeof marked.parse === "function") {
    el.innerHTML = marked.parse(md, { mangle: false, headerIds: false });
  } else {
    el.textContent = `${rec.title}\n${rec.sub}\n\n${rec.body}`;
  }
  el.scrollTop = 0;
}

async function runRulesSearch() {
  await ensureRulesIndexLoaded();
  if (!rulesRecords?.length) return;
  const input = document.getElementById("rulesSearchInput");
  const q = input?.value?.trim() || "";
  const hits = searchRulesRecords(q, 200);
  renderRulesResults(hits);
  setRulesSearchStatus(
    hits.length
      ? `${hits.length} matching record(s). Click one to see its mechanics.`
      : "No matching records. Try different keywords.",
    false
  );
}

function wireRulesSearchOnce() {
  const ul = document.getElementById("rulesResults");
  if (ul && ul.dataset.wired !== "1") {
    ul.dataset.wired = "1";
    ul.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-rules-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-rules-id");
      if (id) openRulesRecord(id);
    });
  }
  // Ruleset picker: switch which book the Reference tab is browsing.
  const sel = document.getElementById("rulesRulesetSelect");
  if (sel && sel.dataset.wired !== "1") {
    sel.dataset.wired = "1";
    sel.addEventListener("change", () => switchRuleset(sel.value));
  }
}

function setAppView(which) {
  const views = {
    sheet: document.getElementById("viewSheet"),
    notes: document.getElementById("viewNotes"),
    rules: document.getElementById("viewRules"),
  };
  const tabs = {
    sheet: document.getElementById("tabSheet"),
    notes: document.getElementById("tabNotes"),
    rules: document.getElementById("tabRules"),
  };
  const order = ["sheet", "notes", "rules"];
  if (!order.includes(which)) which = "sheet";

  for (const key of order) {
    const el = views[key];
    if (!el) continue;
    const show = key === which;
    el.classList.toggle("is-hidden", !show);
    el.setAttribute("aria-hidden", show ? "false" : "true");
  }
  for (const key of order) {
    const t = tabs[key];
    if (!t) continue;
    const on = key === which;
    t.setAttribute("aria-selected", String(on));
    t.classList.toggle("is-active", on);
  }

  if (which === "notes") {
    resolveScratchCanvasOnNotesOpen();
    syncNotesUiFromState();
    requestAnimationFrame(() => {
      fitScratchCanvas();
      wireScratchCanvasIfNeeded();
    });
  } else {
    scratchInkCurrentStroke = null;
  }

  if (which === "rules") {
    wireRulesSearchOnce();
    // Populate the ruleset picker first (settles the active ruleset), then load it.
    void populateRulesetSelector().then(() => ensureRulesIndexLoaded());
  }
}

function getActiveScratchCanvas() {
  ensureScratchCanvasesArray();
  let c = state.scratchCanvases.find((x) => x.id === state.scratchActiveCanvasId);
  if (!c && state.scratchCanvases.length) {
    c = state.scratchCanvases[0];
    state.scratchActiveCanvasId = c.id;
  }
  return c || null;
}

function createScratchCanvasForDay(dayKey) {
  const now = new Date();
  const same = state.scratchCanvases.filter((x) => x.createdDay === dayKey);
  const baseTitle = formatDefaultCanvasTitle(dayKey);
  const name = same.length === 0 ? baseTitle : `${baseTitle} (${same.length + 1})`;
  const c = normalizeScratchCanvas({
    id: uid(),
    name,
    createdDay: dayKey,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    notesText: "",
    inkStrokes: [],
    composeMode: "type",
    inkErase: false,
  });
  state.scratchCanvases.push(c);
  return c;
}

function resolveScratchCanvasOnNotesOpen() {
  ensureScratchCanvasesArray();
  const todayKey = dateToDayKey(new Date());
  let changed = false;
  if (state.scratchLastNotesVisitDay !== todayKey) {
    state.scratchLastNotesVisitDay = todayKey;
    const todays = state.scratchCanvases.filter((c) => c.createdDay === todayKey);
    if (todays.length === 0) {
      const nc = createScratchCanvasForDay(todayKey);
      state.scratchActiveCanvasId = nc.id;
    } else {
      state.scratchActiveCanvasId = [...todays].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0].id;
    }
    changed = true;
  }
  if (!getActiveScratchCanvas() && state.scratchCanvases.length === 0) {
    const nc = createScratchCanvasForDay(todayKey);
    state.scratchActiveCanvasId = nc.id;
    changed = true;
  } else if (!getActiveScratchCanvas() && state.scratchCanvases.length) {
    state.scratchActiveCanvasId = state.scratchCanvases[0].id;
    changed = true;
  }
  if (changed) saveState();
}

function refreshScratchCanvasSelect() {
  const sel = document.getElementById("scratchCanvasSelect");
  if (!sel) return;
  const sorted = [...state.scratchCanvases].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  sel.innerHTML = "";
  for (const c of sorted) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  }
  const valid = sorted.some((c) => c.id === state.scratchActiveCanvasId);
  const fall = sorted[0]?.id ?? "";
  if (!valid && fall) state.scratchActiveCanvasId = fall;
  if (fall) sel.value = state.scratchActiveCanvasId;
}

function wireScratchCanvasSelectOnce() {
  const sel = document.getElementById("scratchCanvasSelect");
  if (!sel || sel.dataset.wired) return;
  sel.dataset.wired = "1";
  sel.addEventListener("change", () => {
    state.scratchActiveCanvasId = sel.value;
    scratchInkCurrentStroke = null;
    saveState();
    syncNotesUiFromState();
    requestAnimationFrame(() => fitScratchCanvas());
  });
}

function syncNotesUiFromState() {
  refreshScratchCanvasSelect();
  const sel = document.getElementById("scratchCanvasSelect");
  if (sel && state.scratchActiveCanvasId) sel.value = state.scratchActiveCanvasId;

  const c = getActiveScratchCanvas();
  const ta = document.getElementById("scratchNotesTextarea");
  if (ta) {
    const next = c?.notesText ?? "";
    if (ta.value !== next) ta.value = next;
  }
  const mode = c?.composeMode === "ink" ? "ink" : "type";
  applyNotesComposeMode(mode, false);
  syncInkPenEraseUi();
  redrawScratchCanvas();
}

function readInkStyleFromToolbar() {
  const c = document.getElementById("inkColor");
  const w = document.getElementById("inkWidth");
  return {
    color: c?.value || "#1a1a1a",
    width: Math.max(1, parseInt(w?.value, 10) || 4),
  };
}

/** Eraser end of stylus, or barrel button (varies by device / browser). */
function pointerUsesEraseInput(e) {
  if (e.pointerType === "eraser") return true;
  if (e.pointerType === "pen") {
    if (e.button === 5) return true;
    if ((e.buttons & 32) === 32) return true;
  }
  return false;
}

function syncInkPenEraseUi() {
  const erase = !!getActiveScratchCanvas()?.inkErase;
  document.getElementById("btnInkPen")?.setAttribute("aria-pressed", String(!erase));
  document.getElementById("btnInkErase")?.setAttribute("aria-pressed", String(erase));
  document.getElementById("btnInkPen")?.classList.toggle("ghost", erase);
  document.getElementById("btnInkErase")?.classList.toggle("ghost", !erase);
}

function setScratchInkEraseMode(erase, persist) {
  const c = getActiveScratchCanvas();
  if (!c) return;
  c.inkErase = !!erase;
  syncInkPenEraseUi();
  const isInk = c.composeMode === "ink";
  const colorEl = document.getElementById("inkColor");
  if (colorEl) {
    colorEl.toggleAttribute("disabled", !isInk || c.inkErase);
    const lab = colorEl.closest(".notes-tool");
    if (lab) lab.style.opacity = !isInk || c.inkErase ? "0.5" : "1";
  }
  if (persist) {
    c.updatedAt = new Date().toISOString();
    saveState();
    refreshScratchCanvasSelect();
  }
}

function applyNotesComposeMode(mode, persist) {
  const c = getActiveScratchCanvas();
  if (!c) return;
  c.composeMode = mode === "ink" ? "ink" : "type";
  const isInk = c.composeMode === "ink";
  const ta = document.getElementById("scratchNotesTextarea");
  const cv = document.getElementById("scratchInkCanvas");
  document.getElementById("btnNotesType")?.setAttribute("aria-pressed", String(!isInk));
  document.getElementById("btnNotesInk")?.setAttribute("aria-pressed", String(isInk));
  document.getElementById("btnNotesType")?.classList.toggle("ghost", isInk);
  document.getElementById("btnNotesInk")?.classList.toggle("ghost", !isInk);
  if (ta) {
    ta.style.pointerEvents = isInk ? "none" : "auto";
  }
  if (cv) {
    cv.hidden = !isInk;
  }
  document.querySelectorAll("#inkColor, #inkWidth").forEach((el) => {
    const colorLocked = el.id === "inkColor" && c.inkErase;
    el.toggleAttribute("disabled", !isInk || colorLocked);
  });
  document.getElementById("btnInkPen")?.toggleAttribute("disabled", !isInk);
  document.getElementById("btnInkErase")?.toggleAttribute("disabled", !isInk);
  document.getElementById("btnInkClear")?.toggleAttribute("disabled", !isInk);
  syncInkPenEraseUi();
  const colorEl = document.getElementById("inkColor");
  if (colorEl) {
    const lab = colorEl.closest(".notes-tool");
    if (lab) lab.style.opacity = !isInk || c.inkErase ? "0.5" : "1";
  }
  if (persist) {
    c.updatedAt = new Date().toISOString();
    saveState();
    refreshScratchCanvasSelect();
  }
  if (isInk) requestAnimationFrame(() => fitScratchCanvas());
}

function bindScratchNotesField() {
  scratchNotesBindingsAbort?.abort();
  scratchNotesBindingsAbort = new AbortController();
  const { signal } = scratchNotesBindingsAbort;
  const ta = document.getElementById("scratchNotesTextarea");
  if (!ta) return;
  const cur = getActiveScratchCanvas();
  ta.value = cur?.notesText ?? "";
  ta.addEventListener(
    "input",
    () => {
      const page = getActiveScratchCanvas();
      if (!page) return;
      page.notesText = ta.value;
      page.updatedAt = new Date().toISOString();
      saveState();
    },
    { signal }
  );
}

function scratchCanvasCoords(e, canvas) {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
}

function drawStroke(ctx, stroke) {
  if (!stroke?.points?.length) return;
  const w = Math.max(1, stroke.width || 3);
  const erase = !!stroke.erase;
  ctx.save();
  if (erase) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.fillStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color || "#1a1a1a";
    ctx.fillStyle = stroke.color || "#1a1a1a";
  }
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (stroke.points.length === 1) {
    const p = stroke.points[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function redrawScratchCanvas(partialStroke) {
  const canvas = document.getElementById("scratchInkCanvas");
  if (!canvas?.getContext) return;
  const ctx = canvas.getContext("2d");
  const page = getActiveScratchCanvas();
  const strokes = page?.inkStrokes ?? [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of strokes) {
    drawStroke(ctx, s);
  }
  if (partialStroke?.points?.length) {
    drawStroke(ctx, partialStroke);
  }
}

function fitScratchCanvas() {
  const canvas = document.getElementById("scratchInkCanvas");
  const pageEl = document.getElementById("notesPage");
  if (!canvas || !pageEl || canvas.hidden) return;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(32, Math.floor(pageEl.clientWidth * dpr));
  const h = Math.max(32, Math.floor(pageEl.clientHeight * dpr));
  const page = getActiveScratchCanvas();
  if (page?.inkStrokes?.length && page.inkCanvasW > 0 && page.inkCanvasH > 0) {
    if (page.inkCanvasW !== w || page.inkCanvasH !== h) {
      scratchInkCurrentStroke = null;
      const sx = w / page.inkCanvasW;
      const sy = h / page.inkCanvasH;
      scaleScratchInkStrokesForResize(page, sx, sy);
      page.inkCanvasW = w;
      page.inkCanvasH = h;
      page.updatedAt = new Date().toISOString();
      saveState();
    }
  } else if (page && (!page.inkStrokes?.length || !(page.inkCanvasW > 0))) {
    page.inkCanvasW = w;
    page.inkCanvasH = h;
  }
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  redrawScratchCanvas(scratchInkCurrentStroke);
}

function wireScratchCanvasIfNeeded() {
  const canvas = document.getElementById("scratchInkCanvas");
  if (!canvas || canvas.dataset.scratchInkWired) return;
  canvas.dataset.scratchInkWired = "1";

  canvas.addEventListener("pointerdown", (e) => {
    const page = getActiveScratchCanvas();
    if (!page || page.composeMode !== "ink") return;
    if (e.button === 2) return;
    e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const useErase = pointerUsesEraseInput(e) || page.inkErase === true;
    const base = readInkStyleFromToolbar();
    const pr = typeof e.pressure === "number" && e.pressure > 0 ? e.pressure : 0.5;
    const penWidth = Math.max(1, Math.round(base.width * (0.3 + pr * 1.2)));
    /** Erase uses same slider as a baseline, then scales up (canvas pixels / DPR). */
    const ERASE_MIN = 20;
    const ERASE_MULT = 4.5;
    const width = useErase ? Math.max(ERASE_MIN, Math.round(penWidth * ERASE_MULT)) : penWidth;
    scratchInkCurrentStroke = {
      erase: useErase,
      color: useErase ? "#000000" : base.color,
      width,
      points: [scratchCanvasCoords(e, canvas)],
      _pid: e.pointerId,
    };
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!scratchInkCurrentStroke || scratchInkCurrentStroke._pid !== e.pointerId) return;
    e.preventDefault();
    scratchInkCurrentStroke.points.push(scratchCanvasCoords(e, canvas));
    redrawScratchCanvas(scratchInkCurrentStroke);
  });

  const endInk = (e) => {
    if (!scratchInkCurrentStroke || scratchInkCurrentStroke._pid !== e.pointerId) return;
    e.preventDefault();
    const { _pid, ...rest } = scratchInkCurrentStroke;
    scratchInkCurrentStroke = null;
    const page = getActiveScratchCanvas();
    if (page && rest.points?.length) {
      page.inkStrokes.push(rest);
      const cEl = document.getElementById("scratchInkCanvas");
      if (cEl) {
        page.inkCanvasW = cEl.width;
        page.inkCanvasH = cEl.height;
      }
      page.updatedAt = new Date().toISOString();
      saveState();
      refreshScratchCanvasSelect();
    }
    redrawScratchCanvas();
  };

  canvas.addEventListener("pointerup", endInk);
  canvas.addEventListener("pointercancel", endInk);
  canvas.addEventListener("lostpointercapture", endInk);
}

function setupNotesPageResizeObserver() {
  const page = document.getElementById("notesPage");
  if (!page || notesPageResizeObserver) return;
  notesPageResizeObserver = new ResizeObserver(() => {
    const notes = document.getElementById("viewNotes");
    if (notes && !notes.classList.contains("is-hidden")) fitScratchCanvas();
  });
  notesPageResizeObserver.observe(page);
}

/** Max height before scrolling; scales with viewport. */
function textareaAutosizeMaxPx() {
  return Math.max(280, Math.round(window.innerHeight * 0.65));
}

function sizeTextareaToContent(textarea) {
  if (!textarea || textarea.tagName !== "TEXTAREA") return;
  textarea.classList.add("textarea-autosize");
  const maxPx = textareaAutosizeMaxPx();
  textarea.style.overflow = "hidden";
  textarea.style.height = "auto";
  const natural = textarea.scrollHeight;
  if (natural > maxPx) {
    textarea.style.height = `${maxPx}px`;
    textarea.style.overflowY = "auto";
  } else {
    textarea.style.height = `${natural}px`;
    textarea.style.overflowY = "hidden";
  }
}

let textareaAutosizeResizeTimer;
function flushAutosizeTextareas() {
  document.querySelectorAll("textarea.textarea-autosize").forEach(sizeTextareaToContent);
}

/**
 * Grow/shrink with content. Uses one input listener per element (stable across bindFields for static fields).
 */
function wireTextareaAutosize(textarea) {
  if (!textarea || textarea.tagName !== "TEXTAREA") return;
  textarea.classList.add("textarea-autosize");
  const bump = () => sizeTextareaToContent(textarea);
  if (!textarea.dataset.cosmereAutosize) {
    textarea.dataset.cosmereAutosize = "1";
    textarea.addEventListener("input", bump);
  }
  requestAnimationFrame(() => requestAnimationFrame(bump));
}

function activityLabel(value) {
  return ACTIVITY_TYPES.find((t) => t.value === value)?.label ?? value;
}

function isTriggeredType(type) {
  return type === "reaction";
}

function bindFields() {
  fieldBindingsAbort?.abort();
  fieldBindingsAbort = new AbortController();
  const { signal } = fieldBindingsAbort;

  const on = (el, ev, fn) => el.addEventListener(ev, fn, { signal });

  /** Simple text/number input bound to a state key; refreshes the play strip on change. */
  const bindSimple = (id, key, refreshStrip = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = state[key] ?? "";
    on(el, "input", () => {
      state[key] = el.value;
      saveState();
      if (refreshStrip) renderPlayResourceStrip();
    });
  };

  // Text/number fields that map 1:1 to a state key with no side effect.
  const SIMPLE_FIELDS = [
    "characterName", "level", "playerName", "paths", "ancestry",
    "recoveryDie", "deflect", "movement", "sensesRange", "liftingCapacity",
    "weapons", "expertises", "conditions",
    "appearance", "equipment", "marks", "purpose", "obstacle", "goals",
    "connections", "otherAbilities", "characterNotes",
    "radiantOrder", "sprenName", "sprenPersonality", "sprenBondRange",
    "ideals", "surgesNotes", "resourceNotes", "passiveNotes",
  ];
  for (const id of SIMPLE_FIELDS) bindSimple(id, id);

  // Resource pools refresh the play strip on change.
  for (const id of ["healthCurrent", "healthMax", "focusCurrent", "focusMax", "investitureCurrent", "investitureMax"]) {
    bindSimple(id, id, true);
  }

  // Defenses refresh the play strip and the computed-vs-manual hints.
  for (const d of DEFENSES) {
    const el = document.getElementById(d.field);
    if (!el) continue;
    el.value = state[d.field] ?? "";
    on(el, "input", () => {
      state[d.field] = el.value;
      saveState();
      renderPlayResourceStrip();
    });
  }

  document.querySelectorAll("#viewSheet textarea.textarea-autosize").forEach(wireTextareaAutosize);
  updateDerivedHints();
}

/** Reads an attribute's numeric value, or null if blank/invalid. */
function attrVal(key) {
  return parseOptionalInt(state.attrs?.[key]);
}

/** 10 + sum of the two governing attributes, or null if either is unset. */
function computedDefense(def) {
  const vals = def.parts.map(attrVal);
  if (vals.some((v) => v == null)) return null;
  return 10 + vals.reduce((a, b) => a + b, 0);
}

/** Manual defense entry wins; otherwise fall back to the attribute formula. */
function effectiveDefense(def) {
  const manual = parseOptionalInt(state[def.field]);
  return manual != null ? manual : computedDefense(def);
}

/**
 * Refreshes "auto" placeholders (defenses, Health/Focus maxima) and the
 * attribute + rank total beside each skill, from the current attribute values.
 */
function updateDerivedHints() {
  for (const d of DEFENSES) {
    const el = document.getElementById(d.field);
    if (!el) continue;
    const c = computedDefense(d);
    el.placeholder = c != null ? `${c} (auto)` : `10+${d.parts.join("+")}`;
  }
  const str = attrVal("STR");
  const hm = document.getElementById("healthMax");
  if (hm) hm.placeholder = str != null ? `${10 + str} (auto)` : "max (10+STR)";
  const wil = attrVal("WIL");
  const fm = document.getElementById("focusMax");
  if (fm) fm.placeholder = wil != null ? `${2 + wil} (auto)` : "max (2+WIL)";

  document.querySelectorAll("[data-skill-total]").forEach((el) => {
    const sk = SKILLS.find((s) => s.name === el.getAttribute("data-skill-total"));
    if (!sk) return;
    const a = attrVal(sk.attr);
    const r = parseOptionalInt(state.skills?.[sk.name]);
    el.textContent = a != null && r != null ? `+${a + r}` : "";
  });
}

/** Builds the attribute inputs, grouped by category, bound to state.attrs. */
function renderAttributes() {
  const root = document.getElementById("attrGrid");
  if (!root) return;
  if (!state.attrs || typeof state.attrs !== "object") state.attrs = {};
  root.innerHTML = "";
  for (const cat of ["Physical", "Cognitive", "Spiritual"]) {
    const col = document.createElement("div");
    col.className = "attr-col";
    const h = document.createElement("h3");
    h.className = "subhead";
    h.textContent = cat;
    col.appendChild(h);
    for (const at of ATTRIBUTES.filter((a) => a.cat === cat)) {
      const lab = document.createElement("label");
      lab.className = "attr-row";
      const name = document.createElement("span");
      name.className = "attr-name";
      name.textContent = `${at.name} (${at.key})`;
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.max = "5";
      inp.step = "1";
      inp.placeholder = "0";
      inp.value = state.attrs[at.key] ?? "";
      inp.addEventListener("input", () => {
        state.attrs[at.key] = inp.value;
        saveState();
        updateDerivedHints();
        renderPlayResourceStrip();
      });
      lab.appendChild(name);
      lab.appendChild(inp);
      col.appendChild(lab);
    }
    root.appendChild(col);
  }
}

/** Builds the skill rows (name · attr · rank · total), grouped by category. */
function renderSkills() {
  const root = document.getElementById("skillsGrid");
  if (!root) return;
  if (!state.skills || typeof state.skills !== "object") state.skills = {};
  root.innerHTML = "";
  const catOf = (attr) => ATTRIBUTES.find((a) => a.key === attr)?.cat;
  for (const cat of ["Physical", "Cognitive", "Spiritual"]) {
    const col = document.createElement("div");
    col.className = "skill-col";
    const h = document.createElement("h3");
    h.className = "subhead";
    h.textContent = cat;
    col.appendChild(h);
    for (const sk of SKILLS.filter((s) => catOf(s.attr) === cat)) {
      const row = document.createElement("label");
      row.className = "skill-row";
      const name = document.createElement("span");
      name.className = "skill-name";
      name.textContent = sk.name;
      const attr = document.createElement("span");
      attr.className = "skill-attr";
      attr.textContent = sk.attr;
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.max = "5";
      inp.step = "1";
      inp.className = "skill-rank";
      inp.placeholder = "0";
      inp.value = state.skills[sk.name] ?? "";
      const total = document.createElement("span");
      total.className = "skill-total";
      total.setAttribute("data-skill-total", sk.name);
      inp.addEventListener("input", () => {
        state.skills[sk.name] = inp.value;
        saveState();
        updateDerivedHints();
      });
      row.appendChild(name);
      row.appendChild(attr);
      row.appendChild(inp);
      row.appendChild(total);
      col.appendChild(row);
    }
    root.appendChild(col);
  }
  updateDerivedHints();
}

function parseOptionalInt(s) {
  const n = parseInt(String(s).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function syncStateInput(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function appendFixedResourceBar(parent, { label, curKey, maxKey }) {
  const bar = document.createElement("div");
  bar.className = "resource-track-bar";

  const nameEl = document.createElement("span");
  nameEl.className = "name";
  nameEl.textContent = label;
  bar.appendChild(nameEl);

  const displayCur = parseOptionalInt(state[curKey]) ?? 0;
  let trackText;
  if (maxKey != null) {
    const maxParsed = parseOptionalInt(state[maxKey]);
    trackText = `${displayCur}${maxParsed != null ? ` / ${maxParsed}` : " / —"}`;
  } else {
    trackText = String(displayCur);
  }

  const t = document.createElement("span");
  t.className = "track";
  t.textContent = trackText;
  bar.appendChild(t);

  const minus = document.createElement("button");
  minus.type = "button";
  minus.className = "btn tiny";
  minus.textContent = "−";
  minus.addEventListener("click", () => {
    const base = parseOptionalInt(state[curKey]) ?? 0;
    state[curKey] = String(Math.max(0, base - 1));
    syncStateInput(curKey, state[curKey]);
    saveState();
    renderPlayResourceStrip();
  });
  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "btn tiny";
  plus.textContent = "+";
  plus.addEventListener("click", () => {
    const base = parseOptionalInt(state[curKey]) ?? 0;
    const cap = maxKey ? parseOptionalInt(state[maxKey]) : null;
    const next = base + 1;
    state[curKey] = String(cap != null ? Math.min(next, cap) : next);
    syncStateInput(curKey, state[curKey]);
    saveState();
    renderPlayResourceStrip();
  });
  bar.appendChild(minus);
  bar.appendChild(plus);

  parent.appendChild(bar);
}

function renderPlayResourceStrip() {
  const panel = document.getElementById("panelReminders");
  const playMode = document.body.classList.contains("play-mode");
  let strip = document.getElementById("playResourceStrip");

  if (!panel) {
    if (strip) strip.remove();
    return;
  }

  const h2 = panel.querySelector("h2");

  if (!playMode) {
    if (strip) strip.remove();
    return;
  }

  if (!strip) {
    strip = document.createElement("div");
    strip.id = "playResourceStrip";
    strip.className = "resource-strip play-only-inline";
    if (h2) h2.insertAdjacentElement("afterend", strip);
    else panel.prepend(strip);
  }

  strip.replaceChildren();

  for (const row of RESOURCE_PLAY_ROWS) {
    appendFixedResourceBar(strip, row);
  }

  if (DEFENSES.some((d) => effectiveDefense(d) != null)) {
    const defRow = document.createElement("div");
    defRow.className = "resource-track-bar defense-bar";
    const label = document.createElement("span");
    label.className = "name";
    label.textContent = "Defenses";
    defRow.appendChild(label);
    for (const d of DEFENSES) {
      const v = effectiveDefense(d);
      const chip = document.createElement("span");
      chip.className = "def-chip";
      chip.textContent = `${d.label[0]} ${v != null ? v : "—"}`;
      chip.title = `${d.label} defense`;
      defRow.appendChild(chip);
    }
    strip.appendChild(defRow);
  }
}

function sortAbilities(list) {
  const order = { "1a": 0, "2a": 1, "3a": 2, reaction: 3, free: 4, passive: 5, other: 6 };
  return [...list].sort((a, b) => {
    const oa = order[a.activity] ?? 99;
    const ob = order[b.activity] ?? 99;
    if (oa !== ob) return oa - ob;
    return (a.name || "").localeCompare(b.name || "");
  });
}

function renderAbilities() {
  const root = document.getElementById("abilityList");
  if (!root) return;
  root.innerHTML = "";
  const playMode = document.body.classList.contains("play-mode");

  const sorted = sortAbilities(state.abilities);
  if (sorted.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = playMode
      ? "No abilities yet. Turn off Play mode and tap “Add ability”."
      : "List the actions, reactions, and passives you reach for: general combat actions plus your path/order talents. Use the Reference tab to look up the local mechanics, then jot a terse note here.";
    root.appendChild(empty);
    return;
  }

  for (const ab of sorted) {
    root.appendChild(playMode ? renderPlayCard(ab) : renderEditCard(ab));
  }

  if (!playMode) {
    root.querySelectorAll("textarea").forEach(wireTextareaAutosize);
  }
}

function renderPlayCard(ab) {
  const wrap = document.createElement("article");
  wrap.className = "card";
  if (ab.usedThisRound && ab.nonFreeTriggered) wrap.classList.add("used-round");

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = ab.name || "(unnamed)";

  const badge = document.createElement("span");
  badge.className = "badge" + (isTriggeredType(ab.activity) ? " triggered" : "");
  badge.textContent = activityLabel(ab.activity);

  header.appendChild(title);
  header.appendChild(badge);
  wrap.appendChild(header);

  const metaParts = [];
  if (ab.cost) metaParts.push(`Cost: ${ab.cost}`);
  if (ab.rangeTargets) metaParts.push(ab.rangeTargets);
  if (metaParts.length) {
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = metaParts.join(" · ");
    wrap.appendChild(meta);
  }

  if (ab.trigger) {
    const tr = document.createElement("div");
    tr.className = "trigger-line";
    tr.textContent = ab.trigger;
    wrap.appendChild(tr);
  }

  if (ab.notes) {
    const notes = document.createElement("p");
    notes.className = "notes";
    notes.textContent = ab.notes;
    wrap.appendChild(notes);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  if (ab.nonFreeTriggered) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn" + (ab.usedThisRound ? " ghost" : "");
    btn.textContent = ab.usedThisRound ? "Reaction used this round" : "Mark used (uses your reaction)";
    btn.addEventListener("click", () => {
      ab.usedThisRound = !ab.usedThisRound;
      saveState();
      renderAbilities();
    });
    actions.appendChild(btn);
  }

  if (actions.childElementCount) wrap.appendChild(actions);

  return wrap;
}

function renderEditCard(ab) {
  const wrap = document.createElement("article");
  wrap.className = "card edit-form";

  const row1 = document.createElement("div");
  row1.className = "row";

  const nameLab = document.createElement("label");
  nameLab.innerHTML = "Name";
  const nameIn = document.createElement("input");
  nameIn.type = "text";
  nameIn.value = ab.name;
  nameIn.placeholder = "Ability name";
  nameLab.appendChild(nameIn);

  const typeLab = document.createElement("label");
  typeLab.innerHTML = "Activity";
  const typeSel = document.createElement("select");
  for (const t of ACTIVITY_TYPES) {
    const opt = document.createElement("option");
    opt.value = t.value;
    opt.textContent = t.label;
    typeSel.appendChild(opt);
  }
  typeSel.value = ab.activity;
  typeLab.appendChild(typeSel);

  row1.appendChild(nameLab);
  row1.appendChild(typeLab);

  const row2 = document.createElement("div");
  row2.className = "row";

  const costLab = document.createElement("label");
  costLab.innerHTML = "Cost (optional)";
  const costIn = document.createElement("input");
  costIn.type = "text";
  costIn.value = ab.cost;
  costIn.placeholder = "Resource spend, e.g. 1F (Focus), 1I (Investiture), or blank";
  costLab.appendChild(costIn);

  const rtLab = document.createElement("label");
  rtLab.innerHTML = "Range & targets (optional)";
  const rtIn = document.createElement("input");
  rtIn.type = "text";
  rtIn.value = ab.rangeTargets;
  rtIn.placeholder = "reach, melee, N ft, self · vs Physical/Cognitive/Spiritual";
  rtLab.appendChild(rtIn);

  row2.appendChild(costLab);
  row2.appendChild(rtLab);

  const trigLab = document.createElement("label");
  trigLab.innerHTML = "Trigger (for reactions)";
  const trigIn = document.createElement("input");
  trigIn.type = "text";
  trigIn.value = ab.trigger;
  trigIn.placeholder = "When the trigger event occurs (one reaction per round)";
  trigLab.appendChild(trigIn);

  const notesLab = document.createElement("label");
  notesLab.innerHTML = "Combat notes (short)";
  const notesIn = document.createElement("textarea");
  notesIn.value = ab.notes;
  notesIn.placeholder = "Terse mechanics: dice, damage type, conditions applied, duration (EONT/SONT), riders";
  notesLab.appendChild(notesIn);

  const checkWrap = document.createElement("label");
  checkWrap.className = "check";
  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = !!ab.nonFreeTriggered;
  checkWrap.appendChild(check);
  checkWrap.appendChild(document.createTextNode("Uses your reaction (one per round)"));

  const formActions = document.createElement("div");
  formActions.className = "form-actions";

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn danger ghost small";
  del.textContent = "Remove";
  del.addEventListener("click", () => {
    state.abilities = state.abilities.filter((x) => x.id !== ab.id);
    saveState();
    renderAbilities();
  });

  formActions.appendChild(del);

  const commit = () => {
    ab.name = nameIn.value;
    ab.activity = typeSel.value;
    ab.cost = costIn.value;
    ab.rangeTargets = rtIn.value;
    ab.trigger = trigIn.value;
    ab.notes = notesIn.value;
    ab.nonFreeTriggered = check.checked;
    if (!ab.nonFreeTriggered) ab.usedThisRound = false;
    saveState();
    renderAbilities();
  };

  [nameIn, typeSel, costIn, rtIn, trigIn, notesIn].forEach((el) => {
    el.addEventListener("input", commit);
    el.addEventListener("change", commit);
  });
  check.addEventListener("change", commit);

  wrap.appendChild(row1);
  wrap.appendChild(row2);
  wrap.appendChild(trigLab);
  wrap.appendChild(notesLab);
  wrap.appendChild(checkWrap);
  wrap.appendChild(formActions);

  return wrap;
}

function applyWarriorPreset() {
  // Any non-empty string field in state (every defaultState scalar is a string) counts as data.
  const hasFieldData = Object.keys(defaultState()).some(
    (k) => typeof state[k] === "string" && state[k].trim() !== ""
  );
  const hasData =
    state.abilities.length > 0 ||
    hasFieldData ||
    (state.scratchCanvases || []).some(
      (pg) =>
        (typeof pg.notesText === "string" && pg.notesText.trim() !== "") ||
        (Array.isArray(pg.inkStrokes) && pg.inkStrokes.length > 0)
    ) ||
    (state.scratchCanvases || []).length > 1;

  if (
    hasData &&
    !confirm(
      "Replace your resource fields, notes, and the entire ability list with the Warrior example? (Export JSON first if you want a backup.)"
    )
  ) {
    return;
  }

  const { abilities, ...fields } = WARRIOR_PRESET;
  Object.assign(state, fields);
  state.abilities = abilities.map((row) => ({
    id: uid(),
    name: row.name,
    activity: row.activity,
    cost: row.cost,
    rangeTargets: row.rangeTargets,
    trigger: row.trigger,
    notes: row.notes,
    nonFreeTriggered: !!row.nonFreeTriggered,
    usedThisRound: false,
  }));

  saveState();
  bindFields();
  renderAttributes();
  renderSkills();
  renderPlayResourceStrip();
  renderAbilities();
}

function addAbility() {
  state.abilities.push({
    id: uid(),
    name: "",
    activity: "1a",
    cost: "",
    rangeTargets: "",
    trigger: "",
    notes: "",
    nonFreeTriggered: false,
    usedThisRound: false,
  });
  saveState();
  renderAbilities();
}

function setPlayMode(on) {
  document.body.classList.toggle("play-mode", on);
  document.getElementById("btnPlay").setAttribute("aria-pressed", on ? "true" : "false");
  document.getElementById("btnEdit").setAttribute("aria-pressed", on ? "false" : "true");
  // Entering play mode collapses the granular sections (skills, gear, details,
  // radiant). Edit mode leaves them as the user set them, so the page can start
  // collapsed and stay that way until a section is opened.
  if (on) {
    document.querySelectorAll("#viewSheet [data-collapsible]").forEach((d) => {
      d.open = false;
    });
  }
  renderPlayResourceStrip();
  renderAbilities();
}

function resetRound() {
  for (const ab of state.abilities) {
    ab.usedThisRound = false;
  }
  saveState();
  renderAbilities();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cosmere-character.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------------------------------------------------------------------------
   Official character-sheet export
   Loads the bundled fillable Stormlight sheet (SL020), populates its AcroForm
   fields from the current character, and downloads a print-ready PDF. Uses
   pdf-lib (loaded from CDN in index.html).
   --------------------------------------------------------------------------- */
const OFFICIAL_SHEET_URL = "assets/stormlight-character-sheet.pdf";

// App attribute keys -> PDF text-field names.
const ATTR_PDF_FIELD = {
  STR: "Strength",
  SPD: "Speed",
  INT: "Intellect",
  WIL: "Willpower",
  AWA: "Awareness",
  PRE: "Presence",
};

// Most skills share the same PDF text-field and rank-checkbox names. The two
// weaponry skills differ: the modifier box reads "…Weapons" but the pip
// checkboxes read "…Weaponry".
const SKILL_PDF_OVERRIDES = {
  "Light Weaponry": { tx: "Light Weapons", rank: "Light Weaponry" },
  "Heavy Weaponry": { tx: "Heavy Weapons", rank: "Heavy Weaponry" },
};

// Ideal checkboxes as named in the PDF (note: "3rd" carries a trailing space).
const IDEAL_CHECK_FIELDS = [
  "check 1st ideal",
  "check 2nd ideal",
  "check 3rd ideal ",
  "check 4th ideal",
  "check 5th ideal",
];

function nonEmptyLines(s) {
  return String(s ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

async function fillOfficialSheet() {
  const btn = document.getElementById("btnFillSheet");
  if (typeof PDFLib === "undefined") {
    alert("The PDF library didn't load. Check your connection and reload the page.");
    return;
  }

  const prevLabel = btn ? btn.textContent : "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Building PDF…";
  }

  try {
    const res = await fetch(OFFICIAL_SHEET_URL);
    if (!res.ok) throw new Error(`Couldn't load the blank sheet (HTTP ${res.status}).`);
    const bytes = await res.arrayBuffer();

    const pdf = await PDFLib.PDFDocument.load(bytes);
    const form = pdf.getForm();
    const fieldNames = new Set(form.getFields().map((f) => f.getName()));

    // The header vitals/attributes/defenses repeat on both sheet pages, stored as
    // "<name>.Page 1" / "<name>.Page 2". Resolve a logical name to whichever
    // concrete field(s) exist so both pages get filled.
    const resolve = (name) => {
      if (fieldNames.has(name)) return [name];
      return [`${name}.Page 1`, `${name}.Page 2`].filter((n) => fieldNames.has(n));
    };

    // Field helpers — every access is guarded so one unexpected field name can't
    // abort the whole export; skips are logged for debugging.
    const setText = (name, value) => {
      const v = (value == null ? "" : String(value)).trim();
      if (!v) return;
      const targets = resolve(name);
      if (!targets.length) {
        console.warn(`Sheet field "${name}" not found; skipped.`);
        return;
      }
      for (const t of targets) {
        try {
          form.getTextField(t).setText(v);
        } catch (e) {
          console.warn(`Sheet field "${t}" skipped:`, e.message);
        }
      }
    };
    const check = (name) => {
      const targets = resolve(name);
      if (!targets.length) {
        console.warn(`Sheet checkbox "${name}" not found; skipped.`);
        return;
      }
      for (const t of targets) {
        try {
          form.getCheckBox(t).check();
        } catch (e) {
          console.warn(`Sheet checkbox "${t}" skipped:`, e.message);
        }
      }
    };

    // Vitals
    setText("Character Name", state.characterName);
    setText("Player Name", state.playerName);
    setText("Level", state.level);
    setText("Paths", state.paths);
    setText("Ancestry", state.ancestry);

    // Attributes
    for (const [key, field] of Object.entries(ATTR_PDF_FIELD)) {
      setText(field, state.attrs?.[key]);
    }

    // Defenses — manual entry wins, else the 10 + a + b formula the app shows.
    setText("Physical Defense", effectiveDefense(DEFENSES[0]));
    setText("Cognitive Defense", effectiveDefense(DEFENSES[1]));
    setText("Spiritual Defense", effectiveDefense(DEFENSES[2]));

    // Resources — fall back to the same auto maxima the app hints (10+STR, 2+WIL).
    const str = attrVal("STR");
    const wil = attrVal("WIL");
    setText("Health Maximum", state.healthMax || (str != null ? 10 + str : ""));
    setText("Health Current", state.healthCurrent);
    setText("Focus Maximum", state.focusMax || (wil != null ? 2 + wil : ""));
    setText("Focus Current", state.focusCurrent);
    setText("Investiture Maximum 4", state.investitureMax);
    setText("Investiture Current 4", state.investitureCurrent);
    setText("Recovery Die", state.recoveryDie);

    // Skills — modifier box (attribute + rank) and rank pips 1..rank.
    for (const sk of SKILLS) {
      const map = SKILL_PDF_OVERRIDES[sk.name] || { tx: sk.name, rank: sk.name };
      const a = attrVal(sk.attr);
      const r = parseOptionalInt(state.skills?.[sk.name]);
      if (a != null && r != null) setText(map.tx, a + r);
      if (r != null) {
        for (let i = 1; i <= r; i++) check(`${map.rank} Rank ${i}`);
      }
    }

    // Combat & gear
    setText("Deflect", state.deflect);
    setText("Movement", state.movement);
    setText("Senses Range", state.sensesRange);
    setText("Lifting Capacity", state.liftingCapacity);
    setText("Weapons", state.weapons);
    setText("Expertises 1", state.expertises);
    setText("Conditions", state.conditions);

    // Character details
    setText("Character Appearance", state.appearance);
    setText("Armor & Equipment", state.equipment);
    setText("Spheres", state.marks);
    setText("Purpose", state.purpose);
    setText("Obstacle", state.obstacle);
    setText("Connections", state.connections);

    // Goals — one per line into Goal 1..9.
    nonEmptyLines(state.goals)
      .slice(0, 9)
      .forEach((g, i) => setText(`Goal ${i + 1}`, g));

    // Talents boxes carry the ability list plus any freeform "other" talents,
    // spread across the three boxes so long lists don't clip.
    const abilityLines = sortAbilities(state.abilities).map((ab) => {
      const head = [ab.name || "(unnamed)", `[${activityLabel(ab.activity)}]`];
      if (ab.cost) head.push(`cost ${ab.cost}`);
      const tail = [ab.rangeTargets, ab.trigger, ab.notes].filter(Boolean).join(" · ");
      return tail ? `${head.join(" ")} — ${tail}` : head.join(" ");
    });
    const talentLines = [...nonEmptyLines(state.otherAbilities), ...abilityLines];
    const perBox = Math.ceil(talentLines.length / 3);
    ["Talents 1", "Talents 2", "Talents 3"].forEach((field, i) => {
      const chunk = perBox ? talentLines.slice(i * perBox, (i + 1) * perBox) : [];
      if (chunk.length) setText(field, chunk.join("\n"));
    });

    // Notes box — character notes plus the app-only reminder fields, which have
    // no dedicated slot on the official sheet, each labeled so nothing is lost.
    const noteBlocks = [];
    if (String(state.characterNotes ?? "").trim()) noteBlocks.push(state.characterNotes.trim());
    if (String(state.resourceNotes ?? "").trim()) noteBlocks.push(`Resources: ${state.resourceNotes.trim()}`);
    if (String(state.passiveNotes ?? "").trim()) noteBlocks.push(`Passives: ${state.passiveNotes.trim()}`);
    setText("Notes", noteBlocks.join("\n\n"));

    // Radiant
    setText("Radiant Order", state.radiantOrder);
    setText("Spren Name", state.sprenName);
    setText("Personality", state.sprenPersonality);
    setText("Spren Bond Range", state.sprenBondRange);

    // Ideals — the 1st Ideal is preprinted (checkbox only); remaining lines fill
    // the 2nd..5th Ideal boxes and tick their checkboxes.
    const ideals = nonEmptyLines(state.ideals);
    const idealFields = ["2nd Ideal", "3rd Ideal", "4th Ideal", "5th Ideal"];
    if (ideals.length) check(IDEAL_CHECK_FIELDS[0]);
    ideals.slice(0, 4).forEach((line, i) => {
      setText(idealFields[i], line);
      check(IDEAL_CHECK_FIELDS[i + 1]);
    });
    setText("Surge Talents", state.surgesNotes);

    // A few of the sheet's boxes are rich-text fields; pdf-lib can't regenerate
    // appearances for those when saving, so downgrade every text field to plain
    // text first (harmless for fields we filled).
    for (const f of form.getFields()) {
      if (typeof f.disableRichFormatting === "function") {
        try {
          f.disableRichFormatting();
        } catch (e) {
          console.warn(`Could not plain-text "${f.getName()}":`, e.message);
        }
      }
    }

    const out = await pdf.save();
    const base =
      (state.characterName || "cosmere-character")
        .trim()
        .replace(/[^\w.-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "cosmere-character";
    const blob = new Blob([out], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${base}-sheet.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    console.error(e);
    alert(`Could not build the character sheet PDF.\n\n${e.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  }
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const importHadInkLayout = Object.prototype.hasOwnProperty.call(data, "scratchInkLayout");
      state = { ...defaultState(), ...data, abilities: Array.isArray(data.abilities) ? data.abilities : [] };
      migrateLegacyScratchToCanvases(state);
      if (!importHadInkLayout) {
        migrateScratchInkDoubleCanvasHeight(state);
        state.scratchInkLayout = 2;
      }
      saveState();
      bindFields();
      bindScratchNotesField();
      syncNotesUiFromState();
      renderAttributes();
      renderSkills();
      renderPlayResourceStrip();
      renderAbilities();
    } catch {
      alert("Could not read that JSON file.");
    }
  };
  reader.readAsText(file);
}

document.getElementById("btnAddAbility").addEventListener("click", addAbility);
document.getElementById("btnWarriorPreset").addEventListener("click", applyWarriorPreset);
document.getElementById("btnPlay").addEventListener("click", () => setPlayMode(true));
document.getElementById("btnEdit").addEventListener("click", () => setPlayMode(false));
document.getElementById("btnResetRound").addEventListener("click", resetRound);
document.getElementById("btnFillSheet").addEventListener("click", () => void fillOfficialSheet());
document.getElementById("btnChooseBackup").addEventListener("click", () => void chooseBackupFile());
document.getElementById("btnStopBackup").addEventListener("click", () => void stopBackupFile());
document.getElementById("btnDownloadOnce").addEventListener("click", exportJson);
document.getElementById("importFile").addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) importJson(f);
  e.target.value = "";
});

window.addEventListener("resize", () => {
  clearTimeout(textareaAutosizeResizeTimer);
  textareaAutosizeResizeTimer = setTimeout(() => {
    flushAutosizeTextareas();
    const notes = document.getElementById("viewNotes");
    if (notes && !notes.classList.contains("is-hidden")) fitScratchCanvas();
  }, 120);
});

document.getElementById("tabSheet")?.addEventListener("click", () => setAppView("sheet"));
document.getElementById("tabNotes")?.addEventListener("click", () => setAppView("notes"));
document.getElementById("tabRules")?.addEventListener("click", () => setAppView("rules"));
document.getElementById("btnRulesSearch")?.addEventListener("click", () => void runRulesSearch());
document.getElementById("btnRulesRefreshIndex")?.addEventListener("click", () => refreshRulesIndex());
document.getElementById("rulesSearchInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") void runRulesSearch();
});
document.getElementById("rulesSearchInput")?.addEventListener("input", () => {
  if (rulesRecords?.length) void runRulesSearch();
});
document.getElementById("btnNotesType")?.addEventListener("click", () => applyNotesComposeMode("type", true));
document.getElementById("btnNotesInk")?.addEventListener("click", () => applyNotesComposeMode("ink", true));
document.getElementById("btnInkPen")?.addEventListener("click", () => setScratchInkEraseMode(false, true));
document.getElementById("btnInkErase")?.addEventListener("click", () => setScratchInkEraseMode(true, true));
document.getElementById("btnInkClear")?.addEventListener("click", () => {
  const page = getActiveScratchCanvas();
  if (!page?.inkStrokes?.length) return;
  if (!confirm("Erase all ink on this page?")) return;
  page.inkStrokes = [];
  page.updatedAt = new Date().toISOString();
  saveState();
  refreshScratchCanvasSelect();
  redrawScratchCanvas();
});

document.getElementById("btnNewScratchCanvas")?.addEventListener("click", () => {
  ensureScratchCanvasesArray();
  const dayKey = dateToDayKey(new Date());
  const nc = createScratchCanvasForDay(dayKey);
  state.scratchActiveCanvasId = nc.id;
  scratchInkCurrentStroke = null;
  saveState();
  syncNotesUiFromState();
  requestAnimationFrame(() => fitScratchCanvas());
});

document.getElementById("btnRenameScratchCanvas")?.addEventListener("click", () => {
  const page = getActiveScratchCanvas();
  if (!page) return;
  const next = prompt("Page name", page.name);
  if (next == null) return;
  const trimmed = next.trim();
  if (!trimmed) return;
  page.name = trimmed;
  page.updatedAt = new Date().toISOString();
  saveState();
  refreshScratchCanvasSelect();
  syncNotesUiFromState();
});

document.getElementById("btnDeleteScratchCanvas")?.addEventListener("click", () => {
  ensureScratchCanvasesArray();
  if (state.scratchCanvases.length <= 1) {
    alert("Keep at least one page.");
    return;
  }
  const page = getActiveScratchCanvas();
  if (!page) return;
  if (!confirm(`Delete “${page.name}”? This cannot be undone.`)) return;
  state.scratchCanvases = state.scratchCanvases.filter((x) => x.id !== page.id);
  state.scratchActiveCanvasId = state.scratchCanvases[0]?.id ?? "";
  scratchInkCurrentStroke = null;
  saveState();
  syncNotesUiFromState();
  requestAnimationFrame(() => fitScratchCanvas());
});

bindFields();
renderAttributes();
renderSkills();
bindScratchNotesField();
wireScratchCanvasSelectOnce();
wireRulesSearchOnce();
setupNotesPageResizeObserver();
syncNotesUiFromState();
setPlayMode(false);
void initBackupFileHandle();
