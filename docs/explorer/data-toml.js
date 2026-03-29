// docs/explorer/data-toml.js
//
// TOML parsing for policy configuration.
//
// Supports the subset of TOML used by the policy format:
//   - Scalar key-value pairs (string, number, bool)
//   - Inline arrays of strings: key = ["a", "b"]
//   - [section] tables
//   - [[array_of_tables]] including nested dotted names (e.g. [[score_rules.numeric_bands]])

const DEFAULT_TOML = `[[factor_specs]]
factor_id = "continuous_noise_monitoring"
label = "Continuous Noise Monitoring"
form = "binary"

[[factor_specs]]
factor_id = "county"
label = "County"
form = "categorical"

[[factor_specs]]
factor_id = "demand_response_capable"
label = "Demand Response Capable"
form = "binary"

[[factor_specs]]
factor_id = "distance_to_residential_m"
label = "Distance to Residential"
form = "numeric"
unit = "m"

[[factor_specs]]
factor_id = "drought_sustainable"
label = "Drought Sustainable"
form = "binary"

[[factor_specs]]
factor_id = "interconnection_years"
label = "Interconnection Years"
form = "numeric"
unit = "years"

[[factor_specs]]
factor_id = "operator_pays_grid_upgrades"
label = "Operator Pays Grid Upgrades"
form = "binary"

[[factor_specs]]
factor_id = "requires_major_new_transmission"
label = "Requires Major New Transmission"
form = "binary"

[[factor_specs]]
factor_id = "substation_capacity_available"
label = "Substation Capacity Available"
form = "binary"

[[factor_specs]]
factor_id = "water_stressed_basin"
label = "Water-Stressed Basin"
form = "binary"

[[factor_specs]]
factor_id = "zoning"
label = "Zoning"
form = "categorical"
allowed_values = ["industrial"]

[[constraint_rules]]
rule_id = "zoning_allowed"
factor_id = "zoning"
comparator = "in"
threshold = ["industrial"]
message = "Site zoning must be industrial."

[[constraint_rules]]
rule_id = "residential_distance_minimum"
factor_id = "distance_to_residential_m"
comparator = "ge"
threshold = 500.0
message = "Site must be at least 500 meters from residential areas."

[[constraint_rules]]
rule_id = "drought_sustainable_required"
factor_id = "drought_sustainable"
comparator = "eq"
threshold = true
message = "Site must be drought sustainable."

[[constraint_rules]]
rule_id = "not_water_stressed"
factor_id = "water_stressed_basin"
comparator = "eq"
threshold = false
message = "Site must not be in a water-stressed basin."

[[constraint_rules]]
rule_id = "demand_response_required"
factor_id = "demand_response_capable"
comparator = "eq"
threshold = true
message = "Site must be demand-response capable."

[[constraint_rules]]
rule_id = "noise_monitoring_required"
factor_id = "continuous_noise_monitoring"
comparator = "eq"
threshold = true
message = "Site must support continuous noise monitoring."

[[constraint_rules]]
rule_id = "operator_pays_upgrades_required"
factor_id = "operator_pays_grid_upgrades"
comparator = "eq"
threshold = true
message = "Operator must pay required grid upgrades."

[[constraint_rules]]
rule_id = "no_major_new_transmission"
factor_id = "requires_major_new_transmission"
comparator = "eq"
threshold = false
message = "Site must not require major new transmission."

[[constraint_rules]]
rule_id = "substation_capacity_required"
factor_id = "substation_capacity_available"
comparator = "eq"
threshold = true
message = "Site must have available substation capacity."

[[score_rules]]
rule_id = "residential_buffer_score"
factor_id = "distance_to_residential_m"
weight = 0.5
rationale = "Greater residential separation is preferred once minimum admissibility is satisfied."

[[score_rules.numeric_bands]]
min_inclusive = 500.0
max_inclusive = 999.99
score = 1.0
band = "minimum"

[[score_rules.numeric_bands]]
min_inclusive = 1000.0
max_inclusive = 1999.99
score = 3.0
band = "moderate"

[[score_rules.numeric_bands]]
min_inclusive = 2000.0
max_inclusive = 1000000.0
score = 5.0
band = "strong"

[[score_rules]]
rule_id = "interconnection_speed_score"
factor_id = "interconnection_years"
weight = 0.5
rationale = "Shorter interconnection timelines are preferred."

[[score_rules.numeric_bands]]
min_inclusive = 0.0
max_inclusive = 2.0
score = 5.0
band = "fast"

[[score_rules.numeric_bands]]
min_inclusive = 2.01
max_inclusive = 5.0
score = 3.0
band = "acceptable"

[[score_rules.numeric_bands]]
min_inclusive = 5.01
max_inclusive = 100.0
score = 1.0
band = "slow"

[interpretation]
weak = 1.0
moderate = 3.0
strong = 4.5
`;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parse a scalar TOML value: bool, number, inline string array, or string.
 *
 * @param {string} raw - Raw right-hand side of a key = value pair.
 * @returns {boolean|number|string|string[]}
 */
function _parseScalar(raw) {
  if (raw === "true") return true;
  if (raw === "false") return false;

  const n = Number(raw);
  if (!isNaN(n) && raw !== "") return n;

  if (raw.startsWith("[") && raw.endsWith("]")) {
    return raw
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter((s) => s.length > 0);
  }

  return raw.replace(/^["']|["']$/g, "");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse the subset of TOML used by the policy format.
 *
 * Handles:
 *   - Scalar key-value pairs
 *   - [section] tables
 *   - [[array_of_tables]] at top level
 *   - [[parent.child]] nested arrays attached to the last parent entry
 *
 * @param {string} text - Raw TOML text.
 * @returns {Object} Parsed policy object with arrays for array-of-tables keys.
 */
function parseToml(text) {
  const result = {};

  // currentTable: the object currently receiving key=value pairs
  // currentArrayKey: top-level array name if inside [[array_of_tables]]
  // currentParentArray: the array itself, for attaching nested [[parent.child]]
  let currentTable = result;
  let currentArrayKey = null;
  let currentParentArray = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    // [[array_of_tables]] or [[parent.child]]
    if (line.startsWith("[[") && line.endsWith("]]")) {
      const name = line.slice(2, -2).trim();
      const dotIndex = name.indexOf(".");

      if (dotIndex === -1) {
        // Top-level array table: [[factor_specs]], [[constraint_rules]], etc.
        if (!Array.isArray(result[name])) result[name] = [];
        currentParentArray = result[name];
        currentArrayKey = name;
        currentTable = {};
        result[name].push(currentTable);
      } else {
        // Nested array table: [[score_rules.numeric_bands]]
        const parentKey = name.slice(0, dotIndex);
        const childKey = name.slice(dotIndex + 1);

        // Attach to the last entry of the parent array
        if (!Array.isArray(result[parentKey]) || result[parentKey].length === 0) {
          throw new Error(
            `[[${name}]] found but no parent [[${parentKey}]] entry exists.`
          );
        }
        const parentEntry = result[parentKey][result[parentKey].length - 1];
        if (!Array.isArray(parentEntry[childKey])) parentEntry[childKey] = [];
        currentTable = {};
        parentEntry[childKey].push(currentTable);
        currentArrayKey = null;
        currentParentArray = null;
      }
      continue;
    }

    // [section] plain table
    if (line.startsWith("[") && line.endsWith("]")) {
      const name = line.slice(1, -1).trim();
      if (!result[name]) result[name] = {};
      currentTable = result[name];
      currentArrayKey = null;
      currentParentArray = null;
      continue;
    }

    // key = value
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    currentTable[key] = _parseScalar(val);
  }

  return result;
}

/**
 * Extract the policy configuration from a parsed TOML object.
 *
 * Returns the four top-level policy keys expected by the evaluation engine:
 * factor_specs, constraint_rules, score_rules, and interpretation.
 *
 * @param {Object} toml - Output of parseToml().
 * @returns {{ factor_specs: Object[], constraint_rules: Object[], score_rules: Object[], interpretation: Object }}
 */
function buildPolicy(toml) {
  return {
    factor_specs: toml.factor_specs ?? [],
    constraint_rules: toml.constraint_rules ?? [],
    score_rules: toml.score_rules ?? [],
    interpretation: toml.interpretation ?? {},
  };
}
