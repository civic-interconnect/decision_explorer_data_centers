// docs/explorer/evaluator.js
//
// Client-side evaluation of CSV site rows against a parsed policy.
//
// Expects:
//   site   — flat object from parseCsv(), all values are strings
//   policy — output of buildPolicy(), shape:
//              { factor_specs, constraint_rules, score_rules, interpretation }
//
// Returns:
//   {
//     candidate_id:   string,
//     candidate_name: string,
//     pass:           boolean,   // true iff all constraint_rules pass
//     checks:         Array<{ key: string, ok: boolean, msg: string }>,
//     scores:         Object<string, number>,  // rule_id -> weighted score
//     total:          number,
//     interpretation: string,    // highest satisfied label, or ""
//   }

// ---------------------------------------------------------------------------
// Internal coercion helpers
// ---------------------------------------------------------------------------

/**
 * Coerce a raw string value to boolean.
 * @param {string} v
 * @returns {boolean}
 */
function _toBool(v) {
  return String(v).trim().toLowerCase() === "true";
}

/**
 * Coerce a raw string value to float.
 * @param {string} v
 * @returns {number}
 */
function _toFloat(v) {
  return parseFloat(v);
}

// ---------------------------------------------------------------------------
// Constraint evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a single constraint rule against a raw site value.
 *
 * @param {string} rawValue - String value from the CSV row.
 * @param {Object} rule - A constraint_rule entry from the policy.
 * @returns {boolean}
 */
function _evalConstraint(rawValue, rule) {
  const { comparator, threshold } = rule;

  if (comparator === "in") {
    return Array.isArray(threshold) && threshold.includes(rawValue);
  }

  if (typeof threshold === "boolean") {
    const v = _toBool(rawValue);
    if (comparator === "eq") return v === threshold;
    return false;
  }

  if (typeof threshold === "number") {
    const v = _toFloat(rawValue);
    if (comparator === "lt") return v < threshold;
    if (comparator === "le") return v <= threshold;
    if (comparator === "eq") return v === threshold;
    if (comparator === "ge") return v >= threshold;
    if (comparator === "gt") return v > threshold;
    return false;
  }

  if (typeof threshold === "string") {
    if (comparator === "eq") return rawValue === threshold;
    return false;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Score evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a single score rule against a raw site value.
 * Returns the unweighted score, or null if no band/mapping matched.
 *
 * @param {string} rawValue
 * @param {Object} rule - A score_rule entry from the policy.
 * @returns {number|null}
 */
function _evalScoreRule(rawValue, rule) {
  if (rule.numeric_bands && rule.numeric_bands.length > 0) {
    const v = _toFloat(rawValue);
    for (const band of rule.numeric_bands) {
      if (v >= band.min_inclusive && v <= band.max_inclusive) {
        return band.score;
      }
    }
    return null;
  }

  if (rule.categorical_scores && typeof rule.categorical_scores === "object") {
    return rule.categorical_scores[rawValue] ?? null;
  }

  if (rule.binary_scores && typeof rule.binary_scores === "object") {
    const key = String(_toBool(rawValue));
    return rule.binary_scores[key] ?? null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Interpretation
// ---------------------------------------------------------------------------

/**
 * Return the highest interpretation label whose threshold is satisfied.
 *
 * @param {number} total
 * @param {Object} interpretation - { label: threshold } mapping.
 * @returns {string}
 */
function _interpretTotal(total, interpretation) {
  if (!interpretation || typeof interpretation !== "object") return "";
  const satisfied = Object.entries(interpretation)
    .filter(([, threshold]) => total >= threshold)
    .sort(([, a], [, b]) => b - a);
  return satisfied.length > 0 ? satisfied[0][0] : "";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a site row against a policy.
 *
 * @param {Object} site   - Flat string-valued object from parseCsv().
 * @param {Object} policy - Output of buildPolicy().
 * @returns {Object} Evaluation result.
 */
function evaluate(site, policy) {
  const checks = [];
  const scores = {};

  // --- Constraint rules ---
  for (const rule of policy.constraint_rules ?? []) {
    const rawValue = site[rule.factor_id] ?? "";
    const passed = _evalConstraint(rawValue, rule);
    checks.push({
      key: rule.rule_id,
      ok: passed,
      msg: rule.message ?? rule.rule_id,
    });
  }

  // --- Score rules ---
  let total = 0;
  for (const rule of policy.score_rules ?? []) {
    const rawValue = site[rule.factor_id] ?? "";
    const score = _evalScoreRule(rawValue, rule);
    if (score !== null) {
      const weighted = score * (rule.weight ?? 1);
      scores[rule.rule_id] = Math.round(weighted * 1000) / 1000;
      total += weighted;
    }
  }
  total = Math.round(total * 1000) / 1000;

  return {
    candidate_id: site.candidate_id ?? "",
    candidate_name: site.candidate_name ?? "",
    pass: checks.every((c) => c.ok),
    checks,
    scores,
    total,
    interpretation: _interpretTotal(total, policy.interpretation),
  };
}
