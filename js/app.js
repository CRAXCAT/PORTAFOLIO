// ============================================================
//  APP.JS — Página pública
//  Todo el mundo puede ver Y descargar sin registrarse
// ============================================================

let unitId = null, unitName = '';

// ── INIT ──
(async () => {
  const { data: { session } } = await db.auth.getSession();
  renderNav(session);
  await loadUnits();
})();

// ── NAVBAR ──
function renderNav(session) {
  const el = document.getElementById('nav-links');
  if (session) {
    const name = session.user.user_metadata?.full_name || session.user.email;
    el.innerHTML = `
      <div class="nav-user">
        <div class="nav-avatar">${name[0].toUpperCase()}</div>
        <span class="nav-uname">${esc(name)}</span>
      </div>
      <a href="pages/dashboard.html" class="nav-btn solid">Mi Panel</a>`;
  } else {
    el.innerHTML = `
      <a href="login.html" class="nav-btn ghost">Iniciar sesión</a>
      <a href="login.html" class="nav-btn solid">Registrarse</a>`;
  }
}

// ── LOAD UNITS ──
async function loadUnits() {
  const grid = document.getElementById('units-grid');
  const { data: units, error } = await db
    .from('units').select('*, weeks(count)')
    .order('number', { ascending: true });

  if (error || !units?.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-ico">📚</div><p>Aún no hay unidades publicadas.</p></div>`;
    return;
  }

  grid.innerHTML = '';
  units.forEach(u => {
    const cnt = u.weeks?.[0]?.count || 0;
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <div class="uc-num">Unidad ${u.number}</div>
      <div class="uc-name">${esc(u.name)}</div>
      <div class="uc-desc">${esc(u.description || '')}</div>
      <div class="uc-count">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${cnt} semana${cnt !== 1 ? 's' : ''}
      </div>`;
    card.addEventListener('click', () => openUnit(u));
    grid.appendChild(card);
  });
}

// ── OPEN UNIT ──
async function openUnit(unit) {
  unitId = unit.id; unitName = unit.name;
  show('semanas');
  document.getElementById('unit-title').textContent = `Unidad ${unit.number}: ${unit.name}`;
  document.getElementById('unit-desc-text').textContent = unit.description || '';

  const grid = document.getElementById('weeks-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const { data: weeks } = await db
    .from('weeks').select('*')
    .eq('unit_id', unit.id).order('number', { ascending: true });

  if (!weeks?.length) {
    grid.innerHTML = '<div class="empty"><div class="empty-ico">📅</div><p>Sin semanas aún.</p></div>';
    return;
  }

  grid.innerHTML = '';
  weeks.forEach(w => {
    const card = document.createElement('div');
    card.className = 'week-card';
    const thumb = w.image_url
      ? `<div class="week-thumb"><img src="${w.image_url}" alt="${esc(w.title)}" loading="lazy"/></div>`
      : `<div class="week-thumb">📖</div>`;
    card.innerHTML = `${thumb}
      <div class="week-info">
        <div class="wk-num">Semana ${w.number}</div>
        <div class="wk-title">${esc(w.title)}</div>
        <div class="wk-prev">${esc(w.description || '')}</div>
      </div>`;
    card.addEventListener('click', () => openWeek(w));
    grid.appendChild(card);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── OPEN WEEK ──
async function openWeek(week) {
  show('detalle');
  const wrap = document.getElementById('detail-wrap');
  wrap.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const { data: files } = await db
    .from('week_files').select('*')
    .eq('week_id', week.id).order('created_at', { ascending: true });

  const hero = week.image_url
    ? `<div class="detail-hero"><img src="${week.image_url}" alt="${esc(week.title)}"/></div>`
    : `<div class="detail-hero">📖</div>`;

  let filesHtml = '';
  if (files?.length) {
    const rows = files.map(f => `
      <div class="file-row">
        <div class="file-info">
          <span class="file-ico">${icon(f.file_name)}</span>
          <span class="file-nm">${esc(f.file_name)}</span>
        </div>
        <a href="${f.file_url}" download="${esc(f.file_name)}" target="_blank" class="btn-dl">⬇ Descargar</a>
      </div>`).join('');
    filesHtml = `<div class="files-box"><h4>📎 Archivos adjuntos</h4>${rows}</div>`;
  }

  wrap.innerHTML = `
    ${hero}
    <div class="detail-tag">Semana ${week.number} · ${esc(unitName)}</div>
    <div class="detail-title">${esc(week.title)}</div>
    <div class="detail-desc">${esc(week.description || '')}</div>
    ${filesHtml}`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── BACK BUTTONS ──
document.getElementById('back-to-units').addEventListener('click', () => { show('unidades'); window.scrollTo({top:0,behavior:'smooth'}); });
document.getElementById('back-to-weeks').addEventListener('click', () => { show('semanas');  window.scrollTo({top:0,behavior:'smooth'}); });

// ── VIEW SWITCH ──
function show(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ── HELPERS ──
function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function icon(name) {
  const ext = name?.split('.').pop()?.toLowerCase();
  return {pdf:'📄',doc:'📝',docx:'📝',ppt:'📊',pptx:'📊',xls:'📈',xlsx:'📈',zip:'🗜️',txt:'📃'}[ext] || '📎';
}
