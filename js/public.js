// ============================================================
//  PUBLIC.JS - Página pública del portfolio
//  Todos pueden VER, solo registrados pueden DESCARGAR
// ============================================================

let isLoggedIn = false;
let currentUnitId = null;
let currentUnitName = '';
let currentWeekId = null;

// ---- INIT ----
(async () => {
  // Verificar si hay sesión activa
  const { data: { session } } = await db.auth.getSession();
  isLoggedIn = !!session;
  renderNavAuth(session);
  await loadUnits();
})();

// ---- NAVBAR AUTH ----
function renderNavAuth(session) {
  const area = document.getElementById('nav-auth-area');
  if (session) {
    const name = session.user.user_metadata?.full_name || session.user.email;
    area.innerHTML = `
      <div class="nav-user-info">
        <div class="nav-avatar">${name.charAt(0).toUpperCase()}</div>
        <span style="display:none;" class="nav-hide-mobile">${name}</span>
      </div>
      <a href="pages/dashboard.html" class="btn-nav-dashboard">Mi Panel</a>
    `;
  } else {
    area.innerHTML = `
      <a href="login.html" class="btn-nav-login">Iniciar Sesión</a>
      <a href="login.html" class="btn-nav-dashboard">Registrarse</a>
    `;
  }
}

// ---- LOAD UNITS ----
async function loadUnits() {
  const grid = document.getElementById('units-grid');

  const { data: units, error } = await db
    .from('units')
    .select('*, weeks(count)')
    .order('number', { ascending: true });

  if (error || !units || units.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">📚</div>
        <p>Aún no hay unidades publicadas.</p>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  units.forEach(unit => {
    const count = unit.weeks?.[0]?.count || 0;
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <div class="unit-number">Unidad ${unit.number}</div>
      <div class="unit-name">${esc(unit.name)}</div>
      <div class="unit-desc">${esc(unit.description || '')}</div>
      <div class="unit-weeks-count">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${count} semana${count !== 1 ? 's' : ''}
      </div>
    `;
    card.addEventListener('click', () => openUnit(unit));
    grid.appendChild(card);
  });
}

// ---- OPEN UNIT → SHOW WEEKS ----
async function openUnit(unit) {
  currentUnitId = unit.id;
  currentUnitName = unit.name;

  showSection('semanas-section');
  document.getElementById('unit-title-display').textContent = `Unidad ${unit.number}: ${unit.name}`;
  document.getElementById('unit-desc-display').textContent = unit.description || '';

  const list = document.getElementById('weeks-list');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  const { data: weeks } = await db
    .from('weeks')
    .select('*')
    .eq('unit_id', unit.id)
    .order('number', { ascending: true });

  if (!weeks || weeks.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><p>Aún no hay semanas en esta unidad.</p></div>';
    return;
  }

  list.innerHTML = '';
  weeks.forEach(week => {
    const item = document.createElement('div');
    item.className = 'week-item';

    const thumb = week.image_url
      ? `<div class="week-thumb"><img src="${week.image_url}" alt="${esc(week.title)}" loading="lazy"/></div>`
      : `<div class="week-thumb">📖</div>`;

    item.innerHTML = `
      ${thumb}
      <div class="week-info">
        <div class="week-label">Semana ${week.number}</div>
        <div class="week-title-text">${esc(week.title)}</div>
        <div class="week-preview">${esc(week.description || '')}</div>
      </div>
    `;
    item.addEventListener('click', () => openWeek(week));
    list.appendChild(item);
  });

  scrollToSection('semanas-section');
}

// ---- OPEN WEEK → SHOW DETAIL ----
async function openWeek(week) {
  currentWeekId = week.id;
  showSection('detail-section');

  const wrap = document.getElementById('week-detail-wrap');
  wrap.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  // Cargar archivos
  const { data: files } = await db
    .from('week_files')
    .select('*')
    .eq('week_id', week.id)
    .order('created_at', { ascending: true });

  const heroHtml = week.image_url
    ? `<div class="detail-hero"><img src="${week.image_url}" alt="${esc(week.title)}"/></div>`
    : `<div class="detail-hero" style="font-size:64px; min-height:160px;">📖</div>`;

  let filesHtml = '';
  if (files && files.length > 0) {
    const items = files.map(f => {
      const downloadBtn = isLoggedIn
        ? `<a href="${f.file_url}" download="${esc(f.file_name)}" target="_blank" class="btn-download">⬇ Descargar</a>`
        : `<button class="btn-download-locked" onclick="showRegisterModal()">🔒 Regístrate</button>`;

      return `
        <div class="file-download-item">
          <div class="file-download-info">
            <span class="file-icon">${getFileIcon(f.file_name)}</span>
            <span class="file-name">${esc(f.file_name)}</span>
          </div>
          ${downloadBtn}
        </div>
      `;
    }).join('');

    const lockNote = !isLoggedIn
      ? `<div class="lock-note">🔒 <a href="login.html">Regístrate gratis</a> para descargar los archivos</div>`
      : '';

    filesHtml = `
      <div class="files-section">
        <h4>📎 Archivos adjuntos</h4>
        ${lockNote}
        ${items}
      </div>
    `;
  }

  wrap.innerHTML = `
    ${heroHtml}
    <div class="detail-badge">Semana ${week.number} · ${esc(currentUnitName)}</div>
    <div class="detail-title">${esc(week.title)}</div>
    <div class="detail-desc">${esc(week.description || '')}</div>
    ${filesHtml}
  `;

  scrollToSection('detail-section');
}

// ---- BACK BUTTONS ----
document.getElementById('btn-back-units').addEventListener('click', () => {
  showSection('unidades');
  scrollToSection('unidades');
});

document.getElementById('btn-back-weeks').addEventListener('click', async () => {
  showSection('semanas-section');
  scrollToSection('semanas-section');
});

function showSection(id) {
  document.getElementById('unidades').style.display = 'none';
  document.getElementById('semanas-section').style.display = 'none';
  document.getElementById('detail-section').style.display = 'none';
  document.getElementById(id).style.display = 'block';
}

function scrollToSection(id) {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ---- REGISTER MODAL ----
function showRegisterModal() {
  document.getElementById('register-modal').style.display = 'flex';
}

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('register-modal').style.display = 'none';
});

document.getElementById('register-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('register-modal')) {
    document.getElementById('register-modal').style.display = 'none';
  }
});

// ---- HELPERS ----
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getFileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const icons = { pdf:'📄', doc:'📝', docx:'📝', ppt:'📊', pptx:'📊', xls:'📈', xlsx:'📈', zip:'🗜️', txt:'📃' };
  return icons[ext] || '📎';
}
