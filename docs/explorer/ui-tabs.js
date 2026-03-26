
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const idx = ['load','edit','results'].indexOf(tab);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  document.getElementById('page-' + tab).classList.add('active');
  if (tab === 'edit') syncEditors();
  if (tab === 'results') renderResults();
}
