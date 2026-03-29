"""io/load_candidates.py: Load candidate site inputs from CSV via core engine."""

from pathlib import Path

from multidimensional_evaluation_engine.domain.candidates import Candidate
from multidimensional_evaluation_engine.io.load_candidates import (
    load_candidates as load_core_candidates,
)
from multidimensional_evaluation_engine.policy.policy import Policy
from multidimensional_evaluation_engine.utils.logging_utils import get_logger

from ..domain.candidates import CandidateSite

logger = get_logger(__name__)


def load_candidates(csv_path: Path, policy: Policy) -> list[CandidateSite]:
    """Load candidate sites from CSV using core factor specs.

    Args:
        csv_path: Path to candidate CSV file.
        policy: Policy object used to provide factor specs.

    Returns:
        List of CandidateSite objects for the current domain evaluator.
    """
    logger.info(f"Loading candidates from: {csv_path}")

    core_candidates: list[Candidate] = load_core_candidates(
        csv_path, policy.factor_specs
    )
    candidates = [_candidate_to_site(candidate) for candidate in core_candidates]

    logger.info(f"Loaded {len(candidates)} candidates.")
    return candidates


def _candidate_to_site(candidate: Candidate) -> CandidateSite:
    """Convert a core Candidate into a data-center CandidateSite."""
    values = candidate.factor_values
    logger.debug(
        f"Converting candidate {candidate.candidate_id!r} with factor values: {values}"
    )

    return CandidateSite(
        candidate_id=candidate.candidate_id,
        candidate_name=candidate.candidate_name,
        county=_require_str(candidate, "county"),
        zoning=_require_str(candidate, "zoning"),
        distance_to_residential_m=_require_float(
            candidate,
            "distance_to_residential_m",
        ),
        water_stressed_basin=_require_bool(candidate, "water_stressed_basin"),
        drought_sustainable=_require_bool(candidate, "drought_sustainable"),
        substation_capacity_available=_require_bool(
            candidate,
            "substation_capacity_available",
        ),
        interconnection_years=_require_float(candidate, "interconnection_years"),
        requires_major_new_transmission=_require_bool(
            candidate,
            "requires_major_new_transmission",
        ),
        operator_pays_grid_upgrades=_require_bool(
            candidate,
            "operator_pays_grid_upgrades",
        ),
        demand_response_capable=_require_bool(candidate, "demand_response_capable"),
        continuous_noise_monitoring=_require_bool(
            candidate,
            "continuous_noise_monitoring",
        ),
    )


def _require_str(candidate: Candidate, factor_id: str) -> str:
    """Return a required string factor value."""
    value = _require_value(candidate, factor_id)
    if not isinstance(value, str):
        raise TypeError(
            f"Candidate {candidate.candidate_id!r} factor {factor_id!r} "
            f"must be str, got {type(value).__name__}."
        )
    return value


def _require_float(candidate: Candidate, factor_id: str) -> float:
    """Return a required float factor value."""
    value = _require_value(candidate, factor_id)
    if isinstance(value, bool) or not isinstance(value, float):
        raise TypeError(
            f"Candidate {candidate.candidate_id!r} factor {factor_id!r} "
            f"must be float, got {type(value).__name__}."
        )
    return value


def _require_bool(candidate: Candidate, factor_id: str) -> bool:
    """Return a required bool factor value."""
    value = _require_value(candidate, factor_id)
    if not isinstance(value, bool):
        raise TypeError(
            f"Candidate {candidate.candidate_id!r} factor {factor_id!r} "
            f"must be bool, got {type(value).__name__}."
        )
    return value


def _require_value(
    candidate: Candidate,
    factor_id: str,
) -> str | float | bool:
    """Return a required primitive factor value."""
    if factor_id not in candidate.factor_values:
        raise KeyError(
            f"Candidate {candidate.candidate_id!r} is missing factor {factor_id!r}."
        )
    return candidate.factor_values[factor_id].value
