/* admin-app.js — Shared admin UI utilities */
(function () {
  // ── AUTH GUARD ──
  const user = 'Club staff';

  // ── POPULATE USER INFO ──
  const userEls = document.querySelectorAll('#sidebar-user');
  userEls.forEach(el => { el.textContent = user.charAt(0).toUpperCase() + user.slice(1); });

  const avatarEls = document.querySelectorAll('#topbar-avatar');
  avatarEls.forEach(el => { el.textContent = user.charAt(0).toUpperCase(); });

  // ── DATE ──
  const dateEl = document.getElementById('topbar-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── SIDEBAR TOGGLE ──
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebarClose = document.getElementById('sidebar-close');

  if (menuToggle) menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  if (sidebarClose) sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

  // Close sidebar on outside click on mobile
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuToggle) {
      sidebar.classList.remove('open');
    }
  });

  // ── LOGOUT ──
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }

  // ── VIEW SITE LINK ──
  const viewSiteBtn = document.querySelector('.view-site-btn');
  if (viewSiteBtn) {
    if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
      viewSiteBtn.href = `${location.protocol}//${location.hostname}:4173/`;
    } else {
      viewSiteBtn.href = 'https://dedza-dynamos-club.mwalwandadesire5.chatgpt.site/';
    }
  }

  // ── TOAST ──
  window.adminToast = function (msg, duration = 3200) {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  };

  // ── TAB BAR ──
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('[id$="-panel"]').forEach(panel => {
        panel.hidden = !panel.id.startsWith(tab);
      });
    });
  });

  // ── MODAL CANCEL & CLOSE HANDLER ──
  window.closeAllModals = function () {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('is-open');
      modal.hidden = true;
      modal.style.display = 'none';
    });
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('.modal-close, #modal-cancel, #player-modal-cancel, #match-modal-cancel, [data-dismiss="modal"], .form-actions .btn-ghost')) {
      e.preventDefault();
      const modal = e.target.closest('.modal-overlay') || document.querySelector('.modal-overlay.is-open, .modal-overlay:not([hidden])');
      if (modal) {
        modal.classList.remove('is-open');
        modal.hidden = true;
        modal.style.display = 'none';
      }
      return;
    }
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('is-open');
      e.target.hidden = true;
      e.target.style.display = 'none';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeAllModals();
    }
  });
})();
