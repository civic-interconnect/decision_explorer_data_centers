// docs/explorer/ui-results.js
//
// Results tab rendering for the decision explorer.
//
// Depends on: data-csv.js (parseCsv), data-toml.js (parseToml, buildPolicy),
//             evaluator.js (evaluate), state, selectedSite globals.

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Create an element with optional class name, text content, and title.
 *
 * @param {string} tag
 * @param {Object} [opts]
 * @param {string} [opts.className]
 * @param {string} [opts.textContent]
 * @param {string} [opts.title]
 * @returns {HTMLElement}
 */
function _el(tag, { className, textContent, title } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent !== undefined) el.textContent = textContent;
  if (title !== undefined) el.title = title;
  return el;
}

/**
 * Clear all children from a container element.
 *
 * @param {HTMLElement} container
 */
function _clear(container) {
  container.textContent = "";
}

/**
 * Build a stat card element.
 *
 * @param {string} label
 * @param {string|number} value
 * @param {string} valClass - CSS class for the value (e.g. "val-pass").
 * @returns {HTMLElement}
 */
function _statCard(label, value, valClass) {
  const card = _el("div", { className: "stat-card" });
  card.appendChild(_el("div", { className: "stat-label", textContent: label }));
  card.appendChild(_el("div", { className: `stat-val ${valClass}`, textContent: String(value) }));
  return card;
}

/**
 * Build a site table row element.
 *
 * @param {Object} r - Evaluated result row.
 * @param {string|null} selectedId - Currently selected candidate_id.
 * @returns {HTMLTableRowElement}
 */
function _siteRow(r, selectedId) {
  const tr = document.createElement("tr");
  if (r.candidate_id === selectedId) tr.classList.add("selected");
  tr.addEventListener("click", () => selectSite(r.candidate_id));

  const tdId = _el("td", { className: "site-id-cell", textContent: r.candidate_id });
  const tdName = _el("td", { textContent: r.candidate_name });

  const tdResult = document.createElement("td");
  tdResult.appendChild(_el("span", {
    className: `badge ${r.pass ? "badge-pass" : "badge-fail"}`,
    textContent: r.pass ? "PASS" : "FAIL",
  }));

  const dots = _el("div", { className: "dots" });
  for (const c of r.checks) {
    dots.appendChild(_el("div", {
      className: `dot ${c.ok ? "dot-ok" : "dot-no"}`,
      title: c.key,
    }));
  }
  const tdChecks = document.createElement("td");
  tdChecks.appendChild(dots);

  tr.append(tdId, tdName, tdResult, tdChecks);
  return tr;
}

/**
 * Build the criteria and score detail panel for a selected site.
 *
 * @param {Object|null} detailSite - Evaluated result row, or null.
 * @returns {HTMLElement} The card body element.
 */
function _detailPanel(detailSite, maxScore = 1) {
  const body = _el("div", { className: "card-body" });

  if (!detailSite) {
    body.appendChild(_el("p", {
      className: "empty-hint",
      textContent: "← Select a site to see criteria breakdown",
    }));
    return body;
  }

  // --- Constraint checks ---
  for (const c of detailSite.checks) {
    const row = _el("div", { className: "crit-row" });
    row.appendChild(_el("div", {
      className: `crit-icon ${c.ok ? "crit-ok" : "crit-no"}`,
      textContent: c.ok ? "✓" : "✗",
    }));
    const text = _el("div");
    text.appendChild(_el("div", {
      className: "crit-key",
      textContent: c.key.replace(/_/g, " "),
    }));
    text.appendChild(_el("div", { className: "crit-msg", textContent: c.msg }));
    row.appendChild(text);
    body.appendChild(row);
  }

  // --- Score summary ---
  const scoreSection = _el("div", { className: "score-section" });
  scoreSection.appendChild(_el("div", {
    className: "score-section-label",
    textContent: "Score",
  }));

  for (const [ruleId, weighted] of Object.entries(detailSite.scores)) {
    const scoreRow = _el("div", { className: "score-row" });
    scoreRow.appendChild(_el("span", {
      className: "score-rule-id",
      textContent: ruleId.replace(/_/g, " ") + ": ",
    }));
    scoreRow.appendChild(_el("span", {
      className: "score-value",
      textContent: String(weighted),
    }));
    scoreSection.appendChild(scoreRow);
  }

  const totalRow = _el("div", { className: "score-row score-total-row" });
  totalRow.appendChild(_el("span", { className: "score-rule-id", textContent: "total: " }));
  totalRow.appendChild(_el("span", { className: "score-value", textContent: String(detailSite.total) }));
  scoreSection.appendChild(totalRow);

  // Score bar
  if (detailSite.pass) {
    const barPct = Math.min(detailSite.total / maxScore, 1);
    const barFilled = Math.round(barPct * 20);
    const bar = "█".repeat(barFilled) + "░".repeat(20 - barFilled);
    scoreSection.appendChild(_el("div", {
      className: "score-bar",
      textContent: `${detailSite.total.toFixed(2)} / ${maxScore.toFixed(2)}  ${bar}`,
    }));
  }

  if (detailSite.interpretation) {
    scoreSection.appendChild(_el("div", {
      className: "score-interpretation",
      textContent: `Interpretation: ${detailSite.interpretation}`,
    }));
  }

  body.appendChild(scoreSection);
  return body;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sync editor state and switch to the results tab.
 */
function runAndGoResults() {
  const csvEl = document.getElementById("csv-editor");
  const tomlEl = document.getElementById("toml-editor");
  if (csvEl) state.csv = csvEl.value;
  if (tomlEl) state.toml = tomlEl.value;
  switchTab("results");
}

/**
 * Parse loaded data, evaluate all sites, and render the results tab.
 */
function renderResults() {
  const container = document.getElementById("results-content");
  if (!container) return;

  _clear(container);

  if (!state.csv || !state.toml) {
    container.appendChild(_el("p", {
      className: "empty-hint",
      textContent: "Load data first (Load tab) or use example data.",
    }));
    return;
  }

  let sites, policy;

  try {
    sites = parseCsv(state.csv);
  } catch (e) {
    container.appendChild(_el("div", {
      className: "parse-err",
      textContent: "CSV parse error: " + e.message,
    }));
    return;
  }

  try {
    const toml = parseToml(state.toml);
    policy = buildPolicy(toml);
  } catch (e) {
    container.appendChild(_el("div", {
      className: "parse-err",
      textContent: "TOML parse error: " + e.message,
    }));
    return;
  }

  const maxScore = computeMaxScore(policy);

  const results = sites.map((s) => evaluate(s, policy));
  const passing = results.filter((r) => r.pass).length;
  const failing = results.filter((r) => !r.pass).length;
  const failChecks = results.reduce(
    (a, r) => a + r.checks.filter((c) => !c.ok).length,
    0
  );

  const detailSite = selectedSite
    ? results.find((r) => r.candidate_id === selectedSite) ?? null
    : null;

  // --- Summary stats ---
  const statsGrid = _el("div", { className: "grid-4" });
  statsGrid.appendChild(_statCard("Sites", results.length, "val-neutral"));
  statsGrid.appendChild(_statCard("Passing", passing, "val-pass"));
  statsGrid.appendChild(_statCard("Failing", failing, "val-fail"));
  statsGrid.appendChild(_statCard("Criteria failures", failChecks, "val-fail"));

  // --- Site table ---
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const label of ["ID", "Site", "Result", "Criteria"]) {
    headerRow.appendChild(_el("th", { textContent: label }));
  }
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  for (const r of results) tbody.appendChild(_siteRow(r, selectedSite));

  const table = document.createElement("table");
  table.className = "site-table";
  table.appendChild(thead);
  table.appendChild(tbody);

  const tableBody = _el("div", { className: "card-body card-body-flush" });
  tableBody.appendChild(table);

  const tableHead = _el("div", { className: "card-head" });
  tableHead.appendChild(_el("span", { className: "card-title", textContent: "Sites" }));

  const tableCard = _el("div", { className: "card" });
  tableCard.appendChild(tableHead);
  tableCard.appendChild(tableBody);

  // --- Detail panel ---
  const detailTitle = detailSite
    ? `${detailSite.candidate_name} — ${detailSite.candidate_id}`
    : "Criteria detail";

  const detailHead = _el("div", { className: "card-head" });
  detailHead.appendChild(_el("span", { className: "card-title", textContent: detailTitle }));
  if (detailSite) {
    detailHead.appendChild(_el("span", {
      className: `badge ${detailSite.pass ? "badge-pass" : "badge-fail"}`,
      textContent: detailSite.pass ? "PASS" : "FAIL",
    }));
  }

  const detailCard = _el("div", { className: "card" });
  detailCard.appendChild(detailHead);
  detailCard.appendChild(_detailPanel(detailSite, maxScore));

  const contentGrid = _el("div", { className: "grid-2" });
  contentGrid.appendChild(tableCard);
  contentGrid.appendChild(detailCard);

  container.appendChild(statsGrid);
  container.appendChild(contentGrid);
}

/**
 * Toggle site selection and re-render results.
 *
 * @param {string} id - candidate_id to select or deselect.
 */
function selectSite(id) {
  selectedSite = selectedSite === id ? null : id;
  renderResults();
}
