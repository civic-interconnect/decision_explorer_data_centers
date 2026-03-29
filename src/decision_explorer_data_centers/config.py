"""config.py: Project-level configuration helpers.
This file contains global constants and helper functions for the project.
It is imported by other modules to access shared configuration values and logic.
"""

from pathlib import Path
from typing import Final

from multidimensional_evaluation_engine.utils.logging_utils import (
    get_logger,
    log_header,
    log_path,
)

logger = get_logger(__name__)

# === DEFINE GLOBAL PATHS ===

PACKAGE_ROOT: Final[Path] = Path(__file__).resolve().parent
PROJECT_ROOT: Final[Path] = PACKAGE_ROOT.parent.parent.parent
DATA_ROOT: Final[Path] = PROJECT_ROOT / "data"
RAW_DATA_ROOT: Final[Path] = DATA_ROOT / "raw"


def log_project_paths() -> None:
    """Log shared project paths."""
    log_header("Project Paths", logger=logger)
    log_path("PACKAGE_ROOT", PACKAGE_ROOT, logger=logger)
    log_path("PROJECT_ROOT", PROJECT_ROOT, logger=logger)
    log_path("DATA_ROOT", DATA_ROOT, logger=logger)
    log_path("RAW_DATA_ROOT", RAW_DATA_ROOT, logger=logger)
