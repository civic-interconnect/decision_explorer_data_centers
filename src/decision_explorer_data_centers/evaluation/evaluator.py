"""evaluation/evaluator.py: Domain evaluator for data center candidate sites.

Evaluates CandidateSite objects against a Policy, producing EvaluationResult
objects that include both constraint findings and weighted score breakdowns.

This replaces the old evaluate_scenario and evaluate_site_admissibility
functions. The framework characterizes and compares sites — it does not
make approval decisions.
"""

from multidimensional_evaluation_engine.domain.candidates import Candidate
from multidimensional_evaluation_engine.domain.factors import FactorForm, FactorValue
from multidimensional_evaluation_engine.evaluation.evaluator import evaluate_candidate
from multidimensional_evaluation_engine.policy.policy import (
    ConstraintRule,
    Policy,
)
from multidimensional_evaluation_engine.utils.logging_utils import get_logger

from ..domain.candidates import (
    AdmissibilityIssue,
    CandidateSite,
    EvaluationResult,
    ScoreFinding,
)

logger = get_logger(__name__)


def evaluate_site(site: CandidateSite, policy: Policy) -> EvaluationResult:
    """Evaluate a CandidateSite against a Policy.

    Wraps the core engine evaluator by projecting CandidateSite fields
    into a Candidate with typed FactorValues, running evaluation, and
    projecting results into the domain EvaluationResult shape.

    Args:
        site: The candidate site to evaluate.
        policy: The policy defining constraints, scores, and interpretation.

    Returns:
        EvaluationResult with admissibility findings, score breakdown,
        total score, and interpretation label.
    """
    logger.debug(f"Evaluating site {site.candidate_id!r}.")

    core_candidate = _site_to_candidate(site)
    core_result = evaluate_candidate(core_candidate, policy)

    admissible = core_result.scores.get("admissible", 0.0) == 1.0
    total = core_result.scores.get("total", 0.0)

    # Derive interpretation label from score keys
    interpretation = ""
    for key, val in core_result.scores.items():
        if key.startswith("interpretation:") and val == 1.0:
            interpretation = key.split(":", 1)[1]
            break

    # Reconstruct per-constraint findings
    # The core engine returns aggregate admissible only; we re-derive
    # per-rule pass/fail by re-evaluating each constraint rule directly.
    issues = tuple(
        _evaluate_constraint_rule(site, rule, policy)
        for rule in policy.constraint_rules
    )

    # Reconstruct per-score-rule findings.
    # Rules whose factor value falls outside all defined bands yield no finding.
    # This is expected for inadmissible sites whose values violate constraints.
    score_findings_list: list[ScoreFinding] = []
    for rule in policy.score_rules:
        weighted = core_result.scores.get(rule.rule_id)
        if weighted is None:
            logger.debug(
                f"Site {site.candidate_id!r}: no score for rule {rule.rule_id!r} "
                f"(factor value outside all bands — site may be inadmissible)."
            )
            continue
        raw = weighted / rule.weight if rule.weight else 0.0
        score_findings_list.append(
            ScoreFinding(
                rule_id=rule.rule_id,
                factor_id=rule.factor_id,
                raw_score=raw,
                weight=rule.weight,
                weighted_score=weighted,
            )
        )
    score_findings = tuple(score_findings_list)

    result = EvaluationResult(
        site=site,
        admissible=admissible,
        issues=issues,
        score_findings=score_findings,
        total_score=total,
        interpretation=interpretation,
    )

    logger.debug(
        f"Site {site.candidate_id!r}: admissible={admissible}, "
        f"total={total:.3f}, interpretation={interpretation!r}."
    )

    return result


def evaluate_sites(
    sites: list[CandidateSite],
    policy: Policy,
) -> list[EvaluationResult]:
    """Evaluate a list of CandidateSite objects against a Policy.

    Args:
        sites: List of candidate sites.
        policy: The evaluation policy.

    Returns:
        List of EvaluationResult objects in the same order as sites.
    """
    return [evaluate_site(site, policy) for site in sites]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _site_to_candidate(site: CandidateSite) -> Candidate:
    """Project a CandidateSite into a core Candidate with typed FactorValues."""
    fv: dict[str, FactorValue] = {}

    def _add(factor_id: str, form: FactorForm, value: bool | float | str) -> None:
        fv[factor_id] = FactorValue(factor_id=factor_id, form=form, value=value)

    # Site / zoning
    _add("zoning", FactorForm.CATEGORICAL, site.zoning)
    _add(
        "distance_to_residential_m", FactorForm.NUMERIC, site.distance_to_residential_m
    )

    # Water and environment
    _add("water_stressed_basin", FactorForm.BINARY, site.water_stressed_basin)
    _add("drought_sustainable", FactorForm.BINARY, site.drought_sustainable)

    # Grid and infrastructure
    _add(
        "substation_capacity_available",
        FactorForm.BINARY,
        site.substation_capacity_available,
    )
    _add("interconnection_years", FactorForm.NUMERIC, site.interconnection_years)
    _add(
        "requires_major_new_transmission",
        FactorForm.BINARY,
        site.requires_major_new_transmission,
    )
    _add(
        "operator_pays_grid_upgrades",
        FactorForm.BINARY,
        site.operator_pays_grid_upgrades,
    )
    _add("demand_response_capable", FactorForm.BINARY, site.demand_response_capable)
    _add(
        "continuous_noise_monitoring",
        FactorForm.BINARY,
        site.continuous_noise_monitoring,
    )

    # Community benefits
    _add(
        "community_benefit_agreement",
        FactorForm.BINARY,
        site.community_benefit_agreement,
    )
    _add(
        "broadband_extension_commitment",
        FactorForm.BINARY,
        site.broadband_extension_commitment,
    )
    _add(
        "local_vendor_contracts_committed",
        FactorForm.BINARY,
        site.local_vendor_contracts_committed,
    )
    _add(
        "projected_annual_tax_revenue_m",
        FactorForm.NUMERIC,
        site.projected_annual_tax_revenue_m,
    )

    # Employment: construction
    _add(
        "construction_jobs_local_pct",
        FactorForm.NUMERIC,
        site.construction_jobs_local_pct,
    )
    _add(
        "construction_duration_months",
        FactorForm.NUMERIC,
        site.construction_duration_months,
    )

    # Employment: permanent
    _add("permanent_ops_jobs_count", FactorForm.NUMERIC, site.permanent_ops_jobs_count)
    _add(
        "permanent_ops_wage_vs_county_median",
        FactorForm.NUMERIC,
        site.permanent_ops_wage_vs_county_median,
    )
    _add(
        "workforce_transition_program",
        FactorForm.BINARY,
        site.workforce_transition_program,
    )

    # Supply-side readiness
    _add("gpu_supply_secured", FactorForm.CATEGORICAL, site.gpu_supply_secured)
    _add("cooling_technology", FactorForm.CATEGORICAL, site.cooling_technology)
    _add("pue_target", FactorForm.NUMERIC, site.pue_target)
    _add("renewable_energy_pct", FactorForm.NUMERIC, site.renewable_energy_pct)

    return Candidate(
        candidate_id=site.candidate_id,
        candidate_name=site.candidate_name,
        factor_values=fv,
        metadata={"county": site.county},
    )


def _evaluate_constraint_rule(
    site: CandidateSite,
    rule: ConstraintRule,
    policy: Policy,
) -> AdmissibilityIssue:
    """Re-derive pass/fail for a single constraint rule against a site.

    The core engine returns only aggregate admissible; per-rule findings
    are reconstructed here by projecting the single factor and re-evaluating.

    Args:
        site: The candidate site.
        rule: The constraint rule to evaluate.
        policy: The full policy (used to construct a minimal candidate).

    Returns:
        AdmissibilityIssue with pass/fail and message.
    """
    from multidimensional_evaluation_engine.policy.policy import Policy as CorePolicy

    # Build a minimal single-factor candidate and single-rule policy
    core_candidate = _site_to_candidate(site)

    single_rule_policy = CorePolicy(
        factor_specs=policy.factor_specs,
        constraint_rules=[rule],
        score_rules=[],
        interpretation={},
    )

    result = evaluate_candidate(core_candidate, single_rule_policy)
    passed = result.scores.get("admissible", 0.0) == 1.0

    return AdmissibilityIssue(
        criterion=rule.rule_id,
        passed=passed,
        message=rule.message,
    )
