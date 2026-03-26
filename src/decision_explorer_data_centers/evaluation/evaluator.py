"""evaluation/evaluator.py: Evaluation logic (slice 1)."""

from decision_explorer_data_centers.domain.scenario import (
    EvaluationResult,
    Scenario,
)


def evaluate_scenario(s: Scenario) -> EvaluationResult:
    reasons: list[str] = []

    if s.grid_capacity_margin < 0.10:
        return EvaluationResult(
            decision="REJECT",
            reason="Insufficient grid capacity margin.",
        )

    if s.water_stress_index > 0.6:
        return EvaluationResult(
            decision="REJECT",
            reason="High regional water stress.",
        )

    if s.proximity_to_population_km < 5:
        reasons.append("Close to population center (noise/impact risk).")

    if not s.noise_mitigation_plan:
        reasons.append("No noise mitigation plan.")

    if reasons:
        return EvaluationResult(
            decision="CONDITIONAL",
            reason="; ".join(reasons),
        )

    return EvaluationResult(
        decision="APPROVE",
        reason="All baseline conditions acceptable.",
    )
