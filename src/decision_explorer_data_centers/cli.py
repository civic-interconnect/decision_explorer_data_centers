"""cli.py: Command-line entry point.

This module defines the CLI for the Decision Explorer Data Centers project.

It allows users to run admissibility evaluations on candidate sites and
explore example scenarios based on Minnesota policy values.

Runs admissibility evaluations on candidate sites against a policy file
and optionally exports results as JSON for the web Explorer.

Run:

    uv run python -m decision_explorer_data_centers.cli --candidates path/to/example_candidate_sites.csv --policy path/to/example_minnesota_policy.toml

Examples:

    uv run python -m decision_explorer_data_centers.cli --candidates data/raw/example_candidate_sites.csv --policy data/raw/example_minnesota_policy.toml

    uv run python -m decision_explorer_data_centers.cli --candidates data/raw/example_candidate_sites.csv --policy data/raw/example_minnesota_policy.toml --output-json docs/data/results.json
"""

import argparse
import json
from pathlib import Path

from decision_explorer_data_centers.config import log_project_paths
from decision_explorer_data_centers.evaluation.admissibility import (
    evaluate_site_admissibility,
)
from decision_explorer_data_centers.evaluation.evaluator import evaluate_scenario
from decision_explorer_data_centers.io.load_candidates import load_candidate_sites
from decision_explorer_data_centers.io.load_policy import load_minnesota_policy
from decision_explorer_data_centers.reporting.tables import format_admissibility_results
from decision_explorer_data_centers.scenarios.example_minnesota import get_scenario
from decision_explorer_data_centers.utils.logging_utils import (
    get_logger,
    log_header,
    log_path,
)

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
        help="Path to example_candidate_sites.csv",
    )
    parser.add_argument(
        "--policy",
        type=Path,
        required=True,
        help="Path to example_minnesota_policy.toml",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        metavar="PATH",
        required=False,
        help="Write results as JSON",
    )

    return parser


def results_to_dict(results: list) -> dict:
    """Serialize admissibility results to a JSON-compatible dict."""
    sites = []
    for r in results:
        sites.append(
            {
                "site_id": r.site.site_id,
                "site_name": r.site.site_name,
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

    sites = load_candidate_sites(args.candidates)
    policy = load_minnesota_policy(args.policy)

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
