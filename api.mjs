import { db, initDatabase, logAuditEvent } from './db.mjs';

initDatabase();

export async function handleApiRequest(req, res, pathname, query) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  const sendJson = (statusCode, data, extraHeaders = {}) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache',
      ...extraHeaders
    });
    res.end(JSON.stringify(data));
  };

  const getBody = async () => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 2e6) {
          req.destroy();
          reject(new Error('Payload too large'));
        }
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (err) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  };

  try {
    // ── READ-ONLY PUBLIC UPDATES (Cloudflare D1 Parity) ──
    if (pathname === '/api/public/updates' && req.method === 'GET') {
      const updates = db.prepare(`
        SELECT id, title, lead as summary, date as publishedAt, tag as authorName
        FROM news
        WHERE status = 'Published' AND (audience = 'public' OR audience IS NULL)
        ORDER BY date DESC, id DESC
        LIMIT 24
      `).all();
      sendJson(200, { updates }, { 'Cache-Control': 'public, max-age=60, s-maxage=300' });
      return true;
    }

    // ── AUDIT EVENTS ──
    if (pathname === '/api/audit-events' && req.method === 'GET') {
      const events = db.prepare('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 50').all();
      sendJson(200, { events });
      return true;
    }

    // ── STAFF PROFILES ──
    if (pathname === '/api/staff') {
      if (req.method === 'GET') {
        const staff = db.prepare('SELECT user_id, display_name, email, role, created_at FROM staff_profiles ORDER BY role ASC').all();
        sendJson(200, staff);
        return true;
      }
      if (req.method === 'POST') {
        const body = await getBody();
        const { display_name, email, role = 'viewer' } = body;
        if (!display_name || !email) return sendJson(400, { error: 'Display name and email are required' });
        const user_id = 'staff_' + Date.now();
        db.prepare(`
          INSERT INTO staff_profiles (user_id, display_name, email, role)
          VALUES (?, ?, ?, ?)
        `).run(user_id, display_name, email, role);
        logAuditEvent('admin', 'Dedza Dynamos Admin', 'create', 'staff_profile', user_id, `Created ${role} profile for ${display_name}`);
        const created = db.prepare('SELECT * FROM staff_profiles WHERE user_id = ?').get(user_id);
        sendJson(201, created);
        return true;
      }
    }

    // ── STATS / DASHBOARD ──
    if (pathname === '/api/stats' && req.method === 'GET') {
      const newsCount = db.prepare('SELECT COUNT(*) as c FROM news').get().c;
      const playersCount = db.prepare('SELECT COUNT(*) as c FROM players').get().c;
      const fixturesCount = db.prepare("SELECT COUNT(*) as c FROM matches WHERE status = 'Upcoming'").get().c;
      const resultsCount = db.prepare("SELECT COUNT(*) as c FROM matches WHERE status != 'Upcoming'").get().c;
      const partnersCount = db.prepare('SELECT COUNT(*) as c FROM partners').get().c;
      const staffCount = db.prepare('SELECT COUNT(*) as c FROM staff_profiles').get().c;
      sendJson(200, {
        newsCount,
        playersCount,
        fixturesCount,
        resultsCount,
        partnersCount,
        staffCount
      });
      return true;
    }

    // ── AUTH / LOGIN ──
    if (pathname === '/api/login' && req.method === 'POST') {
      const body = await getBody();
      const { username, password } = body;
      if (username === 'admin' && password === 'admin123') {
        logAuditEvent('admin', 'Dedza Dynamos Admin', 'login', 'session', 'staff_owner_01', 'Admin signed in');
        sendJson(200, {
          success: true,
          token: 'dd_admin_auth_token_' + Date.now(),
          user: { username: 'admin', role: 'owner', name: 'Dedza Dynamos Admin' }
        });
      } else {
        sendJson(401, { error: 'Invalid username or password' });
      }
      return true;
    }

    // ── NEWS ──
    if (pathname === '/api/news') {
      if (req.method === 'GET') {
        let sql = 'SELECT * FROM news WHERE 1=1';
        const params = [];
        if (query.status && query.status !== 'all') {
          sql += ' AND status = ?';
          params.push(query.status);
        }
        if (query.tag && query.tag !== 'all') {
          sql += ' AND tag = ?';
          params.push(query.tag);
        }
        if (query.q) {
          sql += ' AND (title LIKE ? OR lead LIKE ? OR tag LIKE ?)';
          const term = `%${query.q}%`;
          params.push(term, term, term);
        }
        sql += ' ORDER BY date DESC, id DESC';
        const rows = db.prepare(sql).all(...params);
        sendJson(200, rows);
        return true;
      }

      if (req.method === 'POST') {
        const body = await getBody();
        const { title, tag = 'News', date = new Date().toISOString().slice(0, 10), status = 'Published', lead = '', content = '', image = '', audience = 'public' } = body;
        if (!title) return sendJson(400, { error: 'Title is required' });
        const stmt = db.prepare(`
          INSERT INTO news (title, tag, date, status, lead, content, image, audience)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(title, tag, date, status, lead, content, image, audience);
        const created = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid);
        logAuditEvent('admin', 'Dedza Dynamos Admin', status === 'Published' ? 'publish' : 'create', 'club_update', created.id, `Created story: ${title}`);
        sendJson(201, created);
        return true;
      }
    }

    const newsMatch = pathname.match(/^\/api\/news\/(\d+)$/);
    if (newsMatch) {
      const id = Number(newsMatch[1]);
      if (req.method === 'GET') {
        const item = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
        if (!item) return sendJson(404, { error: 'Not found' });
        sendJson(200, item);
        return true;
      }
      if (req.method === 'PUT') {
        const body = await getBody();
        const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
        if (!existing) return sendJson(404, { error: 'Not found' });
        const {
          title = existing.title,
          tag = existing.tag,
          date = existing.date,
          status = existing.status,
          lead = existing.lead,
          content = existing.content,
          image = existing.image,
          audience = existing.audience || 'public'
        } = body;
        db.prepare(`
          UPDATE news
          SET title = ?, tag = ?, date = ?, status = ?, lead = ?, content = ?, image = ?, audience = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(title, tag, date, status, lead, content, image, audience, id);
        const updated = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
        const actionType = status === 'Published' && existing.status !== 'Published' ? 'publish' : status === 'Draft' && existing.status === 'Published' ? 'unpublish' : 'update';
        logAuditEvent('admin', 'Dedza Dynamos Admin', actionType, 'club_update', id, `Updated story: ${title}`);
        sendJson(200, updated);
        return true;
      }
      if (req.method === 'DELETE') {
        db.prepare('DELETE FROM news WHERE id = ?').run(id);
        logAuditEvent('admin', 'Dedza Dynamos Admin', 'delete', 'club_update', id, `Deleted story #${id}`);
        sendJson(200, { success: true, id });
        return true;
      }
    }

    // ── MATCHES ──
    if (pathname === '/api/matches') {
      if (req.method === 'GET') {
        let sql = 'SELECT * FROM matches WHERE 1=1';
        const params = [];
        if (query.status) {
          if (query.status === 'upcoming') {
            sql += " AND status = 'Upcoming'";
          } else if (query.status === 'results') {
            sql += " AND status != 'Upcoming'";
          } else if (query.status !== 'all') {
            sql += ' AND status = ?';
            params.push(query.status);
          }
        }
        if (query.comp && query.comp !== 'all') {
          sql += ' AND comp = ?';
          params.push(query.comp);
        }
        sql += ' ORDER BY date DESC, id DESC';
        const rows = db.prepare(sql).all(...params);
        sendJson(200, rows);
        return true;
      }

      if (req.method === 'POST') {
        const body = await getBody();
        const {
          date = new Date().toISOString().slice(0, 10),
          time = '14:30',
          home = 'Dedza Dynamos',
          away,
          venue = 'Dedza Stadium',
          comp = 'FDH Bank Premiership',
          status = 'Upcoming',
          score = '',
          round = ''
        } = body;
        if (!away) return sendJson(400, { error: 'Away opponent team is required' });
        const stmt = db.prepare(`
          INSERT INTO matches (date, time, home, away, venue, comp, status, score, round)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(date, time, home, away, venue, comp, status, score, round);
        const created = db.prepare('SELECT * FROM matches WHERE id = ?').get(result.lastInsertRowid);
        sendJson(201, created);
        return true;
      }
    }

    const matchMatch = pathname.match(/^\/api\/matches\/(\d+)$/);
    if (matchMatch) {
      const id = Number(matchMatch[1]);
      if (req.method === 'GET') {
        const item = db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
        if (!item) return sendJson(404, { error: 'Not found' });
        sendJson(200, item);
        return true;
      }
      if (req.method === 'PUT') {
        const body = await getBody();
        const existing = db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
        if (!existing) return sendJson(404, { error: 'Not found' });
        const {
          date = existing.date,
          time = existing.time,
          home = existing.home,
          away = existing.away,
          venue = existing.venue,
          comp = existing.comp,
          status = existing.status,
          score = existing.score,
          round = existing.round
        } = body;
        db.prepare(`
          UPDATE matches
          SET date = ?, time = ?, home = ?, away = ?, venue = ?, comp = ?, status = ?, score = ?, round = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(date, time, home, away, venue, comp, status, score, round, id);
        const updated = db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
        sendJson(200, updated);
        return true;
      }
      if (req.method === 'DELETE') {
        db.prepare('DELETE FROM matches WHERE id = ?').run(id);
        sendJson(200, { success: true, id });
        return true;
      }
    }

    // ── PLAYERS ──
    if (pathname === '/api/players') {
      if (req.method === 'GET') {
        let sql = 'SELECT * FROM players WHERE 1=1';
        const params = [];
        if (query.pos && query.pos !== 'all') {
          sql += ' AND position = ?';
          params.push(query.pos);
        }
        if (query.q) {
          sql += ' AND (name LIKE ? OR nationality LIKE ? OR notes LIKE ? OR CAST(number AS TEXT) = ?)';
          const term = `%${query.q}%`;
          params.push(term, term, term, query.q.replace('#', ''));
        }
        sql += " ORDER BY CASE position WHEN 'Goalkeeper' THEN 1 WHEN 'Defender' THEN 2 WHEN 'Midfielder' THEN 3 WHEN 'Forward' THEN 4 ELSE 5 END, number ASC";
        const rows = db.prepare(sql).all(...params);
        sendJson(200, rows);
        return true;
      }

      if (req.method === 'POST') {
        const body = await getBody();
        const {
          number = null,
          name,
          position = 'Forward',
          nationality = 'Malawian',
          notes = '',
          status = 'Active',
          appearances = 0,
          goals = 0
        } = body;
        if (!name) return sendJson(400, { error: 'Player name is required' });
        const stmt = db.prepare(`
          INSERT INTO players (number, name, position, nationality, notes, status, appearances, goals)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(number ? Number(number) : null, name, position, nationality, notes, status, Number(appearances) || 0, Number(goals) || 0);
        const created = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
        sendJson(201, created);
        return true;
      }
    }

    const playerMatch = pathname.match(/^\/api\/players\/(\d+)$/);
    if (playerMatch) {
      const id = Number(playerMatch[1]);
      if (req.method === 'GET') {
        const item = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
        if (!item) return sendJson(404, { error: 'Not found' });
        sendJson(200, item);
        return true;
      }
      if (req.method === 'PUT') {
        const body = await getBody();
        const existing = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
        if (!existing) return sendJson(404, { error: 'Not found' });
        const {
          number = existing.number,
          name = existing.name,
          position = existing.position,
          nationality = existing.nationality,
          notes = existing.notes,
          status = existing.status,
          appearances = existing.appearances,
          goals = existing.goals
        } = body;
        db.prepare(`
          UPDATE players
          SET number = ?, name = ?, position = ?, nationality = ?, notes = ?, status = ?, appearances = ?, goals = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(number ? Number(number) : null, name, position, nationality, notes, status, Number(appearances), Number(goals), id);
        const updated = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
        sendJson(200, updated);
        return true;
      }
      if (req.method === 'DELETE') {
        db.prepare('DELETE FROM players WHERE id = ?').run(id);
        sendJson(200, { success: true, id });
        return true;
      }
    }

    // ── PARTNERS ──
    if (pathname === '/api/partners') {
      if (req.method === 'GET') {
        const rows = db.prepare('SELECT * FROM partners ORDER BY id ASC').all();
        sendJson(200, rows);
        return true;
      }
      if (req.method === 'POST') {
        const body = await getBody();
        const { name, category = 'Sponsor', tier = 'Commercial', status = 'Active', url = '' } = body;
        if (!name) return sendJson(400, { error: 'Partner name is required' });
        const stmt = db.prepare('INSERT INTO partners (name, category, tier, status, url) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(name, category, tier, status, url);
        const created = db.prepare('SELECT * FROM partners WHERE id = ?').get(result.lastInsertRowid);
        sendJson(201, created);
        return true;
      }
    }

    const partnerMatch = pathname.match(/^\/api\/partners\/(\d+)$/);
    if (partnerMatch) {
      const id = Number(partnerMatch[1]);
      if (req.method === 'DELETE') {
        db.prepare('DELETE FROM partners WHERE id = ?').run(id);
        sendJson(200, { success: true, id });
        return true;
      }
    }

    // ── SETTINGS ──
    if (pathname === '/api/settings') {
      if (req.method === 'GET') {
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const map = {};
        for (const r of rows) map[r.key] = r.value;
        sendJson(200, map);
        return true;
      }
      if (req.method === 'POST') {
        const body = await getBody();
        const stmt = db.prepare(`
          INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `);
        for (const [k, v] of Object.entries(body)) {
          stmt.run(k, String(v));
        }
        sendJson(200, { success: true });
        return true;
      }
    }

    return false; // Not handled by API
  } catch (err) {
    console.error('API Error:', err);
    sendJson(500, { error: err.message || 'Internal server error' });
    return true;
  }
}
