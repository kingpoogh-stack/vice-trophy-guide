const POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const KEY = 'vice-trophy-guide-progress-v1';
const SOURCE_LINKS = { 'Exophase — GTA VI trophy page': 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/', 'PSNProfiles — GTA VI trophy list': 'https://psnprofiles.com/trophies/grand-theft-auto-vi' };
const STAGES = [
  { n: 1, title: 'Stage 1 — Story first, carefully', text: 'Play the main story in order and treat every named mission, stranger finale and one-time scene as a one-chance moment: keep a manual save before each, and never overwrite your last chapter save. Chapter milestones cannot be missed, but the trophies flagged MISSABLE in this stage are the ones this whole roadmap order exists to protect.' },
  { n: 2, title: 'Stage 2 — Collectibles', text: 'With the story done, sweep Leonida in regions: meditation spots, card sets, stunt and vehicle counters, gang operations and full exploration all share the same ground, so one careful trip advances several trophies at once. Use the tracker notes to mark regions clean as you finish them.' },
  { n: 3, title: 'Stage 3 — Activities & mastery', text: 'Now chase skill and variety: shooting-range golds, drone races, races, robberies and partner feats. These are all repeatable in free roam, so they wait safely until after the story — and the practice here is what makes the robbery and combat trophies feel routine.' },
  { n: 4, title: 'Stage 4 — Post-story cleanup', text: 'There are no explicitly online trophies in the official list, so this stage is the post-story cleanup instead: the money totals (laundering and spending), the last garage purchases, and the final push to 100% completion once every income stream is established.' },
  { n: 5, title: 'Stage 5 — The platinum', text: 'When the other 54 trophies are earned, the platinum — Vice Got a Price! — is awarded automatically. If you followed the stages in order, the last trophy you earn should be a formality: check the tracker, confirm nothing is left at 54/55, and let the legend pop.' },
];
const state = { trophies: [], earned: new Set(), view: 'trophies', kind: 'all', grade: 'all', search: '', hideEarned: false, spoiler: false, detail: null };
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const masked = (t) => state.spoiler && t.kind === 'story' && !state.earned.has(t.id);
const dispName = (t) => (masked(t) ? 'Hidden story trophy' : t.name);
const dispDesc = (t) => (masked(t) ? 'Earned story trophies are revealed; this one is still hidden by the spoiler shield.' : t.description);
function save() { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, earned: [...state.earned] })); } catch { /* storage unavailable */ } }
function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.earned)) data.earned.forEach((id) => { if (Number.isInteger(id)) state.earned.add(id); });
  } catch { /* ignore corrupt saves */ }
}
function renderProgress() {
  const total = state.trophies.length || 55;
  const totalPoints = state.trophies.reduce((s, t) => s + (POINTS[t.grade] || 0), 0);
  const earnedPoints = state.trophies.filter((t) => state.earned.has(t.id)).reduce((s, t) => s + (POINTS[t.grade] || 0), 0);
  const pct = total ? Math.round((state.earned.size / total) * 100) : 0;
  $('progress-count').textContent = `${state.earned.size}/${total}`;
  $('progress-points').textContent = String(earnedPoints);
  $('progress-total').textContent = String(totalPoints);
  $('progress-bar').style.width = `${total ? (state.earned.size / total) * 100 : 0}%`;
  $('progress-pct').textContent = `${pct}%`;
}
function sourceHtml(name) {
  const url = SOURCE_LINKS[name];
  return url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>` : esc(name);
}
function detailHtml(t) {
  const steps = (t.steps || []).map((s) => `<li>${esc(s)}</li>`).join('');
  const sources = (t.sources || []).map(sourceHtml).join(' &middot; ');
  const warn = t.missable ? '<p class="warn">Missable: the official description ties this trophy to a one-time moment. Keep a manual save before it and do not overwrite that save until the trophy pops.</p>' : '';
  return `<article class="detail-card"><button type="button" class="close-btn" id="detail-close">Close</button>`
    + `<h3>${esc(dispName(t))}</h3><p class="row-desc">${esc(dispDesc(t))}</p>`
    + `<div class="tags"><span class="tag grade-${esc(t.grade)}">${esc(t.grade)}</span><span class="tag">${esc(t.kind)}</span>${t.missable ? '<span class="tag missable">Missable</span>' : ''}<span class="tag stage">Stage ${esc(t.stage)}</span></div>`
    + warn
    + `<p class="guide">${esc(masked(t) ? 'Turn the spoiler shield off, or earn this trophy, to reveal its guide.' : t.guide)}</p>`
    + (masked(t) ? '' : `<h4>Steps</h4><ol>${steps}</ol>`)
    + `<p class="sources">Sources: ${sources}</p></article>`;
}
function renderDetail() {
  const slot = $('detail-slot');
  const t = state.trophies.find((x) => x.id === state.detail);
  if (!t || state.view !== 'trophies') { slot.innerHTML = ''; return; }
  slot.innerHTML = detailHtml(t);
  $('detail-close').addEventListener('click', () => { state.detail = null; renderDetail(); });
}
function matchesKind(t) {
  if (state.kind === 'all') return true;
  if (state.kind === 'missable') return t.missable === true;
  return t.kind === state.kind;
}
function renderList() {
  const q = state.search.trim().toLowerCase();
  const rows = state.trophies.filter((t) => {
    if (!matchesKind(t)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.hideEarned && state.earned.has(t.id)) return false;
    if (q && !`${dispName(t)} ${dispDesc(t)}`.toLowerCase().includes(q)) return false;
    return true;
  });
  $('trophy-list').innerHTML = rows.map((t) => {
    const earned = state.earned.has(t.id);
    return `<div class="trophy-row${earned ? ' earned' : ''}" data-id="${t.id}" role="button" tabindex="0" aria-label="${esc(dispName(t))}">`
      + `<input type="checkbox" data-earn="${t.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(dispName(t))} as earned">`
      + `<div class="row-main"><div class="row-name">${esc(dispName(t))}</div><div class="row-desc">${esc(dispDesc(t))}</div>`
      + `<div class="tags"><span class="tag grade-${esc(t.grade)}">${esc(t.grade)}</span><span class="tag">${esc(t.kind)}</span>${t.missable ? '<span class="tag missable">Missable</span>' : ''}<span class="tag stage">Stage ${esc(t.stage)}</span></div></div></div>`;
  }).join('');
  $('empty-note').hidden = rows.length > 0;
  document.querySelectorAll('[data-earn]').forEach((box) => box.addEventListener('change', () => {
    const id = Number(box.getAttribute('data-earn'));
    if (box.checked) state.earned.add(id); else state.earned.delete(id);
    save(); renderAll();
  }));
  document.querySelectorAll('.trophy-row').forEach((row) => row.addEventListener('click', (ev) => {
    if (ev.target && ev.target.matches('input')) return;
    state.detail = Number(row.getAttribute('data-id'));
    renderDetail();
    $('detail-slot').scrollIntoView({ block: 'nearest' });
  }));
}
function renderRoadmap() {
  $('roadmap-list').innerHTML = STAGES.map((s) => {
    const items = state.trophies.filter((t) => t.stage === s.n).map((t) => `<li>${esc(dispName(t))} <span class="tag grade-${esc(t.grade)}">${esc(t.grade)}</span>${t.missable ? ' <span class="tag missable">Missable</span>' : ''}</li>`).join('');
    return `<article class="stage-card"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><ul>${items}</ul></article>`;
  }).join('');
}
function switchView(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.getAttribute('data-view') === view));
  $('view-trophies').hidden = view !== 'trophies';
  $('view-roadmap').hidden = view !== 'roadmap';
  $('view-about').hidden = view !== 'about';
}
function renderAll() { renderProgress(); renderList(); renderRoadmap(); renderDetail(); }
function exportProgress() {
  const blob = new Blob([JSON.stringify({ v: 1, earned: [...state.earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'vice-trophy-guide-progress.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importProgress(file) {
  file.text().then((text) => {
    try {
      const data = JSON.parse(text);
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) return;
      state.earned = new Set(ids.filter((id) => Number.isInteger(id)));
      save(); renderAll();
    } catch { /* ignore invalid files */ }
  });
}
function wire() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { switchView(b.getAttribute('data-view')); renderAll(); }));
  $('search').addEventListener('input', (e) => { state.search = e.target.value; renderList(); });
  document.querySelectorAll('#kind-chips .chip').forEach((chip) => chip.addEventListener('click', () => {
    state.kind = chip.getAttribute('data-kind');
    document.querySelectorAll('#kind-chips .chip').forEach((c) => c.classList.toggle('active', c === chip));
    renderList();
  }));
  $('grade-filter').addEventListener('change', (e) => { state.grade = e.target.value; renderList(); });
  $('hide-earned').addEventListener('change', (e) => { state.hideEarned = e.target.checked; renderList(); });
  $('spoiler-toggle').addEventListener('change', (e) => { state.spoiler = e.target.checked; renderAll(); });
  $('export-btn').addEventListener('click', exportProgress);
  $('import-file').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ''; });
}
async function init() {
  wire();
  const params = new URLSearchParams(location.search);
  const data = await (await fetch('data/trophies.json')).json();
  state.trophies = data.trophies || [];
  if (params.get('view')) switchView(params.get('view'));
  const earnedParam = params.get('earned');
  if (earnedParam) earnedParam.split(',').map(Number).filter(Number.isInteger).forEach((id) => state.earned.add(id));
  else loadProgress();
  if (params.get('spoiler') === '1') { state.spoiler = true; $('spoiler-toggle').checked = true; }
  if (params.get('detail')) state.detail = Number(params.get('detail'));
  renderAll();
}
init();
