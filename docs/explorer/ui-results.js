// docs/explorer/ui-results.js

// ── Results ────────────────────────────────────────────────────────
function runAndGoResults() {
  state.csv = document.getElementById('csv-editor').value;
  state.toml = document.getElementById('toml-editor').value;
  switchTab('results');
}

function renderResults() {
  const container = document.getElementById('results-content');
  if (!state.csv || !state.toml) {
    container.innerHTML = '<p style="color:var(--text-faint);font-family:var(--mono);font-size:12px">Load data first (Load tab) or use example data.</p>';
    return;
  }

  let sites, toml, policy;
  try {
    sites = parseCsv(state.csv);
  } catch(e) {
    container.innerHTML = '<div class="parse-err">CSV parse error: ' + e.message + '</div>';
    return;
  }
  try {
    toml = parseToml(state.toml);
    policy = buildPolicy(toml);
  } catch(e) {
    container.innerHTML = '<div class="parse-err">TOML parse error: ' + e.message + '</div>';
    return;
  }

  const results = sites.map(s => ({ ...s, ...evaluate(s, policy) }));
  const passing = results.filter(r => r.pass).length;
  const failing = results.filter(r => !r.pass).length;
  const failChecks = results.reduce((a, r) => a + r.checks.filter(c => !c.ok).length, 0);

  const detailId = selectedSite;
  const detailSite = results.find(r => r.site_id === detailId);

  container.innerHTML = `
    <div class="grid-4">
      <div class="stat-card"><div class="stat-label">Sites</div><div class="stat-val val-neutral">${results.length}</div></div>
      <div class="stat-card"><div class="stat-label">Passing</div><div class="stat-val val-pass">${passing}</div></div>
      <div class="stat-card"><div class="stat-label">Failing</div><div class="stat-val val-fail">${failing}</div></div>
      <div class="stat-card"><div class="stat-label">Criteria failures</div><div class="stat-val val-fail">${failChecks}</div></div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><span class="card-title">Sites</span></div>
        <div class="card-body" style="padding:0">
          <table class="site-table">
            <thead><tr><th>ID</th><th>Site</th><th>Result</th><th>Criteria</th></tr></thead>
            <tbody>
              ${results.map(r => `
              <tr class="${r.site_id === detailId ? 'selected' : ''}" onclick="selectSite('${r.site_id}')">
                <td style="font-family:var(--mono);font-size:12px;color:var(--text-faint)">${r.site_id}</td>
                <td>${r.site_name}</td>
                <td><span class="badge ${r.pass ? 'badge-pass' : 'badge-fail'}">${r.pass ? 'PASS' : 'FAIL'}</span></td>
                <td><div class="dots">${r.checks.map(c => `<div class="dot ${c.ok ? 'dot-ok' : 'dot-no'}" title="${c.key}"></div>`).join('')}</div></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <span class="card-title">${detailSite ? detailSite.site_name + ' — ' + detailSite.site_id : 'Criteria detail'}</span>
          ${detailSite ? `<span class="badge ${detailSite.pass ? 'badge-pass' : 'badge-fail'}">${detailSite.pass ? 'PASS' : 'FAIL'}</span>` : ''}
        </div>
        <div class="card-body">
          ${detailSite
            ? detailSite.checks.map(c => `
              <div class="crit-row">
                <div class="crit-icon ${c.ok ? 'crit-ok' : 'crit-no'}">${c.ok ? '✓' : '✗'}</div>
                <div>
                  <div class="crit-key">${c.key.replace(/_/g, ' ')}</div>
                  <div class="crit-msg">${c.msg}</div>
                </div>
              </div>`).join('')
            : '<p style="color:var(--text-faint);font-size:12px;font-family:var(--mono)">← Select a site to see criteria breakdown</p>'
          }
        </div>
      </div>
    </div>`;
}

function selectSite(id) {
  selectedSite = selectedSite === id ? null : id;
  renderResults();
}
