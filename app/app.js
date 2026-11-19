const POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const KEY = 'vice-trophy-guide-progress-v1';
const SOURCE_LINKS = {
  'Exophase — GTA VI trophy page': 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  'PSNProfiles — GTA VI trophy list': 'https://psnprofiles.com/trophies/grand-theft-auto-vi'
};
const STAGES = [
  { n: 1, title: 'Stage 1 — Story first, carefully', text: 'Play the main story in order and treat every named mission, stranger finale and one-time scene as a one-chance moment: keep a manual save before each, and never overwrite your last chapter save. Chapter milestones cannot be missed, but the trophies flagged MISSABLE in this stage are the ones this whole roadmap order exists to protect.' },
  { n: 2, title: 'Stage 2 — Collectibles', text: 'With the story done, sweep Leonida in regions: meditation spots, card sets, stunt and vehicle counters, gang operations and full exploration all share the same ground, so one careful trip advances several trophies at once. Use the tracker notes to mark regions clean as you finish them.' },
  { n: 3, title: 'Stage 3 — Activities & mastery', text: 'Now chase skill and variety: shooting-range golds, drone races, races, robberies and partner feats. These are all repeatable in free roam, so they wait safely until after the story — and the practice here is what makes the robbery and combat trophies feel routine.' },
  { n: 4, title: 'Stage 4 — Post-story cleanup', text: 'There are no explicitly online trophies in the official list, so this stage is the post-story cleanup instead: the money totals (laundering and spending), the last garage purchases, and the final push to 100% completion once every income stream is established.' },
  { n: 5, title: 'Stage 5 — The platinum', text: 'When the other 54 trophies are earned, the platinum — Vice Got a Price! — is awarded automatically. If you followed the stages in order, the last trophy you earn should be a formality: check the tracker, confirm nothing is left at 54/55, and let the legend pop.' }
];
const params = new URLSearchParams(location.search);
const state = { trophies: [], earned: new Set(), view: 'trophies', kind: 'all', grade: 'all', search: '', hideEarned: false, spoiler: false, detail: null };

function loadProgress() {
  try { const raw = localStorage.getItem(KEY); if (raw) state.earned = new Set(JSON.parse(raw).earned || []); } catch {}
}
function saveProgress() {
  try { localStorage.setItem(KEY, JSON.stringify({ v: 1, earned: [...state.earned] })); } catch {}
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function masked(t) { return state.spoiler && t.kind === 'story' && !state.earned.has(t.id); }

function renderProgress() {
  const totalPts = state.trophies.reduce((a, t) => a + (POINTS[t.grade] || 0), 0);
  const pts = state.trophies.filter(t => state.earned.has(t.id)).reduce((a, t) => a + (POINTS[t.grade] || 0), 0);
  document.getElementById('progress-count').textContent = state.earned.size + '/' + state.trophies.length;
  document.getElementById('progress-points').textContent = pts;
  document.getElementById('progress-total').textContent = totalPts;
  const pct = state.trophies.length ? Math.round(state.earned.size / state.trophies.length * 100) : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '% to the platinum';
}

function detailHtml(t) {
  const srcs = t.sources.map(s => SOURCE_LINKS[s] ? '<a href="' + SOURCE_LINKS[s] + '" rel="noopener">' + esc(s) + '</a>' : esc(s)).join(' · ');
  return '<div class="detail">'
    + (t.missable ? '<p class="warn"><strong>MISSABLE —</strong> flagged from its official description: it names a specific mission, finale, unique target or one-time moment. Keep a save before it.</p>' : '')
    + '<p>' + esc(t.guide) + '</p>'
    + '<ol>' + t.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>'
    + '<p class="sources">Sources: ' + srcs + '</p></div>';
}

function renderList() {
  const q = state.search.toLowerCase();
  const rows = state.trophies.filter(t =>
    (state.kind === 'all' || t.kind === state.kind) &&
    (state.grade === 'all' || t.grade === state.grade) &&
    (!state.hideEarned || !state.earned.has(t.id)) &&
    (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)));
  document.getElementById('empty-note').hidden = rows.length > 0;
  document.getElementById('trophy-list').innerHTML = rows.map(t => {
    const m = masked(t);
    const name = m ? 'Hidden trophy' : t.name;
    const desc = m ? 'Name and description hidden by the Spoiler shield until earned.' : t.description;
    return '<article class="row' + (state.earned.has(t.id) ? ' earned' : '') + '" data-id="' + t.id + '">'
      + '<div class="row-head"><span class="dot g-' + t.grade + '"></span>'
      + '<div class="row-main"><div class="row-name">' + esc(name) + '</div><div class="row-desc">' + esc(desc) + '</div>'
      + '<div class="tags"><span class="tag grade">' + esc(t.grade) + '</span><span class="tag">' + esc(t.kind) + '</span>'
      + (t.missable ? '<span class="tag missable">Missable</span>' : '')
      + (t.count ? '<span class="tag count">Target: ' + t.count.toLocaleString('en-US') + '</span>' : '')
      + '<span class="tag">Stage ' + t.stage + '</span></div></div>'
      + '<label class="earn"><input type="checkbox" class="earn-box" data-id="' + t.id + '"' + (state.earned.has(t.id) ? ' checked' : '') + '> Earned</label></div>'
      + (state.detail === t.id ? detailHtml(t) : '')
      + '</article>';
  }).join('');
  document.querySelectorAll('.earn-box').forEach(b => b.addEventListener('change', e => {
    const id = Number(e.target.dataset.id);
    if (e.target.checked) state.earned.add(id); else state.earned.delete(id);
    saveProgress(); renderProgress(); renderList();
  }));
  document.querySelectorAll('.row').forEach(r => r.addEventListener('click', e => {
    if (e.target.closest('.earn') || e.target.closest('.detail') || e.target.closest('a')) return;
    const id = Number(r.dataset.id);
    state.detail = state.detail === id ? null : id;
    renderList();
  }));
}

function renderRoadmap() {
  document.getElementById('roadmap-list').innerHTML = STAGES.map(s => {
    const items = state.trophies.filter(t => t.stage === s.n);
    return '<div class="stage"><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p><ul>'
      + items.map(t => '<li>' + esc(t.name) + ' <span class="muted">(' + esc(t.grade) + ')</span>' + (t.missable ? ' <span class="tag missable">Missable</span>' : '') + '</li>').join('')
      + '</ul></div>';
  }).join('');
}

function setView(v) {
  state.view = v;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.getElementById('view-trophies').hidden = v !== 'trophies';
  document.getElementById('view-roadmap').hidden = v !== 'roadmap';
  document.getElementById('view-about').hidden = v !== 'about';
}

async function init() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  state.trophies = data.trophies;
  loadProgress();
  if (params.has('earned')) params.get('earned').split(',').map(x => parseInt(x, 10)).filter(Number.isFinite).forEach(id => state.earned.add(id));
  if (params.get('spoiler') === '1') { state.spoiler = true; document.getElementById('spoiler-toggle').checked = true; }
  if (params.has('filter')) { state.kind = params.get('filter'); document.querySelectorAll('#kind-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.kind === state.kind)); }
  if (params.has('detail')) state.detail = parseInt(params.get('detail'), 10);
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  document.getElementById('search').addEventListener('input', e => { state.search = e.target.value; renderList(); });
  document.querySelectorAll('#kind-chips .chip').forEach(c => c.addEventListener('click', () => { state.kind = c.dataset.kind; document.querySelectorAll('#kind-chips .chip').forEach(x => x.classList.toggle('active', x === c)); renderList(); }));
  document.getElementById('grade-filter').addEventListener('change', e => { state.grade = e.target.value; renderList(); });
  document.getElementById('hide-earned').addEventListener('change', e => { state.hideEarned = e.target.checked; renderList(); });
  document.getElementById('spoiler-toggle').addEventListener('change', e => { state.spoiler = e.target.checked; renderList(); });
  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ v: 1, earned: [...state.earned] }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vice-trophy-guide-progress.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  document.getElementById('import-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (Array.isArray(j.earned)) { state.earned = new Set(j.earned); saveProgress(); renderProgress(); renderList(); } } catch {}
  });
  renderProgress(); renderList(); renderRoadmap();
  setView(['trophies', 'roadmap', 'about'].includes(params.get('view')) ? params.get('view') : 'trophies');
  if (state.detail) { const el = document.querySelector('.row[data-id="' + state.detail + '"]'); if (el) el.scrollIntoView(); }
  window.__shotReady = true;
}
init();
