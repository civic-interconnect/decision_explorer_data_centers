// docs/explorer/evaluator.js
//
// Client-side evaluation of CSV site rows against a parsed policy.
//
// Expects:
//   site   — flat object from parseCsv(); all values are strings
//   policy — output of buildPolicy(); shape:
//              { factor_specs, constraint_rules, score_rules, interpretation }
//
// Score rule dispatch (exactly one must be present per rule):
//   numeric_bands      — array of { min_inclusive, max_inclusive, score, band }
//   binary_scores      — object with keys "true" and "false"
//   categorical_scores — object with string category keys
//
// Returns:
//   {
//     candidate_id:   string,
//     candidate_name: string,
//     pass:           boolean,
//     checks:         Array<{ key, ok, msg }>,
//     scores:         Object<rule_id, weighted_score>,
//     total:          number,
//     interpretation: string,
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
 * @param {string} rawValue
 * @param {Object} rule - A constraint_rule entry.
 * @returns {boolean}
 */
function _evalConstraint(rawValue, rule) {
  const { comparator, threshold } = rule;

  if (comparator === "in") {
    return Array.isArray(threshold) && threshold.includes(rawValue);
  }

  if (typeof threshold === "boolean") {
    return _toBool(rawValue) === threshold;
  }

  if (typeof threshold === "number") {
    const v = _toFloat(rawValue);
    if (comparator === "lt") return v < threshold;
    if (comparator === "le") return v <= threshold;
    if (comparator === "eq") return v === threshold;
    if (comparator === "ge") return v >= threshold;
    if (comparator === "gt") return v > threshold;
  }

  if (typeof threshold === "string" && comparator === "eq") {
    return rawValue === threshold;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Score evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a single score rule against a raw site value.
 * Returns the unweighted score, or null if no mapping matched.
 *
 * Dispatch order:
 *   1. numeric_bands (array)
 *   2. binary_scores (object with "true"/"false" keys)
 *   3. categorical_scores (object with string category keys)
 *
 * @param {string} rawValue
 * @param {Object} rule - A score_rule entry.
 * @returns {number|null}
 */
function _evalScoreRule(rawValue, rule) {
  // Numeric bands
  if (Array.isArray(rule.numeric_bands) && rule.numeric_bands.length > 0) {
    const v = _toFloat(rawValue);
    for (const band of rule.numeric_bands) {
      if (v >= band.min_inclusive && v <= band.max_inclusive) {
        return band.score;
      }
    }
    return null;
  }

  // Binary scores — keys are the strings "true" / "false"
  if (rule.binary_scores && typeof rule.binary_scores === "object") {
    const key = _toBool(rawValue) ? "true" : "false";
    const score = rule.binary_scores[key];
    return score !== undefined ? score : null;
  }

  // Categorical scores — keys match raw string values
  if (rule.categorical_scores && typeof rule.categorical_scores === "object") {
    const score = rule.categorical_scores[rawValue];
    return score !== undefined ? score : null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Interpretation
// ---------------------------------------------------------------------------

/**
 * Return the highest interpretation label whose threshold the total satisfies.
 *
 * @param {number} total
 * @param {Object} interpretation - { label: threshold } mapping.
 * @returns {string} Label string, or "" if none satisfied.
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
 * Compute the theoretical maximum score from policy score rules.
 * Mirrors _compute_max_score in reporting/tables.py.
 *
 * @param {Object} policy - Output of buildPolicy().
 * @returns {number}
 */
function computeMaxScore(policy) {
  let total = 0;
  for (const rule of policy.score_rules ?? []) {
    let best = 0;
    if (Array.isArray(rule.numeric_bands) && rule.numeric_bands.length > 0) {
      best = Math.max(...rule.numeric_bands.map((b) => b.score));
    } else if (rule.binary_scores && typeof rule.binary_scores === "object") {
      best = Math.max(...Object.values(rule.binary_scores));
    } else if (rule.categorical_scores && typeof rule.categorical_scores === "object") {
      best = Math.max(...Object.values(rule.categorical_scores));
    }
    total += best * (rule.weight ?? 1);
  }
  return total;
}

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
