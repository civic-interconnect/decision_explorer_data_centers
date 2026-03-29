// docs/explorer/ui-load.js
//
// File loading utilities for CSV and TOML policy data.
//
// DOM ID conventions (must match index.html):
//   {type}-msg          — status message container
//   {type}-status-badge — badge element showing load state
//   {type}-url          — URL input element
//   {type}-drop         — drag-and-drop target element
//
// {type} is either "csv" or "toml".

const FETCH_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Count non-empty lines in text, normalizing line endings.
 *
 * @param {string} text
 * @returns {number}
 */
function _countLines(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim()).length;
}

/**
 * Set a status message safely without using innerHTML.
 *
 * @param {string} type - "csv" or "toml"
 * @param {string} msg  - Human-readable message text.
 * @param {"ok"|"err"} kind - Controls CSS class.
 */
function _setMsg(type, msg, kind) {
  const el = document.getElementById(type + "-msg");
  if (!el) return;
  el.textContent = "";
  const div = document.createElement("div");
  div.className = `status-msg status-${kind}`;
  div.textContent = msg;
  el.appendChild(div);
}

/**
 * Set the status badge to "loaded".
 *
 * @param {string} type - "csv" or "toml"
 */
function _setBadgeLoaded(type) {
  const el = document.getElementById(type + "-status-badge");
  if (!el) return;
  el.textContent = "";
  const span = document.createElement("span");
  span.className = "badge badge-pass";
  span.textContent = "loaded";
  el.appendChild(span);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store loaded text in state and update all related UI elements.
 *
 * @param {"csv"|"toml"} type
 * @param {string} text - Raw file content.
 */
function setData(type, text) {
  state[type] = text;
  updateHeaderStatus();
  _setMsg(type, `✓ Loaded (${_countLines(text)} lines)`, "ok");
  _setBadgeLoaded(type);
}

/**
 * Show a status message in the UI.
 * Prefer _setMsg for internal use; this is exposed for external callers.
 *
 * @param {string} type
 * @param {string} msg
 * @param {"ok"|"err"} kind
 */
function showMsg(type, msg, kind) {
  _setMsg(type, msg, kind);
}

/**
 * Update the header status text based on what data is currently loaded.
 */
function updateHeaderStatus() {
  const parts = [];
  if (state.csv) parts.push("csv");
  if (state.toml) parts.push("toml");
  const el = document.getElementById("hdr-status");
  if (el) {
    el.textContent = parts.length
      ? parts.join(" + ") + " loaded"
      : "no data loaded";
  }
}

/**
 * Handle a file input change event.
 *
 * @param {Event} event - The change event from an <input type="file">.
 * @param {"csv"|"toml"} type
 */
function handleFileUpload(event, type) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result;
    if (typeof result === "string") setData(type, result.trim());
  };
  reader.readAsText(file);
}

/**
 * Handle dragover on a drop zone.
 * Drop zone IDs follow the convention: {type}-drop.
 *
 * @param {DragEvent} e
 * @param {string} id - The drop zone element ID.
 */
function doDragOver(e, id) {
  e.preventDefault();
  document.getElementById(id)?.classList.add("dragover");
}

/**
 * Handle dragleave on a drop zone.
 *
 * @param {string} id - The drop zone element ID.
 */
function doDragLeave(id) {
  document.getElementById(id)?.classList.remove("dragover");
}

/**
 * Handle a drop event on a drop zone.
 *
 * @param {DragEvent} e
 * @param {"csv"|"toml"} type
 */
function doDrop(e, type) {
  e.preventDefault();
  const id = type + "-drop";
  document.getElementById(id)?.classList.remove("dragover");
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const result = ev.target?.result;
    if (typeof result === "string") setData(type, result.trim());
  };
  reader.readAsText(file);
}

/**
 * Fetch data from a URL entered by the user and load it into state.
 * Applies a timeout of FETCH_TIMEOUT_MS milliseconds.
 *
 * @param {"csv"|"toml"} type
 */
async function fetchFromUrl(type) {
  const urlEl = document.getElementById(type + "-url");
  const url = urlEl?.value.trim();
  if (!url) return;

  _setMsg(type, "Fetching…", "ok");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    setData(type, text.trim());
  } catch (e) {
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    const isNetwork = e instanceof TypeError;
    let message = `Error: ${e.message}`;
    if (isTimeout) message = `Error: request timed out after ${FETCH_TIMEOUT_MS / 1000}s.`;
    else if (isNetwork) message = `Error: network failure (possible CORS restriction).`;
    _setMsg(type, message, "err");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Load the bundled default CSV and TOML data into state.
 */
function loadDefaults() {
  setData("csv", DEFAULT_CSV);
  setData("toml", DEFAULT_TOML);
}
