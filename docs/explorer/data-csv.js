// docs/explorer/data-csv.js

const DEFAULT_CSV = `site_id,site_name,county,zoning,distance_to_residential_m,water_stressed_basin,drought_sustainable,substation_capacity_available,interconnection_years,requires_major_new_transmission,operator_pays_grid_upgrades,demand_response_capable,continuous_noise_monitoring
MN001,North River Industrial,Example,industrial,1200,false,true,true,2.5,false,true,true,true
MN002,East Edge Mixed Use,Example,mixed_use,300,false,true,true,3.0,false,true,true,true
MN003,Western Basin Site,Example,industrial,900,true,false,true,2.0,false,true,true,true
MN004,Remote High Cost Site,Example,industrial,1500,false,true,false,6.5,true,false,false,false`;


function parseCsv(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV needs a header row and at least one data row');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i] ?? '');
    return obj;
  });
}


function serializeCsv(sites) {
  if (!sites.length) return "";

  const headers = [
    "site_id",
    "site_name",
    "county",
    "zoning",
    "distance_to_residential_m",
    "water_stressed_basin",
    "drought_sustainable",
    "substation_capacity_available",
    "interconnection_years",
    "requires_major_new_transmission",
    "operator_pays_grid_upgrades",
    "demand_response_capable",
    "continuous_noise_monitoring",
  ];

  const lines = [headers.join(",")];

  for (const site of sites) {
    lines.push(headers.map((key) => String(site[key] ?? "")).join(","));
  }

  return lines.join("\n");
}

function getCsvHeadersAndRows(text) {
  const lines = text.split('\n');
  const nonEmpty = lines.filter(line => line.trim());
  if (nonEmpty.length < 2) {
    throw new Error('CSV needs a header row and at least one data row');
  }

  const headers = nonEmpty[0].split(',').map(h => h.trim());
  const rows = nonEmpty.slice(1).map(line => line.split(',').map(v => v.trim()));

  return { headers, rows };
}

function parseCsvWithHeaders(text) {
  const { headers, rows } = getCsvHeadersAndRows(text);
  return rows.map(vals => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] ?? '';
    });
    return obj;
  });
}

function updateCsvRow(text, rowIndex, updatedRow) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV needs a header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const dataRows = lines.slice(1);

  if (rowIndex < 0 || rowIndex >= dataRows.length) {
    throw new Error('Row index out of range');
  }

  dataRows[rowIndex] = headers.map(header => String(updatedRow[header] ?? '')).join(',');

  return [lines[0], ...dataRows].join('\n');
}
