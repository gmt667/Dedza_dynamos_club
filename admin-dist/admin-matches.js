/* admin-matches.js — Fixtures & Results management connected to live SQLite Database */
(function () {
  const STORE_KEY = 'dd_admin_matches';

  const defaultMatches = [
    { id: 1, date: '2026-10-11', home: 'Dedza Dynamos', away: 'Masters FC', venue: 'Dedza Stadium', comp: 'FDH Bank Premiership', status: 'Upcoming', score: '' },
    { id: 2, date: '2026-10-17', home: 'Civil Service United', away: 'Dedza Dynamos', venue: 'CIVO Stadium', comp: 'FDH Bank Premiership', status: 'Upcoming', score: '' },
    { id: 3, date: '2026-10-25', home: 'Dedza Dynamos', away: 'Moyale Barracks', venue: 'Dedza Stadium', comp: 'FDH Bank Premiership', status: 'Upcoming', score: '' },
    { id: 4, date: '2026-09-09', home: 'Dedza Dynamos', away: 'Luanar Mitundu', venue: 'Dedza Stadium', comp: 'FDH Bank Premiership', status: 'Full time', score: '0–0' },
    { id: 5, date: '2026-07-25', home: 'Dedza Dynamos', away: 'FCB Big Bullets', venue: 'Dedza Stadium', comp: 'FDH Bank Premiership', status: 'Full time', score: '1–0' },
    { id: 6, date: '2026-02-21', home: 'FCB Nyasa Big Bullets', away: 'Dedza Dynamos', venue: 'Bingu National Stadium', comp: 'Castel Challenge Cup', status: 'Full time', score: '2–1' },
  ];

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || defaultMatches; }
    catch { return defaultMatches; }
  }
  function saveLocal(m) { localStorage.setItem(STORE_KEY, JSON.stringify(m)); }

  let matches = loadLocal();
  let editId = null;

  async function fetchRemoteMatches() {
    if (window.AdminAPI) {
      try {
        const data = await window.AdminAPI.getMatches();
        if (Array.isArray(data) && data.length) {
          matches = data;
          saveLocal(matches);
          renderTable('upcoming');
          renderTable('results');
        }
      } catch (err) {
        console.warn('API getMatches error, using local fallback:', err);
      }
    }
  }

  function renderTable(which) {
    const tbody = document.getElementById(which === 'upcoming' ? 'fixtures-tbody' : 'results-tbody');
    if (!tbody) return;
    const list = matches.filter(m => which === 'upcoming' ? m.status === 'Upcoming' : m.status !== 'Upcoming');
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#888;padding:2rem">No matches found.</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(m => `
      <tr data-id="${m.id}">
        <td>${formatDate(m.date)}</td>
        <td>${esc(m.home)}</td>
        <td><strong>${m.score || 'TBC'}</strong></td>
        <td>${esc(m.away)}</td>
        <td>${esc(m.venue)}</td>
        <td>${esc(m.comp)}</td>
        <td><span class="badge ${m.status === 'Upcoming' ? 'upcoming' : m.status === 'Postponed' ? 'postponed' : 'published'}">${esc(m.status)}</span></td>
        <td>
          <button class="tbl-btn" onclick="editMatch('${esc(m.id)}')">Edit</button>
          <button class="tbl-btn danger" onclick="deleteMatch('${esc(m.id)}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function formatDate(d) {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── MODAL ──
  const modal = document.getElementById('match-modal');
  const form = document.getElementById('match-form');
  const modalTitle = document.getElementById('match-modal-title');

  function openModal(m = null) {
    editId = m ? m.id : null;
    modalTitle.textContent = m ? 'Edit match' : 'Add match';
    document.getElementById('m-home').value = m ? m.home : 'Dedza Dynamos';
    document.getElementById('m-away').value = m ? m.away : '';
    document.getElementById('m-date').value = m ? m.date : '';
    document.getElementById('m-time').value = m ? (m.time || '') : '';
    document.getElementById('m-venue').value = m ? m.venue : 'Dedza Stadium';
    document.getElementById('m-comp').value = m ? m.comp : 'FDH Bank Premiership';
    document.getElementById('m-status').value = m ? m.status : 'Upcoming';
    document.getElementById('m-score').value = m ? m.score : '';
    modal.classList.add('is-open');
    modal.hidden = false;
    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.hidden = true;
    modal.style.display = 'none';
    editId = null;
  }

  document.getElementById('new-match-btn')?.addEventListener('click', () => openModal(null));
  document.getElementById('match-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('match-modal-cancel')?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      home: document.getElementById('m-home').value.trim(),
      away: document.getElementById('m-away').value.trim(),
      date: document.getElementById('m-date').value,
      time: document.getElementById('m-time').value,
      venue: document.getElementById('m-venue').value.trim(),
      comp: document.getElementById('m-comp').value,
      status: document.getElementById('m-status').value,
      score: document.getElementById('m-score').value.trim(),
    };
    if (!payload.home || !payload.away) { window.adminToast('Please fill in both teams'); return; }

    try {
      if (editId) {
        if (window.AdminAPI) {
          await window.AdminAPI.updateMatch(editId, payload);
          matches = matches.map(x => String(x.id) === String(editId) ? { ...x, ...payload, id: editId } : x);
        } else {
          matches = matches.map(x => String(x.id) === String(editId) ? { ...payload, id: editId } : x);
        }
      } else {
        if (window.AdminAPI) {
          const created = await window.AdminAPI.createMatch(payload);
          matches.unshift(created);
        } else {
          matches.unshift({ ...payload, id: Date.now() });
        }
      }
    } catch (err) {
      console.warn('API match save error, using local fallback:', err);
      if (editId) {
        matches = matches.map(x => String(x.id) === String(editId) ? { ...payload, id: editId } : x);
      } else {
        matches.unshift({ ...payload, id: Date.now() });
      }
    }

    saveLocal(matches);
    closeModal();
    renderTable('upcoming');
    renderTable('results');
    window.adminToast(editId ? 'Match updated in Database ✓' : 'Match added to Database ✓');
  });

  window.editMatch = (id) => { const m = matches.find(x => String(x.id) === String(id)); if (m) openModal(m); };
  window.deleteMatch = async (id) => {
    if (!confirm('Delete this match?')) return;
    try {
      if (window.AdminAPI) await window.AdminAPI.deleteMatch(id);
    } catch (err) {
      console.warn('API match delete error, local fallback:', err);
    }
    matches = matches.filter(x => String(x.id) !== String(id));
    saveLocal(matches);
    renderTable('upcoming');
    renderTable('results');
    window.adminToast('Match deleted from Database ✓');
  };

  renderTable('upcoming');
  renderTable('results');
  fetchRemoteMatches();
})();
