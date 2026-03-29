"""evaluation/admissibility.py: Hard-constraint admissibility checks."""

from multidimensional_evaluation_engine.policy.policy import (
    Policy,
)
from multidimensional_evaluation_engine.utils.logging_utils import get_logger

from ..domain.candidates import (
    AdmissibilityIssue,
    AdmissibilityResult,
    CandidateSite,
)

logger = get_logger(__name__)


def evaluate_site_admissibility(
    site: CandidateSite,
    policy: Policy,
) -> AdmissibilityResult:
    """Evaluate admissibility using policy constraint rules."""

    issues: list[AdmissibilityIssue] = []

    for rule in policy.constraint_rules:
        value = getattr(site, rule.factor_id)

        passed = _evaluate_rule(value, rule.comparator.value, rule.threshold)

        issues.append(
            AdmissibilityIssue(
                criterion=rule.rule_id,  # stable key
                message=rule.message,  # human-readable
                passed=passed,
            )
        )

    overall_passed = all(issue.passed for issue in issues)

    return AdmissibilityResult(
        site=site,
        passed=overall_passed,
        issues=tuple(issues),
    )


def _evaluate_rule(value, comparator: str, threshold) -> bool:
    if comparator == "eq":
        return value == threshold
    if comparator == "ne":
        return value != threshold
    if comparator == "ge":
        return value >= threshold
    if comparator == "le":
        return value <= threshold
    if comparator == "gt":
        return value > threshold
    if comparator == "lt":
        return value < threshold
    if comparator == "in":
        return value in threshold

    raise ValueError(f"Unsupported comparator: {comparator}")
