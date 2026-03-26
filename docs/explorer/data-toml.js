// docs/explorer/data-toml.js

const DEFAULT_TOML = `[site]
preferred_zoning = ["industrial"]
minimum_distance_to_residential_m = 500.0
require_drought_sustainable = true
reject_water_stressed_basin = true

[operations]
require_demand_response_capable = true
require_continuous_noise_monitoring = true

[infrastructure]
maximum_interconnection_years = 5.0
require_operator_pays_grid_upgrades = true
reject_major_new_transmission = true`;

function parseToml(text) {
  const result = {};
  let section = null;
  for (let raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1).trim();
      result[section] = {};
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    let parsed;
    if (val === 'true') parsed = true;
    else if (val === 'false') parsed = false;
    else if (!isNaN(Number(val))) parsed = Number(val);
    else if (val.startsWith('[') && val.endsWith(']')) {
      parsed = val.slice(1,-1).split(',').map(s => s.trim().replace(/^["']|["']$/g,''));
    } else parsed = val.replace(/^["']|["']$/g,'');
    if (section) result[section][key] = parsed;
    else result[key] = parsed;
  }
  return result;
}

function buildPolicy(toml) {
  const s = toml.site || {};
  const ops = toml.operations || {};
  const inf = toml.infrastructure || {};
  return {
    zoning: s.preferred_zoning || ['industrial'],
    min_dist: s.minimum_distance_to_residential_m ?? 500,
    drought: s.require_drought_sustainable ?? true,
    water: s.reject_water_stressed_basin ?? true,
    demand_resp: ops.require_demand_response_capable ?? true,
    noise_mon: ops.require_continuous_noise_monitoring ?? true,
    max_interconnect: inf.maximum_interconnection_years ?? 5,
    op_pays: inf.require_operator_pays_grid_upgrades ?? true,
    reject_major_tx: inf.reject_major_new_transmission ?? true,
  };
}
