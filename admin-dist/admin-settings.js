/* admin-settings.js — Settings page connected to live SQLite Database */
(function () {
  const CFG_KEY = 'dd_admin_config';

  function loadConfig() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; }
    catch { return {}; }
  }
  function saveConfig(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }

  let cfg = loadConfig();

  // Populate fields from storage
  function populate(data) {
    if (data.displayName) document.getElementById('set-name').value = data.displayName;
    if (data.club_name || data.clubName) document.getElementById('cfg-name').value = data.club_name || data.clubName;
    if (data.nickname) document.getElementById('cfg-nick').value = data.nickname;
    if (data.stadium || data.venue) document.getElementById('cfg-venue').value = data.stadium || data.venue;
    if (data.contact_email || data.email) document.getElementById('cfg-email').value = data.contact_email || data.email;
    if (data.whatsapp) document.getElementById('cfg-wa').value = data.whatsapp;
  }

  populate(cfg);

  // Sync from live SQLite settings
  if (window.AdminAPI) {
    window.AdminAPI.getSettings().then(dbSettings => {
      if (dbSettings && Object.keys(dbSettings).length) {
        cfg = { ...cfg, ...dbSettings };
        populate(cfg);
        saveConfig(cfg);
      }
    }).catch(err => console.warn('API getSettings error:', err));
  }

  document.getElementById('account-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const pw = document.getElementById('set-pw').value;
    const pw2 = document.getElementById('set-pw2').value;
    if (pw && pw !== pw2) { window.adminToast('Passwords do not match'); return; }
    cfg.displayName = document.getElementById('set-name').value.trim();
    saveConfig(cfg);
    window.adminToast('Account settings saved ✓');
  });

  document.getElementById('site-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const club_name = document.getElementById('cfg-name').value.trim();
    const nickname = document.getElementById('cfg-nick').value.trim();
    const stadium = document.getElementById('cfg-venue').value.trim();
    const contact_email = document.getElementById('cfg-email').value.trim();
    const whatsapp = document.getElementById('cfg-wa').value.trim();

    const payload = { club_name, nickname, stadium, contact_email, whatsapp };
    cfg = { ...cfg, ...payload };
    saveConfig(cfg);

    if (window.AdminAPI) {
      try {
        await window.AdminAPI.updateSettings(payload);
        window.adminToast('Site configuration saved to SQLite ✓');
        return;
      } catch (err) {
        console.warn('API updateSettings error:', err);
      }
    }
    window.adminToast('Site configuration saved ✓');
  });
})();
