
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const idx = ['load','edit-p','edit-s','results'].indexOf(tab);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  document.getElementById('page-' + tab).classList.add('active');

  if (tab === 'edit-p' || tab === 'edit-s') {
    syncEditors();
  }
  if (tab === 'results') {
    renderResults();
  }
}
