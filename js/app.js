// ── APP.JS — Página pública ──
let units = [];

(async () => {
  const { data: { session } } = await db.auth.getSession();
  renderNav(session);
  await loadStats();
  await loadUnits();
})();

function renderNav(session) {
  const el = document.getElementById('nav-auth');
  if (session) {
    const name = session.user.user_metadata?.full_name || session.user.email;
    el.innerHTML = `<div class="nav-user">
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

async function loadStats() {
  const [{ count: wc }, { count: fc }] = await Promise.all([
    db.from('weeks').select('*', { count: 'exact', head: true }),
    db.from('week_files').select('*', { count: 'exact', head: true })
  ]);
  document.getElementById('stat-weeks').textContent = wc ?? '–';
  document.getElementById('stat-files').textContent = fc ?? '–';
}

async function loadUnits() {
  const tabsEl   = document.getElementById('units-tabs');
  const contentEl = document.getElementById('unit-content');

  const { data, error } = await db
    .from('units').select('*, weeks(count)')
    .order('number', { ascending: true });

  if (error || !data?.length) {
    tabsEl.innerHTML = '';
    contentEl.innerHTML = `<div class="empty-box"><div class="empty-icon">📚</div><div class="empty-text">Aún no hay unidades publicadas.</div></div>`;
    return;
  }

  units = data;
  tabsEl.innerHTML = '';
  data.forEach((u, i) => {
    const btn = document.createElement('button');
    btn.className = 'unit-tab' + (i === 0 ? ' active' : '');
    btn.innerHTML = `<span class="tab-num">Unidad ${u.number}</span>${esc(u.name)}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.unit-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      loadUnitContent(u);
    });
    tabsEl.appendChild(btn);
  });

  // Load first unit
  loadUnitContent(data[0]);
}

async function loadUnitContent(unit) {
  const el = document.getElementById('unit-content');
  el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

  const { data: weeks } = await db
    .from('weeks').select('*')
    .eq('unit_id', unit.id)
    .order('number', { ascending: true });

  const cnt = unit.weeks?.[0]?.count || weeks?.length || 0;

  let weeksHtml = '';
  if (!weeks?.length) {
    weeksHtml = `<div class="empty-box"><div class="empty-icon">📅</div><div class="empty-text">Aún no hay semanas en esta unidad.</div></div>`;
  } else {
    // Load all files for all weeks in one query
    const weekIds = weeks.map(w => w.id);
    const { data: allFiles } = await db
      .from('week_files').select('*')
      .in('week_id', weekIds)
      .order('created_at', { ascending: true });

    const filesByWeek = {};
    allFiles?.forEach(f => {
      if (!filesByWeek[f.week_id]) filesByWeek[f.week_id] = [];
      filesByWeek[f.week_id].push(f);
    });

    weeksHtml = '<div class="weeks-list">';
    weeks.forEach((w, idx) => {
      const files = filesByWeek[w.id] || [];
      const thumbHtml = w.image_url
        ? `<img src="${w.image_url}" alt="" class="week-thumb-sm"/>`
        : '';

      const filesHtml = files.length
        ? files.map(f => `
          <div class="file-row">
            <div class="file-info">
              <div class="file-icon-wrap">${fileIcon(f.file_name)}</div>
              <div class="file-meta">
                <div class="file-name">${esc(f.file_name)}</div>
                <div class="file-ext">${fileExt(f.file_name)}</div>
              </div>
            </div>
            <a href="${f.file_url}" download="${esc(f.file_name)}" target="_blank" class="btn-dl">
              ⬇ Descargar
            </a>
          </div>`).join('')
        : '<div class="no-files">Sin archivos adjuntos</div>';

      const bodyImgHtml = w.image_url
        ? `<img src="${w.image_url}" alt="${esc(w.title)}" class="week-img"/>`
        : '';

      weeksHtml += `
        <div class="week-block" id="wb-${w.id}">
          <div class="week-header" data-wid="${w.id}" onclick="toggleWeek('${w.id}', this)">
            <div class="week-num-badge">S${w.number}</div>
            ${thumbHtml}
            <div class="week-header-info">
              <div class="week-title-h">Semana ${w.number < 10 ? '0'+w.number : w.number}: ${esc(w.title)}</div>
              <div class="week-prev-h">${esc(w.description || '')}</div>
            </div>
            <span class="week-chevron" id="chev-${w.id}">▼</span>
          </div>
          <div class="week-body" id="body-${w.id}">
            ${bodyImgHtml}
            ${w.description ? `<div class="week-desc-full">${esc(w.description)}</div>` : ''}
            <div class="files-header">
              📎 Archivos adjuntos
              <span class="files-count">${files.length}</span>
            </div>
            ${filesHtml}
          </div>
        </div>`;
    });
    weeksHtml += '</div>';
  }

  el.innerHTML = `
    <div class="unit-header">
      <div class="unit-header-top">
        <span class="unit-badge">Unidad ${unit.number}</span>
        <span class="unit-count">${cnt} semana${cnt !== 1 ? 's' : ''}</span>
      </div>
      <div class="unit-name">${esc(unit.name)}</div>
      ${unit.description ? `<div class="unit-desc-text">${esc(unit.description)}</div>` : ''}
    </div>
    ${weeksHtml}`;
}

function toggleWeek(wid, headerEl) {
  const body = document.getElementById('body-' + wid);
  const chev = document.getElementById('chev-' + wid);
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  headerEl.classList.toggle('open', !isOpen);
  chev.classList.toggle('open', !isOpen);
}

// ── HELPERS ──
function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fileExt(name) {
  return name?.split('.').pop()?.toUpperCase() || 'FILE';
}

function fileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase();
  const icons = { pdf:'📄', doc:'📝', docx:'📝', ppt:'📊', pptx:'📊', xls:'📈', xlsx:'📈', zip:'🗜️', txt:'📃', jpg:'🖼️', jpeg:'🖼️', png:'🖼️' };
  return icons[ext] || '📎';
}
