// ── DASHBOARD.JS — Portfolio Académico ──
let currentUser = null;
let currentRole = 'user';

(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = '../login.html'; return; }
  currentUser = session.user;
  await loadProfile();
  await loadOverview();
})();

async function loadProfile() {
  const { data: p } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
  if (!p) {
    await db.from('profiles').insert({ id: currentUser.id, full_name: currentUser.user_metadata?.full_name || currentUser.email, email: currentUser.email, role: 'user' });
    currentRole = 'user';
  } else { currentRole = p.role || 'user'; }
  const name = p?.full_name || currentUser.email;
  document.getElementById('sb-name').textContent = name;
  document.getElementById('sb-avatar').textContent = name[0].toUpperCase();
  document.getElementById('sb-role').textContent = currentRole;
  if (currentRole === 'admin') document.querySelectorAll('.admin-item').forEach(el => el.style.display = 'flex');
}

document.getElementById('menu-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
});
document.getElementById('overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
});
document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut(); window.location.href = '../index.html';
});

document.querySelectorAll('.sb-link[data-v]').forEach(link => {
  link.addEventListener('click', async e => {
    e.preventDefault();
    const v = link.dataset.v;
    document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
    const titles = { overview:'Resumen', manage:'Gestionar Contenido', users:'Usuarios' };
    document.getElementById('dash-title').textContent = titles[v] || v;
    document.querySelectorAll('.dview').forEach(d => d.classList.remove('active'));
    if (v === 'overview') { document.getElementById('dv-overview').classList.add('active'); await loadOverview(); }
    if (v === 'manage')   { document.getElementById('dv-manage').classList.add('active');   await initManage(); }
    if (v === 'users')    { document.getElementById('dv-users').classList.add('active');    await loadUsers(); }
  });
});

async function loadOverview() {
  const statsEl = document.getElementById('ov-stats');
  const unitsEl = document.getElementById('ov-units');
  statsEl.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  unitsEl.innerHTML = '';
  const [{ data: units },{ count: wc },{ count: fc }] = await Promise.all([
    db.from('units').select('*, weeks(count)').order('number'),
    db.from('weeks').select('*',{count:'exact',head:true}),
    db.from('week_files').select('*',{count:'exact',head:true})
  ]);
  statsEl.innerHTML = `<div class="overview-stats">
    <div class="stat-card"><div class="stat-n">${units?.length||0}</div><div class="stat-l">Unidades</div></div>
    <div class="stat-card"><div class="stat-n">${wc||0}</div><div class="stat-l">Semanas</div></div>
    <div class="stat-card"><div class="stat-n">${fc||0}</div><div class="stat-l">Archivos</div></div>
    <div class="stat-card"><div class="stat-n" style="color:var(--green)">●</div><div class="stat-l">En línea</div></div>
  </div>`;
  if (!units?.length) { unitsEl.innerHTML='<div class="empty-box"><div class="empty-icon">📚</div><div class="empty-text">Sin unidades.</div></div>'; return; }
  unitsEl.innerHTML = '<div class="ov-units-title">Unidades del curso</div>' +
    units.map(u=>`<div class="ov-unit-row">
      <div><div class="ov-unit-name">Unidad ${u.number}: ${esc(u.name)}</div><div class="ov-unit-meta">${esc(u.description||'')}</div></div>
      <div class="unit-count">${u.weeks?.[0]?.count||0} semanas</div></div>`).join('');
}

let manageReady = false;

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
      const t = document.createElement('span'); t.className='file-tag'; t.textContent=f.name; tags.appendChild(t);
    });
  });

  // ── CREATE UNIT ──
  document.getElementById('btn-add-unit').addEventListener('click', async () => {
    const num  = parseInt(document.getElementById('u-num').value);
    const name = document.getElementById('u-name').value.trim();
    const desc = document.getElementById('u-desc').value.trim();
    const msgEl = document.getElementById('u-msg');
    const btn   = document.getElementById('btn-add-unit');

    if (!num || !name) { showMsg(msgEl,'error','⚠️ El número y nombre son requeridos.'); return; }

    btn.disabled = true; btn.textContent = 'Creando...';

    const { error } = await db.from('units').insert({ number: num, name, description: desc });

    if (error) {
      showMsg(msgEl, 'error', '❌ ' + error.message);
    } else {
      showMsg(msgEl, 'success', '✅ Unidad creada correctamente.');
      document.getElementById('u-num').value = '';
      document.getElementById('u-name').value = '';
      document.getElementById('u-desc').value = '';
      await fillUnitSelect();
      await loadContentList();
    }
    btn.disabled = false; btn.textContent = 'Crear Unidad';
  });

  // ── CREATE WEEK ──
  document.getElementById('btn-add-week').addEventListener('click', async () => {
    const unitId   = document.getElementById('w-unit').value;
    const num      = parseInt(document.getElementById('w-num').value);
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

    if (!unitId || !num || !title) { showMsg(msgEl,'error','⚠️ Selecciona unidad, número y título.'); return; }

    btn.disabled = true; btnSpan.textContent = 'Procesando...';
    progWrap.style.display = 'block'; prog(progFill, progText, 5, 'Iniciando...');

    // Upload image
    let imageUrl = null;
    if (imgFile) {
      prog(progFill, progText, 20, 'Subiendo imagen...');
      const path = `images/${Date.now()}_${san(imgFile.name)}`;
      const { error: ie } = await db.storage.from(STORAGE_BUCKET).upload(path, imgFile, { upsert: true });
      if (!ie) { const {data:d}=db.storage.from(STORAGE_BUCKET).getPublicUrl(path); imageUrl=d.publicUrl; }
      else console.warn('img err:', ie.message);
    }

    // Insert week
    prog(progFill, progText, 45, 'Guardando semana...');
    const { data: week, error: we } = await db.from('weeks')
      .insert({ unit_id: unitId, number: num, title, description: desc, image_url: imageUrl })
      .select().single();

    if (we) {
      showMsg(msgEl,'error','❌ Error: ' + we.message);
      btn.disabled=false; btnSpan.textContent='Publicar Semana'; progWrap.style.display='none';
      return;
    }

    // Upload files
    const total = attFiles.length;
    for (let i=0; i<total; i++) {
      const f = attFiles[i];
      prog(progFill, progText, 45+Math.round(((i+1)/total)*50), `Archivo ${i+1}/${total}...`);
      const fp = `files/${week.id}/${Date.now()}_${san(f.name)}`;
      const { error: fe } = await db.storage.from(STORAGE_BUCKET).upload(fp, f, { upsert: true });
      if (!fe) {
        const {data:fu}=db.storage.from(STORAGE_BUCKET).getPublicUrl(fp);
        await db.from('week_files').insert({ week_id:week.id, file_name:f.name, file_url:fu.publicUrl, file_path:fp });
      } else console.warn('file err:', fe.message);
    }

    prog(progFill, progText, 100, '¡Listo!');
    setTimeout(()=>{ progWrap.style.display='none'; progFill.style.width='0%'; },800);
    showMsg(msgEl,'success','✅ Semana publicada correctamente.');

    // Reset
    ['w-unit','w-num','w-title','w-desc','w-img','w-files'].forEach(id => document.getElementById(id).value='');
    document.getElementById('img-prev').innerHTML='';
    document.getElementById('files-tags').innerHTML='';
    btn.disabled=false; btnSpan.textContent='Publicar Semana';
    await loadContentList();
  });
}

async function fillUnitSelect() {
  const { data: units } = await db.from('units').select('*').order('number');
  const sel = document.getElementById('w-unit');
  sel.innerHTML = '<option value="">Selecciona una unidad...</option>';
  units?.forEach(u => { const o=document.createElement('option'); o.value=u.id; o.textContent=`Unidad ${u.number}: ${u.name}`; sel.appendChild(o); });
}

async function loadContentList() {
  const el = document.getElementById('content-list');
  el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  const { data: weeks } = await db.from('weeks').select('*, units(name,number)').order('created_at',{ascending:false});
  if (!weeks?.length) { el.innerHTML='<p style="color:var(--txt3);font-size:13px;padding:8px 0">Sin semanas publicadas.</p>'; return; }
  el.innerHTML = weeks.map(w=>`
    <div class="content-row">
      <div>
        <div class="content-row-name">${esc(w.title)}</div>
        <div class="content-row-meta">Semana ${w.number} · Unidad ${w.units?.number||''}: ${esc(w.units?.name||'')}</div>
      </div>
      <button class="btn-del" data-id="${w.id}" data-title="${esc(w.title)}">Eliminar</button>
    </div>`).join('');
  el.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`¿Eliminar "${btn.dataset.title}"?`)) return;
      btn.textContent='...'; btn.disabled=true;
      await db.from('week_files').delete().eq('week_id', btn.dataset.id);
      await db.from('weeks').delete().eq('id', btn.dataset.id);
      await loadContentList();
    });
  });
}

async function loadUsers() {
  const wrap = document.getElementById('users-wrap');
  wrap.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
  const { data: profiles } = await db.from('profiles').select('*').order('created_at');
  if (!profiles?.length) { wrap.innerHTML='<p style="color:var(--txt3);font-size:13px;">Sin usuarios.</p>'; return; }
  const tbl = document.createElement('table'); tbl.className='users-table';
  tbl.innerHTML = `<thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Cambiar</th></tr></thead>
    <tbody>${profiles.map(p=>`<tr>
      <td>${esc(p.full_name||'—')}</td><td>${esc(p.email||'—')}</td>
      <td><span class="role-pill ${p.role}">${p.role}</span></td>
      <td><select class="role-sel" data-uid="${p.id}">
        <option value="user" ${p.role==='user'?'selected':''}>user</option>
        <option value="admin" ${p.role==='admin'?'selected':''}>admin</option>
      </select></td></tr>`).join('')}</tbody>`;
  wrap.innerHTML=''; wrap.appendChild(tbl);
  tbl.querySelectorAll('.role-sel').forEach(sel=>{
    sel.addEventListener('change', async()=>{
      await db.from('profiles').update({role:sel.value}).eq('id',sel.dataset.uid);
      const pill=sel.closest('tr').querySelector('.role-pill');
      pill.className=`role-pill ${sel.value}`; pill.textContent=sel.value;
    });
  });
}

function prog(fill,text,pct,msg){ fill.style.width=pct+'%'; text.textContent=msg; }
function showMsg(el,type,txt){ el.className='msg '+type; el.textContent=txt; el.style.display='block'; setTimeout(()=>el.style.display='none',6000); }
function esc(s){ if(!s)return''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function san(n){ return n.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9._-]/g,''); }
