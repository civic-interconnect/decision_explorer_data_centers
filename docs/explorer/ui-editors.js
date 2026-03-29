// docs/explorer/ui-editors.js

function syncEditors() {
  document.getElementById('csv-editor').value = state.csv || DEFAULT_CSV;
  document.getElementById('toml-editor').value = state.toml || DEFAULT_TOML;
  if (!state.csv) state.csv = DEFAULT_CSV;
  if (!state.toml) state.toml = DEFAULT_TOML;
  updateCsvRowLabel();
  refreshCsvRowHelper();

  const csvEditor = document.getElementById('csv-editor');
  const csvToggleBtn = document.getElementById('csv-toggle-btn');
  const csvNote = document.getElementById('csv-readonly-note');

  if (csvEditor) {
    csvEditor.setAttribute('readonly', '');
    csvEditor.classList.add('editor-ghosted');
  }
  if (csvToggleBtn) csvToggleBtn.textContent = 'Unlock Raw CSV';
  if (csvNote) csvNote.textContent = 'Raw CSV is shown for transparency. Use the site helper above to edit safely.';
}

function updateCsvRowLabel() {
  try {
    const rows = parseCsv(state.csv || "");
    document.getElementById("csv-rows-label").textContent =
      rows.length + " site" + (rows.length !== 1 ? "s" : "");
    document.getElementById("csv-parse-err").innerHTML = "";
  } catch (e) {
    document.getElementById("csv-parse-err").innerHTML =
      '<div class="parse-err">CSV error: ' + e.message + "</div>";
  }
}

function onEditorChange(type) {
  state[type] = document.getElementById(type + "-editor").value;
  if (type === "csv") {
    updateCsvRowLabel();
    refreshCsvRowHelper();
  }
  if (type === "toml") {
    document.getElementById("toml-parse-err").innerHTML = "";
  }
}

function addCsvRow() {
  const lines = (state.csv || "").split("\n").filter((l) => l.trim());
  if (!lines.length) return;
  const headers = lines[0].split(",").map((h) => h.trim());
  const newRow = headers.map((h) => {
    if (h === "candidate_id") return "MN00" + lines.length;
    if (h === "candidate_name") return "New Site";
    if (h === "county") return "Example";
    if (h === "zoning") return "industrial";
    if (h === "distance_to_residential_m") return "600";
    if (h === "water_stressed_basin") return "false";
    if (h === "drought_sustainable") return "true";
    if (h === "substation_capacity_available") return "true";
    if (h === "interconnection_years") return "3.0";
    if (h === "requires_major_new_transmission") return "false";
    if (h === "operator_pays_grid_upgrades") return "true";
    if (h === "demand_response_capable") return "true";
    if (h === "continuous_noise_monitoring") return "true";
    // Community benefits
    if (h === "community_benefit_agreement") return "false";
    if (h === "broadband_extension_commitment") return "false";
    if (h === "local_vendor_contracts_committed") return "false";
    if (h === "projected_annual_tax_revenue_m") return "0.0";
    // Employment: construction
    if (h === "construction_jobs_local_pct") return "0.0";
    if (h === "construction_duration_months") return "12.0";
    // Employment: permanent
    if (h === "permanent_ops_jobs_count") return "0.0";
    if (h === "permanent_ops_wage_vs_county_median") return "1.0";
    if (h === "workforce_transition_program") return "false";
    // Supply-side
    if (h === "gpu_supply_secured") return "none";
    if (h === "cooling_technology") return "air";
    if (h === "pue_target") return "1.5";
    if (h === "renewable_energy_pct") return "0.0";
    return "";
  }).join(",");

  const newText = lines.join("\n") + "\n" + newRow;
  state.csv = newText;
  document.getElementById("csv-editor").value = newText;
  updateCsvRowLabel();
  selectedCsvRowIndex = parseCsv(state.csv).length - 1;
  refreshCsvRowHelper();
}

function downloadFile(type) {
  const content = state[type] || "";
  const ext = type === "csv" ? "csv" : "toml";
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sites." + ext;
  a.click();
}

function getCurrentCsvRows() {
  const text = document.getElementById("csv-editor").value || state.csv || "";
  return parseCsv(text);
}

function refreshCsvRowHelper() {
  const select = document.getElementById("csv-row-select");
  const form = document.getElementById("csv-row-form");
  if (!select || !form) return;

  let rows;
  try {
    rows = getCurrentCsvRows();
  } catch (e) {
    select.innerHTML = "";
    form.innerHTML = '<div class="parse-err">CSV error: ' + e.message + "</div>";
    return;
  }

  if (!rows.length) {
    select.innerHTML = "";
    form.innerHTML = '<p style="color:var(--text-faint);font-family:var(--mono);font-size:12px">No rows available.</p>';
    return;
  }

  if (selectedCsvRowIndex >= rows.length) selectedCsvRowIndex = rows.length - 1;
  if (selectedCsvRowIndex < 0) selectedCsvRowIndex = 0;

  select.innerHTML = rows.map((row, idx) => {
    const label =
      (row.candidate_id || "Row " + (idx + 1)) +
      " — " +
      (row.candidate_name || "Unnamed Site");
    return `<option value="${idx}"${idx === selectedCsvRowIndex ? " selected" : ""}>${label}</option>`;
  }).join("");

  renderCsvRowForm(rows[selectedCsvRowIndex]);
}

function renderCsvRowForm(row) {
  const form = document.getElementById("csv-row-form");
  if (!form) return;

  form.innerHTML = `
    <div class="form-section-label">Identification</div>
    ${renderTextField("candidate_id", "Site ID", row.candidate_id)}
    ${renderTextField("candidate_name", "Site Name", row.candidate_name)}
    ${renderTextField("county", "County", row.county)}

    <div class="form-section-label">Site / Zoning</div>
    ${renderTextField("zoning", "Zoning", row.zoning)}
    ${renderNumberField("distance_to_residential_m", "Distance to Residential (m)", row.distance_to_residential_m)}

    <div class="form-section-label">Water and Environment</div>
    ${renderBoolField("water_stressed_basin", "Water-Stressed Basin", row.water_stressed_basin)}
    ${renderBoolField("drought_sustainable", "Drought Sustainable", row.drought_sustainable)}

    <div class="form-section-label">Grid and Infrastructure</div>
    ${renderBoolField("substation_capacity_available", "Substation Capacity Available", row.substation_capacity_available)}
    ${renderNumberField("interconnection_years", "Interconnection Years", row.interconnection_years)}
    ${renderBoolField("requires_major_new_transmission", "Requires Major New Transmission", row.requires_major_new_transmission)}
    ${renderBoolField("operator_pays_grid_upgrades", "Operator Pays Grid Upgrades", row.operator_pays_grid_upgrades)}
    ${renderBoolField("demand_response_capable", "Demand Response Capable", row.demand_response_capable)}
    ${renderBoolField("continuous_noise_monitoring", "Continuous Noise Monitoring", row.continuous_noise_monitoring)}

    <div class="form-section-label">Community Benefits</div>
    ${renderBoolField("community_benefit_agreement", "Community Benefit Agreement", row.community_benefit_agreement)}
    ${renderBoolField("broadband_extension_commitment", "Broadband Extension Commitment", row.broadband_extension_commitment)}
    ${renderBoolField("local_vendor_contracts_committed", "Local Vendor Contracts Committed", row.local_vendor_contracts_committed)}
    ${renderNumberField("projected_annual_tax_revenue_m", "Projected Annual Tax Revenue (USD millions)", row.projected_annual_tax_revenue_m)}

    <div class="form-section-label">Employment — Construction (Temporary)</div>
    ${renderNumberField("construction_jobs_local_pct", "Local Hire % (Construction)", row.construction_jobs_local_pct)}
    ${renderNumberField("construction_duration_months", "Construction Duration (months)", row.construction_duration_months)}

    <div class="form-section-label">Employment — Permanent (Ongoing)</div>
    ${renderNumberField("permanent_ops_jobs_count", "Permanent Ops Jobs (Committed Minimum)", row.permanent_ops_jobs_count)}
    ${renderNumberField("permanent_ops_wage_vs_county_median", "Wage vs County Median (ratio)", row.permanent_ops_wage_vs_county_median)}
    ${renderBoolField("workforce_transition_program", "Workforce Transition Program", row.workforce_transition_program)}

    <div class="form-section-label">Supply-Side Readiness</div>
    ${renderSelectField("gpu_supply_secured", "GPU Supply Secured", row.gpu_supply_secured, ["secured", "partial", "none"])}
    ${renderSelectField("cooling_technology", "Cooling Technology", row.cooling_technology, ["immersion", "liquid", "air"])}
    ${renderNumberField("pue_target", "PUE Target", row.pue_target, "0.01")}
    ${renderNumberField("renewable_energy_pct", "Renewable Energy %", row.renewable_energy_pct)}
  `;

  form.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", onCsvRowFormInput);
    el.addEventListener("change", onCsvRowFormInput);
  });
}

// ---------------------------------------------------------------------------
// Field renderers
// ---------------------------------------------------------------------------

function renderTextField(name, label, value) {
  return `
    <div class="form-field">
      <label for="field-${name}">${label}</label>
      <input type="text" id="field-${name}" name="${name}" value="${escapeHtml(value ?? "")}">
    </div>
  `;
}

function renderNumberField(name, label, value, step = "0.1") {
  return `
    <div class="form-field">
      <label for="field-${name}">${label}</label>
      <input type="number" step="${step}" id="field-${name}" name="${name}" value="${escapeHtml(value ?? "")}">
    </div>
  `;
}

function renderBoolField(name, label, value) {
  const normalized = String(value).toLowerCase() === "true" ? "true" : "false";
  return `
    <div class="form-field">
      <label>${label}</label>
      <div class="bool-pair">
        <label><input type="radio" name="${name}" value="true" ${normalized === "true" ? "checked" : ""}> Yes</label>
        <label><input type="radio" name="${name}" value="false" ${normalized === "false" ? "checked" : ""}> No</label>
      </div>
    </div>
  `;
}

function renderSelectField(name, label, value, options) {
  const opts = options.map((o) =>
    `<option value="${o}"${o === value ? " selected" : ""}>${o}</option>`
  ).join("");
  return `
    <div class="form-field">
      <label for="field-${name}">${label}</label>
      <select id="field-${name}" name="${name}">${opts}</select>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function onCsvRowSelectChange() {
  const select = document.getElementById("csv-row-select");
  selectedCsvRowIndex = Number(select.value);
  refreshCsvRowHelper();
}

function onCsvRowFormInput() {
  const editor = document.getElementById("csv-editor");
  const rows = getCurrentCsvRows();
  const current = { ...rows[selectedCsvRowIndex] };
  const form = document.getElementById("csv-row-form");

  form.querySelectorAll("input, select").forEach((field) => {
    if (field.type === "radio") {
      if (field.checked) current[field.name] = field.value;
    } else {
      current[field.name] = field.value;
    }
  });

  const updatedText = updateCsvRow(editor.value, selectedCsvRowIndex, current);
  editor.value = updatedText;
  state.csv = updatedText;
  updateCsvRowLabel();
  refreshCsvRowHelper();
}

function selectPrevCsvRow() {
  if (!getCurrentCsvRows().length) return;
  selectedCsvRowIndex = Math.max(0, selectedCsvRowIndex - 1);
  refreshCsvRowHelper();
}

function selectNextCsvRow() {
  const rows = getCurrentCsvRows();
  if (!rows.length) return;
  selectedCsvRowIndex = Math.min(rows.length - 1, selectedCsvRowIndex + 1);
  refreshCsvRowHelper();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toggleRawCsvEdit() {
  const editor = document.getElementById("csv-editor");
  const button = document.getElementById("csv-toggle-btn");
  const note = document.getElementById("csv-readonly-note");
  const isReadOnly = editor.hasAttribute("readonly");

  if (isReadOnly) {
    editor.removeAttribute("readonly");
    editor.classList.remove("editor-ghosted");
    button.textContent = "Lock Raw CSV";
    if (note) note.textContent = "Raw CSV editing is unlocked. Changes here affect evaluation directly.";
  } else {
    editor.setAttribute("readonly", "");
    editor.classList.add("editor-ghosted");
    button.textContent = "Unlock Raw CSV";
    if (note) note.textContent = "Raw CSV is shown for transparency. Use the site helper above to edit safely.";
  }
}
