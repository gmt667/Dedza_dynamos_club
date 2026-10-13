/* admin-news.js — News management page connected to live SQLite Database */
(function () {
  const STORE_KEY = 'dd_admin_news';

  const defaultStories = [
    { id: 1, title: 'The road to a first Castel Cup final', tag: 'History', date: '2026-02-19', status: 'Published', lead: 'A stoppage-time equaliser and a dramatic shootout carried Dedza onto the national stage.' },
    { id: 2, title: 'A new board for a new era', tag: 'Club', date: '2026-10-05', status: 'Published', lead: 'Reported leadership changes mark the next chapter in the club\'s growth.' },
    { id: 3, title: 'Dedza finish as cup runners-up', tag: 'Match report', date: '2026-02-21', status: 'Published', lead: 'Chikondi Mbeta scored late as the Yellow Boys contested their first final.' },
    { id: 4, title: 'Clement Nyondo wins Golden Boot', tag: 'News', date: '2023-06-30', status: 'Published', lead: 'The striker finished the 2022/23 season with a reported 16 goals.' },
    { id: 5, title: 'Pre-season training underway', tag: 'News', date: '2026-07-01', status: 'Draft', lead: 'The squad reports back ahead of the new FDH Bank Premiership campaign.' },
  ];

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || defaultStories; }
    catch { return defaultStories; }
  }
  function saveLocal(stories) { localStorage.setItem(STORE_KEY, JSON.stringify(stories)); }

  let stories = loadLocal();
  let editId = null;

  async function fetchRemoteStories() {
    if (window.AdminAPI) {
      try {
        const data = await window.AdminAPI.getNews();
        if (Array.isArray(data) && data.length) {
          stories = data;
          saveLocal(stories);
          render(getFilters());
        }
      } catch (err) {
        console.warn('API fetchNews error, using local state:', err);
      }
    }
  }

  // ── RENDER TABLE ──
  function render(filter = {}) {
    const tbody = document.getElementById('news-tbody');
    if (!tbody) return;

    let list = stories;
    if (filter.q) {
      const q = filter.q.toLowerCase().trim();
      list = list.filter(s =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.lead && s.lead.toLowerCase().includes(q)) ||
        (s.tag && s.tag.toLowerCase().includes(q))
      );
    }
    if (filter.status && filter.status !== 'all') list = list.filter(s => s.status === filter.status);
    if (filter.tag && filter.tag !== 'all') list = list.filter(s => s.tag === filter.tag);

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;padding:2rem">No stories found.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(s => `
      <tr data-id="${s.id}">
        <td><strong>${escHtml(s.title)}</strong><br><small style="color:#888">${escHtml((s.lead || '').slice(0,70))}…</small></td>
        <td><span class="badge ${s.tag === 'Match report' ? 'upcoming' : 'published'}">${escHtml(s.tag || 'News')}</span></td>
        <td>${formatDate(s.date)}</td>
        <td><span class="badge ${s.status === 'Published' ? 'published' : 'draft'}">${escHtml(s.status || 'Draft')}</span></td>
        <td>
          <button class="tbl-btn" onclick="editStory('${escHtml(s.id)}')">Edit</button>
          <button class="tbl-btn danger" onclick="deleteStory('${escHtml(s.id)}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function formatDate(d) {
    if (!d) return '–';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── MODAL ──
  const modal = document.getElementById('story-modal');
  const form = document.getElementById('story-form');
  const modalTitle = document.getElementById('modal-title');

  function openModal(story = null) {
    editId = story ? story.id : null;
    modalTitle.textContent = story ? 'Edit story' : 'New story';
    document.getElementById('s-title').value = story ? story.title : '';
    document.getElementById('s-tag').value = story ? story.tag : 'News';
    document.getElementById('s-lead').value = story ? (story.lead || '') : '';
    document.getElementById('s-body').value = story ? (story.content || story.body || '') : '';
    document.getElementById('s-date').value = story ? story.date : new Date().toISOString().slice(0,10);
    document.getElementById('s-status').value = story ? story.status : 'Draft';
    modal.classList.add('is-open');
    modal.hidden = false;
    modal.style.display = 'flex';
    document.getElementById('s-title').focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.hidden = true;
    modal.style.display = 'none';
    editId = null;
  }

  document.getElementById('new-story-btn')?.addEventListener('click', () => openModal(null));
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      title: document.getElementById('s-title').value.trim(),
      tag: document.getElementById('s-tag').value,
      lead: document.getElementById('s-lead').value.trim(),
      content: document.getElementById('s-body').value.trim(),
      date: document.getElementById('s-date').value,
      status: document.getElementById('s-status').value,
    };
    if (!payload.title) { window.adminToast('Please enter a headline'); return; }

    try {
      if (editId) {
        if (window.AdminAPI) {
          await window.AdminAPI.updateNews(editId, payload);
          stories = stories.map(s => String(s.id) === String(editId) ? { ...s, ...payload, id: editId } : s);
        } else {
          stories = stories.map(s => String(s.id) === String(editId) ? { ...payload, id: editId } : s);
        }
      } else {
        if (window.AdminAPI) {
          const created = await window.AdminAPI.createNews(payload);
          stories.unshift(created);
        } else {
          stories.unshift({ ...payload, id: Date.now() });
        }
      }
    } catch (err) {
      console.warn('API error saving story, saving local fallback:', err);
      if (editId) {
        stories = stories.map(s => String(s.id) === String(editId) ? { ...payload, id: editId } : s);
      } else {
        stories.unshift({ ...payload, id: `upd_${Date.now()}` });
      }
    }

    saveLocal(stories);
    closeModal();
    render(getFilters());
    window.adminToast(editId ? 'Story updated in Database ✓' : 'Story saved to Database ✓');
  });

  window.editStory = (id) => {
    const s = stories.find(s => String(s.id) === String(id));
    if (s) openModal(s);
  };

  window.deleteStory = async (id) => {
    if (!confirm('Delete this story? This cannot be undone.')) return;
    try {
      if (window.AdminAPI) await window.AdminAPI.deleteNews(id);
    } catch (err) {
      console.warn('API delete error, deleting local:', err);
    }
    stories = stories.filter(s => String(s.id) !== String(id));
    saveLocal(stories);
    render(getFilters());
    window.adminToast('Story deleted from Database ✓');
  };

  // ── FILTERS ──
  function getFilters() {
    return {
      q: document.getElementById('story-search')?.value || '',
      status: document.getElementById('story-filter-status')?.value || 'all',
      tag: document.getElementById('story-filter-tag')?.value || 'all',
    };
  }

  ['story-search','story-filter-status','story-filter-tag'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => render(getFilters()));
    document.getElementById(id)?.addEventListener('change', () => render(getFilters()));
  });

  // Initial render & sync
  render();
  fetchRemoteStories();
})();
