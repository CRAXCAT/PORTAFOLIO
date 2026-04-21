// ── DASHBOARD.JS ──
let currentUser = null;
let currentRole = 'user';
let manageReady = false;

// INIT
(async () => {
  try {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { window.location.href = '../login.html'; return; }
    currentUser = session.user;
    await loadProfile();
    showView('overview');
    await loadOverview();
  } catch(e) { console.error('Init error:', e); }
})();

// PROFILE
async function loadProfile() {
  try {
    const { data: p, error } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
    if (error || !p) {
      await db.from('profiles').insert({
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email,
        email: currentUser.email,
        role: 'user'
      });
      currentRole = 'user';
    } else {
      currentRole = p.role || 'user';
    }
    const name = (currentRole === 'user' && !currentUser.user_metadata?.full_name)
      ? currentUser.email
      : (currentUser.user_metadata?.full_name || currentUser.email);
    document.getElementById('sb-name').textContent = name;
    document.getElementById('sb-avatar').textContent = name[0].toUpperCase();
    document.getElementById('sb-role').textContent = currentRole.toUpperCase();
    if (currentRole === 'admin') {
      document.querySelectorAll('.admin-item').forEach(el => el.style.display = 'flex');
    }
  } catch(e) { console.error('Profile error:', e); }
}

// NAV
document.getElementById('menu-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
});
document.getElementById('overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
});
document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  window.location.href = '../index.html';
});

document.querySelectorAll('.sb-link[data-v]').forEach(link => {
  link.addEventListener('click', async e => {
    e.preventDefault();
    const v = link.dataset.v;
    document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
    const titles = { overview:'Resumen', manage:'Gestionar', users:'Usuarios' };
    document.getElementById('dash-title').textContent = titles[v] || v;
    showView(v);
    if (v === 'overview') await loadOverview();
    if (v === 'manage')   await initManage();
    if (v === 'users')    await loadUsers();
  });
});

function showView(v) {
  document.querySelectorAll('.dview').forEach(d => d.classList.remove('active'));
  const el = document.getElementById('dv-' + v);
  if (el) el.classList.add('active');
}

// OVERVIEW
async function loadOverview() {
  const statsEl = document.getElementById('ov-stats');
  const unitsEl = document.getElementById('ov-units');
  statsEl.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  unitsEl.innerHTML = '';

  try {
    const { data: units } = await db.from('units').select('*').order('number');
    const { data: weeks } = await db.from('weeks').select('id');
    const { data: files } = await db.from('week_files').select('id');

    const unitCount = units?.length || 0;
    const weekCount = weeks?.length || 0;
    const fileCount = files?.length || 0;

    // Count weeks per unit
    const { data: weeksWithUnit } = await db.from('weeks').select('unit_id');
    const weeksByUnit = {};
    weeksWithUnit?.forEach(w => {
      weeksByUnit[w.unit_id] = (weeksByUnit[w.unit_id] || 0) + 1;
    });

    statsEl.innerHTML = `
      <div class="overview-stats">
        <div class="stat-card"><div class="stat-n">${unitCount}</div><div class="stat-l">Unidades</div></div>
        <div class="stat-card"><div class="stat-n">${weekCount}</div><div class="stat-l">Semanas</div></div>
        <div class="stat-card"><div class="stat-n">${fileCount}</div><div class="stat-l">Archivos</div></div>
        <div class="stat-card"><div class="stat-n" style="color:var(--green)">●</div><div class="stat-l">Activo</div></div>
      </div>`;

    if (!units?.length) {
      unitsEl.innerHTML = `<div class="empty-box"><div class="empty-icon">📚</div><div class="empty-text">Aún no hay unidades. Ve a <strong>Gestionar</strong> para crear.</div></div>`;
      return;
    }

    unitsEl.innerHTML = '<div class="ov-units-title">Unidades publicadas</div>' +
      units.map(u => {
        const cnt = weeksByUnit[u.id] || 0;
        return `<div class="ov-unit-row">
          <div>
            <div class="ov-unit-name">Unidad ${u.number}: ${esc(u.name)}</div>
            <div class="ov-unit-meta">${esc(u.description || 'Sin descripción')}</div>
          </div>
          <div style="font-size:12px;color:var(--txt3);flex-shrink:0">${cnt} semana${cnt!==1?'s':''}</div>
        </div>`;
      }).join('');

  } catch(e) {
    statsEl.innerHTML = `<div style="color:var(--red);font-size:13px;padding:20px">Error al cargar: ${e.message}</div>`;
    console.error('Overview error:', e);
  }
}

// MANAGE
async function initManage() {
  await fillUnitSelect();
  await loadContentList();
  if (manageReady) return;
  manageReady = true;

  document.getElementById('w-img').addEventListener('change', e => {
    const f = e.target.files[0];
    document.getElementById('img-prev').innerHTML = f ? `<img src="${URL.createObjectURL(f)}"/>` : '';
  });

  document.getElementById('w-files').addEventListener('change', e => {
    const tags = document.getElementById('files-tags');
    tags.innerHTML = '';
    Array.from(e.target.files).forEach(f => {
      const t = document.createElement('span');
      t.className = 'file-tag';
      t.textContent = f.name;
      tags.appendChild(t);
    });
  });

  // CREATE UNIT
  document.getElementById('btn-add-unit').addEventListener('click', async () => {
    const numVal = document.getElementById('u-num').value;
    const name   = document.getElementById('u-name').value.trim();
    const desc   = document.getElementById('u-desc').value.trim();
    const msgEl  = document.getElementById('u-msg');
    const btn    = document.getElementById('btn-add-unit');

    if (!numVal || !name) {
      showMsg(msgEl, 'error', '⚠️ Número y nombre son requeridos.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creando...';

    try {
      const { data, error } = await db
        .from('units')
        .insert({ number: parseInt(numVal), name: name, description: desc })
        .select();

      if (error) {
        showMsg(msgEl, 'error', '❌ Error: ' + error.message);
        console.error('Create unit error:', error);
      } else {
        showMsg(msgEl, 'success', '✅ Unidad creada: ' + name);
        document.getElementById('u-num').value = '';
        document.getElementById('u-name').value = '';
        document.getElementById('u-desc').value = '';
        await fillUnitSelect();
        await loadContentList();
      }
    } catch(e) {
      showMsg(msgEl, 'error', '❌ Excepción: ' + e.message);
      console.error('Exception:', e);
    }

    btn.disabled = false;
    btn.textContent = 'Crear Unidad';
  });

  // CREATE WEEK
  document.getElementById('btn-add-week').addEventListener('click', async () => {
    const unitId   = document.getElementById('w-unit').value;
    const numVal   = document.getElementById('w-num').value;
    const title    = document.getElementById('w-title').value.trim();
    const desc     = document.getElementById('w-desc').value.trim();
    const imgFile  = document.getElementById('w-img').files[0];
    const attFiles = document.getElementById('w-files').files;
    const msgEl    = document.getElementById('w-msg');
    const btn      = document.getElementById('btn-add-week');
    const btnSpan  = btn.querySelector('span');
    const progWrap = document.getElementById('prog-wrap');
    const progFill = document.getElementById('prog-fill');
    const progText = document.getElementById('prog-text');

    if (!unitId || !numVal || !title) {
      showMsg(msgEl, 'error', '⚠️ Selecciona unidad, número y título.');
      return;
    }

    btn.disabled = true;
    btnSpan.textContent = 'Procesando...';
    progWrap.style.display = 'block';
    setP(progFill, progText, 5, 'Iniciando...');

    try {
      // Upload image
      let imageUrl = null;
      if (imgFile) {
        setP(progFill, progText, 20, 'Subiendo imagen...');
        const imgPath = `images/${Date.now()}_${san(imgFile.name)}`;
        const { error: ie } = await db.storage.from(STORAGE_BUCKET).upload(imgPath, imgFile, { upsert: true });
        if (!ie) {
          const { data: ud } = db.storage.from(STORAGE_BUCKET).getPublicUrl(imgPath);
          imageUrl = ud.publicUrl;
        } else {
          console.warn('Image error:', ie.message);
        }
      }

      // Insert week
      setP(progFill, progText, 45, 'Guardando semana...');
      const { data: week, error: we } = await db
        .from('weeks')
        .insert({ unit_id: unitId, number: parseInt(numVal), title, description: desc, image_url: imageUrl })
        .select()
        .single();

      if (we) {
        showMsg(msgEl, 'error', '❌ Error semana: ' + we.message);
        console.error('Week error:', we);
        btn.disabled = false; btnSpan.textContent = 'Publicar Semana'; progWrap.style.display = 'none';
        return;
      }

      // Upload files
      const total = attFiles.length;
      for (let i = 0; i < total; i++) {
        const f = attFiles[i];
        setP(progFill, progText, 45 + Math.round(((i+1)/total)*50), `Archivo ${i+1}/${total}...`);
        const fp = `files/${week.id}/${Date.now()}_${san(f.name)}`;
        const { error: fe } = await db.storage.from(STORAGE_BUCKET).upload(fp, f, { upsert: true });
        if (!fe) {
          const { data: fu } = db.storage.from(STORAGE_BUCKET).getPublicUrl(fp);
          const { error: dbe } = await db.from('week_files').insert({
            week_id: week.id,
            file_name: f.name,
            file_url: fu.publicUrl,
            file_path: fp
          });
          if (dbe) console.warn('week_files insert error:', dbe.message);
        } else {
          console.warn('File upload error:', fe.message);
        }
      }

      setP(progFill, progText, 100, '¡Listo!');
      setTimeout(() => { progWrap.style.display = 'none'; progFill.style.width = '0%'; }, 1000);

      showMsg(msgEl, 'success', `✅ Semana "${title}" publicada con ${total} archivo(s).`);

      ['w-unit','w-num','w-title','w-desc','w-img','w-files'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('img-prev').innerHTML = '';
      document.getElementById('files-tags').innerHTML = '';
      await loadContentList();

    } catch(e) {
      showMsg(msgEl, 'error', '❌ Excepción: ' + e.message);
      console.error('Week exception:', e);
    }

    btn.disabled = false;
    btnSpan.textContent = 'Publicar Semana';
  });
}

async function fillUnitSelect() {
  try {
    const { data: units, error } = await db.from('units').select('*').order('number');
    if (error) { console.error('fillUnitSelect error:', error); return; }
    const sel = document.getElementById('w-unit');
    sel.innerHTML = '<option value="">Selecciona una unidad...</option>';
    units?.forEach(u => {
      const o = document.createElement('option');
      o.value = u.id;
      o.textContent = `Unidad ${u.number}: ${u.name}`;
      sel.appendChild(o);
    });
  } catch(e) { console.error('fillUnitSelect exception:', e); }
}

async function loadContentList() {
  const el = document.getElementById('content-list');
  el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  try {
    const { data: weeks, error } = await db
      .from('weeks')
      .select('id, title, number, unit_id, units(name, number)')
      .order('created_at', { ascending: false });

    if (error) { el.innerHTML = `<p style="color:var(--red);font-size:13px">Error: ${error.message}</p>`; return; }
    if (!weeks?.length) { el.innerHTML = '<p style="color:var(--txt3);font-size:13px;padding:8px 0">Sin semanas publicadas aún.</p>'; return; }

    el.innerHTML = weeks.map(w => `
      <div class="content-row">
        <div>
          <div class="content-row-name">${esc(w.title)}</div>
          <div class="content-row-meta">Semana ${w.number} · ${w.units ? 'Unidad '+w.units.number+': '+esc(w.units.name) : ''}</div>
        </div>
        <button class="btn-del" data-id="${w.id}" data-title="${esc(w.title)}">Eliminar</button>
      </div>`).join('');

    el.querySelectorAll('.btn-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`¿Eliminar "${btn.dataset.title}"?`)) return;
        btn.textContent = '...'; btn.disabled = true;
        await db.from('week_files').delete().eq('week_id', btn.dataset.id);
        await db.from('weeks').delete().eq('id', btn.dataset.id);
        await loadContentList();
      });
    });
  } catch(e) { el.innerHTML = `<p style="color:var(--red);font-size:13px">Excepción: ${e.message}</p>`; }
}

// USERS
async function loadUsers() {
  const wrap = document.getElementById('users-wrap');
  wrap.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  try {
    const { data: profiles, error } = await db.from('profiles').select('*').order('created_at');
    if (error) { wrap.innerHTML = `<p style="color:var(--red);font-size:13px">Error: ${error.message}</p>`; return; }
    if (!profiles?.length) { wrap.innerHTML = '<p style="color:var(--txt3);font-size:13px;">Sin usuarios registrados.</p>'; return; }

    const tbl = document.createElement('table');
    tbl.className = 'users-table';
    tbl.innerHTML = `<thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Cambiar</th></tr></thead>
      <tbody>${profiles.map(p=>`<tr>
        <td>${esc(p.full_name||'—')}</td>
        <td>${esc(p.email||'—')}</td>
        <td><span class="role-pill ${p.role}">${p.role}</span></td>
        <td><select class="role-sel" data-uid="${p.id}">
          <option value="user" ${p.role==='user'?'selected':''}>user</option>
          <option value="admin" ${p.role==='admin'?'selected':''}>admin</option>
        </select></td></tr>`).join('')}</tbody>`;
    wrap.innerHTML = '';
    wrap.appendChild(tbl);
    tbl.querySelectorAll('.role-sel').forEach(sel => {
      sel.addEventListener('change', async () => {
        await db.from('profiles').update({ role: sel.value }).eq('id', sel.dataset.uid);
        const pill = sel.closest('tr').querySelector('.role-pill');
        pill.className = `role-pill ${sel.value}`; pill.textContent = sel.value;
      });
    });
  } catch(e) { wrap.innerHTML = `<p style="color:var(--red);font-size:13px">Excepción: ${e.message}</p>`; }
}

// HELPERS
function setP(fill, text, pct, msg) { fill.style.width = pct+'%'; text.textContent = msg; }
function showMsg(el, type, txt) { el.className='msg '+type; el.textContent=txt; el.style.display='block'; setTimeout(()=>el.style.display='none',7000); }
function esc(s) { if(!s)return''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function san(n) { return n.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9._-]/g,''); }
