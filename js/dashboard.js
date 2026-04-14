// ── DASHBOARD.JS ──
let user = null, role = 'user', curUnitId = null, curUnitName = '';

(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { window.location.href = '../login.html'; return; }
  user = session.user;
  await loadProfile();
  await loadDUnits();
})();

async function loadProfile() {
  const { data: p } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (!p) {
    await db.from('profiles').insert({ id: user.id, full_name: user.user_metadata?.full_name || user.email, email: user.email, role: 'user' });
    role = 'user';
  } else { role = p.role || 'user'; }

  const name = p?.full_name || user.email;
  document.getElementById('sb-name').textContent = name;
  document.getElementById('sb-avatar').textContent = name[0].toUpperCase();
  document.getElementById('sb-role').textContent = role;
  document.getElementById('sb-role').style.color = role === 'admin' ? 'var(--acc2)' : 'var(--txt3)';

  if (role === 'admin') {
    document.querySelectorAll('.admin-item').forEach(el => el.style.display = 'flex');
  }
}

// Nav
document.querySelectorAll('.sb-link[data-v]').forEach(link => {
  link.addEventListener('click', async e => {
    e.preventDefault();
    const v = link.dataset.v;
    document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    hideViews(); closeMenu();
    const titles = { units:'Unidades', manage:'Gestionar Contenido', users:'Usuarios' };
    document.getElementById('dash-title').textContent = titles[v] || '';
    if (v === 'units')  { document.getElementById('dv-units').classList.add('active'); await loadDUnits(); }
    if (v === 'manage') { document.getElementById('dv-manage').classList.add('active'); await loadManage(); }
    if (v === 'users')  { document.getElementById('dv-users').classList.add('active'); await loadUsers(); }
  });
});

function hideViews() { document.querySelectorAll('.dview').forEach(v => v.classList.remove('active')); }

// Sidebar mobile
document.getElementById('menu-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
});
document.getElementById('overlay').addEventListener('click', closeMenu);
function closeMenu() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

// Logout
document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut(); window.location.href = '../index.html';
});

// ── UNITS VIEW ──
async function loadDUnits() {
  const grid = document.getElementById('d-units-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const { data: units } = await db.from('units').select('*, weeks(count)').order('number');
  if (!units?.length) { grid.innerHTML = '<div class="empty"><div class="empty-ico">📚</div><p>Sin unidades.</p></div>'; return; }
  grid.innerHTML = '';
  units.forEach(u => {
    const cnt = u.weeks?.[0]?.count || 0;
    const c = document.createElement('div');
    c.className = 'unit-card';
    c.innerHTML = `
      <div class="uc-num">Unidad ${u.number}</div>
      <div class="uc-name">${esc(u.name)}</div>
      <div class="uc-desc">${esc(u.description||'')}</div>
      <div class="uc-count"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${cnt} semana${cnt!==1?'s':''}</div>`;
    c.addEventListener('click', () => openDUnit(u));
    grid.appendChild(c);
  });
}

async function openDUnit(unit) {
  curUnitId = unit.id; curUnitName = unit.name;
  hideViews(); document.getElementById('dv-weeks').classList.add('active');
  document.getElementById('d-unit-crumb').textContent = `Unidad ${unit.number}: ${unit.name}`;
  const grid = document.getElementById('d-weeks-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const { data: weeks } = await db.from('weeks').select('*').eq('unit_id', unit.id).order('number');
  if (!weeks?.length) { grid.innerHTML = '<div class="empty"><div class="empty-ico">📅</div><p>Sin semanas.</p></div>'; return; }
  grid.innerHTML = '';
  weeks.forEach(w => {
    const c = document.createElement('div'); c.className = 'week-card';
    const thumb = w.image_url ? `<div class="week-thumb"><img src="${w.image_url}" loading="lazy"/></div>` : `<div class="week-thumb">📖</div>`;
    c.innerHTML = `${thumb}<div class="week-info"><div class="wk-num">Semana ${w.number}</div><div class="wk-title">${esc(w.title)}</div><div class="wk-prev">${esc(w.description||'')}</div></div>`;
    c.addEventListener('click', () => openDWeek(w));
    grid.appendChild(c);
  });
}

document.getElementById('d-back-units').addEventListener('click', () => { hideViews(); document.getElementById('dv-units').classList.add('active'); loadDUnits(); });

async function openDWeek(week) {
  hideViews(); document.getElementById('dv-detail').classList.add('active');
  document.getElementById('d-week-crumb').textContent = `Semana ${week.number}: ${week.title}`;
  const wrap = document.getElementById('d-detail-wrap');
  wrap.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const { data: files } = await db.from('week_files').select('*').eq('week_id', week.id).order('created_at');
  const hero = week.image_url ? `<div class="detail-hero"><img src="${week.image_url}"/></div>` : `<div class="detail-hero">📖</div>`;
  let fHtml = '';
  if (files?.length) {
    fHtml = `<div class="files-box"><h4>📎 Archivos</h4>${files.map(f=>`
      <div class="file-row"><div class="file-info"><span class="file-ico">${icon(f.file_name)}</span><span class="file-nm">${esc(f.file_name)}</span></div>
      <a href="${f.file_url}" download="${esc(f.file_name)}" target="_blank" class="btn-dl">⬇ Descargar</a></div>`).join('')}</div>`;
  }
  wrap.innerHTML = `${hero}<div class="detail-tag">Semana ${week.number} · ${esc(curUnitName)}</div><div class="detail-title">${esc(week.title)}</div><div class="detail-desc">${esc(week.description||'')}</div>${fHtml}`;
}

document.getElementById('d-back-weeks').addEventListener('click', async () => {
  const { data: u } = await db.from('units').select('*').eq('id', curUnitId).single();
  if (u) openDUnit(u);
});

// ── MANAGE VIEW ──
async function loadManage() {
  await fillUnitSelect();
  await loadContentList();
  document.getElementById('w-img').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) document.getElementById('img-prev').innerHTML = `<img src="${URL.createObjectURL(f)}"/>`;
  });
  document.getElementById('w-files').addEventListener('change', e => {
    const tags = document.getElementById('files-tags');
    tags.innerHTML = '';
    Array.from(e.target.files).forEach(f => { const t=document.createElement('span'); t.className='file-tag'; t.textContent=`${icon(f.name)} ${f.name}`; tags.appendChild(t); });
  });
}

async function fillUnitSelect() {
  const { data: units } = await db.from('units').select('*').order('number');
  const sel = document.getElementById('w-unit');
  sel.innerHTML = '<option value="">Selecciona...</option>';
  units?.forEach(u => { const o=document.createElement('option'); o.value=u.id; o.textContent=`Unidad ${u.number}: ${u.name}`; sel.appendChild(o); });
}

document.getElementById('btn-add-unit').addEventListener('click', async () => {
  const num = parseInt(document.getElementById('u-num').value);
  const name = document.getElementById('u-name').value.trim();
  const desc = document.getElementById('u-desc').value.trim();
  const msg = document.getElementById('u-msg');
  const btn = document.getElementById('btn-add-unit');
  if (!num || !name) { showMsg(msg,'error','Número y nombre son requeridos.'); return; }
  btn.disabled=true; btn.textContent='Creando...';
  const { error } = await db.from('units').insert({ number:num, name, description:desc });
  if (error) { showMsg(msg,'error',error.message); }
  else { showMsg(msg,'success','✅ Unidad creada.'); document.getElementById('u-num').value=''; document.getElementById('u-name').value=''; document.getElementById('u-desc').value=''; await fillUnitSelect(); await loadContentList(); }
  btn.disabled=false; btn.textContent='Crear Unidad';
});

document.getElementById('btn-add-week').addEventListener('click', async () => {
  const unitId = document.getElementById('w-unit').value;
  const num    = parseInt(document.getElementById('w-num').value);
  const title  = document.getElementById('w-title').value.trim();
  const desc   = document.getElementById('w-desc').value.trim();
  const imgFile= document.getElementById('w-img').files[0];
  const attFiles = document.getElementById('w-files').files;
  const msg    = document.getElementById('w-msg');
  const btn    = document.getElementById('btn-add-week').querySelector('span');
  const prog   = document.getElementById('prog-wrap');
  const fill   = document.getElementById('prog-fill');
  const ptxt   = document.getElementById('prog-text');

  if (!unitId||!num||!title) { showMsg(msg,'error','Unidad, número y título son requeridos.'); return; }

  document.getElementById('btn-add-week').disabled=true; btn.textContent='Subiendo...';
  prog.style.display='block'; fill.style.width='8%'; ptxt.textContent='Preparando...';

  let imageUrl=null;
  if (imgFile) {
    ptxt.textContent='Subiendo imagen...'; fill.style.width='22%';
    const path=`images/${Date.now()}_${imgFile.name.replace(/\s/g,'_')}`;
    const { error:ie } = await db.storage.from(STORAGE_BUCKET).upload(path, imgFile);
    if (!ie) { const {data:d}=db.storage.from(STORAGE_BUCKET).getPublicUrl(path); imageUrl=d.publicUrl; }
  }

  fill.style.width='45%'; ptxt.textContent='Guardando semana...';
  const { data:week, error:we } = await db.from('weeks').insert({ unit_id:unitId, number:num, title, description:desc, image_url:imageUrl }).select().single();
  if (we) { showMsg(msg,'error',we.message); document.getElementById('btn-add-week').disabled=false; btn.textContent='Publicar Semana'; prog.style.display='none'; return; }

  const total=attFiles.length;
  for (let i=0;i<total;i++) {
    const f=attFiles[i];
    fill.style.width=`${45+((i+1)/total)*50}%`; ptxt.textContent=`Archivo ${i+1}/${total}...`;
    const fp=`files/${week.id}/${Date.now()}_${f.name.replace(/\s/g,'_')}`;
    const {error:fe}=await db.storage.from(STORAGE_BUCKET).upload(fp,f);
    if (!fe) { const {data:fu}=db.storage.from(STORAGE_BUCKET).getPublicUrl(fp); await db.from('week_files').insert({week_id:week.id,file_name:f.name,file_url:fu.publicUrl,file_path:fp}); }
  }

  fill.style.width='100%'; ptxt.textContent='¡Listo!';
  setTimeout(()=>{ prog.style.display='none'; fill.style.width='0%'; },800);
  showMsg(msg,'success','✅ Semana publicada correctamente.');
  document.getElementById('w-unit').value=''; document.getElementById('w-num').value=''; document.getElementById('w-title').value='';
  document.getElementById('w-desc').value=''; document.getElementById('w-img').value=''; document.getElementById('w-files').value='';
  document.getElementById('img-prev').innerHTML=''; document.getElementById('files-tags').innerHTML='';
  document.getElementById('btn-add-week').disabled=false; btn.textContent='Publicar Semana';
  await loadContentList();
});

async function loadContentList() {
  const el = document.getElementById('content-list');
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const { data:weeks } = await db.from('weeks').select('*, units(name,number)').order('created_at',{ascending:false});
  if (!weeks?.length) { el.innerHTML='<p style="color:var(--txt3);font-size:13px;">Sin semanas publicadas.</p>'; return; }
  el.innerHTML='';
  weeks.forEach(w => {
    const r=document.createElement('div'); r.className='content-row';
    r.innerHTML=`<div><div class="content-row-info">${esc(w.title)}</div><div class="content-row-meta">Semana ${w.number} · ${w.units?.name||''}</div></div>
    <button class="btn-del" data-id="${w.id}" data-title="${esc(w.title)}">Eliminar</button>`;
    el.appendChild(r);
  });
  el.querySelectorAll('.btn-del').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      if (!confirm(`¿Eliminar "${btn.dataset.title}"?`)) return;
      await db.from('week_files').delete().eq('week_id',btn.dataset.id);
      await db.from('weeks').delete().eq('id',btn.dataset.id);
      await loadContentList();
    });
  });
}

// ── USERS ──
async function loadUsers() {
  const wrap=document.getElementById('users-wrap');
  wrap.innerHTML='<div class="loading"><div class="spinner"></div></div>';
  const {data:profiles}=await db.from('profiles').select('*').order('created_at');
  if (!profiles?.length) { wrap.innerHTML='<p style="color:var(--txt3);font-size:13px;">Sin usuarios.</p>'; return; }
  const tbl=document.createElement('table'); tbl.className='users-table';
  tbl.innerHTML=`<thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Cambiar</th></tr></thead>
  <tbody>${profiles.map(p=>`<tr>
    <td>${esc(p.full_name||'—')}</td>
    <td>${esc(p.email||'—')}</td>
    <td><span class="role-pill ${p.role}">${p.role}</span></td>
    <td><select class="role-sel" data-uid="${p.id}"><option value="user" ${p.role==='user'?'selected':''}>user</option><option value="admin" ${p.role==='admin'?'selected':''}>admin</option></select></td>
  </tr>`).join('')}</tbody>`;
  wrap.innerHTML=''; wrap.appendChild(tbl);
  tbl.querySelectorAll('.role-sel').forEach(sel=>{
    sel.addEventListener('change',async()=>{
      await db.from('profiles').update({role:sel.value}).eq('id',sel.dataset.uid);
      sel.closest('tr').querySelector('.role-pill').className=`role-pill ${sel.value}`;
      sel.closest('tr').querySelector('.role-pill').textContent=sel.value;
    });
  });
}

// ── HELPERS ──
function showMsg(el,type,txt){ el.className=`msg ${type}`; el.textContent=txt; el.style.display='block'; setTimeout(()=>el.style.display='none',5000); }
function esc(s){ if(!s)return''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function icon(n){ const e=n?.split('.').pop()?.toLowerCase(); return {pdf:'📄',doc:'📝',docx:'📝',ppt:'📊',pptx:'📊',xls:'📈',xlsx:'📈',zip:'🗜️',txt:'📃'}[e]||'📎'; }
