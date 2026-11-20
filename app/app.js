const POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const KEY = 'vice-trophy-guide-progress-v1';
const SOURCE_LINKS = {
  'Exophase — GTA VI trophy page': 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  'PSNProfiles — GTA VI trophy list': 'https://psnprofiles.com/trophies/grand-theft-auto-vi',
};
const STAGES = [
  { n: 1, title: 'Stage 1 — Story first, carefully', text: 'Play the main story in order; treat every named mission, stranger finale and one-time scene as a one-chance moment. Keep a manual save before each and never overwrite the last chapter save. Chapter milestones cannot be missed, but the missable trophies are what this order protects.' },
  { n: 2, title: 'Stage 2 — Collectibles', text: 'Sweep Leonida region by region after the story: meditation spots, card sets, stunt and vehicle counters, gang operations and full exploration share the same ground, so one careful trip advances several trophies at once. Mark regions clean in the tracker as you finish them.' },
  { n: 3, title: 'Stage 3 — Activities & mastery', text: 'Shooting-range golds, drone races, races, robberies and partner feats — all repeatable in free roam, so they wait safely until after the story. Practice here makes the robbery and combat trophies routine.' },
  { n: 4, title: 'Stage 4 — Post-story cleanup', text: 'There are no explicitly online trophies in the official list, so this stage is the cleanup: money totals — laundering and spending — the last garage purchases, and the final push to 100% once every income stream is established.' },
  { n: 5, title: 'Stage 5 — The platinum', text: "When the other 54 are earned, the platinum 'Vice Got a Price!' is awarded automatically. Confirm nothing is left at 54/55 and let it pop." },
];
const state = { trophies: [], earned: new Set(), view: 'trophies', kind: 'all', grade: 'all', search: '', hideEarned: false, spoiler: false, detail: null };
const $ = (id) => document.getElementById(id);
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function masked(t) { return state.spoiler && t.kind === 'story' && !state.earned.has(t.id); }
function dispName(t) { return masked(t) ? 'Hidden story trophy' : t.name; }
function dispDesc(t) { return masked(t) ? 'This story trophy is hidden by the spoiler shield. Earned story trophies are always revealed — earn it or turn the shield off to see it.' : t.description; }
function save() { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, earned: [...state.earned] })); } catch {} }
function loadProgress() { try { const raw = localStorage.getItem(KEY); if (!raw) return; const data = JSON.parse(raw); const arr = Array.isArray(data) ? data : data.earned; if (Array.isArray(arr)) for (const id of arr) if (Number.isInteger(id)) state.earned.add(id); } catch {} }
function renderProgress() {
  const total = state.trophies.length || 55;
  let totalPoints = 0; let earnedPoints = 0; let earnedCount = 0;
  for (const t of state.trophies) { totalPoints += POINTS[t.grade] || 0; if (state.earned.has(t.id)) { earnedPoints += POINTS[t.grade] || 0; earnedCount++; } }
  if (!state.trophies.length) { earnedCount = state.earned.size; }
  const pct = total ? Math.round((earnedCount / total) * 100) : 0;
  const c = $('progress-count'); if (c) c.textContent = earnedCount + '/' + total;
  const pp = $('progress-points'); if (pp) pp.textContent = String(earnedPoints);
  const pt = $('progress-total'); if (pt) pt.textContent = String(totalPoints);
  const bar = $('progress-bar'); if (bar) bar.style.width = pct + '%';
  const pc = $('progress-pct'); if (pc) pc.textContent = pct + '%';
}
function sourceHtml(name) { const url = SOURCE_LINKS[name]; return url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(name) + '</a>' : esc(name); }
function tagsHtml(t) {
  let h = '<div class="tags"><span class="tag grade-' + esc(t.grade) + '">' + esc(t.grade) + '</span><span class="tag">' + esc(t.kind) + '</span>';
  if (t.missable) h += '<span class="tag missable">Missable</span>';
  h += '<span class="tag stage">Stage ' + esc(t.stage) + '</span></div>';
  return h;
}
function detailHtml(t) {
  const isMasked = masked(t);
  let h = '<article class="detail-card">';
  h += '<button class="close-btn" id="detail-close" type="button">Close</button>';
  h += '<h3>' + esc(dispName(t)) + '</h3>';
  h += '<p class="row-desc">' + esc(dispDesc(t)) + '</p>';
  h += tagsHtml(t);
  if (t.missable) h += '<p class="warn">Missable: the official description ties this trophy to a one-time moment. Keep a manual save before it and do not overwrite that save until the trophy pops.</p>';
  if (isMasked) {
    h += '<p class="guide">Turn the spoiler shield off or earn this trophy to reveal its guide.</p>';
  } else {
    h += '<p class="guide">' + esc(t.guide || '') + '</p>';
    if (Array.isArray(t.steps) && t.steps.length) {
      h += '<h4>Steps</h4><ol>' + t.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>';
    }
  }
  const sources = Array.isArray(t.sources) ? t.sources : [];
  h += '<p class="sources">Sources: ' + sources.map(sourceHtml).join(' · ') + '</p>';
  h += '</article>';
  return h;
}
function renderDetail() {
  const slot = $('detail-slot'); if (!slot) return;
  const t = state.trophies.find((x) => x.id === state.detail);
  if (!t || state.view !== 'trophies') { slot.innerHTML = ''; return; }
  slot.innerHTML = detailHtml(t);
  const btn = $('detail-close');
  if (btn) btn.addEventListener('click', () => { state.detail = null; renderDetail(); });
}
function matchesKind(t) { if (state.kind === 'all') return true; if (state.kind === 'missable') return t.missable === true; return t.kind === state.kind; }
function renderList() {
  const list = $('trophy-list'); if (!list) return;
  const q = state.search.trim().toLowerCase();
  const rows = state.trophies.filter((t) => {
    if (!matchesKind(t)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.hideEarned && state.earned.has(t.id)) return false;
    if (q) { const hay = (dispName(t) + ' ' + dispDesc(t)).toLowerCase(); if (!hay.includes(q)) return false; }
    return true;
  });
  list.innerHTML = rows.map((t) => {
    const earned = state.earned.has(t.id);
    return '<div class="trophy-row' + (earned ? ' earned' : '') + '" data-id="' + t.id + '" role="button" tabindex="0" aria-label="' + esc(dispName(t)) + '">'
      + '<input type="checkbox" data-earn="' + t.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark ' + esc(dispName(t)) + ' as earned">'
      + '<div class="row-main"><div class="row-name">' + esc(dispName(t)) + '</div><div class="row-desc">' + esc(dispDesc(t)) + '</div>' + tagsHtml(t) + '</div></div>';
  }).join('');
  const note = $('empty-note'); if (note) note.hidden = rows.length > 0;
  list.querySelectorAll('input[data-earn]').forEach((input) => {
    input.addEventListener('change', () => {
      const id = Number(input.getAttribute('data-earn'));
      if (input.checked) state.earned.add(id); else state.earned.delete(id);
      save(); renderAll();
    });
  });
  list.querySelectorAll('.trophy-row').forEach((row) => {
    row.addEventListener('click', (ev) => {
      if (ev.target && ev.target.tagName === 'INPUT') return;
      state.detail = Number(row.getAttribute('data-id'));
      renderDetail();
      const slot = $('detail-slot'); if (slot) slot.scrollIntoView({ block: 'nearest' });
    });
  });
}
function renderRoadmap() {
  const el = $('roadmap-list'); if (!el) return;
  el.innerHTML = STAGES.map((s) => {
    const items = state.trophies.filter((t) => t.stage === s.n);
    const lis = items.map((t) => '<li>' + esc(dispName(t)) + ' <span class="tag grade-' + esc(t.grade) + '">' + esc(t.grade) + '</span>' + (t.missable ? ' <span class="tag missable">Missable</span>' : '') + '</li>').join('');
    return '<article class="stage-card"><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p><ul>' + lis + '</ul></article>';
  }).join('');
}
function switchView(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.getAttribute('data-view') === view));
  const trophies = $('view-trophies'); if (trophies) trophies.hidden = view !== 'trophies';
  const roadmap = $('view-roadmap'); if (roadmap) roadmap.hidden = view !== 'roadmap';
  const about = $('view-about'); if (about) about.hidden = view !== 'about';
}
function renderAll() { renderProgress(); renderList(); renderRoadmap(); renderDetail(); }
function exportProgress() {
  const payload = JSON.stringify({ v: 1, earned: [...state.earned].sort((a, b) => a - b) }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'vice-trophy-guide-progress.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
async function importProgress(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(arr)) return;
    state.earned = new Set(arr.filter((id) => Number.isInteger(id)));
    save(); renderAll();
  } catch {}
}
function wire() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { switchView(b.getAttribute('data-view')); renderAll(); }));
  const search = $('search'); if (search) search.addEventListener('input', () => { state.search = search.value; renderList(); });
  document.querySelectorAll('#kind-chips .chip').forEach((chip) => chip.addEventListener('click', () => {
    state.kind = chip.getAttribute('data-kind');
    document.querySelectorAll('#kind-chips .chip').forEach((c) => c.classList.toggle('active', c === chip));
    renderList();
  }));
  const grade = $('grade-filter'); if (grade) grade.addEventListener('change', () => { state.grade = grade.value; renderList(); });
  const hide = $('hide-earned'); if (hide) hide.addEventListener('change', () => { state.hideEarned = hide.checked; renderList(); });
  const spoiler = $('spoiler-toggle'); if (spoiler) spoiler.addEventListener('change', () => { state.spoiler = spoiler.checked; renderAll(); });
  const exp = $('export-btn'); if (exp) exp.addEventListener('click', exportProgress);
  const imp = $('import-file'); if (imp) imp.addEventListener('change', () => { const f = imp.files && imp.files[0]; if (f) importProgress(f); imp.value = ''; });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && state.detail !== null) { state.detail = null; renderDetail(); }
  });
}
async function init() {
  wire();
  const params = new URLSearchParams(location.search);
  try {
    const res = await fetch('data/trophies.json');
    const data = await res.json();
    state.trophies = data.trophies || [];
  } catch { state.trophies = []; }
  const view = params.get('view');
  if (view) switchView(view);
  const earnedParam = params.get('earned');
  if (earnedParam !== null) {
    for (const part of earnedParam.split(',')) { const n = Number(part.trim()); if (Number.isInteger(n) && part.trim() !== '') state.earned.add(n); }
  } else {
    loadProgress();
  }
  if (params.get('spoiler') === '1') { state.spoiler = true; const sp = $('spoiler-toggle'); if (sp) sp.checked = true; }
  const detail = params.get('detail');
  if (detail !== null) state.detail = Number(detail);
  renderAll();
}
init();
