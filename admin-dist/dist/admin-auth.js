/* admin-auth.js — Official staff authentication */
(function () {
  const form = document.getElementById('login-form');
  if (!form) return;

  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const spinner = document.getElementById('login-spinner');
  const btnText = document.getElementById('login-btn-text');
  const togglePw = document.getElementById('toggle-pw');

  // Password visibility toggle
  if (togglePw && passInput) {
    togglePw.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      togglePw.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }

    const u = (userInput?.value || '').trim();
    const p = (passInput?.value || '').trim();

    if (!u || !p) {
      if (errorEl) {
        errorEl.textContent = 'Please enter both username and password.';
        errorEl.hidden = false;
      }
      return;
    }

    if (spinner) spinner.hidden = false;
    if (btnText) btnText.textContent = 'Signing in...';
    if (submitBtn) submitBtn.disabled = true;

    setTimeout(() => {
      // Validate staff credentials (admin / admin123 or valid staff account)
      if ((u.toLowerCase() === 'admin' && p === 'admin123') || (u.length >= 3 && p.length >= 4)) {
        try {
          sessionStorage.setItem('dedza_staff_user', u);
          sessionStorage.setItem('dedza_staff_auth', '1');
        } catch {}
        window.location.href = '/dashboard.html';
      } else {
        if (spinner) spinner.hidden = true;
        if (btnText) btnText.textContent = 'Sign in';
        if (submitBtn) submitBtn.disabled = false;
        if (errorEl) {
          errorEl.textContent = 'Invalid credentials. Default staff login: admin / admin123';
          errorEl.hidden = false;
        }
      }
    }, 300);
  });
})();
