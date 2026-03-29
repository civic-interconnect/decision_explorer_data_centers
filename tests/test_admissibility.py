"""tests/test_admissibility.py: Tests for site evaluation."""

from pathlib import Path

from multidimensional_evaluation_engine.io.load_policy import load_policy

from decision_explorer_data_centers.domain.candidates import CandidateSite
from decision_explorer_data_centers.evaluation.evaluator import evaluate_site


def make_site(**overrides) -> CandidateSite:
    """Create a baseline valid site with all required fields and allow overrides."""
    base = {
        # Identification
        "candidate_id": "s1",
        "candidate_name": "Test Site",
        "county": "Example",
        # Site / zoning
        "zoning": "industrial",
        "distance_to_residential_m": 1500.0,
        # Water and environment
        "water_stressed_basin": False,
        "drought_sustainable": True,
        # Grid and infrastructure
        "substation_capacity_available": True,
        "interconnection_years": 2.0,
        "requires_major_new_transmission": False,
        "operator_pays_grid_upgrades": True,
        "demand_response_capable": True,
        "continuous_noise_monitoring": True,
        # Community benefits
        "community_benefit_agreement": True,
        "broadband_extension_commitment": True,
        "local_vendor_contracts_committed": True,
        "projected_annual_tax_revenue_m": 50.0,
        # Employment: construction
        "construction_jobs_local_pct": 60.0,
        "construction_duration_months": 24.0,
        # Employment: permanent
        "permanent_ops_jobs_count": 80.0,
        "permanent_ops_wage_vs_county_median": 1.4,
        "workforce_transition_program": True,
        # Supply-side readiness
        "gpu_supply_secured": "secured",
        "cooling_technology": "liquid",
        "pue_target": 1.15,
        "renewable_energy_pct": 80.0,
    }
    base.update(overrides)
    return CandidateSite(**base)


def load_test_policy() -> Path:
    """Return path to example policy used in tests."""
    return Path("data/raw/example_policy.toml")


# ---------------------------------------------------------------------------
# Core admissibility behavior
# ---------------------------------------------------------------------------


def test_all_constraints_pass() -> None:
    policy = load_policy(load_test_policy())
    site = make_site()

    result = evaluate_site(site, policy)

    assert result.admissible is True
    assert len(result.issues) > 0
    assert all(issue.passed for issue in result.issues)


def test_single_constraint_failure() -> None:
    policy = load_policy(load_test_policy())
    site = make_site(zoning="mixed_use")

    result = evaluate_site(site, policy)

    assert result.admissible is False
    assert any(not issue.passed for issue in result.issues)


def test_multiple_constraint_failures() -> None:
    policy = load_policy(load_test_policy())
    site = make_site(
        zoning="mixed_use",
        water_stressed_basin=True,
        substation_capacity_available=False,
    )

    result = evaluate_site(site, policy)
    failed = result.failed_issues

    assert result.admissible is False
    assert len(failed) >= 2


# ---------------------------------------------------------------------------
# Comparator correctness
# ---------------------------------------------------------------------------


def test_numeric_threshold_ge_passes() -> None:
    policy = load_policy(load_test_policy())
    site = make_site(distance_to_residential_m=500.0)

    result = evaluate_site(site, policy)

    assert result.admissible is True


def test_numeric_threshold_ge_fails() -> None:
    policy = load_policy(load_test_policy())
    site = make_site(distance_to_residential_m=100.0)

    result = evaluate_site(site, policy)

    assert result.admissible is False


def test_boolean_constraint_enforced() -> None:
    policy = load_policy(load_test_policy())
    site = make_site(demand_response_capable=False)

    result = evaluate_site(site, policy)

    assert result.admissible is False


def test_in_comparator() -> None:
    policy = load_policy(load_test_policy())

    result_ok = evaluate_site(make_site(zoning="industrial"), policy)
    assert result_ok.admissible is True

    result_bad = evaluate_site(make_site(zoning="residential"), policy)
    assert result_bad.admissible is False


# ---------------------------------------------------------------------------
# Score and interpretation
# ---------------------------------------------------------------------------


def test_score_is_positive_for_admissible_site() -> None:
    policy = load_policy(load_test_policy())
    site = make_site()

    result = evaluate_site(site, policy)

    assert result.admissible is True
    assert result.total_score > 0.0


def test_score_findings_present() -> None:
    policy = load_policy(load_test_policy())
    site = make_site()

    result = evaluate_site(site, policy)

    assert len(result.score_findings) > 0
    assert all(f.weighted_score >= 0.0 for f in result.score_findings)


def test_interpretation_present_for_strong_site() -> None:
    policy = load_policy(load_test_policy())
    # baseline site is strong across all dimensions
    site = make_site()

    result = evaluate_site(site, policy)

    assert result.interpretation != ""


def test_category_scores_sum_to_total() -> None:
    policy = load_policy(load_test_policy())
    site = make_site()

    result = evaluate_site(site, policy)

    category_sum = (
        result.community_benefit_score
        + result.employment_score
        + result.supply_side_score
    )
    # Infrastructure scores not in category properties; total may exceed sum
    assert result.total_score >= category_sum


def test_weak_community_benefits_lowers_score() -> None:
    policy = load_policy(load_test_policy())

    strong = make_site()
    weak = make_site(
        community_benefit_agreement=False,
        broadband_extension_commitment=False,
        local_vendor_contracts_committed=False,
        projected_annual_tax_revenue_m=5.0,
    )

    result_strong = evaluate_site(strong, policy)
    result_weak = evaluate_site(weak, policy)

    assert result_strong.community_benefit_score > result_weak.community_benefit_score


def test_workforce_transition_contributes_to_employment_score() -> None:
    policy = load_policy(load_test_policy())

    with_program = make_site(workforce_transition_program=True)
    without_program = make_site(workforce_transition_program=False)

    result_with = evaluate_site(with_program, policy)
    result_without = evaluate_site(without_program, policy)

    assert result_with.employment_score > result_without.employment_score


def test_gpu_supply_affects_supply_side_score() -> None:
    policy = load_policy(load_test_policy())

    secured = make_site(gpu_supply_secured="secured")
    none_ = make_site(gpu_supply_secured="none")

    result_secured = evaluate_site(secured, policy)
    result_none = evaluate_site(none_, policy)

    assert result_secured.supply_side_score > result_none.supply_side_score


# ---------------------------------------------------------------------------
# Backwards compatibility
# ---------------------------------------------------------------------------


def test_failed_issues_property() -> None:
    policy = load_policy(load_test_policy())
    site = make_site(zoning="mixed_use", water_stressed_basin=True)

    result = evaluate_site(site, policy)

    assert len(result.failed_issues) >= 2
    assert all(not issue.passed for issue in result.failed_issues)
