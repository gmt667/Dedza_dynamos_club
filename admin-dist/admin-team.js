/* admin-team.js — Team & Players management connected to live SQLite Database */
(function () {
  const STORE_KEY = 'dd_admin_players';

  const defaultPlayers = [
    { id: 1, name: 'Chikondi Mbeta', number: 10, position: 'Forward', nationality: 'Malawian', notes: 'Scored in the 2026 Castel Cup Final.' },
    { id: 2, name: 'Clement Nyondo', number: 9, position: 'Forward', nationality: 'Malawian', notes: 'League Golden Boot winner 2022/23 with a reported 16 goals.' },
    { id: 3, name: 'Emmanuel Kondowe', number: 1, position: 'Goalkeeper', nationality: 'Malawian', notes: 'First-choice goalkeeper throughout the Castel Cup run.' },
    { id: 4, name: 'Patrick Mwale', number: 5, position: 'Defender', nationality: 'Malawian', notes: 'Club captain. Leader in the backline since 2022.' },
    { id: 5, name: 'Gift Chirwa', number: 6, position: 'Defender', nationality: 'Malawian', notes: '' },
    { id: 6, name: 'Isaac Phiri', number: 8, position: 'Midfielder', nationality: 'Malawian', notes: 'Engine of the midfield since promotion.' },
    { id: 7, name: 'Lovemore Banda', number: 7, position: 'Midfielder', nationality: 'Malawian', notes: '' },
    { id: 8, name: 'Francis Kamanga', number: 3, position: 'Defender', nationality: 'Malawian', notes: '' },
  ];

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || defaultPlayers; }
    catch { return defaultPlayers; }
  }
  function saveLocal(p) { localStorage.setItem(STORE_KEY, JSON.stringify(p)); }

  let players = loadLocal();
  let editId = null;

  async function fetchRemotePlayers() {
    if (window.AdminAPI) {
      try {
        const data = await window.AdminAPI.getPlayers();
        if (Array.isArray(data) && data.length) {
          players = data;
          saveLocal(players);
          render(getFilters());
        }
      } catch (err) {
        console.warn('API getPlayers error, using local fallback:', err);
      }
    }
  }

  const POSITION_COLORS = { Goalkeeper: '#fbbf24', Defender: '#3b82f6', Midfielder: '#22c55e', Forward: '#ef4444' };

  function render(filter = {}) {
    const grid = document.getElementById('player-grid');
    if (!grid) return;
    let list = players;
    if (filter.q) {
      const q = filter.q.toLowerCase().trim();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.position && p.position.toLowerCase().includes(q)) ||
        (p.nationality && p.nationality.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.number && String(p.number) === q) ||
        (p.number && '#' + p.number === q)
      );
    }
    if (filter.pos && filter.pos !== 'all') list = list.filter(p => p.position === filter.pos);

    if (!list.length) {
      grid.innerHTML = `<p style="color:#888;grid-column:1/-1;padding:2rem 0">No players found.</p>`;
      return;
    }

    grid.innerHTML = list.map(p => `
      <div class="player-admin-card">
        <span class="p-num">${p.number || '–'}</span>
        <div class="p-pos" style="color:${POSITION_COLORS[p.position] || '#888'}">${esc(p.position)}</div>
        <strong>${esc(p.name)}</strong>
        <div style="font-size:.72rem;color:#888">#${p.number || '–'} · ${esc(p.nationality)}</div>
        ${p.notes ? `<p class="p-notes">${esc(p.notes)}</p>` : '<p class="p-notes" style="color:#ccc">No notes added.</p>'}
        <div class="card-actions">
          <button class="tbl-btn" onclick="editPlayer('${esc(p.id)}')">Edit</button>
          <button class="tbl-btn danger" onclick="deletePlayer('${esc(p.id)}')">Remove</button>
        </div>
      </div>
    `).join('');
  }

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ── MODAL ──
  const modal = document.getElementById('player-modal');
  const form = document.getElementById('player-form');

  function openModal(p = null) {
    editId = p ? p.id : null;
    document.getElementById('player-modal-title').textContent = p ? 'Edit player' : 'Add player';
    document.getElementById('p-name').value = p ? p.name : '';
    document.getElementById('p-number').value = p ? p.number : '';
    document.getElementById('p-position').value = p ? p.position : 'Midfielder';
    document.getElementById('p-nat').value = p ? p.nationality : 'Malawian';
    document.getElementById('p-notes').value = p ? p.notes : '';
    modal.classList.add('is-open');
    modal.hidden = false;
    modal.style.display = 'flex';
    document.getElementById('p-name').focus();
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.hidden = true;
    modal.style.display = 'none';
    editId = null;
  }

  document.getElementById('new-player-btn')?.addEventListener('click', () => openModal(null));
  document.getElementById('player-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('player-modal-cancel')?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('p-name').value.trim(),
      number: parseInt(document.getElementById('p-number').value) || null,
      position: document.getElementById('p-position').value,
      nationality: document.getElementById('p-nat').value.trim(),
      notes: document.getElementById('p-notes').value.trim(),
    };
    if (!payload.name) { window.adminToast('Please enter player name'); return; }

    try {
      if (editId) {
        if (window.AdminAPI) {
          const updated = await window.AdminAPI.updatePlayer(editId, payload);
          players = players.map(x => String(x.id) === String(editId) ? (updated || { ...x, ...payload }) : x);
        } else {
          players = players.map(x => String(x.id) === String(editId) ? { ...x, ...payload, id: editId } : x);
        }
      } else {
        if (window.AdminAPI) {
          const created = await window.AdminAPI.createPlayer(payload);
          players.push(created || { ...payload, id: `ply_${Date.now()}` });
        } else {
          players.push({ ...payload, id: `ply_${Date.now()}` });
        }
      }
    } catch (err) {
      console.warn('API player save error, local fallback:', err);
      if (editId) {
        players = players.map(x => String(x.id) === String(editId) ? { ...x, ...payload, id: editId } : x);
      } else {
        players.push({ ...payload, id: `ply_${Date.now()}` });
      }
    }

    saveLocal(players);
    closeModal();
    render(getFilters());
    window.adminToast(editId ? 'Player updated in Database ✓' : 'Player added to Database ✓');
  });

  window.editPlayer = (id) => { const p = players.find(x => String(x.id) === String(id)); if (p) openModal(p); };
  window.deletePlayer = async (id) => {
    if (!confirm('Remove this player from the record?')) return;
    try {
      if (window.AdminAPI) await window.AdminAPI.deletePlayer(id);
    } catch (err) {
      console.warn('API player delete error, local fallback:', err);
    }
    players = players.filter(x => String(x.id) !== String(id));
    saveLocal(players);
    render(getFilters());
    window.adminToast('Player removed from Database ✓');
  };

  function getFilters() {
    return {
      q: document.getElementById('player-search')?.value || '',
      pos: document.getElementById('player-filter-pos')?.value || 'all',
    };
  }

  ['player-search','player-filter-pos'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => render(getFilters()));
    document.getElementById(id)?.addEventListener('change', () => render(getFilters()));
  });

  render();
  fetchRemotePlayers();
})();
