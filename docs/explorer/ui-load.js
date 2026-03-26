


function setData(type, text) {
  state[type] = text;
  updateHeaderStatus();
  showMsg(type, '✓ Loaded (' + text.split('\n').length + ' lines)', 'ok');
  document.getElementById(type + '-status-badge').innerHTML = '<span class="badge badge-pass">loaded</span>';
}

function showMsg(type, msg, kind) {
  const el = document.getElementById(type + '-msg');
  el.innerHTML = '<div class="status-msg status-' + kind + '">' + msg + '</div>';
}

function updateHeaderStatus() {
  const parts = [];
  if (state.csv) parts.push('csv');
  if (state.toml) parts.push('toml');
  document.getElementById('hdr-status').textContent = parts.length ? parts.join(' + ') + ' loaded' : 'no data loaded';
}

function handleFileUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => setData(type, e.target.result.trim());
  reader.readAsText(file);
}

function doDragOver(e, id) { e.preventDefault(); document.getElementById(id).classList.add('dragover'); }
function doDragLeave(id) { document.getElementById(id).classList.remove('dragover'); }
function doDrop(e, type) {
  e.preventDefault();
  const id = type + '-drop';
  document.getElementById(id).classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => setData(type, ev.target.result.trim());
  reader.readAsText(file);
}

async function fetchFromUrl(type) {
  const url = document.getElementById(type + '-url').value.trim();
  if (!url) return;
  showMsg(type, 'Fetching…', 'ok');
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    setData(type, text.trim());
  } catch(e) {
    showMsg(type, 'Error: ' + e.message, 'err');
  }
}

function loadDefaults() {
  setData('csv', DEFAULT_CSV);
  setData('toml', DEFAULT_TOML);
}
