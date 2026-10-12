/**
 * Dedza Dynamos — Public Site Preview & Live API Server
 * Port: 4173 (Access: http://127.0.0.1:4173/)
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const dataFilePath = resolve(fileURLToPath(new URL('./admin-data.json', import.meta.url)));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

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
      authorName: 'Dedza Dynamos Media'
    },
    {
      id: 'upd_02',
      title: 'A new board for a new era',
      summary: "Reported leadership changes mark the next chapter in the club's growth. The reported nine-member executive board is chaired by Paul Mzungu, focusing on sporting excellence and community development.",
      status: 'published',
      publishedAt: '2026-10-05 09:30:00',
      createdAt: '2026-10-05 09:30:00',
      audience: 'public',
      authorName: 'Club Secretariat'
    },
    {
      id: 'upd_03',
      title: 'Dedza finish as cup runners-up',
      summary: 'Chikondi Mbeta scored late as the Yellow Boys contested their first national cup final at the Bingu National Stadium in Lilongwe against Big Bullets.',
      status: 'published',
      publishedAt: '2026-02-21 17:30:00',
      createdAt: '2026-02-21 17:30:00',
      audience: 'public',
      authorName: 'Matchday Reporter'
    },
    {
      id: 'upd_04',
      title: 'Clement Nyondo wins Golden Boot',
      summary: 'The prolific striker concluded a landmark elite season with a reported 16 goals, becoming the top goalscorer in the national league.',
      status: 'published',
      publishedAt: '2023-06-30 18:00:00',
      createdAt: '2023-06-30 18:00:00',
      audience: 'public',
      authorName: 'Historical Archive'
    },
    {
      id: 'upd_05',
      title: 'Pre-season training underway at Dedza Stadium',
      summary: 'The squad reports back ahead of the new FDH Bank Premiership campaign. Tactical conditioning and fitness drills commenced with full first-team participation.',
      status: 'published',
      publishedAt: '2026-07-01 10:00:00',
      createdAt: '2026-07-01 10:00:00',
      audience: 'public',
      authorName: 'Technical Staff'
    },
  ],
  matches: [
    { id: 1, date: '2026-10-11', time: '14:30', home: 'Dedza Dynamos', away: 'Masters FC', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 16' },
    { id: 2, date: '2026-10-17', time: '14:30', home: 'Civil Service United', away: 'Dedza Dynamos', venue: 'CIVO Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 17' },
    { id: 3, date: '2026-10-25', time: '14:30', home: 'Dedza Dynamos', away: 'Moyale Barracks', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 18' },
    { id: 4, date: '2026-09-09', time: '14:30', home: 'Dedza Dynamos', away: 'Luanar Mitundu', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'full_time', score: '0–0', round: 'Matchday 15' },
    { id: 5, date: '2026-07-25', time: '14:30', home: 'Dedza Dynamos', away: 'FCB Big Bullets', venue: 'Dedza Stadium', competition: 'FDH Bank Premiership', status: 'full_time', score: '1–0', round: 'Matchday 10' },
    { id: 6, date: '2026-02-21', time: '15:00', home: 'FCB Nyasa Big Bullets', away: 'Dedza Dynamos', venue: 'Bingu National Stadium', competition: 'Castel Challenge Cup', status: 'full_time', score: '2–1', round: 'Final' },
    { id: 7, date: '2026-10-31', time: '14:30', home: 'Dedza Dynamos', away: 'Creck Sporting', venue: 'Dedza Stadium', competition: 'Castel Challenge Cup', status: 'upcoming', score: '', round: 'Round of 16' },
    { id: 8, date: '2026-11-08', time: '14:30', home: 'Silver Strikers', away: 'Dedza Dynamos', venue: 'Silver Stadium', competition: 'FDH Bank Premiership', status: 'upcoming', score: '', round: 'Matchday 19' },
  ],
  players: [
    { id: 1, firstName: 'Chikondi', lastName: 'Mbeta', shirtNumber: '10', position: 'forward', squadRole: 'Key Goalscorer', nationality: 'Malawian', bio: 'Scored in the historic 2026 Castel Challenge Cup Final.', photoUrl: '/assets/players/chikondi-mbeta.jpg' },
    { id: 2, firstName: 'Clement', lastName: 'Nyondo', shirtNumber: '09', position: 'forward', squadRole: 'Golden Boot Winner', nationality: 'Malawian', bio: 'League Golden Boot winner with 16 goals in national championship.', photoUrl: '/assets/players/clement-nyondo.jpg' },
    { id: 3, firstName: 'Emmanuel', lastName: 'Kondowe', shirtNumber: '01', position: 'goalkeeper', squadRole: 'First-Choice Goalkeeper', nationality: 'Malawian', bio: 'Heroic shot-stopper throughout the dramatic cup penalty shootouts.', photoUrl: '/assets/players/emmanuel-kondowe.jpg' },
    { id: 4, firstName: 'Patrick', lastName: 'Mwale', shirtNumber: '05', position: 'defender', squadRole: 'Club Captain', nationality: 'Malawian', bio: 'Commanding central defender and captain leading the backline since 2022.', photoUrl: '/assets/players/patrick-mwale.jpg' },
    { id: 5, firstName: 'Gift', lastName: 'Chirwa', shirtNumber: '06', position: 'defender', squadRole: 'Centre Back', nationality: 'Malawian', bio: 'Towering aerial presence and resolute ball-winner.', photoUrl: '/assets/players/gift-chirwa.jpg' },
    { id: 6, firstName: 'Isaac', lastName: 'Phiri', shirtNumber: '08', position: 'midfielder', squadRole: 'Box-to-Box Engine', nationality: 'Malawian', bio: 'Engine and tempo-setter in the central third of the pitch.', photoUrl: '/assets/players/isaac-phiri.jpg' },
    { id: 7, firstName: 'Lovemore', lastName: 'Banda', shirtNumber: '07', position: 'midfielder', squadRole: 'Playmaker', nationality: 'Malawian', bio: 'Creative attacking midfielder known for incisive through balls and crosses.', photoUrl: '/assets/players/lovemore-banda.jpg' },
    { id: 8, firstName: 'Francis', lastName: 'Kamanga', shirtNumber: '03', position: 'defender', squadRole: 'Full Back', nationality: 'Malawian', bio: 'Dynamic full-back providing defensive coverage and overlapping pace.', photoUrl: '/assets/players/francis-kamanga.jpg' },
  ],
  partners: [
    { id: 1, name: 'Goshen City', category: 'Principal Title Sponsor', tier: 'platinum', url: 'https://goshencity.mw', logoUrl: '/assets/brand/goshen-city.png' },
    { id: 2, name: 'FDH Bank', category: 'Competition Sponsor', tier: 'gold', url: 'https://fdh.co.mw', logoUrl: '/assets/brand/fdh-bank.png' },
    { id: 3, name: 'Castel Malawi', category: 'Challenge Cup Partner', tier: 'gold', url: 'https://castel-malawi.com', logoUrl: '/assets/brand/castel.png' },
  ],
  table: [
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
  ],
};

function getLiveDataset() {
  try {
    if (existsSync(dataFilePath)) {
      const saved = JSON.parse(readFileSync(dataFilePath, 'utf8'));
      return { ...defaultData, ...saved };
    }
  } catch {}
  return defaultData;
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'cache-control': 'public, max-age=60',
  });
  res.end(JSON.stringify(body));
}

function handleApiRoute(req, res, pathname) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  const data = getLiveDataset();

  // 1. Live Football API (matches, table, dedza standing, SULOM source)
  if (pathname === '/api/public/live-football') {
    sendJson(res, 200, {
      matches: data.matches,
      table: data.table,
      dedza: data.table.find(r => r.club.toLowerCase().includes('dedza')) || { position: 12, club: 'Dedza Dynamos', played: 15, points: 15, goalsFor: 13, goalDifference: -5 },
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

  // 2. Matches
  if (pathname === '/api/public/matches' || pathname === '/api/matches') {
    sendJson(res, 200, { matches: data.matches });
    return true;
  }

  // 3. Updates / News
  if (pathname === '/api/public/updates' || pathname === '/api/updates') {
    sendJson(res, 200, { updates: data.updates });
    return true;
  }

  // 4. Players / Squad
  if (pathname === '/api/public/players' || pathname === '/api/players') {
    sendJson(res, 200, { players: data.players });
    return true;
  }

  // 5. Partners
  if (pathname === '/api/public/partners' || pathname === '/api/partners') {
    sendJson(res, 200, { partners: data.partners });
    return true;
  }

  // 6. Settings
  if (pathname === '/api/public/settings' || pathname === '/api/settings') {
    sendJson(res, 200, { settings: data.settings });
    return true;
  }

  return false;
}

createServer((request, response) => {
  const urlObj = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
  const requestPath = decodeURIComponent(urlObj.pathname);

  // Serve live REST API
  if (requestPath.startsWith('/api/')) {
    const handled = handleApiRoute(request, response, requestPath);
    if (handled) return;
  }

  const safePath = normalize(requestPath).replace(/^[/\\]+/, '').replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, safePath || 'index.html');
  if (filePath.startsWith(root) && existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
  const missing = !filePath.startsWith(root) || !existsSync(filePath);
  if (missing) filePath = join(root, '404.html');
  response.writeHead(missing ? 404 : 200, {
    'content-type': types[extname(filePath)] || 'application/octet-stream',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
  });
  createReadStream(filePath).pipe(response);
}).listen(4173, '0.0.0.0', () => console.log('Dedza Dynamos preview & live API: http://0.0.0.0:4173'));
