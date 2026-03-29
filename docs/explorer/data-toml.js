// docs/explorer/data-toml.js
//
// TOML parsing for policy configuration.
//
// Supports the subset of TOML used by the policy format:
//   - Scalar key-value pairs (string, number, bool)
//   - Inline arrays of strings: key = ["a", "b"]
//   - [section] plain tables
//   - [parent.child] sub-tables attached to last array entry or nested plain tables
//   - [[array_of_tables]] top-level arrays
//   - [[parent.child]] nested arrays attached to last parent entry

const DEFAULT_TOML = `
# =============================================================================
# Data Center Site Evaluation Policy
# Minnesota — Illustrative Multidimensional Policy
#
# Hard constraints eliminate sites that cannot meet minimum thresholds.
# Score rules reward community benefits, workforce quality, and
# supply-side readiness. Weights reflect relative community priority.
# =============================================================================

# -----------------------------------------------------------------------------
# Factor specifications
# -----------------------------------------------------------------------------

[[factor_specs]]
factor_id = "county"
label = "County"
form = "categorical"

[[factor_specs]]
factor_id = "zoning"
label = "Zoning"
form = "categorical"
allowed_values = ["industrial"]

[[factor_specs]]
factor_id = "distance_to_residential_m"
label = "Distance to Residential"
form = "numeric"
unit = "m"

[[factor_specs]]
factor_id = "water_stressed_basin"
label = "Water-Stressed Basin"
form = "binary"

[[factor_specs]]
factor_id = "drought_sustainable"
label = "Drought Sustainable"
form = "binary"

[[factor_specs]]
factor_id = "substation_capacity_available"
label = "Substation Capacity Available"
form = "binary"

[[factor_specs]]
factor_id = "interconnection_years"
label = "Interconnection Years"
form = "numeric"
unit = "years"

[[factor_specs]]
factor_id = "requires_major_new_transmission"
label = "Requires Major New Transmission"
form = "binary"

[[factor_specs]]
factor_id = "operator_pays_grid_upgrades"
label = "Operator Pays Grid Upgrades"
form = "binary"

[[factor_specs]]
factor_id = "demand_response_capable"
label = "Demand Response Capable"
form = "binary"

[[factor_specs]]
factor_id = "continuous_noise_monitoring"
label = "Continuous Noise Monitoring"
form = "binary"

[[factor_specs]]
factor_id = "community_benefit_agreement"
label = "Community Benefit Agreement"
form = "binary"

[[factor_specs]]
factor_id = "broadband_extension_commitment"
label = "Broadband Extension Commitment"
form = "binary"

[[factor_specs]]
factor_id = "workforce_transition_program"
label = "Workforce Transition Program (Displaced Industrial Workers)"
form = "binary"

[[factor_specs]]
factor_id = "local_vendor_contracts_committed"
label = "Local Vendor Contracts Committed"
form = "binary"

[[factor_specs]]
factor_id = "projected_annual_tax_revenue_m"
label = "Projected Annual Tax Revenue"
form = "numeric"
unit = "USD millions"

[[factor_specs]]
factor_id = "construction_jobs_local_pct"
label = "Construction Jobs — Local Hire %"
form = "numeric"
unit = "%"

[[factor_specs]]
factor_id = "construction_duration_months"
label = "Construction Duration"
form = "numeric"
unit = "months"

[[factor_specs]]
factor_id = "permanent_ops_jobs_count"
label = "Permanent Operations Jobs (Committed Minimum)"
form = "numeric"
unit = "jobs"

[[factor_specs]]
factor_id = "permanent_ops_wage_vs_county_median"
label = "Permanent Ops Wage vs County Median"
form = "numeric"
unit = "ratio"

[[factor_specs]]
factor_id = "gpu_supply_secured"
label = "GPU Supply Secured"
form = "categorical"
allowed_values = ["secured", "partial", "none"]

[[factor_specs]]
factor_id = "cooling_technology"
label = "Cooling Technology"
form = "categorical"
allowed_values = ["immersion", "liquid", "air"]

[[factor_specs]]
factor_id = "pue_target"
label = "Power Usage Effectiveness Target"
form = "numeric"

[[factor_specs]]
factor_id = "renewable_energy_pct"
label = "Renewable Energy Commitment"
form = "numeric"
unit = "%"

# -----------------------------------------------------------------------------
# Hard constraints — eliminate sites that cannot meet minimum thresholds
# -----------------------------------------------------------------------------

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
message = "Site must be at least 500 m from residential areas."

[[constraint_rules]]
rule_id = "not_water_stressed"
factor_id = "water_stressed_basin"
comparator = "eq"
threshold = false
message = "Site must not be in a water-stressed basin."

[[constraint_rules]]
rule_id = "drought_sustainable_required"
factor_id = "drought_sustainable"
comparator = "eq"
threshold = true
message = "Site must be drought sustainable."

[[constraint_rules]]
rule_id = "substation_capacity_required"
factor_id = "substation_capacity_available"
comparator = "eq"
threshold = true
message = "Site must have available substation capacity."

[[constraint_rules]]
rule_id = "no_major_new_transmission"
factor_id = "requires_major_new_transmission"
comparator = "eq"
threshold = false
message = "Site must not require major new transmission."

[[constraint_rules]]
rule_id = "operator_pays_upgrades_required"
factor_id = "operator_pays_grid_upgrades"
comparator = "eq"
threshold = true
message = "Operator must pay required grid upgrades."

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

# -----------------------------------------------------------------------------
# Score rules — weighted contributions to total score
#
# Weight groups (approximate):
#   Infrastructure / grid : 0.50 total
#   Community benefits    : 2.25 total
#   Employment            : 2.50 total
#   Supply-side readiness : 2.00 total
#
# Max possible score ≈ 20 (all factors at peak band/value)
# -----------------------------------------------------------------------------

# --- Infrastructure ---

[[score_rules]]
rule_id = "residential_buffer_score"
factor_id = "distance_to_residential_m"
weight = 0.25
rationale = "Greater residential separation is preferred beyond minimum."

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
weight = 0.25
rationale = "Shorter interconnection timelines reduce project risk."

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

# --- Community benefits ---

[[score_rules]]
rule_id = "community_benefit_agreement_score"
factor_id = "community_benefit_agreement"
weight = 0.75
rationale = "Formal CBA signals legally binding community commitments."

[score_rules.binary_scores]
true = 5.0
false = 0.0

[[score_rules]]
rule_id = "broadband_extension_score"
factor_id = "broadband_extension_commitment"
weight = 0.25
rationale = "Broadband extension serves rural connectivity gaps."

[score_rules.binary_scores]
true = 5.0
false = 0.0

[[score_rules]]
rule_id = "projected_tax_revenue_score"
factor_id = "projected_annual_tax_revenue_m"
weight = 0.75
rationale = "Tax revenue is the most reliable and durable community benefit."

[[score_rules.numeric_bands]]
min_inclusive = 0.0
max_inclusive = 19.99
score = 1.0
band = "low"

[[score_rules.numeric_bands]]
min_inclusive = 20.0
max_inclusive = 59.99
score = 3.0
band = "moderate"

[[score_rules.numeric_bands]]
min_inclusive = 60.0
max_inclusive = 9999.0
score = 5.0
band = "strong"

[[score_rules]]
rule_id = "local_vendor_contracts_score"
factor_id = "local_vendor_contracts_committed"
weight = 0.25
rationale = "Local vendor contracts sustain indirect employment during and after construction."

[score_rules.binary_scores]
true = 5.0
false = 0.0

# --- Employment: construction (lower weight — temporary) ---

[[score_rules]]
rule_id = "construction_local_hire_score"
factor_id = "construction_jobs_local_pct"
weight = 0.25
rationale = "Local construction hire provides short-term economic stimulus."

[[score_rules.numeric_bands]]
min_inclusive = 0.0
max_inclusive = 24.99
score = 1.0
band = "low"

[[score_rules.numeric_bands]]
min_inclusive = 25.0
max_inclusive = 59.99
score = 3.0
band = "moderate"

[[score_rules.numeric_bands]]
min_inclusive = 60.0
max_inclusive = 100.0
score = 5.0
band = "strong"

[[score_rules]]
rule_id = "construction_duration_score"
factor_id = "construction_duration_months"
weight = 0.10
rationale = "Longer construction sustains local employment over more budget cycles."

[[score_rules.numeric_bands]]
min_inclusive = 0.0
max_inclusive = 12.0
score = 1.0
band = "short"

[[score_rules.numeric_bands]]
min_inclusive = 13.0
max_inclusive = 24.0
score = 3.0
band = "moderate"

[[score_rules.numeric_bands]]
min_inclusive = 25.0
max_inclusive = 999.0
score = 5.0
band = "extended"

# --- Employment: permanent (higher weight — ongoing) ---

[[score_rules]]
rule_id = "permanent_ops_jobs_score"
factor_id = "permanent_ops_jobs_count"
weight = 0.75
rationale = "Committed minimum permanent jobs; headcount over promises excluded."

[[score_rules.numeric_bands]]
min_inclusive = 0.0
max_inclusive = 25.0
score = 1.0
band = "minimal"

[[score_rules.numeric_bands]]
min_inclusive = 26.0
max_inclusive = 75.0
score = 3.0
band = "moderate"

[[score_rules.numeric_bands]]
min_inclusive = 76.0
max_inclusive = 9999.0
score = 5.0
band = "strong"

[[score_rules]]
rule_id = "workforce_transition_score"
factor_id = "workforce_transition_program"
weight = 0.50
rationale = "Explicit programs targeting displaced mining and industrial workers."

[score_rules.binary_scores]
true = 5.0
false = 0.0

[[score_rules]]
rule_id = "permanent_wage_score"
factor_id = "permanent_ops_wage_vs_county_median"
weight = 0.65
rationale = "Wage parity with legacy industrial employment is essential for community acceptance."

[[score_rules.numeric_bands]]
min_inclusive = 0.0
max_inclusive = 0.99
score = 0.0
band = "below_median"

[[score_rules.numeric_bands]]
min_inclusive = 1.0
max_inclusive = 1.24
score = 2.0
band = "parity"

[[score_rules.numeric_bands]]
min_inclusive = 1.25
max_inclusive = 1.49
score = 4.0
band = "above_median"

[[score_rules.numeric_bands]]
min_inclusive = 1.5
max_inclusive = 99.0
score = 5.0
band = "strong_premium"

# --- Supply-side readiness ---

[[score_rules]]
rule_id = "gpu_supply_score"
factor_id = "gpu_supply_secured"
weight = 0.50
rationale = "GPU supply constraints are a primary cause of project delays."

[score_rules.categorical_scores]
secured = 5.0
partial = 3.0
none = 0.0

[[score_rules]]
rule_id = "cooling_technology_score"
factor_id = "cooling_technology"
weight = 0.50
rationale = "Liquid and immersion cooling reduce water and energy consumption."

[score_rules.categorical_scores]
immersion = 5.0
liquid = 3.0
air = 1.0

[[score_rules]]
rule_id = "pue_score"
factor_id = "pue_target"
weight = 0.25
rationale = "Lower PUE indicates greater energy efficiency."

[[score_rules.numeric_bands]]
min_inclusive = 1.0
max_inclusive = 1.19
score = 5.0
band = "excellent"

[[score_rules.numeric_bands]]
min_inclusive = 1.2
max_inclusive = 1.39
score = 3.0
band = "good"

[[score_rules.numeric_bands]]
min_inclusive = 1.4
max_inclusive = 99.0
score = 1.0
band = "poor"

[[score_rules]]
rule_id = "renewable_energy_score"
factor_id = "renewable_energy_pct"
weight = 0.75
rationale = "Renewable commitment affects long-term grid load and carbon profile."

[[score_rules.numeric_bands]]
min_inclusive = 0.0
max_inclusive = 29.99
score = 1.0
band = "low"

[[score_rules.numeric_bands]]
min_inclusive = 30.0
max_inclusive = 69.99
score = 3.0
band = "moderate"

[[score_rules.numeric_bands]]
min_inclusive = 70.0
max_inclusive = 100.0
score = 5.0
band = "strong"

# -----------------------------------------------------------------------------
# Interpretation thresholds (applied to total weighted score)
# Max possible ≈ 20
# -----------------------------------------------------------------------------

[interpretation]
weak = 5.0
moderate = 12.0
strong = 20.0
exceptional = 28.0
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
 *   - [section] plain tables
 *   - [parent.child] sub-tables of the last array entry or nested plain tables
 *   - [[array_of_tables]] top-level arrays
 *   - [[parent.child]] nested arrays attached to last parent entry
 *
 * @param {string} text - Raw TOML text.
 * @returns {Object} Parsed policy object.
 */
function parseToml(text) {
  const result = {};
  let currentTable = result;
  let currentArrayKey = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    // [[array_of_tables]] or [[parent.child]]
    if (line.startsWith("[[") && line.endsWith("]]")) {
      const name = line.slice(2, -2).trim();
      const dotIndex = name.indexOf(".");

      if (dotIndex === -1) {
        // Top-level array: [[factor_specs]], [[score_rules]], etc.
        if (!Array.isArray(result[name])) result[name] = [];
        currentArrayKey = name;
        currentTable = {};
        result[name].push(currentTable);
      } else {
        // Nested array: [[score_rules.numeric_bands]]
        const parentKey = name.slice(0, dotIndex);
        const childKey = name.slice(dotIndex + 1);
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
      }
      continue;
    }

    // [section] plain table or [parent.child] sub-table
    if (line.startsWith("[") && line.endsWith("]")) {
      const name = line.slice(1, -1).trim();
      const dotIndex = name.indexOf(".");

      if (dotIndex !== -1) {
        const parentKey = name.slice(0, dotIndex);
        const childKey = name.slice(dotIndex + 1);

        // If parent is a non-empty array, attach as sub-table of last entry
        // e.g. [score_rules.binary_scores] after [[score_rules]]
        if (Array.isArray(result[parentKey]) && result[parentKey].length > 0) {
          const parentEntry = result[parentKey][result[parentKey].length - 1];
          if (!parentEntry[childKey]) parentEntry[childKey] = {};
          currentTable = parentEntry[childKey];
          currentArrayKey = null;
          continue;
        }

        // Otherwise treat as nested plain table path
        const parts = name.split(".");
        let obj = result;
        for (const part of parts) {
          if (!obj[part]) obj[part] = {};
          obj = obj[part];
        }
        currentTable = obj;
        currentArrayKey = null;
        continue;
      }

      // Simple [section]
      if (!result[name]) result[name] = {};
      currentTable = result[name];
      currentArrayKey = name;
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
 * @param {Object} toml - Output of parseToml().
 * @returns {{ factor_specs, constraint_rules, score_rules, interpretation }}
 */
function buildPolicy(toml) {
  return {
    factor_specs: toml.factor_specs ?? [],
    constraint_rules: toml.constraint_rules ?? [],
    score_rules: toml.score_rules ?? [],
    interpretation: toml.interpretation ?? {},
  };
}
