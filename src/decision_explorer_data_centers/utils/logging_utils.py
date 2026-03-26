"""utils/logging_utils.py: Logging helpers for the project."""

import logging
from pathlib import Path

from datafun_toolkit.logger import (
    get_logger as datafun_get_logger,
)
from datafun_toolkit.logger import (
    log_header as datafun_log_header,
)
from datafun_toolkit.logger import (
    log_path as datafun_log_path,
)

PROJECT_LOGGER_NAME = "Decision_Explorer"


def get_logger(name: str | None = None, level: str = "INFO") -> logging.Logger:
    """Return a configured project logger."""
    logger = datafun_get_logger(PROJECT_LOGGER_NAME, level=level)
    if name:
        return logger.getChild(name)
    return logger


def log_header(title: str, logger: logging.Logger | None = None) -> None:
    """Log a section header for a major run phase."""
    active_logger = logger or get_logger()
    datafun_log_header(active_logger, title)


def log_path(
    name: str,
    path: Path | str,
    logger: logging.Logger | None = None,
) -> None:
    """Log a filesystem path."""
    active_logger = logger or get_logger()
    datafun_log_path(active_logger, name, Path(path))
