"""reporting/tables.py: Simple text-table reporting for first-slice outputs."""

from decision_explorer_data_centers.domain.sites import AdmissibilityResult


def format_admissibility_results(results: list[AdmissibilityResult]) -> str:
    """Format admissibility results as a readable plain-text report."""
    lines: list[str] = []
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        lines.append(f"{result.site.site_id} | {result.site.site_name} | {status}")
        for issue in result.issues:
            marker = "OK" if issue.passed else "NO"
            lines.append(f"  - {marker} | {issue.criterion}: {issue.message}")
        lines.append("")
    return "\n".join(lines).rstrip()
