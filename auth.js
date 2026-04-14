// ============================================================
//  AUTH.JS - Login & Register
// ============================================================

// Si ya hay sesión activa, redirigir al dashboard
(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    window.location.href = 'pages/dashboard.html';
  }
})();

// --- TABS ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// --- LOGIN ---
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  const btn   = document.getElementById('btn-login');

  errEl.style.display = 'none';

  if (!email || !pass) {
    errEl.textContent = 'Por favor completa todos los campos.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Entrando...';

  const { error } = await db.auth.signInWithPassword({ email, password: pass });

  if (error) {
    errEl.textContent = error.message === 'Invalid login credentials'
      ? 'Correo o contraseña incorrectos.'
      : error.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Entrar';
  } else {
    window.location.href = 'pages/dashboard.html';
  }
});

// Enter key on login
document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

// --- REGISTER ---
document.getElementById('btn-register').addEventListener('click', async () => {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const errEl = document.getElementById('reg-error');
  const sucEl = document.getElementById('reg-success');
  const btn   = document.getElementById('btn-register');

  errEl.style.display = 'none';
  sucEl.style.display = 'none';

  if (!name || !email || !pass) {
    errEl.textContent = 'Por favor completa todos los campos.';
    errEl.style.display = 'block';
    return;
  }

  if (pass.length < 6) {
    errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.querySelector('span').textContent = 'Creando cuenta...';

  const { data, error } = await db.auth.signUp({
    email,
    password: pass,
    options: { data: { full_name: name } }
  });

  if (error) {
    errEl.textContent = error.message;
    errEl.style.display = 'block';
  } else {
    // Crear perfil con rol 'user'
    if (data.user) {
      await db.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        email: email,
        role: 'user'
      });
    }
    sucEl.textContent = '✅ Cuenta creada. Revisa tu correo para confirmar (si está activado), o inicia sesión.';
    sucEl.style.display = 'block';
  }

  btn.disabled = false;
  btn.querySelector('span').textContent = 'Crear cuenta';
});
