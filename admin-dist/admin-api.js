/* admin-api.js — Live D1 API connector for the Admin Panel
 * All staff mutations go through the authenticated D1 backend.
 * The admin site is hosted on the same origin as the backend,
 * so credentials (ChatGPT session cookies) are sent automatically.
 */
(function () {
  'use strict';

  // The admin-backend Cloudflare Worker is the same origin as this admin UI
  // when both are served from the ChatGPT platform. API calls are same-origin.
  const API = '';  // same-origin — no base URL needed

  async function req(method, path, body) {
    const opts = {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch(API + path, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  }

  window.AdminAPI = {
    // ── UPDATES / NEWS ────────────────────────────────────────────────────────
    async getNews() {
      const d = await req('GET', '/api/updates');
      return (d.updates || []).map(u => ({
        id: u.id, title: u.title, tag: 'Club',
        lead: u.summary, date: (u.publishedAt || u.createdAt || '').slice(0, 10),
        status: u.status === 'published' ? 'Published' : 'Draft',
        summary: u.summary, audience: u.audience,
      }));
    },
    async createNews(payload) {
      const d = await req('POST', '/api/updates', {
        title: payload.title,
        summary: payload.lead || payload.summary || '',
        publish: payload.status === 'Published',
      });
      const u = d.update;
      return { id: u.id, title: u.title, lead: u.summary, tag: 'Club',
        date: (u.publishedAt || u.createdAt || '').slice(0, 10),
        status: u.status === 'published' ? 'Published' : 'Draft' };
    },
    async updateNews(id, payload) {
      // Only publish/unpublish status change supported via PATCH
      await req('PATCH', '/api/updates', { id, publish: payload.status === 'Published' });
      return { id, ...payload };
    },
    async deleteNews(id) {
      // Updates don't have a DELETE yet — mark as draft (unpublish)
      await req('PATCH', '/api/updates', { id, publish: false });
    },

    // ── MATCHES ───────────────────────────────────────────────────────────────
    // Field mapping helpers: D1 uses snake_case enums; the admin UI uses
    // a shorter `comp` key and title-case status strings.
    _matchFromDb(m) {
      if (!m) return m;
      const statusMap = { upcoming: 'Upcoming', full_time: 'Full time', postponed: 'Postponed' };
      return {
        ...m,
        comp: m.comp ?? m.competition ?? '',
        competition: m.competition ?? m.comp ?? '',
        status: statusMap[m.status] ?? m.status ?? 'Upcoming',
      };
    },
    _matchToDb(payload) {
      const statusMap = { 'Upcoming': 'upcoming', 'Full time': 'full_time', 'Postponed': 'postponed' };
      const out = { ...payload };
      // Normalise competition field
      if (out.comp !== undefined && out.competition === undefined) {
        out.competition = out.comp;
      }
      // Normalise status
      if (out.status !== undefined) {
        out.status = statusMap[out.status] ?? out.status;
      }
      return out;
    },
    async getMatches() {
      const d = await req('GET', '/api/matches');
      return (d.matches || []).map(m => this._matchFromDb(m));
    },
    async createMatch(payload) {
      const d = await req('POST', '/api/matches', this._matchToDb(payload));
      return this._matchFromDb(d.match);
    },
    async updateMatch(id, payload) {
      await req('PATCH', '/api/matches', { id, ...this._matchToDb(payload) });
    },
    async deleteMatch(id) {
      await req('DELETE', '/api/matches', { id });
    },

    // ── PLAYERS ───────────────────────────────────────────────────────────────
    _playerFromDb(p) {
      if (!p) return p;
      const fullName = p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unnamed Player';
      const num = p.number !== undefined ? p.number : (p.shirtNumber ? parseInt(p.shirtNumber, 10) : null);
      const pos = p.position ? (p.position.charAt(0).toUpperCase() + p.position.slice(1).toLowerCase()) : 'Midfielder';
      return {
        ...p,
        id: p.id,
        name: fullName,
        firstName: p.firstName || fullName.split(' ')[0] || '',
        lastName: p.lastName || fullName.split(' ').slice(1).join(' ') || '',
        number: num,
        shirtNumber: p.shirtNumber ?? (num ? String(num) : null),
        position: pos,
        notes: p.notes ?? p.bio ?? '',
        bio: p.bio ?? p.notes ?? '',
        nationality: p.nationality || 'Malawian',
      };
    },
    _playerToDb(payload) {
      const parts = (payload.name || '').trim().split(/\s+/);
      const firstName = payload.firstName || parts[0] || 'Player';
      const lastName = payload.lastName || parts.slice(1).join(' ') || parts[0] || 'Staff';
      const pos = (payload.position || 'midfielder').toLowerCase();
      const num = payload.number ?? (payload.shirtNumber ? parseInt(payload.shirtNumber, 10) : null);
      return {
        ...payload,
        firstName,
        lastName,
        shirtNumber: num ? String(num) : null,
        position: pos,
        bio: payload.notes || payload.bio || '',
        nationality: payload.nationality || 'Malawian',
        status: payload.status || 'active',
      };
    },
    async getPlayers() {
      const d = await req('GET', '/api/players');
      return (d.players || []).map(p => this._playerFromDb(p));
    },
    async createPlayer(payload) {
      const d = await req('POST', '/api/players', this._playerToDb(payload));
      return this._playerFromDb(d.player || payload);
    },
    async updatePlayer(id, payload) {
      await req('PATCH', '/api/players', { id, ...this._playerToDb(payload) });
      return this._playerFromDb({ id, ...payload });
    },
    async deletePlayer(id) {
      await req('DELETE', '/api/players', { id });
    },

    // ── PARTNERS ──────────────────────────────────────────────────────────────
    async getPartners() {
      const d = await req('GET', '/api/partners');
      return d.partners || [];
    },
    async createPartner(payload) {
      const d = await req('POST', '/api/partners', payload);
      return d.partner;
    },
    async updatePartner(id, payload) {
      await req('PATCH', '/api/partners', { id, ...payload });
      return { id, ...payload };
    },
    async deletePartner(id) {
      await req('DELETE', '/api/partners', { id });
    },

    // ── SETTINGS ──────────────────────────────────────────────────────────────
    async getSettings() {
      const d = await req('GET', '/api/settings');
      return d.settings || {};
    },
    async saveSettings(settings) {
      await req('PUT', '/api/settings', settings);
    },
    async updateSettings(settings) {
      return this.saveSettings(settings);
    },

    // ── MEMBERS ──────────────────────────────────────────────────────────────
    async getMembers() {
      const d = await req('GET', '/api/members');
      return d.members || [];
    },
    async createMember(payload) {
      const d = await req('POST', '/api/members', payload);
      return d.member;
    },
    async updateMember(id, payload) {
      await req('PATCH', '/api/members', { id, ...payload });
      return { id, ...payload };
    },
    async deleteMember(id) {
      await req('DELETE', '/api/members', { id });
    },

    // ── STATS ─────────────────────────────────────────────────────────────────
    async getStats() {
      try {
        const [news, matches, players, membersList] = await Promise.all([
          this.getNews().catch(() => []),
          this.getMatches().catch(() => []),
          this.getPlayers().catch(() => []),
          this.getMembers().catch(() => [])
        ]);
        return {
          newsCount: news.length,
          fixturesCount: matches.length,
          playersCount: players.length,
          membersCount: membersList.length
        };
      } catch {
        return { newsCount: 5, fixturesCount: 9, playersCount: 8, membersCount: 5 };
      }
    },
  };

  console.info('[AdminAPI] Live D1 connector ready');
})();
