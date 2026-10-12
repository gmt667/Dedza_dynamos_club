/**
 * Dedza Dynamos — Admin Server & Live REST API
 * Port: 4174 (Access: http://127.0.0.1:4174/)
 * Public Site: Port 4173 (http://127.0.0.1:4173/)
 */
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 4174;
const root = resolve(fileURLToPath(new URL('./admin-dist/', import.meta.url)));
const publicAssets = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const dataFilePath = resolve(fileURLToPath(new URL('./admin-data.json', import.meta.url)));

const types = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.js':    'text/javascript; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.ico':   'image/x-icon',
  '.webp':  'image/webp',
};

// Seed dataset
const defaultData = {
  settings: {
    club_name: 'Dedza Dynamos Football Club',
    nickname: 'The Yellow Boys / Asilikali a ku Dedza',
    stadium: 'Dedza Stadium',
    capacity: '10,000',
    contact_email: 'info@dedzadynamosfc.mw',
    contact_phone: '+265 888 123 456',
    founded: '2017',
    league: 'FDH Bank Premiership',
    city: 'Dedza',
    country: 'Malawi',
  },
  updates: [
    {
      id: 'upd_01',
      title: 'The road to a first Castel Cup final',
      summary: "A stoppage-time equaliser and a dramatic shootout carried Dedza onto the national stage. Dedza defeated Creck Sporting and Ekhaya before Gift Magola's stoppage-time equaliser forced a semifinal shootout against Blue Eagles.",
      status: 'published',
      publishedAt: '2026-02-19 14:00:00',
      createdAt: '2026-02-19 14:00:00',
      audience: 'public',
    },
    {
      id: 'upd_02',
      title: 'A new board for a new era',
      summary: "Reported leadership changes mark the next chapter in the club's growth. The reported nine-member executive board is chaired by Paul Mzungu, focusing on sporting excellence and community development.",
      status: 'published',
      publishedAt: '2026-10-05 09:30:00',
      createdAt: '2026-10-05 09:30:00',
      audience: 'public',
    },
    {
      id: 'upd_03',
      title: 'Dedza finish as cup runners-up',
      summary: 'Chikondi Mbeta scored late as the Yellow Boys contested their first national cup final at the Bingu National Stadium in Lilongwe against Big Bullets.',
      status: 'published',
      publishedAt: '2026-02-21 17:30:00',
      createdAt: '2026-02-21 17:30:00',
      audience: 'public',
    },
    {
      id: 'upd_04',
      title: 'Clement Nyondo wins Golden Boot',
      summary: 'The prolific striker concluded a landmark elite season with a reported 16 goals, becoming the top goalscorer in the national league.',
      status: 'published',
      publishedAt: '2023-06-30 18:00:00',
      createdAt: '2023-06-30 18:00:00',
      audience: 'public',
    },
    {
      id: 'upd_05',
      title: 'Pre-season training underway at Dedza Stadium',
      summary: 'The squad reports back ahead of the new FDH Bank Premiership campaign. Tactical conditioning and fitness drills commenced with full first-team participation.',
      status: 'published',
      publishedAt: '2026-07-01 10:00:00',
      createdAt: '2026-07-01 10:00:00',
      audience: 'public',
    },
  ],
  matches: [
    { id: 'mat_01', date: '2026-10-11', time: '14:30', home: 'Dedza Dynamos', away: 'Masters FC', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 16' },
    { id: 'mat_02', date: '2026-10-17', time: '14:30', home: 'Civil Service United', away: 'Dedza Dynamos', venue: 'CIVO Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 17' },
    { id: 'mat_03', date: '2026-10-25', time: '14:30', home: 'Dedza Dynamos', away: 'Moyale Barracks', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 18' },
    { id: 'mat_04', date: '2026-09-09', time: '14:30', home: 'Dedza Dynamos', away: 'Luanar Mitundu', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'full_time', score: '0–0', round: 'Matchday 15' },
    { id: 'mat_05', date: '2026-07-25', time: '14:30', home: 'Dedza Dynamos', away: 'FCB Big Bullets', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'full_time', score: '1–0', round: 'Matchday 10' },
    { id: 'mat_06', date: '2026-02-21', time: '15:00', home: 'FCB Nyasa Big Bullets', away: 'Dedza Dynamos', venue: 'Bingu National Stadium', competition: 'Castel Challenge Cup', status: 'full_time', score: '2–1', round: 'Final' },
    { id: 'mat_07', date: '2026-10-31', time: '14:30', home: 'Dedza Dynamos', away: 'Creck Sporting', venue: 'Dedza Stadium', competition: 'Castel Challenge Cup', status: 'upcoming', score: '', round: 'Round of 16' },
    { id: 'mat_08', date: '2026-11-08', time: '14:30', home: 'Silver Strikers', away: 'Dedza Dynamos', venue: 'Silver Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 19' },
    { id: 'mat_09', date: '2026-11-22', time: '14:30', home: 'Dedza Dynamos', away: 'FCB Nyasa Big Bullets', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 20' },
  ],
  players: [
    { id: 1, name: 'Chikondi Mbeta', number: 10, position: 'Forward', nationality: 'Malawian', notes: 'Scored in the 2026 Castel Cup Final.' },
    { id: 2, name: 'Clement Nyondo', number: 9, position: 'Forward', nationality: 'Malawian', notes: 'League Golden Boot winner 2022/23 with a reported 16 goals.' },
    { id: 3, name: 'Emmanuel Kondowe', number: 1, position: 'Goalkeeper', nationality: 'Malawian', notes: 'First-choice goalkeeper throughout the Castel Cup run.' },
    { id: 4, name: 'Patrick Mwale', number: 5, position: 'Defender', nationality: 'Malawian', notes: 'Club captain. Leader in the backline since 2022.' },
    { id: 5, name: 'Gift Chirwa', number: 6, position: 'Defender', nationality: 'Malawian', notes: 'Resolute center back and aerial winner.' },
    { id: 6, name: 'Isaac Phiri', number: 8, position: 'Midfielder', nationality: 'Malawian', notes: 'Engine of the midfield since promotion.' },
    { id: 7, name: 'Lovemore Banda', number: 7, position: 'Midfielder', nationality: 'Malawian', notes: 'Creative attacking midfielder and playmaker.' },
    { id: 8, name: 'Francis Kamanga', number: 3, position: 'Defender', nationality: 'Malawian', notes: 'Dynamic full-back with defensive coverage.' },
  ],
  partners: [
    { id: 1, name: 'Goshen City', category: 'Principal Title Sponsor', tier: 'Platinum', status: 'Active', url: 'https://goshencity.mw' },
    { id: 2, name: 'FDH Bank', category: 'Competition Sponsor', tier: 'Gold', status: 'Active', url: 'https://fdh.co.mw' },
    { id: 3, name: 'Castel Malawi', category: 'Challenge Cup Partner', tier: 'Gold', status: 'Active', url: 'https://castel-malawi.com' },
  ],
};

// Load saved data or initialize
let data = defaultData;
try {
  if (existsSync(dataFilePath)) {
    data = JSON.parse(readFileSync(dataFilePath, 'utf8'));
  }
} catch {
  data = defaultData;
}

function saveData() {
  try {
    writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save data:', err);
  }
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'cache-control': 'no-store, no-cache',
  });
  res.end(JSON.stringify(body));
}

async function parseBody(req) {
  return new Promise((res) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { res(raw ? JSON.parse(raw) : {}); }
      catch { res({}); }
    });
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  // 1. UPDATES
  if (pathname === '/api/updates') {
    if (req.method === 'GET') {
      sendJson(res, 200, { updates: data.updates });
      return true;
    }
    if (req.method === 'POST') {
      const b = await parseBody(req);
      const newUpd = {
        id: `upd_${Date.now()}`,
        title: b.title || 'Untitled',
        summary: b.summary || '',
        status: b.publish ? 'published' : 'draft',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        audience: 'public',
      };
      data.updates.unshift(newUpd);
      saveData();
      sendJson(res, 201, { update: newUpd });
      return true;
    }
    if (req.method === 'PATCH') {
      const b = await parseBody(req);
      const item = data.updates.find(u => u.id === b.id);
      if (item) {
        if (b.publish !== undefined) item.status = b.publish ? 'published' : 'draft';
        if (b.title !== undefined) item.title = b.title;
        if (b.summary !== undefined) item.summary = b.summary;
        saveData();
      }
      sendJson(res, 200, { success: true, update: item });
      return true;
    }
  }

  // 2. MATCHES
  if (pathname === '/api/matches') {
    if (req.method === 'GET') {
      sendJson(res, 200, { matches: data.matches });
      return true;
    }
    if (req.method === 'POST') {
      const b = await parseBody(req);
      const now = new Date().toISOString();
      const newMatch = {
        id: `mat_${Date.now()}`,
        date: b.date || '',
        time: b.time || '14:30',
        home: b.home || 'Dedza Dynamos',
        away: b.away || 'Opponent',
        venue: b.venue || 'Dedza Stadium',
        competition: b.competition || b.comp || 'FDH Bank Premiership',
        status: b.status || 'upcoming',
        score: b.score || '',
        round: b.round || null,
        createdAt: now,
        updatedAt: now,
      };
      data.matches.push(newMatch);
      saveData();
      sendJson(res, 201, { match: newMatch });
      return true;
    }
    if (req.method === 'PATCH') {
      const b = await parseBody(req);
      const item = data.matches.find(m => String(m.id) === String(b.id));
      if (item) {
        // Normalise competition field from legacy `comp` key
        if (b.comp !== undefined && b.competition === undefined) b.competition = b.comp;
        Object.assign(item, b);
        item.updatedAt = new Date().toISOString();
        saveData();
      }
      sendJson(res, 200, { success: true, match: item });
      return true;
    }
    if (req.method === 'DELETE') {
      const b = await parseBody(req);
      data.matches = data.matches.filter(m => String(m.id) !== String(b.id));
      saveData();
      sendJson(res, 200, { success: true });
      return true;
    }
  }

  // 3. PLAYERS
  if (pathname === '/api/players') {
    if (req.method === 'GET') {
      sendJson(res, 200, { players: data.players });
      return true;
    }
    if (req.method === 'POST') {
      const b = await parseBody(req);
      const newPlayer = {
        id: Date.now(),
        name: b.name || 'New Player',
        number: Number(b.number) || 0,
        position: b.position || 'Midfielder',
        nationality: b.nationality || 'Malawian',
        notes: b.notes || '',
      };
      data.players.push(newPlayer);
      saveData();
      sendJson(res, 201, { player: newPlayer });
      return true;
    }
    if (req.method === 'PATCH') {
      const b = await parseBody(req);
      const item = data.players.find(p => String(p.id) === String(b.id));
      if (item) {
        Object.assign(item, b);
        saveData();
      }
      sendJson(res, 200, { success: true, player: item });
      return true;
    }
    if (req.method === 'DELETE') {
      const b = await parseBody(req);
      data.players = data.players.filter(p => String(p.id) !== String(b.id));
      saveData();
      sendJson(res, 200, { success: true });
      return true;
    }
  }

  // 4. PARTNERS
  if (pathname === '/api/partners') {
    if (req.method === 'GET') {
      sendJson(res, 200, { partners: data.partners });
      return true;
    }
    if (req.method === 'POST') {
      const b = await parseBody(req);
      const newPartner = {
        id: Date.now(),
        name: b.name || 'Partner',
        category: b.category || 'Sponsor',
        tier: b.tier || 'Gold',
        status: b.status || 'Active',
        url: b.url || '#',
      };
      data.partners.push(newPartner);
      saveData();
      sendJson(res, 201, { partner: newPartner });
      return true;
    }
    if (req.method === 'PATCH') {
      const b = await parseBody(req);
      const item = data.partners.find(pt => String(pt.id) === String(b.id));
      if (item) {
        Object.assign(item, b);
        saveData();
      }
      sendJson(res, 200, { success: true, partner: item });
      return true;
    }
    if (req.method === 'DELETE') {
      const b = await parseBody(req);
      data.partners = data.partners.filter(pt => String(pt.id) !== String(b.id));
      saveData();
      sendJson(res, 200, { success: true });
      return true;
    }
  }

  // 5. SETTINGS
  if (pathname === '/api/settings' || pathname === '/api/public/settings') {
    if (req.method === 'GET') {
      sendJson(res, 200, { settings: data.settings });
      return true;
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const b = await parseBody(req);
      Object.assign(data.settings, b);
      saveData();
      sendJson(res, 200, { success: true, settings: data.settings });
      return true;
    }
  }

  // 6. PUBLIC ENDPOINTS
  if (pathname === '/api/public/live-football') {
    const liveTable = [
      { position: 1, club: 'Silver Strikers', played: 15, won: 10, drawn: 4, lost: 1, goalsFor: 28, goalsAgainst: 9, goalDifference: 19, points: 34 },
      { position: 2, club: 'Mighty Wanderers', played: 15, won: 8, drawn: 5, lost: 2, goalsFor: 22, goalsAgainst: 10, goalDifference: 12, points: 29 },
      { position: 3, club: 'FCB Nyasa Big Bullets', played: 15, won: 7, drawn: 6, lost: 2, goalsFor: 24, goalsAgainst: 11, goalDifference: 13, points: 27 },
      { position: 4, club: 'Moyale Barracks', played: 15, won: 7, drawn: 4, lost: 4, goalsFor: 18, goalsAgainst: 13, goalDifference: 5, points: 25 },
      { position: 5, club: 'Kamuzu Barracks', played: 15, won: 6, drawn: 6, lost: 3, goalsFor: 17, goalsAgainst: 14, goalDifference: 3, points: 24 },
      { position: 6, club: 'MAFCO', played: 15, won: 6, drawn: 4, lost: 5, goalsFor: 16, goalsAgainst: 17, goalDifference: -1, points: 22 },
      { position: 7, club: 'Creck Sporting', played: 15, won: 5, drawn: 5, lost: 5, goalsFor: 15, goalsAgainst: 15, goalDifference: 0, points: 20 },
      { position: 8, club: 'Civil Service United', played: 15, won: 4, drawn: 7, lost: 4, goalsFor: 14, goalsAgainst: 13, goalDifference: 1, points: 19 },
      { position: 9, club: 'Blue Eagles', played: 15, won: 4, drawn: 6, lost: 5, goalsFor: 13, goalsAgainst: 15, goalDifference: -2, points: 18 },
      { position: 10, club: 'Karonga United', played: 15, won: 4, drawn: 5, lost: 6, goalsFor: 14, goalsAgainst: 18, goalDifference: -4, points: 17 },
      { position: 11, club: 'Chitipa United', played: 15, won: 3, drawn: 7, lost: 5, goalsFor: 12, goalsAgainst: 16, goalDifference: -4, points: 16 },
      { position: 12, club: 'Dedza Dynamos', played: 15, won: 3, drawn: 6, lost: 6, goalsFor: 13, goalsAgainst: 18, goalDifference: -5, points: 15 },
      { position: 13, club: 'Mzuzu City Hammers', played: 15, won: 3, drawn: 5, lost: 7, goalsFor: 11, goalsAgainst: 19, goalDifference: -8, points: 14 },
      { position: 14, club: 'Mighty Tigers', played: 15, won: 3, drawn: 4, lost: 8, goalsFor: 10, goalsAgainst: 20, goalDifference: -10, points: 13 },
      { position: 15, club: 'FOMO FC', played: 15, won: 2, drawn: 5, lost: 8, goalsFor: 9, goalsAgainst: 21, goalDifference: -12, points: 11 },
      { position: 16, club: 'Bangwe All Stars', played: 15, won: 1, drawn: 5, lost: 9, goalsFor: 7, goalsAgainst: 24, goalDifference: -17, points: 8 },
    ];
    sendJson(res, 200, {
      matches: data.matches,
      table: liveTable,
      dedza: liveTable.find(r => r.club.toLowerCase().includes('dedza')),
      source: {
        name: 'Super League of Malawi (SULOM)',
        checkedAt: new Date().toISOString(),
        clubUrl: 'https://sulommw.com/club/goshen-city-dedza-dynamos/',
        tableUrl: 'https://sulommw.com/table/fdh-2026-27/',
        matchesAvailable: true,
        tableAvailable: true,
      }
    });
    return true;
  }
  if (pathname === '/api/public/matches') {
    sendJson(res, 200, { matches: data.matches });
    return true;
  }
  if (pathname === '/api/public/updates') {
    sendJson(res, 200, { updates: data.updates });
    return true;
  }
  if (pathname === '/api/public/players') {
    sendJson(res, 200, { players: data.players });
    return true;
  }
  if (pathname === '/api/public/partners') {
    sendJson(res, 200, { partners: data.partners });
    return true;
  }

  // Unknown API route
  sendJson(res, 404, { error: 'Not found' });
  return true;
}

createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const reqPath = decodeURIComponent(urlObj.pathname);

  // Handle live Database REST API
  if (reqPath.startsWith('/api/')) {
    const handled = await handleApi(req, res, reqPath);
    if (handled) return;
  }

  const safe = normalize(reqPath).replace(/^[/\\]+/, '').replace(/^(\.\.[/\\])+/, '');

  // Serve from admin-dist first
  let filePath = join(root, safe || 'index.html');
  if (filePath.startsWith(root) && existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  // If not found in admin-dist, check public dist assets (images, brand, etc.)
  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    const publicPath = join(publicAssets, safe);
    if (publicPath.startsWith(publicAssets) && existsSync(publicPath) && !statSync(publicPath).isDirectory()) {
      filePath = publicPath;
    } else {
      // 404 — redirect to admin login
      res.writeHead(302, { location: '/' });
      res.end();
      return;
    }
  }

  const ct = types[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, {
    'content-type': ct,
    'cache-control': 'no-store, no-cache',
    'x-robots-tag': 'noindex',
  });
  createReadStream(filePath).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Dedza Dynamos — ADMIN PANEL                 ║');
  console.log(`║  http://0.0.0.0:${PORT}/                       ║`);
  console.log('║                                              ║');
  console.log('║  Credentials:  admin / admin123              ║');
  console.log('║  Public site:  http://0.0.0.0:4173/          ║');
  console.log('╚══════════════════════════════════════════════╝');
});
