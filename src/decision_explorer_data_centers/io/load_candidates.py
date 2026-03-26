"""io/load_candidates.py: Load candidate site inputs from CSV."""

import csv
from pathlib import Path

from decision_explorer_data_centers.domain.sites import CandidateSite
from decision_explorer_data_centers.utils.logging_utils import get_logger

logger = get_logger(__name__)

_TRUE_VALUES = {"true", "1", "yes", "y"}
_FALSE_VALUES = {"false", "0", "no", "n"}


def _parse_bool(raw: str, field_name: str) -> bool:
    value = raw.strip().lower()
    if value in _TRUE_VALUES:
        return True
    if value in _FALSE_VALUES:
        return False
    raise ValueError(f"Invalid boolean for {field_name!r}: {raw!r}")


def load_candidate_sites(csv_path: Path) -> list[CandidateSite]:
    """Load candidate sites from a CSV file."""
    logger.info(f"Loading candidate sites from: {csv_path}")
    sites: list[CandidateSite] = []

    with csv_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            sites.append(
                CandidateSite(
                    site_id=row["site_id"].strip(),
                    site_name=row["site_name"].strip(),
                    county=row["county"].strip(),
                    zoning=row["zoning"].strip(),
                    distance_to_residential_m=float(row["distance_to_residential_m"]),
                    water_stressed_basin=_parse_bool(
                        row["water_stressed_basin"],
                        "water_stressed_basin",
                    ),
                    drought_sustainable=_parse_bool(
                        row["drought_sustainable"],
                        "drought_sustainable",
                    ),
                    substation_capacity_available=_parse_bool(
                        row["substation_capacity_available"],
                        "substation_capacity_available",
                    ),
                    interconnection_years=float(row["interconnection_years"]),
                    requires_major_new_transmission=_parse_bool(
                        row["requires_major_new_transmission"],
                        "requires_major_new_transmission",
                    ),
                    operator_pays_grid_upgrades=_parse_bool(
                        row["operator_pays_grid_upgrades"],
                        "operator_pays_grid_upgrades",
                    ),
                    demand_response_capable=_parse_bool(
                        row["demand_response_capable"],
                        "demand_response_capable",
                    ),
                    continuous_noise_monitoring=_parse_bool(
                        row["continuous_noise_monitoring"],
                        "continuous_noise_monitoring",
                    ),
                )
            )
    logger.info(f"Loaded {len(sites)} candidate sites.")
    return sites
