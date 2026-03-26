"""domain/scenario.py: Core domain structures."""

from dataclasses import dataclass
from typing import Literal

Decision = Literal["APPROVE", "CONDITIONAL", "REJECT"]


@dataclass(frozen=True)
class Scenario:
    name: str
    grid_capacity_margin: float
    water_stress_index: float
    proximity_to_population_km: float
    noise_mitigation_plan: bool


@dataclass(frozen=True)
class EvaluationResult:
    decision: Decision
    reason: str
