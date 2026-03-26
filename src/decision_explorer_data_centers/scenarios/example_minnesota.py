"""scenarios/example_minnesota.py: Example Minnesota scenario (values are for illustration only)."""

from decision_explorer_data_centers.domain.scenario import Scenario


def get_scenario() -> Scenario:
    return Scenario(
        name="Example: Minnesota",
        grid_capacity_margin=0.18,  # moderate capacity
        water_stress_index=0.25,  # relatively low stress
        proximity_to_population_km=15.0,  # semi-rural siting
        noise_mitigation_plan=True,
    )
