// ── AUTH.JS ──
(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) window.location.href = 'index.html';
})();

// Tabs
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('pane-' + t.dataset.tab).classList.add('active');
  });
});

// Login
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const err   = document.getElementById('l-err');
  const btn   = document.getElementById('btn-login');
  err.style.display = 'none';
  if (!email || !pass) { err.textContent = 'Completa todos los campos.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Entrando...';
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) {
    err.textContent = error.message.includes('Invalid') ? 'Correo o contraseña incorrectos.' : error.message;
    err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Entrar →';
  } else {
    window.location.href = 'pages/dashboard.html';
  }
});

document.getElementById('l-pass').addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('btn-login').click(); });

// Register
document.getElementById('btn-register').addEventListener('click', async () => {
  const name  = document.getElementById('r-name').value.trim();
  const email = document.getElementById('r-email').value.trim();
  const pass  = document.getElementById('r-pass').value;
  const err = document.getElementById('r-err');
  const ok  = document.getElementById('r-ok');
  const btn = document.getElementById('btn-register');
  err.style.display = 'none'; ok.style.display = 'none';
  if (!name || !email || !pass) { err.textContent = 'Completa todos los campos.'; err.style.display = 'block'; return; }
  if (pass.length < 6) { err.textContent = 'La contraseña debe tener mínimo 6 caracteres.'; err.style.display = 'block'; return; }
  btn.disabled = true; btn.textContent = 'Creando...';
  const { data, error } = await db.auth.signUp({ email, password: pass, options: { data: { full_name: name } } });
  if (error) {
    err.textContent = error.message; err.style.display = 'block';
  } else {
    if (data.user) {
      await db.from('profiles').upsert({ id: data.user.id, full_name: name, email, role: 'user' });
    }
    ok.textContent = '✅ Cuenta creada. Redirigiendo...'; ok.style.display = 'block';
    setTimeout(() => window.location.href = 'pages/dashboard.html', 1500);
  }
  btn.disabled = false; btn.textContent = 'Crear cuenta';
});
