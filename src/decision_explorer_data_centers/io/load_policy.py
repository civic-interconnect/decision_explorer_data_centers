"""io/load_policy.py: Load policy values from TOML."""

import tomllib
from pathlib import Path

from decision_explorer_data_centers.policy.example_minnesota import (
    ExampleMinnesotaPolicy,
)
from decision_explorer_data_centers.utils.logging_utils import get_logger

logger = get_logger(__name__)


def load_minnesota_policy(toml_path: Path) -> ExampleMinnesotaPolicy:
    """Load a Minnesota policy definition from TOML."""
    logger.info(f"Loading Minnesota policy from: {toml_path}")
    with toml_path.open("rb") as file:
        data = tomllib.load(file)
    policy = ExampleMinnesotaPolicy.from_dict(data)
    logger.info("Loaded Minnesota policy.")
    return policy
