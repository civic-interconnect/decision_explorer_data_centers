"""reporting/tables.py: Plain-text reporting for evaluation outputs."""

from multidimensional_evaluation_engine.policy.policy import Policy

from ..domain.candidates import EvaluationResult

# Backwards compatibility alias
AdmissibilityResult = EvaluationResult

_WIDTH = 72
_BAR_WIDTH = 30


def _separator(char: str = "─") -> str:
    return char * _WIDTH


def _compute_max_score(policy: Policy) -> float:
    """Compute the theoretical maximum score from policy score rules."""
    total = 0.0
    for rule in policy.score_rules:
        if rule.numeric_bands:
            best = max((b.score for b in rule.numeric_bands), default=0.0)
        elif rule.categorical_scores:
            best = max(rule.categorical_scores.values(), default=0.0)
        elif rule.binary_scores:
            best = max(rule.binary_scores.values(), default=0.0)
        else:
            best = 0.0
        total += best * rule.weight
    return total


def _bar(score: float, max_score: float) -> str:
    """Render a simple ASCII progress bar."""
    filled = round((score / max_score) * _BAR_WIDTH) if max_score > 0 else 0
    return "█" * filled + "░" * (_BAR_WIDTH - filled)


def format_evaluation_results(
    results: list[EvaluationResult],
    policy: Policy | None = None,
) -> str:
    """Format full evaluation results as a readable plain-text report.

    Args:
        results: List of EvaluationResult objects.
        policy: Policy used for evaluation. If provided, the score bar
            is scaled to the theoretical maximum score derived from
            policy weights. If absent, falls back to the observed maximum.

    Returns:
        Formatted multi-line string suitable for logging or stdout.
    """
    lines: list[str] = []

    if policy is not None:
        max_score = _compute_max_score(policy)
    else:
        max_score = max((r.total_score for r in results), default=1.0)

    admissible_count = sum(1 for r in results if r.admissible)
    lines.append(_separator("═"))
    lines.append("  EVALUATION SUMMARY")
    lines.append(_separator("═"))
    lines.append(f"  Sites evaluated : {len(results)}")
    lines.append(f"  Admissible      : {admissible_count}")
    lines.append(f"  Not admissible  : {len(results) - admissible_count}")
    lines.append(f"  Max possible score : {max_score:.2f}")
    lines.append("")

    for result in results:
        status = "PASS" if result.admissible else "FAIL"
        interp = (
            f"  — {result.interpretation}"
            if result.interpretation and result.admissible
            else ""
        )
        lines.append(_separator())
        lines.append(
            f"  {result.site.candidate_id}"
            f"  {result.site.candidate_name}"
            f"  [{status}]{interp}"
        )
        if result.site.county:
            lines.append(f"  County: {result.site.county}")
        lines.append("")

        if result.admissible:
            lines.append(
                f"  Score  {result.total_score:5.2f} / {max_score:.2f}"
                f"  {_bar(result.total_score, max_score)}"
            )
            lines.append("")

        lines.append("  Constraints:")
        for issue in sorted(result.issues, key=lambda i: i.criterion):
            marker = "OK" if issue.passed else "NO"
            lines.append(f"    {marker}  {issue.criterion}: {issue.message}")
        lines.append("")

        if result.score_findings:
            lines.append("  Scores:")
            for f in result.score_findings:
                if f.weighted_score > 0.0:
                    lines.append(f"    {f.label:<48} {f.weighted_score:5.3f}")
            lines.append(f"    {'total':<48} {result.total_score:5.3f}")
            lines.append("")

            lines.append("  Category subtotals:")
            lines.append(
                f"    {'Community benefits':<48} {result.community_benefit_score:5.3f}"
            )
            lines.append(f"    {'Employment':<48} {result.employment_score:5.3f}")
            lines.append(
                f"    {'Supply-side readiness':<48} {result.supply_side_score:5.3f}"
            )
            lines.append("")

    lines.append(_separator("═"))
    return "\n".join(lines).rstrip()


def format_admissibility_results(
    results: list[EvaluationResult],
    policy: Policy | None = None,
) -> str:
    """Deprecated — delegates to format_evaluation_results().

    .. deprecated::
        Use format_evaluation_results() directly.
    """
    import warnings

    warnings.warn(
        "format_admissibility_results is deprecated; "
        "use format_evaluation_results() instead.",
        DeprecationWarning,
        stacklevel=2,
    )
    return format_evaluation_results(results, policy)
