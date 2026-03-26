"""policy/example_minnesota.py: Example Minnesota policy configuration for first-slice admissibility."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ExampleMinnesotaPolicy:
    """First-slice admissibility policy for Minnesota-like exploration."""

    preferred_zoning: tuple[str, ...]
    minimum_distance_to_residential_m: float
    maximum_interconnection_years: float
    require_drought_sustainable: bool
    reject_water_stressed_basin: bool
    require_operator_pays_grid_upgrades: bool
    require_demand_response_capable: bool
    require_continuous_noise_monitoring: bool
    reject_major_new_transmission: bool

    @classmethod
    def from_dict(cls, data: dict) -> "ExampleMinnesotaPolicy":
        """Create a policy object from TOML-loaded data."""
        site = data["site"]
        operations = data["operations"]
        infrastructure = data["infrastructure"]

        return cls(
            preferred_zoning=tuple(site["preferred_zoning"]),
            minimum_distance_to_residential_m=float(
                site["minimum_distance_to_residential_m"]
            ),
            maximum_interconnection_years=float(
                infrastructure["maximum_interconnection_years"]
            ),
            require_drought_sustainable=bool(site["require_drought_sustainable"]),
            reject_water_stressed_basin=bool(site["reject_water_stressed_basin"]),
            require_operator_pays_grid_upgrades=bool(
                infrastructure["require_operator_pays_grid_upgrades"]
            ),
            require_demand_response_capable=bool(
                operations["require_demand_response_capable"]
            ),
            require_continuous_noise_monitoring=bool(
                operations["require_continuous_noise_monitoring"]
            ),
            reject_major_new_transmission=bool(
                infrastructure["reject_major_new_transmission"]
            ),
        )
