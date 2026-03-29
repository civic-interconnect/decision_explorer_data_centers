"""cli.py: Command-line entry point.

Runs multidimensional evaluation of candidate data center sites against
a policy file and optionally exports results as JSON for the web Explorer.

The framework characterizes and compares sites — it does not make
approval decisions. Results include constraint findings and weighted
score breakdowns across community benefits, employment, and supply-side
readiness categories.

Usage:

    uv run python -m decision_explorer_data_centers.cli \\
        --candidates data/raw/example_candidates.csv \\
        --policy data/raw/example_policy.toml

    uv run python -m decision_explorer_data_centers.cli \\
        --candidates data/raw/example_candidates.csv \\
        --policy data/raw/example_policy.toml \\
        --output-json docs/data/results.json
"""

import argparse
import json
from pathlib import Path

from multidimensional_evaluation_engine.io.load_policy import load_policy
from multidimensional_evaluation_engine.policy.policy import Policy
from multidimensional_evaluation_engine.utils.logging_utils import (
    get_logger,
    log_header,
    log_path,
)

from .config import log_project_paths
from .domain.candidates import EvaluationResult
from .evaluation.evaluator import evaluate_sites
from .io.load_candidates import load_candidates
from .reporting.tables import format_evaluation_results

logger = get_logger(__name__)


def build_parser() -> argparse.ArgumentParser:
    """Build the CLI argument parser."""
    parser = argparse.ArgumentParser(
        description=(
            "Evaluate candidate data center sites against a policy. "
            "Produces constraint findings and weighted score breakdowns."
        )
    )
    parser.add_argument(
        "--candidates",
        type=Path,
        required=True,
        help="Path to candidates CSV file.",
    )
    parser.add_argument(
        "--policy",
        type=Path,
        required=True,
        help="Path to policy TOML file.",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        metavar="PATH",
        required=False,
        help="Write evaluation results as JSON to this path.",
    )
    return parser


def results_to_dict(results: list[EvaluationResult]) -> dict[str, object]:
    """Serialize evaluation results to a JSON-compatible dict.

    Args:
        results: List of EvaluationResult objects.

    Returns:
        Dict with summary counts and per-site detail.
    """
    sites = []
    for r in results:
        sites.append(
            {
                "candidate_id": r.site.candidate_id,
                "candidate_name": r.site.candidate_name,
                "county": r.site.county,
                "admissible": r.admissible,
                "total_score": r.total_score,
                "interpretation": r.interpretation,
                "community_benefit_score": r.community_benefit_score,
                "employment_score": r.employment_score,
                "supply_side_score": r.supply_side_score,
                "constraints": [
                    {
                        "criterion": issue.criterion,
                        "passed": issue.passed,
                        "message": issue.message,
                    }
                    for issue in r.issues
                ],
                "scores": [
                    {
                        "rule_id": f.rule_id,
                        "factor_id": f.factor_id,
                        "weighted_score": f.weighted_score,
                        "weight": f.weight,
                    }
                    for f in r.score_findings
                ],
            }
        )

    admissible_count = sum(1 for r in results if r.admissible)
    return {
        "summary": {
            "total": len(results),
            "admissible": admissible_count,
            "not_admissible": len(results) - admissible_count,
        },
        "sites": sites,
    }


def main() -> None:
    """Run the CLI evaluation."""
    parser = build_parser()
    args = parser.parse_args()

    log_project_paths()
    log_header("Decision Explorer — Data Centers")

    logger.info("Starting evaluation run.")
    log_path("Candidates", args.candidates)
    log_path("Policy", args.policy)

    policy: Policy = load_policy(args.policy)
    sites = load_candidates(args.candidates, policy)

    log_header("Evaluate Candidate Sites")
    results = evaluate_sites(sites, policy)

    admissible_count = sum(1 for r in results if r.admissible)
    not_admissible_count = len(results) - admissible_count

    logger.info(
        f"Evaluation complete. "
        f"Admissible: {admissible_count} | Not admissible: {not_admissible_count}"
    )
    logger.info("\n%s", format_evaluation_results(results, policy))

    if args.output_json:
        args.output_json.parent.mkdir(parents=True, exist_ok=True)
        args.output_json.write_text(json.dumps(results_to_dict(results), indent=2))
        log_path("Output JSON", args.output_json)


if __name__ == "__main__":
    main()
