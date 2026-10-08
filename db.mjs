import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = resolve(dataDir, 'dedza_dynamos.db');
export const db = new DatabaseSync(dbPath);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT 'News',
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Published',
      lead TEXT,
      content TEXT,
      image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT DEFAULT '14:30',
      home TEXT NOT NULL,
      away TEXT NOT NULL,
      venue TEXT NOT NULL,
      comp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Upcoming',
      score TEXT DEFAULT '',
      round TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      nationality TEXT DEFAULT 'Malawian',
      notes TEXT,
      bio TEXT,
      photo_url TEXT,
      status TEXT DEFAULT 'Active',
      display_order INTEGER DEFAULT 999,
      appearances INTEGER DEFAULT 0,
      goals INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      tier TEXT DEFAULT 'Commercial',
      status TEXT DEFAULT 'Active',
      url TEXT,
      logo_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'video',
      category TEXT DEFAULT 'Highlights',
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff_profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'viewer' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      detail TEXT DEFAULT '' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure audience column exists in news
  try {
    db.exec(`ALTER TABLE news ADD COLUMN audience TEXT DEFAULT 'public';`);
  } catch {
    // Column already exists
  }

  seedData();
}

function seedData() {
  // Seed News if empty
  const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get().count;
  if (newsCount === 0) {
    const insertNews = db.prepare(`
      INSERT INTO news (title, tag, date, status, lead, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const seedNews = [
      ['The road to a first Castel Cup final', 'History', '2026-02-19', 'Published', 'A stoppage-time equaliser and a dramatic shootout carried Dedza onto the national stage.', 'Dedza Dynamos FC delivered a historic campaign in the Castel Challenge Cup, defying expectations and capturing the hearts of football supporters across Malawi.'],
      ['A new board for a new era', 'Club', '2026-10-05', 'Published', 'Reported leadership changes mark the next chapter in the club\'s growth.', 'The executive committee of Dedza Dynamos FC has appointed new visionary leadership focused on sporting excellence and commercial sustainability.'],
      ['Dedza finish as cup runners-up', 'Match report', '2026-02-21', 'Published', 'Chikondi Mbeta scored late as the Yellow Boys contested their first final at Bingu National Stadium.', 'In front of an electric crowd at the Bingu National Stadium in Lilongwe, Dedza Dynamos fought courageously until the final whistle.'],
      ['Clement Nyondo wins Golden Boot', 'News', '2023-06-30', 'Published', 'The striker finished the season with a reported 16 goals in the national elite league.', 'Clement Nyondo carved his name into the annals of Malawian football by clinching the league top goalscorer accolade.'],
      ['Pre-season training underway', 'News', '2026-07-01', 'Draft', 'The squad reports back to Dedza Stadium ahead of the new FDH Bank Premiership campaign.', 'Head coach and technical staff welcomed the full squad back for tactical conditioning.']
    ];
    for (const item of seedNews) {
      insertNews.run(...item);
    }
  }

  // Seed Matches if empty
  const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get().count;
  if (matchCount === 0) {
    const insertMatch = db.prepare(`
      INSERT INTO matches (date, time, home, away, venue, comp, status, score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const seedMatches = [
      ['2026-10-11', '14:30', 'Dedza Dynamos', 'Masters FC', 'Dedza Stadium', 'FDH Bank Premiership', 'Upcoming', ''],
      ['2026-10-17', '14:30', 'Civil Service United', 'Dedza Dynamos', 'CIVO Stadium', 'FDH Bank Premiership', 'Upcoming', ''],
      ['2026-10-25', '14:30', 'Dedza Dynamos', 'Moyale Barracks', 'Dedza Stadium', 'FDH Bank Premiership', 'Upcoming', ''],
      ['2026-09-09', '14:30', 'Dedza Dynamos', 'Luanar Mitundu', 'Dedza Stadium', 'FDH Bank Premiership', 'Full time', '0–0'],
      ['2026-07-25', '14:30', 'Dedza Dynamos', 'FCB Big Bullets', 'Dedza Stadium', 'FDH Bank Premiership', 'Full time', '1–0'],
      ['2026-02-21', '15:00', 'FCB Nyasa Big Bullets', 'Dedza Dynamos', 'Bingu National Stadium', 'Castel Challenge Cup', 'Full time', '2–1']
    ];
    for (const item of seedMatches) {
      insertMatch.run(...item);
    }
  }

  // Seed Players if empty
  const playerCount = db.prepare('SELECT COUNT(*) as count FROM players').get().count;
  if (playerCount === 0) {
    const insertPlayer = db.prepare(`
      INSERT INTO players (number, name, position, nationality, notes, status, appearances, goals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const seedPlayers = [
      [10, 'Chikondi Mbeta', 'Forward', 'Malawian', 'Scored in the 2026 Castel Cup Final.', 'Active', 24, 9],
      [9, 'Clement Nyondo', 'Forward', 'Malawian', 'League Golden Boot winner 2022/23 with a reported 16 goals.', 'Active', 28, 16],
      [1, 'Emmanuel Kondowe', 'Goalkeeper', 'Malawian', 'First-choice goalkeeper throughout the Castel Cup run.', 'Active', 27, 0],
      [5, 'Patrick Mwale', 'Defender', 'Malawian', 'Club captain. Leader in the backline since 2022.', 'Active', 30, 2],
      [6, 'Gift Chirwa', 'Defender', 'Malawian', 'Solid central defender with towering aerial presence.', 'Active', 22, 1],
      [8, 'Isaac Phiri', 'Midfielder', 'Malawian', 'Engine of the midfield since promotion.', 'Active', 26, 4],
      [7, 'Lovemore Banda', 'Midfielder', 'Malawian', 'Creative playmaker with exceptional vision and crossing.', 'Active', 21, 3],
      [3, 'Francis Kamanga', 'Defender', 'Malawian', 'Dynamic full-back renowned for pace and defensive grit.', 'Active', 25, 0]
    ];
    for (const item of seedPlayers) {
      insertPlayer.run(...item);
    }
  }

  // Seed Partners if empty
  const partnerCount = db.prepare('SELECT COUNT(*) as count FROM partners').get().count;
  if (partnerCount === 0) {
    const insertPartner = db.prepare(`
      INSERT INTO partners (name, category, tier, status, url)
      VALUES (?, ?, ?, ?, ?)
    `);
    const seedPartners = [
      ['Goshen City', 'Principal Title Sponsor', 'Platinum', 'Active', 'https://goshencity.mw'],
      ['FDH Bank', 'Competition Sponsor', 'Gold', 'Active', 'https://fdh.co.mw'],
      ['Castel Malawi', 'Challenge Cup Partner', 'Gold', 'Active', 'https://castel-malawi.com']
    ];
    for (const item of seedPartners) {
      insertPartner.run(...item);
    }
  }

  // Seed Settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
    insertSetting.run('club_name', 'Dedza Dynamos Football Club');
    insertSetting.run('nickname', 'The Yellow Boys / Asilikali a ku Dedza');
    insertSetting.run('stadium', 'Dedza Stadium');
    insertSetting.run('capacity', '10,000');
    insertSetting.run('contact_email', 'info@dedzadynamosfc.mw');
    insertSetting.run('contact_phone', '+265 888 123 456');
  }

  // Seed Staff Profiles if empty
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff_profiles').get().count;
  if (staffCount === 0) {
    const insertStaff = db.prepare(`
      INSERT INTO staff_profiles (user_id, display_name, email, role)
      VALUES (?, ?, ?, ?)
    `);
    insertStaff.run('staff_owner_01', 'Dedza Dynamos Admin', 'admin@dedzadynamosfc.mw', 'owner');
    insertStaff.run('staff_editor_01', 'Media & Press Team', 'media@dedzadynamosfc.mw', 'editor');
    insertStaff.run('staff_viewer_01', 'Club Operations Member', 'ops@dedzadynamosfc.mw', 'viewer');
  }
}

export function logAuditEvent(actorId, actorName, action, entityType, entityId, detail = '') {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_events (id, actor_id, actor_name, action, entity_type, entity_id, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const id = 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    stmt.run(id, actorId, actorName, action, entityType, String(entityId), detail);
  } catch (err) {
    console.warn('Failed to record audit event:', err);
  }
}
