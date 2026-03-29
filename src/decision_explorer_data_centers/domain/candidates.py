"""domain/candidates.py: Domain models for candidates and evaluation results."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class CandidateSite:
    """A candidate data center site with all policy-relevant inputs.

    Fields are grouped by evaluation category:
      - Site / zoning
      - Water and environment
      - Grid and infrastructure
      - Community benefits
      - Employment: construction (temporary)
      - Employment: permanent (ongoing)
      - Supply-side readiness
    """

    # --- Identification ---
    candidate_id: str
    candidate_name: str
    county: str

    # --- Site / zoning ---
    zoning: str
    distance_to_residential_m: float

    # --- Water and environment ---
    water_stressed_basin: bool
    drought_sustainable: bool

    # --- Grid and infrastructure ---
    substation_capacity_available: bool
    interconnection_years: float
    requires_major_new_transmission: bool
    operator_pays_grid_upgrades: bool
    demand_response_capable: bool
    continuous_noise_monitoring: bool

    # --- Community benefits ---
    community_benefit_agreement: bool
    broadband_extension_commitment: bool
    local_vendor_contracts_committed: bool
    projected_annual_tax_revenue_m: float

    # --- Employment: construction (temporary) ---
    construction_jobs_local_pct: float
    construction_duration_months: float

    # --- Employment: permanent (ongoing) ---
    permanent_ops_jobs_count: float
    permanent_ops_wage_vs_county_median: float
    workforce_transition_program: bool

    # --- Supply-side readiness ---
    gpu_supply_secured: str  # "secured" | "partial" | "none"
    cooling_technology: str  # "immersion" | "liquid" | "air"
    pue_target: float
    renewable_energy_pct: float

    @property
    def has_cba(self) -> bool:
        """Return True if a formal Community Benefit Agreement is in place."""
        return self.community_benefit_agreement

    @property
    def permanent_wage_premium(self) -> str:
        """Qualitative label for permanent wage relative to county median."""
        ratio = self.permanent_ops_wage_vs_county_median
        if ratio >= 1.5:
            return "strong premium"
        if ratio >= 1.25:
            return "above median"
        if ratio >= 1.0:
            return "parity"
        return "below median"


@dataclass(frozen=True)
class AdmissibilityIssue:
    """A single pass/fail finding for one constraint criterion."""

    criterion: str
    passed: bool
    message: str


@dataclass(frozen=True)
class ScoreFinding:
    """A weighted score contribution from a single score rule."""

    rule_id: str
    factor_id: str
    raw_score: float
    weight: float
    weighted_score: float
    band: str = ""

    @property
    def label(self) -> str:
        """Human-readable rule label derived from rule_id."""
        return self.rule_id.replace("_", " ")


@dataclass(frozen=True)
class EvaluationResult:
    """Full evaluation result for a candidate site.

    Replaces AdmissibilityResult with a richer structure that includes
    scored findings, total score, and interpretation label alongside
    the pass/fail admissibility determination.

    Attributes:
        site: The evaluated candidate site.
        admissible: True iff all hard constraints passed.
        issues: All constraint findings (pass and fail).
        score_findings: Weighted score contributions per rule.
        total_score: Sum of all weighted scores.
        interpretation: Highest satisfied interpretation label, or "".
    """

    site: CandidateSite
    admissible: bool
    issues: tuple[AdmissibilityIssue, ...] = field(default_factory=tuple)
    score_findings: tuple[ScoreFinding, ...] = field(default_factory=tuple)
    total_score: float = 0.0
    interpretation: str = ""

    @property
    def failed_issues(self) -> tuple[AdmissibilityIssue, ...]:
        """Return only failed constraint issues."""
        return tuple(issue for issue in self.issues if not issue.passed)

    @property
    def passed_issues(self) -> tuple[AdmissibilityIssue, ...]:
        """Return only passed constraint issues."""
        return tuple(issue for issue in self.issues if issue.passed)

    @property
    def score_by_rule(self) -> dict[str, float]:
        """Return a mapping of rule_id to weighted score."""
        return {f.rule_id: f.weighted_score for f in self.score_findings}

    @property
    def community_benefit_score(self) -> float:
        """Return the total score from community benefit rules."""
        community_rules = {
            "community_benefit_agreement_score",
            "broadband_extension_score",
            "projected_tax_revenue_score",
            "local_vendor_contracts_score",
        }
        return sum(
            f.weighted_score
            for f in self.score_findings
            if f.rule_id in community_rules
        )

    @property
    def employment_score(self) -> float:
        """Return the total score from employment rules."""
        employment_rules = {
            "construction_local_hire_score",
            "construction_duration_score",
            "permanent_ops_jobs_score",
            "workforce_transition_score",
            "permanent_wage_score",
        }
        return sum(
            f.weighted_score
            for f in self.score_findings
            if f.rule_id in employment_rules
        )

    @property
    def supply_side_score(self) -> float:
        """Return the total score from supply-side readiness rules."""
        supply_rules = {
            "gpu_supply_score",
            "cooling_technology_score",
            "pue_score",
            "renewable_energy_score",
        }
        return sum(
            f.weighted_score for f in self.score_findings if f.rule_id in supply_rules
        )


# ---------------------------------------------------------------------------
# Backwards compatibility alias
# ---------------------------------------------------------------------------

#: AdmissibilityResult is retained as an alias for code that has not yet
#: migrated to EvaluationResult.
AdmissibilityResult = EvaluationResult
