"""Tests for admissibility evaluation."""

from decision_explorer_data_centers.domain.sites import CandidateSite
from decision_explorer_data_centers.evaluation.admissibility import (
    evaluate_site_admissibility,
)
from decision_explorer_data_centers.policy.example_minnesota import MinnesotaPolicy


def build_policy() -> MinnesotaPolicy:
    return MinnesotaPolicy(
        preferred_zoning=("industrial",),
        minimum_distance_to_residential_m=500.0,
        maximum_interconnection_years=5.0,
        require_drought_sustainable=True,
        reject_water_stressed_basin=True,
        require_operator_pays_grid_upgrades=True,
        require_demand_response_capable=True,
        require_continuous_noise_monitoring=True,
        reject_major_new_transmission=True,
    )


def test_site_passes_when_all_constraints_are_met() -> None:
    site = CandidateSite(
        site_id="MN001",
        site_name="Passing Site",
        county="Example",
        zoning="industrial",
        distance_to_residential_m=1000.0,
        water_stressed_basin=False,
        drought_sustainable=True,
        substation_capacity_available=True,
        interconnection_years=2.0,
        requires_major_new_transmission=False,
        operator_pays_grid_upgrades=True,
        demand_response_capable=True,
        continuous_noise_monitoring=True,
    )

    result = evaluate_site_admissibility(site, build_policy())
    assert result.passed is True
    assert len(result.failed_issues) == 0


def test_site_fails_when_too_close_to_residential() -> None:
    site = CandidateSite(
        site_id="MN002",
        site_name="Too Close",
        county="Example",
        zoning="industrial",
        distance_to_residential_m=250.0,
        water_stressed_basin=False,
        drought_sustainable=True,
        substation_capacity_available=True,
        interconnection_years=2.0,
        requires_major_new_transmission=False,
        operator_pays_grid_upgrades=True,
        demand_response_capable=True,
        continuous_noise_monitoring=True,
    )

    result = evaluate_site_admissibility(site, build_policy())
    assert result.passed is False
    assert any(
        issue.criterion == "distance_to_residential" for issue in result.failed_issues
    )
