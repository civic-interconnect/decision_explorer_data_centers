// docs/explorer/evaluator.js

function evaluate(site, pol) {
  const checks = [];
  const ok = (key, msg) => checks.push({ key, ok: true, msg });
  const no = (key, msg) => checks.push({ key, ok: false, msg });
  const b = v => String(v).toLowerCase() === 'true';
  const n = v => parseFloat(v);

  pol.zoning.includes(site.zoning)
    ? ok('zoning', `'${site.zoning}' is in allowed set`)
    : no('zoning', `'${site.zoning}' not in allowed set (${pol.zoning.join(', ')})`);

  n(site.distance_to_residential_m) >= pol.min_dist
    ? ok('distance_to_residential', `${site.distance_to_residential_m} m meets minimum ${pol.min_dist} m`)
    : no('distance_to_residential', `${site.distance_to_residential_m} m below minimum ${pol.min_dist} m`);

  if (pol.water)
    !b(site.water_stressed_basin)
      ? ok('water_stressed_basin', 'Not in water-stressed basin')
      : no('water_stressed_basin', 'Site is in a water-stressed basin');

  if (pol.drought)
    b(site.drought_sustainable)
      ? ok('drought_sustainable', 'Sustainable under drought conditions')
      : no('drought_sustainable', 'Not sustainable under drought conditions');

  b(site.substation_capacity_available)
    ? ok('substation_capacity', 'Substation capacity available')
    : no('substation_capacity', 'Substation capacity not available');

  n(site.interconnection_years) <= pol.max_interconnect
    ? ok('interconnection_timeline', `${site.interconnection_years} yrs within max ${pol.max_interconnect} yrs`)
    : no('interconnection_timeline', `${site.interconnection_years} yrs exceeds max ${pol.max_interconnect} yrs`);

  if (pol.reject_major_tx)
    !b(site.requires_major_new_transmission)
      ? ok('major_new_transmission', 'No major new transmission required')
      : no('major_new_transmission', 'Requires major new transmission');

  if (pol.op_pays)
    b(site.operator_pays_grid_upgrades)
      ? ok('grid_upgrade_cost_allocation', 'Operator pays grid upgrade costs')
      : no('grid_upgrade_cost_allocation', 'Operator does not pay grid upgrade costs');

  if (pol.demand_resp)
    b(site.demand_response_capable)
      ? ok('demand_response_capable', 'Supports demand response')
      : no('demand_response_capable', 'Does not support demand response');

  if (pol.noise_mon)
    b(site.continuous_noise_monitoring)
      ? ok('continuous_noise_monitoring', 'Noise monitoring provided')
      : no('continuous_noise_monitoring', 'Noise monitoring not provided');

  return { pass: checks.every(c => c.ok), checks };
}
