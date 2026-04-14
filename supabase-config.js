/* ============================================
   PUBLIC PAGE STYLES
   ============================================ */

/* ---- NAVBAR ---- */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(10,10,15,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-head);
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
  text-decoration: none;
}

.nav-right { display: flex; align-items: center; gap: 12px; }

.btn-nav-login {
  padding: 7px 18px;
  background: none;
  border: 1px solid var(--border);
  color: var(--text2);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-nav-login:hover { border-color: var(--accent); color: var(--accent2); }

.btn-nav-dashboard {
  padding: 7px 18px;
  background: var(--accent);
  border: none;
  color: white;
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-nav-dashboard:hover { background: var(--accent2); }

.nav-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text3);
}

.nav-avatar {
  width: 30px;
  height: 30px;
  background: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

/* ---- HERO ---- */
.public-page { padding-top: 64px; }

.hero {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
}

.hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 24px;
  position: relative;
  z-index: 2;
}

.hero-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--accent2);
  border: 1px solid var(--accent);
  padding: 4px 14px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.hero-title {
  font-family: var(--font-head);
  font-size: clamp(2.8rem, 8vw, 5rem);
  font-weight: 800;
  line-height: 1;
  margin-bottom: 20px;
  color: var(--text);
}

.hero-title span {
  -webkit-text-stroke: 2px var(--accent);
  color: transparent;
}

.hero-sub {
  font-size: 15px;
  color: var(--text3);
  max-width: 480px;
  line-height: 1.7;
  margin-bottom: 32px;
}

.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }

.btn-hero-primary {
  padding: 12px 28px;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
  display: inline-block;
}
.btn-hero-primary:hover { background: var(--accent2); transform: translateY(-2px); box-shadow: 0 4px 16px var(--accent-glow); }

.btn-hero-ghost {
  padding: 12px 28px;
  background: none;
  color: var(--text2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
  display: inline-block;
}
.btn-hero-ghost:hover { border-color: var(--accent); color: var(--accent2); }

/* Deco rings */
.hero-deco {
  position: absolute;
  right: -100px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.deco-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(124,58,237,0.15);
  transform: translate(-50%, -50%);
}
.r1 { width: 300px; height: 300px; top: 0; left: 0; animation: spin-slow 20s linear infinite; }
.r2 { width: 500px; height: 500px; top: 0; left: 0; border-color: rgba(124,58,237,0.08); animation: spin-slow 30s linear infinite reverse; }
.r3 { width: 700px; height: 700px; top: 0; left: 0; border-color: rgba(124,58,237,0.05); }

@keyframes spin-slow { to { transform: translate(-50%,-50%) rotate(360deg); } }

/* ---- MAIN ---- */
.pub-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

.section { padding: 60px 0 0; }

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.section-title {
  font-family: var(--font-head);
  font-size: clamp(1.4rem, 4vw, 2rem);
  font-weight: 800;
  color: var(--text);
  margin-bottom: 4px;
}

.section-sub {
  font-size: 13px;
  color: var(--text3);
}

/* ---- UNITS GRID ---- */
.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

/* ---- WEEKS LIST ---- */
.weeks-list { display: flex; flex-direction: column; gap: 16px; }

.week-item {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  display: grid;
  grid-template-columns: 180px 1fr;
}

@media (max-width: 560px) {
  .week-item { grid-template-columns: 1fr; }
  .week-thumb { width: 100%; height: 180px; }
}

.week-item:hover {
  border-color: var(--accent);
  transform: translateX(4px);
  box-shadow: var(--glow);
}

/* ---- WEEK DETAIL ---- */
.week-detail-wrap { max-width: 800px; }

/* Files section */
.files-section {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-top: 24px;
}

.files-section h4 {
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 16px;
}

.file-download-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  transition: all 0.2s;
  gap: 12px;
}

.file-download-item:hover { border-color: var(--accent); }

.file-download-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text2);
  overflow: hidden;
  flex: 1;
}

.file-icon { font-size: 18px; flex-shrink: 0; }
.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-download {
  background: var(--accent);
  color: white;
  border: none;
  padding: 7px 16px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  text-decoration: none;
  display: inline-block;
  flex-shrink: 0;
}
.btn-download:hover { background: var(--accent2); }

.btn-download-locked {
  background: var(--bg3);
  color: var(--text3);
  border: 1px solid var(--border);
  padding: 7px 16px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-download-locked:hover { border-color: var(--accent); color: var(--accent2); }

/* ---- REGISTER MODAL ---- */
.register-modal-box {
  text-align: center;
  max-width: 420px;
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-title {
  font-family: var(--font-head);
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 10px;
}

.modal-desc {
  font-size: 13px;
  color: var(--text3);
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-btn { width: 100%; text-align: center; }

.btn-ghost {
  display: inline-block;
  padding: 12px 24px;
  background: none;
  border: 1px solid var(--border);
  color: var(--text2);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}
.btn-ghost:hover { border-color: var(--accent); color: var(--accent2); }

/* ---- FOOTER ---- */
.pub-footer {
  border-top: 1px solid var(--border);
  padding: 32px 24px;
  text-align: center;
  font-size: 12px;
  color: var(--text3);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-login-link {
  color: var(--accent2);
  text-decoration: none;
  font-size: 13px;
}
.footer-login-link:hover { text-decoration: underline; }

/* ---- AUTH BACK LINK ---- */
.auth-back-link {
  position: fixed;
  top: 16px;
  left: 20px;
  z-index: 200;
}
.auth-back-link a {
  font-size: 12px;
  color: var(--text3);
  text-decoration: none;
  font-family: var(--font-mono);
  transition: color 0.2s;
}
.auth-back-link a:hover { color: var(--accent2); }

/* ============================================
   RESPONSIVE FIXES GLOBALES
   ============================================ */

/* Sidebar responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    box-shadow: 4px 0 20px rgba(0,0,0,0.5);
  }
  .sidebar.open { transform: translateX(0); }
  .main-content { margin-left: 0 !important; }
  .menu-toggle { display: flex !important; }

  .view { padding: 20px 16px; }

  .form-row { grid-template-columns: 1fr; }

  .admin-card { padding: 16px; }

  .top-bar { padding: 14px 16px; }

  .units-grid { grid-template-columns: 1fr; }

  .week-detail-content { padding: 0; }
  .detail-title { font-size: 22px; }

  .users-table { font-size: 11px; }
  .users-table th, .users-table td { padding: 8px; }

  .auth-container {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 100px 20px 40px;
  }

  .auth-brand { text-align: center; align-items: center; }
  .brand-sub { max-width: 100%; }

  .modal-box { padding: 24px 16px; }
}

@media (max-width: 480px) {
  .hero-title { font-size: 2.4rem; }
  .hero-sub { font-size: 13px; }
  .hero-actions { flex-direction: column; }
  .btn-hero-primary, .btn-hero-ghost { text-align: center; }

  .hero-deco { display: none; }

  .file-download-item { flex-wrap: wrap; }
  .file-download-info { min-width: 0; }
}

/* Overlay to close sidebar on mobile */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
}
.sidebar-overlay.active { display: block; }
