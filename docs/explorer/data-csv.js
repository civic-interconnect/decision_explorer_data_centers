// docs/explorer/data-csv.js
//
// CSV parsing and serialization for candidate site data.
//
// Candidates are designed to illustrate distinct policy tradeoffs:
//   MN001 — Model site: strong CBA, liquid cooling, secured supply, Iron Range
//   MN002 — Strong community benefits, air cooling, partial GPU supply
//   MN003 — Excellent CBA and supply-side, but fails water constraints
//   MN004 — Remote cautionary case: fails multiple hard constraints
//   MN005 — Passes all constraints, no CBA yet — the negotiation gap case
//
// Limitations:
//   - Quoted fields and embedded commas are not supported.
//   - Windows-style CRLF line endings are normalized to LF on parse.

const DEFAULT_CSV = `candidate_id,candidate_name,county,zoning,distance_to_residential_m,water_stressed_basin,drought_sustainable,substation_capacity_available,interconnection_years,requires_major_new_transmission,operator_pays_grid_upgrades,demand_response_capable,continuous_noise_monitoring,community_benefit_agreement,broadband_extension_commitment,workforce_transition_program,local_vendor_contracts_committed,projected_annual_tax_revenue_m,construction_jobs_local_pct,construction_duration_months,permanent_ops_jobs_count,permanent_ops_wage_vs_county_median,gpu_supply_secured,cooling_technology,pue_target,renewable_energy_pct
MN001,North Range Industrial,Itasca,industrial,1800,false,true,true,2.0,false,true,true,true,true,true,true,true,85.0,65.0,28,90,1.45,secured,liquid,1.15,80.0
MN002,East Corridor Site,St. Louis,industrial,1100,false,true,true,3.5,false,true,true,true,true,true,false,true,45.0,55.0,18,45,1.2,partial,air,1.45,50.0
MN003,Western Basin Site,Big Stone,industrial,2200,true,false,true,2.5,false,true,true,true,true,true,true,true,120.0,70.0,30,110,1.6,secured,immersion,1.05,95.0
MN004,Remote High Cost Site,Lake of the Woods,industrial,3500,false,true,false,7.5,true,false,false,false,false,false,false,false,8.0,15.0,36,12,0.95,none,air,1.8,5.0
MN005,South Metro Industrial,Dakota,industrial,650,false,true,true,1.5,false,true,true,true,false,false,false,false,55.0,30.0,20,60,1.3,secured,liquid,1.2,60.0
`;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalize line endings and split CSV text into a header row and data rows.
 * Empty lines are discarded.
 *
 * @param {string} text - Raw CSV text.
 * @returns {{ headers: string[], rows: string[][] }}
 * @throws {Error} If fewer than two non-empty lines are present.
 */
function _getCsvHeadersAndRows(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV needs a header row and at least one data row.");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => line.split(",").map((v) => v.trim()));

  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse CSV text into an array of objects keyed by header name.
 *
 * @param {string} text - Raw CSV text.
 * @returns {Object[]} Array of row objects.
 * @throws {Error} If the CSV is malformed.
 */
function parseCsv(text) {
  const { headers, rows } = _getCsvHeadersAndRows(text);
  return rows.map((vals) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] ?? "";
    });
    return obj;
  });
}

/**
 * Serialize an array of site objects back to CSV text.
 * Column order is derived from the keys of the first object.
 *
 * @param {Object[]} sites - Array of row objects.
 * @returns {string} CSV text, or an empty string if the array is empty.
 */
function serializeCsv(sites) {
  if (!sites.length) return "";
  const headers = Object.keys(sites[0]);
  const lines = [headers.join(",")];
  for (const site of sites) {
    lines.push(headers.map((key) => String(site[key] ?? "")).join(","));
  }
  return lines.join("\n");
}

/**
 * Update a single data row in CSV text by row index.
 *
 * @param {string} text - Raw CSV text.
 * @param {number} rowIndex - Zero-based index into the data rows (excluding header).
 * @param {Object} updatedRow - Object containing updated field values.
 * @returns {string} Updated CSV text.
 * @throws {Error} If the CSV is malformed or rowIndex is out of range.
 */
function updateCsvRow(text, rowIndex, updatedRow) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV needs a header row and at least one data row.");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const dataRows = lines.slice(1);

  if (rowIndex < 0 || rowIndex >= dataRows.length) {
    throw new Error(
      `Row index ${rowIndex} is out of range (${dataRows.length} data rows).`
    );
  }

  dataRows[rowIndex] = headers
    .map((header) => String(updatedRow[header] ?? ""))
    .join(",");

  return [lines[0], ...dataRows].join("\n");
}
