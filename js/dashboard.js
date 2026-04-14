// ============================================================
//  DASHBOARD.JS - Lógica principal del dashboard
// ============================================================

let currentUser = null;
let currentRole = 'user';
let currentUnitId = null;
let currentUnitName = '';

// ---- INIT ----
(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = '../index.html';
    return;
  }
  currentUser = session.user;
  await loadProfile();
  await loadUnitsView();
})();

// ---- LOAD PROFILE ----
async function loadProfile() {
  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (!profile) {
    // Crear perfil si no existe
    await db.from('profiles').insert({
      id: currentUser.id,
      full_name: currentUser.user_metadata?.full_name || currentUser.email,
      email: currentUser.email,
      role: 'user'
    });
    currentRole = 'user';
  } else {
    currentRole = profile.role || 'user';
  }

  // Actualizar UI
  const name = profile?.full_name || currentUser.email;
  document.getElementById('user-name').textContent = name;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('user-role-badge').textContent = currentRole;
  document.getElementById('user-role-badge').style.color = currentRole === 'admin' ? 'var(--accent2)' : 'var(--text3)';

  // Mostrar opciones admin
  if (currentRole === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'flex');
  }
}

// ---- NAVIGATION ----
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', async (e) => {
    e.preventDefault();
    const view = item.dataset.view;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    hideAllViews();
    closeSidebar();

    if (view === 'units') {
      document.getElementById('page-title').textContent = 'Unidades del Curso';
      document.getElementById('view-units').style.display = 'block';
      await loadUnitsView();
    } else if (view === 'manage') {
      document.getElementById('page-title').textContent = 'Gestionar Contenido';
      document.getElementById('view-manage').style.display = 'block';
      await loadManageView();
    } else if (view === 'users') {
      document.getElementById('page-title').textContent = 'Gestión de Usuarios';
      document.getElementById('view-users').style.display = 'block';
      await loadUsersView();
    }
  });
});

function hideAllViews() {
  ['view-units','view-weeks','view-week-detail','view-manage','view-users'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// ---- SIDEBAR MOBILE ----
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

// ---- LOGOUT ----
document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  window.location.href = '../index.html';
});

// ============================================================
//  UNITS VIEW
// ============================================================
async function loadUnitsView() {
  document.getElementById('view-units').style.display = 'block';
  const grid = document.getElementById('units-grid');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando unidades...</p></div>';

  const { data: units, error } = await db
    .from('units')
    .select('*, weeks(count)')
    .order('number', { ascending: true });

  if (error || !units || units.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><p>Aún no hay unidades publicadas.</p></div>';
    return;
  }

  grid.innerHTML = '';
  units.forEach(unit => {
    const weeksCount = unit.weeks?.[0]?.count || 0;
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <div class="unit-number">Unidad ${unit.number}</div>
      <div class="unit-name">${escHtml(unit.name)}</div>
      <div class="unit-desc">${escHtml(unit.description || '')}</div>
      <div class="unit-weeks-count">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${weeksCount} semana${weeksCount !== 1 ? 's' : ''}
      </div>
    `;
    card.addEventListener('click', () => openUnit(unit));
    grid.appendChild(card);
  });
}

// ============================================================
//  WEEKS VIEW
// ============================================================
async function openUnit(unit) {
  currentUnitId = unit.id;
  currentUnitName = unit.name;

  hideAllViews();
  document.getElementById('view-weeks').style.display = 'block';
  document.getElementById('page-title').textContent = `Unidad ${unit.number}`;
  document.getElementById('unit-breadcrumb').textContent = `Unidad ${unit.number}: ${unit.name}`;

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

    const thumbHtml = week.image_url
      ? `<div class="week-thumb"><img src="${week.image_url}" alt="${escHtml(week.title)}" loading="lazy"/></div>`
      : `<div class="week-thumb">📖</div>`;

    item.innerHTML = `
      ${thumbHtml}
      <div class="week-info">
        <div class="week-label">Semana ${week.number}</div>
        <div class="week-title-text">${escHtml(week.title)}</div>
        <div class="week-preview">${escHtml(week.description || '')}</div>
      </div>
    `;
    item.addEventListener('click', () => openWeek(week));
    list.appendChild(item);
  });
}

document.getElementById('btn-back-units').addEventListener('click', () => {
  hideAllViews();
  document.getElementById('view-units').style.display = 'block';
  document.getElementById('page-title').textContent = 'Unidades del Curso';
});

// ============================================================
//  WEEK DETAIL VIEW
// ============================================================
async function openWeek(week) {
  hideAllViews();
  document.getElementById('view-week-detail').style.display = 'block';
  document.getElementById('week-breadcrumb').textContent = `Semana ${week.number}: ${week.title}`;
  document.getElementById('page-title').textContent = week.title;

  const container = document.getElementById('week-detail-content');

  // Cargar archivos adjuntos
  const { data: files } = await db
    .from('week_files')
    .select('*')
    .eq('week_id', week.id)
    .order('created_at', { ascending: true });

  const heroHtml = week.image_url
    ? `<div class="detail-hero"><img src="${week.image_url}" alt="${escHtml(week.title)}"/></div>`
    : `<div class="detail-hero" style="font-size:64px;">📖</div>`;

  let filesHtml = '';
  if (files && files.length > 0) {
    const fileItems = files.map(f => `
      <div class="file-download-item">
        <div class="file-download-info">
          <span class="file-icon">${getFileIcon(f.file_name)}</span>
          <span class="file-name">${escHtml(f.file_name)}</span>
        </div>
        <a href="${f.file_url}" download="${escHtml(f.file_name)}" target="_blank" class="btn-download">⬇ Descargar</a>
      </div>
    `).join('');

    filesHtml = `
      <div class="files-section">
        <h4>📎 Archivos adjuntos</h4>
        ${fileItems}
      </div>
    `;
  }

  container.innerHTML = `
    ${heroHtml}
    <div class="detail-badge">Semana ${week.number} · ${currentUnitName}</div>
    <div class="detail-title">${escHtml(week.title)}</div>
    <div class="detail-desc">${escHtml(week.description || '')}</div>
    ${filesHtml}
  `;
}

document.getElementById('btn-back-weeks').addEventListener('click', async () => {
  const { data: unit } = await db.from('units').select('*').eq('id', currentUnitId).single();
  if (unit) openUnit(unit);
});

// ============================================================
//  MANAGE VIEW (ADMIN)
// ============================================================
async function loadManageView() {
  await populateUnitSelect();
  await loadAdminContentList();

  // Image preview
  document.getElementById('week-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('img-preview');
    if (file) {
      const url = URL.createObjectURL(file);
      preview.innerHTML = `<img src="${url}" alt="preview"/>`;
    }
  });

  // Files list
  document.getElementById('week-files').addEventListener('change', (e) => {
    const filesList = document.getElementById('files-list');
    filesList.innerHTML = '';
    Array.from(e.target.files).forEach(f => {
      const tag = document.createElement('span');
      tag.className = 'file-tag';
      tag.textContent = `${getFileIcon(f.name)} ${f.name}`;
      filesList.appendChild(tag);
    });
  });
}

async function populateUnitSelect() {
  const { data: units } = await db.from('units').select('*').order('number');
  const sel = document.getElementById('week-unit-select');
  sel.innerHTML = '<option value="">Selecciona una unidad...</option>';
  if (units) {
    units.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `Unidad ${u.number}: ${u.name}`;
      sel.appendChild(opt);
    });
  }
}

// CREATE UNIT
document.getElementById('btn-create-unit').addEventListener('click', async () => {
  const name   = document.getElementById('unit-name').value.trim();
  const desc   = document.getElementById('unit-desc').value.trim();
  const number = parseInt(document.getElementById('unit-number').value);
  const msgEl  = document.getElementById('unit-msg');
  const btn    = document.getElementById('btn-create-unit');

  if (!name || !number) {
    showMsg(msgEl, 'error', 'El nombre y número son requeridos.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creando...';

  const { error } = await db.from('units').insert({ name, description: desc, number });

  if (error) {
    showMsg(msgEl, 'error', `Error: ${error.message}`);
  } else {
    showMsg(msgEl, 'success', '✅ Unidad creada exitosamente.');
    document.getElementById('unit-name').value = '';
    document.getElementById('unit-desc').value = '';
    document.getElementById('unit-number').value = '';
    await populateUnitSelect();
    await loadAdminContentList();
  }

  btn.disabled = false;
  btn.textContent = 'Crear Unidad';
});

// CREATE WEEK
document.getElementById('btn-create-week').addEventListener('click', async () => {
  const unitId  = document.getElementById('week-unit-select').value;
  const number  = parseInt(document.getElementById('week-number').value);
  const title   = document.getElementById('week-title').value.trim();
  const desc    = document.getElementById('week-desc').value.trim();
  const imgFile = document.getElementById('week-image').files[0];
  const attachFiles = document.getElementById('week-files').files;
  const msgEl   = document.getElementById('week-msg');
  const btn     = document.getElementById('btn-create-week');
  const progress = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  if (!unitId || !number || !title) {
    showMsg(msgEl, 'error', 'Unidad, número y título son requeridos.');
    return;
  }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Subiendo...';
  progress.style.display = 'block';
  progressFill.style.width = '10%';
  progressText.textContent = 'Preparando...';

  let imageUrl = null;

  // Upload image
  if (imgFile) {
    progressText.textContent = 'Subiendo imagen...';
    progressFill.style.width = '25%';
    const imgPath = `images/${Date.now()}_${imgFile.name.replace(/\s/g,'_')}`;
    const { error: imgErr } = await db.storage.from(STORAGE_BUCKET).upload(imgPath, imgFile);
    if (!imgErr) {
      const { data: urlData } = db.storage.from(STORAGE_BUCKET).getPublicUrl(imgPath);
      imageUrl = urlData.publicUrl;
    }
  }

  progressFill.style.width = '50%';
  progressText.textContent = 'Creando semana...';

  // Insert week
  const { data: weekData, error: weekErr } = await db.from('weeks').insert({
    unit_id: unitId,
    number,
    title,
    description: desc,
    image_url: imageUrl
  }).select().single();

  if (weekErr) {
    showMsg(msgEl, 'error', `Error: ${weekErr.message}`);
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Publicar Semana';
    progress.style.display = 'none';
    return;
  }

  // Upload attachments
  if (attachFiles.length > 0) {
    const total = attachFiles.length;
    for (let i = 0; i < total; i++) {
      const f = attachFiles[i];
      progressText.textContent = `Subiendo archivo ${i+1} de ${total}...`;
      progressFill.style.width = `${50 + ((i+1)/total)*40}%`;

      const filePath = `files/${weekData.id}/${Date.now()}_${f.name.replace(/\s/g,'_')}`;
      const { error: fErr } = await db.storage.from(STORAGE_BUCKET).upload(filePath, f);
      if (!fErr) {
        const { data: fUrl } = db.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
        await db.from('week_files').insert({
          week_id: weekData.id,
          file_name: f.name,
          file_url: fUrl.publicUrl,
          file_path: filePath
        });
      }
    }
  }

  progressFill.style.width = '100%';
  progressText.textContent = '¡Listo!';

  setTimeout(() => { progress.style.display = 'none'; progressFill.style.width = '0%'; }, 1000);

  showMsg(msgEl, 'success', '✅ Semana publicada exitosamente.');

  // Reset form
  document.getElementById('week-unit-select').value = '';
  document.getElementById('week-number').value = '';
  document.getElementById('week-title').value = '';
  document.getElementById('week-desc').value = '';
  document.getElementById('week-image').value = '';
  document.getElementById('week-files').value = '';
  document.getElementById('img-preview').innerHTML = '';
  document.getElementById('files-list').innerHTML = '';

  btn.disabled = false;
  btn.querySelector('span').textContent = 'Publicar Semana';

  await loadAdminContentList();
});

async function loadAdminContentList() {
  const container = document.getElementById('admin-content-list');
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  const { data: weeks } = await db
    .from('weeks')
    .select('*, units(name, number)')
    .order('created_at', { ascending: false });

  if (!weeks || weeks.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No hay semanas publicadas aún.</p></div>';
    return;
  }

  container.innerHTML = '';
  weeks.forEach(w => {
    const row = document.createElement('div');
    row.className = 'admin-content-row';
    row.innerHTML = `
      <div>
        <div class="admin-content-row-info">${escHtml(w.title)}</div>
        <div class="admin-content-row-meta">Semana ${w.number} · ${w.units?.name || ''}</div>
      </div>
      <button class="btn-delete" data-id="${w.id}" data-title="${escHtml(w.title)}">Eliminar</button>
    `;
    container.appendChild(row);
  });

  // Delete handlers
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`¿Eliminar "${btn.dataset.title}"?`)) return;
      await db.from('week_files').delete().eq('week_id', btn.dataset.id);
      await db.from('weeks').delete().eq('id', btn.dataset.id);
      await loadAdminContentList();
    });
  });
}

// ============================================================
//  USERS VIEW (ADMIN)
// ============================================================
async function loadUsersView() {
  const wrap = document.getElementById('users-table-wrap');
  wrap.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  const { data: profiles } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (!profiles || profiles.length === 0) {
    wrap.innerHTML = '<p style="color:var(--text3);font-size:13px;">No hay usuarios registrados.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'users-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Correo</th>
        <th>Rol</th>
        <th>Cambiar rol</th>
      </tr>
    </thead>
    <tbody>
      ${profiles.map(p => `
        <tr>
          <td>${escHtml(p.full_name || '—')}</td>
          <td>${escHtml(p.email || '—')}</td>
          <td><span class="role-badge ${p.role}">${p.role}</span></td>
          <td>
            <select class="role-select" data-uid="${p.id}" data-current="${p.role}">
              <option value="user" ${p.role === 'user' ? 'selected' : ''}>user</option>
              <option value="admin" ${p.role === 'admin' ? 'selected' : ''}>admin</option>
            </select>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  wrap.innerHTML = '';
  wrap.appendChild(table);

  // Role change handlers
  table.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const newRole = sel.value;
      const uid = sel.dataset.uid;
      const { error } = await db.from('profiles').update({ role: newRole }).eq('id', uid);
      if (!error) {
        const badge = sel.closest('tr').querySelector('.role-badge');
        badge.className = `role-badge ${newRole}`;
        badge.textContent = newRole;
      }
    });
  });
}

// ============================================================
//  HELPERS
// ============================================================
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showMsg(el, type, text) {
  el.className = `msg ${type}`;
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function getFileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const icons = { pdf:'📄', doc:'📝', docx:'📝', ppt:'📊', pptx:'📊', xls:'📈', xlsx:'📈', zip:'🗜️', txt:'📃' };
  return icons[ext] || '📎';
}

// Modal
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});
