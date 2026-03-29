"""tests/test_admissibility.py: Tests for admissibility evaluation."""

from pathlib import Path

from multidimensional_evaluation_engine.io.load_policy import load_policy

from decision_explorer_data_centers.domain.candidates import CandidateSite
from decision_explorer_data_centers.evaluation.admissibility import (
    evaluate_site_admissibility,
)


def make_site(**overrides) -> CandidateSite:
    """Create a baseline valid site and allow overrides."""
    base = {
        "candidate_id": "s1",
        "candidate_name": "Test Site",
        "county": "Example",
        "zoning": "industrial",
        "distance_to_residential_m": 1500.0,
        "water_stressed_basin": False,
        "drought_sustainable": True,
        "substation_capacity_available": True,
        "interconnection_years": 2.0,
        "requires_major_new_transmission": False,
        "operator_pays_grid_upgrades": True,
        "demand_response_capable": True,
        "continuous_noise_monitoring": True,
    }
    base.update(overrides)
    return CandidateSite(**base)


def load_test_policy() -> Path:
    """Return path to example policy used in tests."""
    return Path("data/raw/example_policy.toml")


# ---------------------------------------------------------------------------
# Core behavior
# ---------------------------------------------------------------------------


def test_all_constraints_pass() -> None:
    policy = load_policy(load_test_policy())
    site = make_site()

    result = evaluate_site_admissibility(site, policy)

    assert result.passed is True
    assert len(result.issues) > 0
    assert all(issue.passed for issue in result.issues)


def test_single_constraint_failure() -> None:
    policy = load_policy(load_test_policy())

    # violate zoning rule
    site = make_site(zoning="mixed_use")

    result = evaluate_site_admissibility(site, policy)

    assert result.passed is False
    assert any(not issue.passed for issue in result.issues)


def test_multiple_constraint_failures() -> None:
    policy = load_policy(load_test_policy())

    site = make_site(
        zoning="mixed_use",
        water_stressed_basin=True,
        substation_capacity_available=False,
    )

    result = evaluate_site_admissibility(site, policy)

    failed = [issue for issue in result.issues if not issue.passed]

    assert result.passed is False
    assert len(failed) >= 2


# ---------------------------------------------------------------------------
# Comparator correctness
# ---------------------------------------------------------------------------


def test_numeric_threshold_ge_passes() -> None:
    policy = load_policy(load_test_policy())

    site = make_site(distance_to_residential_m=500.0)

    result = evaluate_site_admissibility(site, policy)

    assert result.passed is True


def test_numeric_threshold_ge_fails() -> None:
    policy = load_policy(load_test_policy())

    site = make_site(distance_to_residential_m=100.0)

    result = evaluate_site_admissibility(site, policy)

    assert result.passed is False


def test_boolean_constraint_enforced() -> None:
    policy = load_policy(load_test_policy())

    site = make_site(demand_response_capable=False)

    result = evaluate_site_admissibility(site, policy)

    assert result.passed is False


def test_in_comparator() -> None:
    policy = load_policy(load_test_policy())

    # allowed
    site_ok = make_site(zoning="industrial")
    result_ok = evaluate_site_admissibility(site_ok, policy)
    assert result_ok.passed is True

    # not allowed
    site_bad = make_site(zoning="residential")
    result_bad = evaluate_site_admissibility(site_bad, policy)
    assert result_bad.passed is False
