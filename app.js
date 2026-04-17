/**
 * Local-only combat reminder sheet for Draw Steel characters.
 */

const STORAGE_KEY = "drawSteelAbilityHelper.v1";

/**
 * One-click Conduit sheet aligned to the class quick build in `data-md-main/Rules/Classes/Conduit.md`
 * and 1st-level ability files under `data-md-main/Rules/Abilities/Conduit/…` (Steel Compendium data-md).
 * In Edit mode you can swap domains, signatures, or Word of Judgment vs Word of Guidance per the Heroes book.
 */
const CONDUIT_PRESET = {
  heroicName: "Piety",
  heroicCurrent: "",
  victoryNotes:
    "Piety (combat): At the start of an encounter, gain piety equal to your Victories. At the start of each of your turns, gain 1d3 piety. Before that roll you may pray (no action) for extra piety or a domain prayer effect on a 3 — on a 1 you also take 1d6 + level psychic damage that can't be reduced. You lose remaining piety when the encounter ends.\n\nOutside combat: abilities that cost piety can be used without spending it; each can't be used again out of combat until you earn Victories or finish a respite. Unlimited-piety effects (e.g. Healing Grace) use piety as if equal to your Victories.",
  passiveNotes:
    "Quick build — Adûn; Life + Protection domains; Heal skill.\n\nPrayer of Distance — +2 bonus to the distance of your ranged magic abilities.\n\nBastion Ward — +1 bonus to saving throws.\n\nRevitalizing Ritual (Life domain) — Each time you finish a respite, choose yourself or one ally also finishing a respite: that character gains a bonus to their recovery value equal to your level until you finish another respite.",
  abilities: [
    {
      name: "Blessed Light",
      activity: "action",
      cost: "Main action · Signature (at will)",
      rangeTargets: "Ranged 10 · one creature or object",
      trigger: "",
      notes:
        "Power roll + Intuition: ≤11: 3 + I holy damage; 12–16: 5 + I holy; 17+: 8 + I holy. Effect: one ally within distance gains a number of surges equal to the tier outcome of your power roll.",
      nonFreeTriggered: false,
    },
    {
      name: "Staggering Curse",
      activity: "action",
      cost: "Main action · Signature (at will)",
      rangeTargets: "Melee 1 · one creature or object",
      trigger: "",
      notes:
        "Power roll + Intuition: ≤11: 3 + I holy damage, slide 1; 12–16: 5 + I holy, slide 2; 17+: 8 + I holy, slide 3.",
      nonFreeTriggered: false,
    },
    {
      name: "Healing Grace",
      activity: "maneuver",
      cost: "Maneuver",
      rangeTargets: "Ranged 10 · self or one ally",
      trigger: "",
      notes:
        "Effect: the target can spend a Recovery. Spend 1+ piety: for each piety, choose one — target one additional ally within distance; end one save/end-of-turn effect on a target; a prone target stands; or a target spends 1 additional Recovery.",
      nonFreeTriggered: false,
    },
    {
      name: "Ray of Wrath",
      activity: "action",
      cost: "Main action · ranged free strike",
      rangeTargets: "Ranged 10 · one creature or object",
      trigger: "",
      notes:
        "Power roll + Intuition: ≤11: 2 + I damage; 12–16: 4 + I; 17+: 6 + I. Effect: you can have this ability deal holy damage.",
      nonFreeTriggered: false,
    },
    {
      name: "Call the Thunder Down",
      activity: "action",
      cost: "Main action · 3 Piety",
      rangeTargets: "3 cube within 10 · each enemy in the area",
      trigger: "",
      notes:
        "Power roll + Intuition: ≤11: 2 sonic damage, push 1; 12–16: 3 sonic, push 2; 17+: 5 sonic, push 3. Effect: you can push each willing ally in the area the same distance, ignoring stability.",
      nonFreeTriggered: false,
    },
    {
      name: "Faith Is Our Armor",
      activity: "maneuver",
      cost: "Maneuver · 5 Piety",
      rangeTargets: "Ranged 10 · four allies (you can target yourself instead of one ally)",
      trigger: "",
      notes:
        "Power roll + Intuition: ≤11: target gains 5 temporary Stamina; 12–16: 10 temporary Stamina; 17+: 15 temporary Stamina.",
      nonFreeTriggered: false,
    },
    {
      name: "Word of Guidance",
      activity: "triggered",
      cost: "",
      rangeTargets: "Ranged 10 · one ally",
      trigger: "The target makes an ability roll for a damage-dealing ability.",
      notes: "Effect: the power roll gains an edge. Spend 1 piety: the power roll has a double edge instead.",
      nonFreeTriggered: true,
    },
    {
      name: "Revitalizing Ritual",
      activity: "other",
      cost: "",
      rangeTargets: "",
      trigger: "",
      notes:
        "Life domain 1st-level feature (exploration). Each time you finish a respite, choose yourself or one ally who is also finishing a respite: that character gains a bonus to their recovery value equal to your level until you finish another respite.",
      nonFreeTriggered: false,
    },
  ],
};

const ACTIVITY_TYPES = [
  { value: "action", label: "Action" },
  { value: "maneuver", label: "Maneuver" },
  { value: "move", label: "Move" },
  { value: "triggered", label: "Triggered" },
  { value: "free-triggered", label: "Free triggered" },
  { value: "other", label: "Other" },
];

const defaultState = () => ({
  heroicName: "",
  heroicCurrent: "",
  staminaCurrent: "",
  staminaMax: "",
  recoveriesCurrent: "",
  recoveriesMax: "",
  surgesCurrent: "",
  fateCurrent: "",
  victoriesCurrent: "",
  victoryNotes: "",
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
  { label: "Stamina", curKey: "staminaCurrent", maxKey: "staminaMax" },
  { label: "Recoveries", curKey: "recoveriesCurrent", maxKey: "recoveriesMax" },
  { label: "Surges", curKey: "surgesCurrent" },
  { label: "Fate points", curKey: "fateCurrent" },
  { label: "Victories", curKey: "victoriesCurrent" },
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
    delete merged.heroicMax;
    delete merged.surgesMax;
    delete merged.fateMax;
    delete merged.victoriesMax;
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

const IDB_NAME = "drawSteelAbilityHelper";
const IDB_VERSION = 1;
const IDB_STORE = "handles";
const BACKUP_HANDLE_KEY = "backupJson";
const RULES_DIR_HANDLE_KEY = "rulesDataMdDir";
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

async function idbSetRulesDirHandle(handle) {
  const db = await openIdb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(handle, RULES_DIR_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGetRulesDirHandle() {
  const db = await openIdb();
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const r = tx.objectStore(IDB_STORE).get(RULES_DIR_HANDLE_KEY);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return result;
}

async function idbClearRulesDirHandle() {
  const db = await openIdb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(RULES_DIR_HANDLE_KEY);
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
      suggestedName: "draw-steel-character.json",
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

const DATA_MD_REPO = "SteelCompendium/data-md";
const DATA_MD_BRANCH = "main";
const GITHUB_DATA_MD_TREE = `https://api.github.com/repos/${DATA_MD_REPO}/git/trees/${DATA_MD_BRANCH}?recursive=1`;
const DATA_MD_RAW_BASE = `https://raw.githubusercontent.com/${DATA_MD_REPO}/${DATA_MD_BRANCH}/`;
const RULES_TREE_STORAGE_KEY = "drawSteelRulesTree.v1";
const RULES_TREE_TTL_MS = 1000 * 60 * 60 * 24;
const RULES_LOCAL_BODY_SCAN_MAX_CHARS = 450000;

let rulesMdPaths = null;
let rulesIndexLoadPromise = null;
let rulesLocalDirHandle = null;
let rulesLocalFileMap = new Map();

function supportsRulesDirectoryPicker() {
  return typeof window.showDirectoryPicker === "function";
}

function rulesUsesLocalClone() {
  return rulesLocalDirHandle != null;
}

async function verifyRulesLocalPermission() {
  if (!rulesLocalDirHandle?.queryPermission) return true;
  let q = await rulesLocalDirHandle.queryPermission({ mode: "read" });
  if (q === "granted") return true;
  if (typeof rulesLocalDirHandle.requestPermission === "function") {
    q = await rulesLocalDirHandle.requestPermission({ mode: "read" });
  }
  return q === "granted";
}

function updateRulesSourceUi() {
  const btnGithub = document.getElementById("btnRulesUseGithub");
  const btnFolder = document.getElementById("btnRulesChooseFolder");
  const btnRefresh = document.getElementById("btnRulesRefreshIndex");
  const line = document.getElementById("rulesSourceLine");
  const local = rulesUsesLocalClone();
  const canPick = supportsRulesDirectoryPicker();
  if (btnGithub) btnGithub.hidden = !local;
  if (btnFolder) {
    btnFolder.hidden = !canPick;
    if (canPick) {
      btnFolder.textContent = local ? "Change local folder…" : "Local data-md folder…";
    }
  }
  if (btnRefresh) {
    btnRefresh.title = local
      ? "Re-scan the linked folder for new or removed Markdown files"
      : "Clear cached file list and re-download from GitHub";
  }
  if (line) {
    line.textContent = local
      ? "Source: linked folder on this computer (full-text search runs locally; no GitHub code-search limits)."
      : "Source: GitHub API + raw files (file list cached one day).";
  }
}

async function collectMarkdownUnder(dirHandle, basePath = "") {
  const out = [];
  for await (const [name, handle] of dirHandle.entries()) {
    const rel = basePath ? `${basePath}/${name}` : name;
    if (handle.kind === "file" && /\.md$/i.test(name)) {
      out.push({ path: rel.replace(/\\/g, "/"), handle });
    } else if (handle.kind === "directory") {
      if (name === ".git" || name === "node_modules") continue;
      out.push(...(await collectMarkdownUnder(handle, rel)));
    }
  }
  return out;
}

async function scanLocalRulesDir() {
  if (!rulesLocalDirHandle) return;
  setRulesSearchStatus("Scanning local folder for Markdown…");
  const entries = await collectMarkdownUnder(rulesLocalDirHandle);
  rulesLocalFileMap = new Map(entries.map((e) => [e.path, e.handle]));
  rulesMdPaths = entries.map((e) => e.path).sort((a, b) => a.localeCompare(b));
  setRulesSearchStatus(`Local: ${rulesMdPaths.length} Markdown file(s).`);
}

async function initRulesLocalDirHandle() {
  if (!supportsRulesDirectoryPicker()) return;
  try {
    const h = await idbGetRulesDirHandle();
    if (h && h.kind === "directory") rulesLocalDirHandle = h;
  } catch {
    rulesLocalDirHandle = null;
  }
}

async function chooseRulesLocalFolder() {
  if (!supportsRulesDirectoryPicker()) {
    alert("Linking a rules folder needs Chrome, Edge, or another Chromium-based browser.");
    return;
  }
  try {
    const dir = await window.showDirectoryPicker({ mode: "read" });
    rulesLocalDirHandle = dir;
    const ok = await verifyRulesLocalPermission();
    if (!ok) {
      rulesLocalDirHandle = null;
      setRulesSearchStatus("Folder access was not granted.", true);
      updateRulesSourceUi();
      return;
    }
    rulesMdPaths = null;
    rulesLocalFileMap = new Map();
    rulesIndexLoadPromise = null;
    await scanLocalRulesDir();
    await idbSetRulesDirHandle(dir);
    updateRulesSourceUi();
  } catch (e) {
    if (e && e.name !== "AbortError") {
      alert(`Could not use that folder: ${e.message || String(e)}`);
      rulesLocalDirHandle = null;
      rulesLocalFileMap = new Map();
      rulesMdPaths = null;
      rulesIndexLoadPromise = null;
      updateRulesSourceUi();
    }
  }
}

async function useGithubForRules() {
  rulesLocalDirHandle = null;
  rulesLocalFileMap = new Map();
  rulesMdPaths = null;
  rulesIndexLoadPromise = null;
  try {
    await idbClearRulesDirHandle();
  } catch {
    /* ignore */
  }
  updateRulesSourceUi();
  setRulesSearchStatus("Switched to GitHub. Loading file list…");
  void ensureRulesIndexLoaded();
}

function readCachedRulesPaths() {
  try {
    const raw = localStorage.getItem(RULES_TREE_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || !Array.isArray(o.paths) || typeof o.cachedAt !== "number") return null;
    if (Date.now() - o.cachedAt > RULES_TREE_TTL_MS) return null;
    return o.paths;
  } catch {
    return null;
  }
}

function writeCachedRulesPaths(paths) {
  try {
    localStorage.setItem(RULES_TREE_STORAGE_KEY, JSON.stringify({ paths, cachedAt: Date.now() }));
  } catch {
    /* ignore quota */
  }
}

function setRulesSearchStatus(message, isError = false) {
  const el = document.getElementById("rulesSearchStatus");
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("is-error", Boolean(isError));
}

function rawUrlFromPath(relPath) {
  return DATA_MD_RAW_BASE + relPath.split("/").map(encodeURIComponent).join("/");
}

function ensureRulesIndexLoaded() {
  if (rulesMdPaths?.length) return Promise.resolve();
  if (rulesIndexLoadPromise) return rulesIndexLoadPromise;

  if (rulesUsesLocalClone()) {
    rulesIndexLoadPromise = (async () => {
      const ok = await verifyRulesLocalPermission();
      if (!ok) {
        throw new Error("Folder access was not granted. Use “Local data-md folder…” to pick the clone again.");
      }
      await scanLocalRulesDir();
    })().catch((e) => {
      rulesIndexLoadPromise = null;
      if (!rulesUsesLocalClone()) rulesMdPaths = null;
      setRulesSearchStatus(e?.message || String(e), true);
    });
    return rulesIndexLoadPromise;
  }

  rulesIndexLoadPromise = (async () => {
    const cached = readCachedRulesPaths();
    if (cached?.length) {
      rulesMdPaths = cached;
      setRulesSearchStatus(`Using cached file list (${cached.length} Markdown files).`);
      return;
    }
    setRulesSearchStatus("Downloading file list from GitHub…");
    const r = await fetch(GITHUB_DATA_MD_TREE, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!r.ok) {
      throw new Error(`GitHub returned ${r.status} while loading the file list. Try again later.`);
    }
    const j = await r.json();
    const paths = (j.tree || [])
      .filter((x) => x.type === "blob" && /\.md$/i.test(x.path))
      .map((x) => x.path);
    rulesMdPaths = paths;
    writeCachedRulesPaths(paths);
    setRulesSearchStatus(`Indexed ${paths.length} Markdown files.`);
  })().catch((e) => {
    rulesIndexLoadPromise = null;
    rulesMdPaths = null;
    setRulesSearchStatus(e?.message || String(e), true);
  });
  return rulesIndexLoadPromise;
}

function refreshRulesIndex() {
  rulesMdPaths = null;
  rulesIndexLoadPromise = null;
  if (!rulesUsesLocalClone()) {
    try {
      localStorage.removeItem(RULES_TREE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setRulesSearchStatus("Cache cleared. Reloading file list from GitHub…");
  } else {
    rulesLocalFileMap = new Map();
    setRulesSearchStatus("Re-scanning local folder…");
  }
  void ensureRulesIndexLoaded();
}

function rulesIncludeBestiaryChecked() {
  return Boolean(document.getElementById("rulesIncludeBestiary")?.checked);
}

function rulesPathPassesBestiaryFilter(path) {
  if (!path || typeof path !== "string") return false;
  if (rulesIncludeBestiaryChecked()) return true;
  const norm = path.replace(/\\/g, "/").toLowerCase();
  return !norm.startsWith("bestiary/");
}

async function fetchCodeSearchPaths(query) {
  const trimmed = query.trim().slice(0, 200);
  if (trimmed.length < 2) return [];
  const q = encodeURIComponent(`${trimmed} repo:${DATA_MD_REPO}`);
  const url = `https://api.github.com/search/code?q=${q}&per_page=40`;
  const r = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.items || [])
    .map((x) => x.path)
    .filter((p) => typeof p === "string" && /\.md$/i.test(p) && rulesPathPassesBestiaryFilter(p));
}

async function searchLocalMarkdownBodies(query, maxHits = 55) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length || !rulesLocalFileMap?.size || !rulesMdPaths?.length) return [];
  const paths = rulesMdPaths.filter(rulesPathPassesBestiaryFilter);
  let cursor = 0;
  const hits = [];
  const concurrency = Math.min(10, paths.length || 1);

  async function scanOne(path) {
    const fh = rulesLocalFileMap.get(path);
    if (!fh || typeof fh.getFile !== "function") return null;
    const file = await fh.getFile();
    let raw = await file.text();
    if (raw.length > RULES_LOCAL_BODY_SCAN_MAX_CHARS) {
      raw = raw.slice(0, RULES_LOCAL_BODY_SCAN_MAX_CHARS);
    }
    const text = raw.toLowerCase();
    if (!tokens.every((t) => text.includes(t))) return null;
    let score = 8;
    const head = text.slice(0, 2500);
    for (const t of tokens) {
      if (head.includes(t)) score += 5;
    }
    return { p: path, score };
  }

  async function worker() {
    while (hits.length < maxHits * 4) {
      const idx = cursor++;
      if (idx >= paths.length) break;
      const row = await scanOne(paths[idx]);
      if (row) hits.push(row);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  hits.sort((a, b) => b.score - a.score || a.p.localeCompare(b.p));
  return hits.slice(0, maxHits).map((x) => x.p);
}

function searchRulesPaths(query, limit = 100) {
  const q = query.trim().toLowerCase();
  if (!q || !rulesMdPaths?.length) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const p of rulesMdPaths) {
    if (!rulesPathPassesBestiaryFilter(p)) continue;
    const low = p.toLowerCase();
    const file = low.split("/").pop().replace(/\.md$/i, "");
    const every = tokens.every((t) => low.includes(t) || file.includes(t));
    if (!every) continue;
    let score = 0;
    for (const t of tokens) {
      if (file.includes(t)) score += 12;
      else if (low.includes(t)) score += 4;
    }
    score -= low.split("/").length * 0.15;
    scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score || a.p.localeCompare(b.p));
  return scored.slice(0, limit).map((x) => x.p);
}

function renderRulesResults(paths) {
  const ul = document.getElementById("rulesResults");
  if (!ul) return;
  ul.innerHTML = "";
  for (const p of paths) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rules-result-btn";
    btn.setAttribute("data-rules-path", p);
    const file = p.split("/").pop() || p;
    const dir = p.slice(0, Math.max(0, p.length - file.length - 1));
    btn.innerHTML = `<span class="rules-result-title">${escapeHtml(file)}</span><span class="rules-result-path">${escapeHtml(dir ? `${dir}/` : "")}</span>`;
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRulesMarkdown(md) {
  const el = document.getElementById("rulesDetail");
  if (!el) return;
  if (typeof marked !== "undefined" && typeof marked.parse === "function") {
    el.innerHTML = marked.parse(md, { mangle: false, headerIds: false });
  } else {
    el.textContent = md;
  }
}

async function openRulesDocument(relPath) {
  const el = document.getElementById("rulesDetail");
  if (!el || !relPath) return;
  setRulesSearchStatus(`Loading ${relPath}…`);
  try {
    const fh = rulesLocalFileMap?.get(relPath);
    if (fh && typeof fh.getFile === "function") {
      const file = await fh.getFile();
      const text = await file.text();
      renderRulesMarkdown(text);
      setRulesSearchStatus(`Showing ${relPath} (local)`);
      el.scrollTop = 0;
      return;
    }
    const r = await fetch(rawUrlFromPath(relPath));
    if (!r.ok) {
      setRulesSearchStatus(`Could not load file (HTTP ${r.status}).`, true);
      return;
    }
    const text = await r.text();
    renderRulesMarkdown(text);
    setRulesSearchStatus(`Showing ${relPath}`);
    el.scrollTop = 0;
  } catch (e) {
    setRulesSearchStatus(e?.message || String(e), true);
  }
}

async function runRulesSearch() {
  const input = document.getElementById("rulesSearchInput");
  const q = input?.value?.trim() || "";
  if (!q) {
    setRulesSearchStatus("Enter a search term.", true);
    return;
  }
  await ensureRulesIndexLoaded();
  if (!rulesMdPaths?.length) return;
  const pathHits = searchRulesPaths(q, 80);
  let contentHits = [];
  if (rulesUsesLocalClone() && rulesLocalFileMap?.size) {
    setRulesSearchStatus("Searching local Markdown contents…");
    try {
      contentHits = await searchLocalMarkdownBodies(q, 55);
    } catch {
      /* ignore */
    }
  } else {
    try {
      contentHits = await fetchCodeSearchPaths(q);
    } catch {
      /* optional; path-only still useful */
    }
  }
  const seen = new Set();
  const merged = [];
  for (const p of [...contentHits, ...pathHits]) {
    if (seen.has(p)) continue;
    seen.add(p);
    merged.push(p);
  }
  const hits = merged.slice(0, 100);
  renderRulesResults(hits);
  const contentNote = contentHits.length
    ? rulesUsesLocalClone()
      ? " (includes full-text matches in your local clone)"
      : " (includes content matches from GitHub search when available)"
    : "";
  setRulesSearchStatus(
    hits.length
      ? `${hits.length} matching file(s)${contentNote}. Click one to load the full text.`
      : "No matching Markdown files. Try different keywords or shorter tokens.",
    false
  );
}

function wireRulesSearchOnce() {
  const ul = document.getElementById("rulesResults");
  if (!ul || ul.dataset.wired === "1") return;
  ul.dataset.wired = "1";
  ul.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rules-path]");
    if (!btn) return;
    const path = btn.getAttribute("data-rules-path");
    if (path) void openRulesDocument(path);
  });
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
    updateRulesSourceUi();
    void ensureRulesIndexLoaded();
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
  if (!textarea.dataset.drawSteelAutosize) {
    textarea.dataset.drawSteelAutosize = "1";
    textarea.addEventListener("input", bump);
  }
  requestAnimationFrame(() => requestAnimationFrame(bump));
}

function activityLabel(value) {
  return ACTIVITY_TYPES.find((t) => t.value === value)?.label ?? value;
}

function isTriggeredType(type) {
  return type === "triggered" || type === "free-triggered";
}

function bindFields() {
  fieldBindingsAbort?.abort();
  fieldBindingsAbort = new AbortController();
  const { signal } = fieldBindingsAbort;

  const heroicName = document.getElementById("heroicName");
  const heroicCurrent = document.getElementById("heroicCurrent");
  const victoryNotes = document.getElementById("victoryNotes");
  const passiveNotes = document.getElementById("passiveNotes");

  heroicName.value = state.heroicName;
  heroicCurrent.value = state.heroicCurrent;
  victoryNotes.value = state.victoryNotes;
  passiveNotes.value = state.passiveNotes;

  const on = (el, ev, fn) => el.addEventListener(ev, fn, { signal });

  const staminaCurrent = document.getElementById("staminaCurrent");
  const staminaMax = document.getElementById("staminaMax");
  const recoveriesCurrent = document.getElementById("recoveriesCurrent");
  const recoveriesMax = document.getElementById("recoveriesMax");
  const surgesCurrent = document.getElementById("surgesCurrent");
  const fateCurrent = document.getElementById("fateCurrent");
  const victoriesCurrent = document.getElementById("victoriesCurrent");

  if (staminaCurrent && staminaMax) {
    staminaCurrent.value = state.staminaCurrent;
    staminaMax.value = state.staminaMax;
    recoveriesCurrent.value = state.recoveriesCurrent;
    recoveriesMax.value = state.recoveriesMax;
    surgesCurrent.value = state.surgesCurrent;
    fateCurrent.value = state.fateCurrent;
    victoriesCurrent.value = state.victoriesCurrent;
  }

  on(heroicName, "input", () => {
    state.heroicName = heroicName.value;
    saveState();
    renderPlayResourceStrip();
  });
  on(heroicCurrent, "input", () => {
    state.heroicCurrent = heroicCurrent.value;
    saveState();
    renderPlayResourceStrip();
  });
  on(victoryNotes, "input", () => {
    state.victoryNotes = victoryNotes.value;
    saveState();
  });
  on(passiveNotes, "input", () => {
    state.passiveNotes = passiveNotes.value;
    saveState();
  });

  const bindTracker = (curEl, maxEl, curKey, maxKey) => {
    on(curEl, "input", () => {
      state[curKey] = curEl.value;
      saveState();
      renderPlayResourceStrip();
    });
    on(maxEl, "input", () => {
      state[maxKey] = maxEl.value;
      saveState();
      renderPlayResourceStrip();
    });
  };

  const bindCurrentOnly = (el, key) => {
    on(el, "input", () => {
      state[key] = el.value;
      saveState();
      renderPlayResourceStrip();
    });
  };

  if (staminaCurrent && staminaMax) {
    bindTracker(staminaCurrent, staminaMax, "staminaCurrent", "staminaMax");
    bindTracker(recoveriesCurrent, recoveriesMax, "recoveriesCurrent", "recoveriesMax");
    bindCurrentOnly(surgesCurrent, "surgesCurrent");
    bindCurrentOnly(fateCurrent, "fateCurrent");
    bindCurrentOnly(victoriesCurrent, "victoriesCurrent");
  }

  wireTextareaAutosize(victoryNotes);
  wireTextareaAutosize(passiveNotes);
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
  const heroicNameTrim = (state.heroicName || "").trim();

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

  const heroicDisplay = parseOptionalInt(state.heroicCurrent) ?? 0;
  const bar = document.createElement("div");
  bar.id = "heroicBar";
  bar.className = "heroic-bar";

  const nameEl = document.createElement("span");
  nameEl.className = "name";
  nameEl.textContent = heroicNameTrim || "Resource";
  bar.appendChild(nameEl);

  const trackEl = document.createElement("span");
  trackEl.className = "track";
  trackEl.textContent = String(heroicDisplay);
  bar.appendChild(trackEl);

  const hMinus = document.createElement("button");
  hMinus.type = "button";
  hMinus.className = "btn tiny";
  hMinus.textContent = "−";
  hMinus.addEventListener("click", () => {
    const base = parseOptionalInt(state.heroicCurrent) ?? 0;
    state.heroicCurrent = String(Math.max(0, base - 1));
    syncStateInput("heroicCurrent", state.heroicCurrent);
    saveState();
    renderPlayResourceStrip();
  });
  const hPlus = document.createElement("button");
  hPlus.type = "button";
  hPlus.className = "btn tiny";
  hPlus.textContent = "+";
  hPlus.addEventListener("click", () => {
    const base = parseOptionalInt(state.heroicCurrent) ?? 0;
    state.heroicCurrent = String(base + 1);
    syncStateInput("heroicCurrent", state.heroicCurrent);
    saveState();
    renderPlayResourceStrip();
  });
  bar.appendChild(hMinus);
  bar.appendChild(hPlus);

  strip.appendChild(bar);

  for (const row of RESOURCE_PLAY_ROWS) {
    appendFixedResourceBar(strip, row);
  }
}

function sortAbilities(list) {
  const order = { action: 0, maneuver: 1, move: 2, triggered: 3, "free-triggered": 4, other: 5 };
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
      : "List main actions, maneuvers, moves, and triggered abilities from your class (Draw Steel Heroes). Use the Rules tab to search Steel Compendium markdown, or enter names and copy tier outcomes from your class abilities.";
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
    btn.textContent = ab.usedThisRound ? "Marked used this round" : "Mark used (non-free triggered)";
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
  costLab.innerHTML = "Cost / frequency (optional)";
  const costIn = document.createElement("input");
  costIn.type = "text";
  costIn.value = ab.cost;
  costIn.placeholder = "Main action, maneuver, move, or spend (heroic resource, Recovery, Piety, etc.)—per ability text";
  costLab.appendChild(costIn);

  const rtLab = document.createElement("label");
  rtLab.innerHTML = "Range & targets (optional)";
  const rtIn = document.createElement("input");
  rtIn.type = "text";
  rtIn.value = ab.rangeTargets;
  rtIn.placeholder = "Melee 1, Ranged N, Burst, Cube, Line… (squares; per ability)";
  rtLab.appendChild(rtIn);

  row2.appendChild(costLab);
  row2.appendChild(rtLab);

  const trigLab = document.createElement("label");
  trigLab.innerHTML = "Trigger (for triggered abilities)";
  const trigIn = document.createElement("input");
  trigIn.type = "text";
  trigIn.value = ab.trigger;
  trigIn.placeholder = "When the trigger event occurs (wording from the ability; Combat: one non-free triggered per round)";
  trigLab.appendChild(trigIn);

  const notesLab = document.createElement("label");
  notesLab.innerHTML = "Combat notes (short)";
  const notesIn = document.createElement("textarea");
  notesIn.value = ab.notes;
  notesIn.placeholder = "Power roll tiers (≤11 / 12–16 / 17+), damage types, riders, stability, forced movement, edges/banes—per ability text";
  notesLab.appendChild(notesIn);

  const checkWrap = document.createElement("label");
  checkWrap.className = "check";
  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = !!ab.nonFreeTriggered;
  checkWrap.appendChild(check);
  checkWrap.appendChild(document.createTextNode("Uses non-free triggered budget (max 1/round)"));

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

function applyConduitPreset() {
  const hasData =
    state.abilities.length > 0 ||
    (state.heroicName || "").trim() !== "" ||
    (state.heroicCurrent || "").trim() !== "" ||
    (state.staminaCurrent || "").trim() !== "" ||
    (state.staminaMax || "").trim() !== "" ||
    (state.recoveriesCurrent || "").trim() !== "" ||
    (state.recoveriesMax || "").trim() !== "" ||
    (state.surgesCurrent || "").trim() !== "" ||
    (state.fateCurrent || "").trim() !== "" ||
    (state.victoriesCurrent || "").trim() !== "" ||
    (state.victoryNotes || "").trim() !== "" ||
    (state.passiveNotes || "").trim() !== "" ||
    (state.scratchCanvases || []).some(
      (pg) =>
        (typeof pg.notesText === "string" && pg.notesText.trim() !== "") ||
        (Array.isArray(pg.inkStrokes) && pg.inkStrokes.length > 0)
    ) ||
    (state.scratchCanvases || []).length > 1;

  if (
    hasData &&
    !confirm(
      "Replace your heroic fields, victory/passive notes, and the entire ability list with the Conduit preset? (Export JSON first if you want a backup.)"
    )
  ) {
    return;
  }

  const p = CONDUIT_PRESET;
  state.heroicName = p.heroicName;
  state.heroicCurrent = p.heroicCurrent;
  state.victoryNotes = p.victoryNotes;
  state.passiveNotes = p.passiveNotes;
  state.abilities = p.abilities.map((row) => ({
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
  renderPlayResourceStrip();
  renderAbilities();
}

function addAbility() {
  state.abilities.push({
    id: uid(),
    name: "",
    activity: "action",
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
  a.download = "draw-steel-character.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const importHadInkLayout = Object.prototype.hasOwnProperty.call(data, "scratchInkLayout");
      state = { ...defaultState(), ...data, abilities: Array.isArray(data.abilities) ? data.abilities : [] };
      delete state.heroicMax;
      delete state.surgesMax;
      delete state.fateMax;
      delete state.victoriesMax;
      migrateLegacyScratchToCanvases(state);
      if (!importHadInkLayout) {
        migrateScratchInkDoubleCanvasHeight(state);
        state.scratchInkLayout = 2;
      }
      saveState();
      bindFields();
      bindScratchNotesField();
      syncNotesUiFromState();
      renderPlayResourceStrip();
      renderAbilities();
    } catch {
      alert("Could not read that JSON file.");
    }
  };
  reader.readAsText(file);
}

document.getElementById("btnAddAbility").addEventListener("click", addAbility);
document.getElementById("btnConduitPreset").addEventListener("click", applyConduitPreset);
document.getElementById("btnPlay").addEventListener("click", () => setPlayMode(true));
document.getElementById("btnEdit").addEventListener("click", () => setPlayMode(false));
document.getElementById("btnResetRound").addEventListener("click", resetRound);
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
document.getElementById("btnRulesChooseFolder")?.addEventListener("click", () => void chooseRulesLocalFolder());
document.getElementById("btnRulesUseGithub")?.addEventListener("click", () => void useGithubForRules());
document.getElementById("rulesSearchInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") void runRulesSearch();
});
document.getElementById("rulesIncludeBestiary")?.addEventListener("change", () => {
  const q = document.getElementById("rulesSearchInput")?.value?.trim();
  if (q) void runRulesSearch();
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
bindScratchNotesField();
wireScratchCanvasSelectOnce();
wireRulesSearchOnce();
setupNotesPageResizeObserver();
syncNotesUiFromState();
setPlayMode(false);
void initBackupFileHandle();
void initRulesLocalDirHandle().then(() => updateRulesSourceUi());
