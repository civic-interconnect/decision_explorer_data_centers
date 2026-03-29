"""cli.py: Command-line entry point.

This module defines the CLI for the Decision Explorer Data Centers project.

It allows users to run admissibility evaluations on candidates and
explore example scenarios based on Minnesota policy values.

Runs admissibility evaluations on candidates against a policy file
and optionally exports results as JSON for the web Explorer.

Run:

    uv run python -m decision_explorer_data_centers.cli --candidates path/to/example_candidates.csv --policy path/to/example_policy.toml

Examples:

    uv run python -m decision_explorer_data_centers.cli --candidates data/raw/example_candidates.csv --policy data/raw/example_policy.toml

    uv run python -m decision_explorer_data_centers.cli --candidates data/raw/example_candidates.csv --policy data/raw/example_policy.toml --output-json docs/data/results.json
"""

import argparse
import json
from pathlib import Path

# from multidimensional_evaluation_engine.io.load_candidates import load_candidates
from multidimensional_evaluation_engine.io.load_policy import load_policy
from multidimensional_evaluation_engine.policy.policy import Policy
from multidimensional_evaluation_engine.utils.logging_utils import (
    get_logger,
    log_header,
    log_path,
)

from .config import log_project_paths
from .domain.candidates import AdmissibilityResult
from .evaluation.admissibility import (
    evaluate_site_admissibility,
)
from .evaluation.evaluator import evaluate_scenario
from .io.load_candidates import load_candidates
from .reporting.tables import format_admissibility_results
from .scenarios.example import get_scenario

logger = get_logger(__name__)


def build_parser() -> argparse.ArgumentParser:
    """Build the CLI parser."""
    parser = argparse.ArgumentParser(
        description="Explore admissibility of candidate data center sites."
    )
    parser.add_argument(
        "--candidates",
        type=Path,
        required=True,
        help="Path to example_candidates.csv",
    )
    parser.add_argument(
        "--policy",
        type=Path,
        required=True,
        help="Path to example_policy.toml",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        metavar="PATH",
        required=False,
        help="Write results as JSON",
    )

    return parser


def results_to_dict(results: list[AdmissibilityResult]) -> dict[str, object]:
    """Serialize admissibility results to a JSON-compatible dict."""
    sites = []
    for r in results:
        sites.append(
            {
                "candidate_id": r.site.candidate_id,
                "candidate_name": r.site.candidate_name,
                "passed": r.passed,
                "checks": [
                    {
                        "criterion": issue.criterion,
                        "passed": issue.passed,
                        "message": issue.message,
                    }
                    for issue in r.issues
                ],
            }
        )
    passed = sum(r.passed for r in results)
    return {
        "summary": {
            "total": len(results),
            "passed": passed,
            "failed": len(results) - passed,
        },
        "sites": sites,
    }


def main() -> None:
    """Run the CLI."""
    parser = build_parser()
    args = parser.parse_args()

    log_project_paths()
    log_header("Decision Explorer Run")

    logger.info("Starting admissibility exploration run.")
    log_path("Candidates", args.candidates)
    log_path("Policy", args.policy)

    policy: Policy = load_policy(args.policy)
    sites = load_candidates(args.candidates, policy)

    log_header("Evaluate Candidate Site Admissibility")
    results = [evaluate_site_admissibility(site, policy) for site in sites]

    passed_count = sum(result.passed for result in results)
    failed_count = len(results) - passed_count
    logger.info(
        f"Exploration complete. Passed: {passed_count} | Failed: {failed_count}"
    )

    logger.info("\n%s", format_admissibility_results(results))

    log_header("Evaluate Example Scenario")
    scenario = get_scenario()
    scenario_result = evaluate_scenario(scenario)

    logger.info("Scenario: %s", scenario.name)
    logger.info("Scenario decision: %s", scenario_result.decision)
    logger.info("Scenario reason: %s", scenario_result.reason)

    if args.output_json:
        args.output_json.parent.mkdir(parents=True, exist_ok=True)
        args.output_json.write_text(json.dumps(results_to_dict(results), indent=2))
        log_path("Output file", args.output_json)


if __name__ == "__main__":
    main()
