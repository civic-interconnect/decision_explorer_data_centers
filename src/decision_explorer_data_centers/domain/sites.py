"""domain/sites.py: Domain models for candidate sites and admissibility results."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class CandidateSite:
    """A candidate data center site with simplified first-slice inputs."""

    site_id: str
    site_name: str
    county: str
    zoning: str
    distance_to_residential_m: float
    water_stressed_basin: bool
    drought_sustainable: bool
    substation_capacity_available: bool
    interconnection_years: float
    requires_major_new_transmission: bool
    operator_pays_grid_upgrades: bool
    demand_response_capable: bool
    continuous_noise_monitoring: bool


@dataclass(frozen=True)
class AdmissibilityIssue:
    """A single pass/fail finding for a site."""

    criterion: str
    passed: bool
    message: str


@dataclass(frozen=True)
class AdmissibilityResult:
    """Structured admissibility result for a candidate site."""

    site: CandidateSite
    passed: bool
    issues: tuple[AdmissibilityIssue, ...] = field(default_factory=tuple)

    @property
    def failed_issues(self) -> tuple[AdmissibilityIssue, ...]:
        """Return only failed issues."""
        return tuple(issue for issue in self.issues if not issue.passed)
