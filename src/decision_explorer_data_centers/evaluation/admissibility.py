"""evaluation/admissibility.py: Hard-constraint admissibility checks."""

from decision_explorer_data_centers.domain.sites import (
    AdmissibilityIssue,
    AdmissibilityResult,
    CandidateSite,
)
from decision_explorer_data_centers.policy.example_minnesota import (
    ExampleMinnesotaPolicy,
)
from decision_explorer_data_centers.utils.logging_utils import get_logger

logger = get_logger(__name__)


def evaluate_site_admissibility(
    site: CandidateSite,
    policy: ExampleMinnesotaPolicy,
) -> AdmissibilityResult:
    """Evaluate whether a site passes first-slice admissibility checks."""
    issues: list[AdmissibilityIssue] = []

    zoning_passed = site.zoning in policy.preferred_zoning
    issues.append(
        AdmissibilityIssue(
            criterion="zoning",
            passed=zoning_passed,
            message=(
                f"Zoning {site.zoning!r} is allowed."
                if zoning_passed
                else (
                    f"Zoning {site.zoning!r} is not in allowed set "
                    f"{policy.preferred_zoning!r}."
                )
            ),
        )
    )

    distance_passed = (
        site.distance_to_residential_m >= policy.minimum_distance_to_residential_m
    )
    issues.append(
        AdmissibilityIssue(
            criterion="distance_to_residential",
            passed=distance_passed,
            message=(
                f"Distance to residential ({site.distance_to_residential_m:.1f} m) "
                "meets minimum."
                if distance_passed
                else (
                    f"Distance to residential ({site.distance_to_residential_m:.1f} m) "
                    f"is below minimum {policy.minimum_distance_to_residential_m:.1f} m."
                )
            ),
        )
    )

    water_stress_passed = True
    if policy.reject_water_stressed_basin:
        water_stress_passed = not site.water_stressed_basin
    issues.append(
        AdmissibilityIssue(
            criterion="water_stressed_basin",
            passed=water_stress_passed,
            message=(
                "Site is not in a water-stressed basin."
                if water_stress_passed
                else "Site is in a water-stressed basin."
            ),
        )
    )

    drought_passed = True
    if policy.require_drought_sustainable:
        drought_passed = site.drought_sustainable
    issues.append(
        AdmissibilityIssue(
            criterion="drought_sustainable",
            passed=drought_passed,
            message=(
                "Site is sustainable under drought conditions."
                if drought_passed
                else "Site is not sustainable under drought conditions."
            ),
        )
    )

    substation_passed = site.substation_capacity_available
    issues.append(
        AdmissibilityIssue(
            criterion="substation_capacity",
            passed=substation_passed,
            message=(
                "Substation capacity is available."
                if substation_passed
                else "Substation capacity is not currently available."
            ),
        )
    )

    interconnection_passed = (
        site.interconnection_years <= policy.maximum_interconnection_years
    )
    issues.append(
        AdmissibilityIssue(
            criterion="interconnection_timeline",
            passed=interconnection_passed,
            message=(
                f"Interconnection timeline ({site.interconnection_years:.1f} years) "
                "is within allowed range."
                if interconnection_passed
                else (
                    f"Interconnection timeline ({site.interconnection_years:.1f} years) "
                    f"exceeds maximum {policy.maximum_interconnection_years:.1f} years."
                )
            ),
        )
    )

    transmission_passed = True
    if policy.reject_major_new_transmission:
        transmission_passed = not site.requires_major_new_transmission
    issues.append(
        AdmissibilityIssue(
            criterion="major_new_transmission",
            passed=transmission_passed,
            message=(
                "Site does not require major new transmission."
                if transmission_passed
                else "Site requires major new transmission."
            ),
        )
    )

    grid_upgrade_cost_passed = True
    if policy.require_operator_pays_grid_upgrades:
        grid_upgrade_cost_passed = site.operator_pays_grid_upgrades
    issues.append(
        AdmissibilityIssue(
            criterion="grid_upgrade_cost_allocation",
            passed=grid_upgrade_cost_passed,
            message=(
                "Operator pays grid upgrade costs."
                if grid_upgrade_cost_passed
                else "Operator does not pay grid upgrade costs."
            ),
        )
    )

    demand_response_passed = True
    if policy.require_demand_response_capable:
        demand_response_passed = site.demand_response_capable
    issues.append(
        AdmissibilityIssue(
            criterion="demand_response_capable",
            passed=demand_response_passed,
            message=(
                "Site supports demand response."
                if demand_response_passed
                else "Site does not support demand response."
            ),
        )
    )

    noise_monitoring_passed = True
    if policy.require_continuous_noise_monitoring:
        noise_monitoring_passed = site.continuous_noise_monitoring
    issues.append(
        AdmissibilityIssue(
            criterion="continuous_noise_monitoring",
            passed=noise_monitoring_passed,
            message=(
                "Continuous noise monitoring is provided."
                if noise_monitoring_passed
                else "Continuous noise monitoring is not provided."
            ),
        )
    )

    passed = all(issue.passed for issue in issues)

    logger.info(
        "Admissibility result for site %s (%s): %s",
        site.site_id,
        site.site_name,
        "PASS" if passed else "FAIL",
    )

    return AdmissibilityResult(site=site, passed=passed, issues=tuple(issues))
