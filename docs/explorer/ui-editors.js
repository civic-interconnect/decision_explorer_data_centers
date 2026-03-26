// docs/explorer/ui-editors.js


// ── Editors ────────────────────────────────────────────────────────
function syncEditors() {
  document.getElementById('csv-editor').value = state.csv || DEFAULT_CSV;
  document.getElementById('toml-editor').value = state.toml || DEFAULT_TOML;
  if (!state.csv) state.csv = DEFAULT_CSV;
  if (!state.toml) state.toml = DEFAULT_TOML;
  updateCsvRowLabel();
}

function updateCsvRowLabel() {
  try {
    const rows = parseCsv(state.csv || '');
    document.getElementById('csv-rows-label').textContent = rows.length + ' site' + (rows.length !== 1 ? 's' : '');
    document.getElementById('csv-parse-err').innerHTML = '';
  } catch(e) {
    document.getElementById('csv-parse-err').innerHTML = '<div class="parse-err">CSV error: ' + e.message + '</div>';
  }
}

function onEditorChange(type) {
  state[type] = document.getElementById(type + '-editor').value;
  if (type === 'csv') updateCsvRowLabel();
  if (type === 'toml') document.getElementById('toml-parse-err').innerHTML = '';
}

function addCsvRow() {
  const lines = (state.csv || '').split('\n').filter(l => l.trim());
  if (!lines.length) return;
  const headers = lines[0].split(',').map(h => h.trim());
  const newRow = headers.map((h, i) => {
    if (h === 'site_id') return 'MN00' + lines.length;
    if (h === 'site_name') return 'New Site';
    if (h === 'county') return 'Example';
    if (h === 'zoning') return 'industrial';
    if (h === 'distance_to_residential_m') return '600';
    if (h.includes('basin') || h.includes('stressed')) return 'false';
    if (h.includes('sustainable') || h.includes('available') || h.includes('capable') || h.includes('monitoring') || h.includes('pays')) return 'true';
    if (h.includes('major')) return 'false';
    if (h.includes('years')) return '3.0';
    return '';
  }).join(',');
  const newText = lines.join('\n') + '\n' + newRow;
  state.csv = newText;
  document.getElementById('csv-editor').value = newText;
  updateCsvRowLabel();
}

// ── Download ───────────────────────────────────────────────────────
function downloadFile(type) {
  const content = state[type] || '';
  const ext = type === 'csv' ? 'csv' : 'toml';
  const fname = 'sites.' + ext;
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  a.click();
}
