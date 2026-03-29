"""io/load_candidates.py: Load candidate site inputs from CSV.

Two-pass loading strategy:
  Pass 1 (engine): load factor values via core engine using policy factor_specs.
                   Engine handles type coercion via FactorForm.
  Pass 2 (domain): read metadata columns (candidate_id, candidate_name, county)
                   directly from the raw CSV row.

This keeps metadata columns out of factor_specs entirely, so the TOML
policy file only needs to declare fields that are actually evaluated.
"""

import csv
from pathlib import Path

from multidimensional_evaluation_engine.domain.candidates import Candidate
from multidimensional_evaluation_engine.io.load_candidates import (
    load_candidates as load_core_candidates,
)
from multidimensional_evaluation_engine.policy.policy import Policy
from multidimensional_evaluation_engine.utils.logging_utils import get_logger

from ..domain.candidates import CandidateSite

logger = get_logger(__name__)

# Columns read directly from the raw CSV row — not loaded as factor values.
_METADATA_COLUMNS = {"candidate_id", "candidate_name", "county"}


def load_candidates(csv_path: Path, policy: Policy) -> list[CandidateSite]:
    """Load candidate sites from CSV using a two-pass strategy.

    Pass 1: engine loads and type-coerces all factor values via factor_specs.
    Pass 2: domain loader reads metadata columns from raw CSV rows and merges.

    Args:
        csv_path: Path to candidate CSV file.
        policy: Policy object providing factor specs for the engine pass.

    Returns:
        List of CandidateSite objects.

    Raises:
        KeyError: If a required factor is missing from a candidate row.
        TypeError: If a factor value has the wrong type after coercion.
    """
    logger.info(f"Loading candidates from: {csv_path}")

    # Pass 1: engine loads factor values
    core_candidates: list[Candidate] = load_core_candidates(
        csv_path, policy.factor_specs
    )

    # Pass 2: read metadata directly from raw CSV
    metadata = _load_metadata(csv_path)

    candidates = [
        _build_site(candidate, metadata.get(candidate.candidate_id, {}))
        for candidate in core_candidates
    ]

    logger.info(f"Loaded {len(candidates)} candidates.")
    return candidates


def _load_metadata(csv_path: Path) -> dict[str, dict[str, str]]:
    """Read metadata columns from raw CSV, keyed by candidate_id.

    Args:
        csv_path: Path to candidate CSV file.

    Returns:
        Mapping of candidate_id to a dict of metadata column values.
    """
    metadata: dict[str, dict[str, str]] = {}
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            candidate_id = row.get("candidate_id", "").strip()
            if not candidate_id:
                continue
            metadata[candidate_id] = {
                col: row.get(col, "").strip() for col in _METADATA_COLUMNS if col in row
            }
    return metadata


def _build_site(candidate: Candidate, meta: dict[str, str]) -> CandidateSite:
    """Merge engine-loaded factor values with raw metadata into a CandidateSite.

    Args:
        candidate: Core Candidate with typed factor values.
        meta: Raw metadata dict for this candidate from the CSV.

    Returns:
        CandidateSite with all fields populated.
    """
    logger.debug(
        f"Building CandidateSite for {candidate.candidate_id!r} "
        f"with {len(candidate.factor_values)} factor values."
    )

    return CandidateSite(
        # --- Identification (from metadata pass) ---
        candidate_id=candidate.candidate_id,
        candidate_name=candidate.candidate_name,
        county=meta.get("county", ""),
        # --- Site / zoning ---
        zoning=_require_str(candidate, "zoning"),
        distance_to_residential_m=_require_float(
            candidate, "distance_to_residential_m"
        ),
        # --- Water and environment ---
        water_stressed_basin=_require_bool(candidate, "water_stressed_basin"),
        drought_sustainable=_require_bool(candidate, "drought_sustainable"),
        # --- Grid and infrastructure ---
        substation_capacity_available=_require_bool(
            candidate, "substation_capacity_available"
        ),
        interconnection_years=_require_float(candidate, "interconnection_years"),
        requires_major_new_transmission=_require_bool(
            candidate, "requires_major_new_transmission"
        ),
        operator_pays_grid_upgrades=_require_bool(
            candidate, "operator_pays_grid_upgrades"
        ),
        demand_response_capable=_require_bool(candidate, "demand_response_capable"),
        continuous_noise_monitoring=_require_bool(
            candidate, "continuous_noise_monitoring"
        ),
        # --- Community benefits ---
        community_benefit_agreement=_require_bool(
            candidate, "community_benefit_agreement"
        ),
        broadband_extension_commitment=_require_bool(
            candidate, "broadband_extension_commitment"
        ),
        local_vendor_contracts_committed=_require_bool(
            candidate, "local_vendor_contracts_committed"
        ),
        projected_annual_tax_revenue_m=_require_float(
            candidate, "projected_annual_tax_revenue_m"
        ),
        # --- Employment: construction (temporary) ---
        construction_jobs_local_pct=_require_float(
            candidate, "construction_jobs_local_pct"
        ),
        construction_duration_months=_require_float(
            candidate, "construction_duration_months"
        ),
        # --- Employment: permanent (ongoing) ---
        permanent_ops_jobs_count=_require_float(candidate, "permanent_ops_jobs_count"),
        permanent_ops_wage_vs_county_median=_require_float(
            candidate, "permanent_ops_wage_vs_county_median"
        ),
        workforce_transition_program=_require_bool(
            candidate, "workforce_transition_program"
        ),
        # --- Supply-side readiness ---
        gpu_supply_secured=_require_str(candidate, "gpu_supply_secured"),
        cooling_technology=_require_str(candidate, "cooling_technology"),
        pue_target=_require_float(candidate, "pue_target"),
        renewable_energy_pct=_require_float(candidate, "renewable_energy_pct"),
    )


# ---------------------------------------------------------------------------
# Private extraction helpers
# ---------------------------------------------------------------------------


def _require_value(
    candidate: Candidate,
    factor_id: str,
) -> str | float | bool:
    """Return a required primitive factor value.

    Raises:
        KeyError: If the factor is absent from the candidate.
    """
    if factor_id not in candidate.factor_values:
        raise KeyError(
            f"Candidate {candidate.candidate_id!r} is missing factor {factor_id!r}."
        )
    return candidate.factor_values[factor_id].value


def _require_str(candidate: Candidate, factor_id: str) -> str:
    """Return a required string factor value.

    Raises:
        KeyError: If the factor is absent.
        TypeError: If the value is not a string.
    """
    value = _require_value(candidate, factor_id)
    if not isinstance(value, str):
        raise TypeError(
            f"Candidate {candidate.candidate_id!r} factor {factor_id!r} "
            f"must be str, got {type(value).__name__}."
        )
    return value


def _require_float(candidate: Candidate, factor_id: str) -> float:
    """Return a required float factor value.

    Note:
        The bool check must precede the float check because bool is a
        subclass of float in Python.

    Raises:
        KeyError: If the factor is absent.
        TypeError: If the value is bool or not float.
    """
    value = _require_value(candidate, factor_id)
    if isinstance(value, bool) or not isinstance(value, float):
        raise TypeError(
            f"Candidate {candidate.candidate_id!r} factor {factor_id!r} "
            f"must be float, got {type(value).__name__}."
        )
    return value


def _require_bool(candidate: Candidate, factor_id: str) -> bool:
    """Return a required bool factor value.

    Raises:
        KeyError: If the factor is absent.
        TypeError: If the value is not bool.
    """
    value = _require_value(candidate, factor_id)
    if not isinstance(value, bool):
        raise TypeError(
            f"Candidate {candidate.candidate_id!r} factor {factor_id!r} "
            f"must be bool, got {type(value).__name__}."
        )
    return value
