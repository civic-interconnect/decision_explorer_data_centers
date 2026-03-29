// docs/explorer/data-csv.js
//
// CSV parsing and serialization for candidate site data.
//
// Limitations:
//   - Quoted fields and embedded commas are not supported.
//   - Windows-style CRLF line endings are normalized to LF on parse.

const DEFAULT_CSV = `candidate_id,candidate_name,county,zoning,distance_to_residential_m,water_stressed_basin,drought_sustainable,substation_capacity_available,interconnection_years,requires_major_new_transmission,operator_pays_grid_upgrades,demand_response_capable,continuous_noise_monitoring
MN001,North River Industrial,Example,industrial,1200,false,true,true,2.5,false,true,true,true
MN002,East Edge Mixed Use,Example,mixed_use,300,false,true,true,3.0,false,true,true,true
MN003,Western Basin Site,Example,industrial,900,true,false,true,2.0,false,true,true,true
MN004,Remote High Cost Site,Example,industrial,1500,false,true,false,6.5,true,false,false,false
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
  const rows = lines
    .slice(1)
    .map((line) => line.split(",").map((v) => v.trim()));

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

  const headers = [
    "candidate_id",
    "candidate_name",
    "county",
    "zoning",
    "distance_to_residential_m",
    "water_stressed_basin",
    "drought_sustainable",
    "substation_capacity_available",
    "interconnection_years",
    "requires_major_new_transmission",
    "operator_pays_grid_upgrades",
    "demand_response_capable",
    "continuous_noise_monitoring",
  ];
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
  const { headers, rows } = _getCsvHeadersAndRows(text);

  if (rowIndex < 0 || rowIndex >= rows.length) {
    throw new Error(
      `Row index ${rowIndex} is out of range (${rows.length} data rows).`
    );
  }

  rows[rowIndex] = headers.map((header) => String(updatedRow[header] ?? ""));

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
