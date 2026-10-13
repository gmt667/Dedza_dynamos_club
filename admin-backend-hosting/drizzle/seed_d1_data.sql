-- Migration Seed Script for Cloudflare D1
-- Migrates official Dedza Dynamos club data into D1 single source of truth

-- 1. Club Updates (News & Announcements)
INSERT OR IGNORE INTO `club_updates` (`id`, `title`, `summary`, `status`, `author_id`, `author_name`, `audience`, `published_at`, `created_at`, `updated_at`) VALUES
('upd_01', 'The road to a first Castel Cup final', 'A stoppage-time equaliser and a dramatic shootout carried Dedza onto the national stage. Dedza defeated Creck Sporting and Ekhaya before Gift Magola’s stoppage-time equaliser forced a semifinal shootout against Blue Eagles.', 'published', 'staff_owner_01', 'Dedza Dynamos Media', 'public', '2026-02-19 14:00:00', '2026-02-19 14:00:00', '2026-02-19 14:00:00'),
('upd_02', 'A new board for a new era', 'Reported leadership changes mark the next chapter in the club’s growth. The reported nine-member executive board is chaired by Paul Mzungu, focusing on sporting excellence and community development.', 'published', 'staff_owner_01', 'Dedza Dynamos Media', 'public', '2026-10-05 09:30:00', '2026-10-05 09:30:00', '2026-10-05 09:30:00'),
('upd_03', 'Dedza finish as cup runners-up', 'Chikondi Mbeta scored late as the Yellow Boys contested their first national cup final at the Bingu National Stadium in Lilongwe against Big Bullets.', 'published', 'staff_owner_01', 'Dedza Dynamos Media', 'public', '2026-02-21 17:30:00', '2026-02-21 17:30:00', '2026-02-21 17:30:00'),
('upd_04', 'Clement Nyondo wins Golden Boot', 'The prolific striker concluded a landmark elite season with a reported 16 goals, becoming the top goalscorer in the national league.', 'published', 'staff_owner_01', 'Dedza Dynamos Media', 'public', '2023-06-30 18:00:00', '2023-06-30 18:00:00', '2023-06-30 18:00:00'),
('upd_05', 'Pre-season training underway at Dedza Stadium', 'The squad reports back ahead of the new FDH Bank Premiership campaign. Tactical conditioning and fitness drills commenced with full first-team participation.', 'published', 'staff_editor_01', 'Technical Staff', 'public', '2026-07-01 10:00:00', '2026-07-01 10:00:00', '2026-07-01 10:00:00');

-- 2. Squad Players
INSERT OR IGNORE INTO `players` (`id`, `shirt_number`, `first_name`, `last_name`, `position`, `squad_role`, `nationality`, `bio`, `photo_url`, `status`, `display_order`, `created_at`, `updated_at`) VALUES
('ply_01', '10', 'Chikondi', 'Mbeta', 'forward', 'Key Goalscorer', 'Malawian', 'Scored in the historic 2026 Castel Challenge Cup Final.', '/assets/players/chikondi-mbeta.jpg', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ply_02', '09', 'Clement', 'Nyondo', 'forward', '2022/23 Golden Boot', 'Malawian', 'League Golden Boot winner with 16 goals in the national elite championship.', '/assets/players/clement-nyondo.jpg', 'active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ply_03', '01', 'Emmanuel', 'Kondowe', 'goalkeeper', 'First-Choice Goalkeeper', 'Malawian', 'Heroic shot-stopper throughout the dramatic Castel Cup penalty shootouts.', '/assets/players/emmanuel-kondowe.jpg', 'active', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ply_04', '05', 'Patrick', 'Mwale', 'defender', 'Club Captain', 'Malawian', 'Commanding central defender and club captain leading the backline since 2022.', '/assets/players/patrick-mwale.jpg', 'active', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ply_05', '06', 'Gift', 'Chirwa', 'defender', 'Center Back', 'Malawian', 'Towering aerial presence and resolute ball-winner.', '/assets/players/gift-chirwa.jpg', 'active', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ply_06', '08', 'Isaac', 'Phiri', 'midfielder', 'Box-to-Box Midfielder', 'Malawian', 'Engine and tempo-setter in the central third of the pitch.', '/assets/players/isaac-phiri.jpg', 'active', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ply_07', '07', 'Lovemore', 'Banda', 'midfielder', 'Playmaker', 'Malawian', 'Creative attacking midfielder known for incisive through balls and crosses.', '/assets/players/lovemore-banda.jpg', 'active', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ply_08', '03', 'Francis', 'Kamanga', 'defender', 'Full Back', 'Malawian', 'Dynamic and energetic full-back providing defensive coverage and overlapping pace.', '/assets/players/francis-kamanga.jpg', 'active', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Fixtures and Results
INSERT OR IGNORE INTO `matches` (`id`, `date`, `time`, `home`, `away`, `venue`, `competition`, `status`, `score`, `round`, `created_at`, `updated_at`) VALUES
('mat_01', '2026-10-11', '14:30', 'Dedza Dynamos', 'Masters FC', 'Dedza Stadium', 'FDH Bank Premiership', 'upcoming', '', 'Matchday 16', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mat_02', '2026-10-17', '14:30', 'Civil Service United', 'Dedza Dynamos', 'CIVO Stadium', 'FDH Bank Premiership', 'upcoming', '', 'Matchday 17', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mat_03', '2026-10-25', '14:30', 'Dedza Dynamos', 'Moyale Barracks', 'Dedza Stadium', 'FDH Bank Premiership', 'upcoming', '', 'Matchday 18', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mat_04', '2026-09-09', '14:30', 'Dedza Dynamos', 'Luanar Mitundu', 'Dedza Stadium', 'FDH Bank Premiership', 'full_time', '0–0', 'Matchday 15', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mat_05', '2026-07-25', '14:30', 'Dedza Dynamos', 'FCB Big Bullets', 'Dedza Stadium', 'FDH Bank Premiership', 'full_time', '1–0', 'Matchday 10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mat_06', '2026-02-21', '15:00', 'FCB Nyasa Big Bullets', 'Dedza Dynamos', 'Bingu National Stadium', 'Castel Challenge Cup', 'full_time', '2–1', 'Final', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Commercial Partners & Sponsors
INSERT OR IGNORE INTO `partners` (`id`, `name`, `category`, `tier`, `status`, `url`, `logo_url`, `created_at`, `updated_at`) VALUES
('ptn_01', 'Goshen City', 'Principal Title Sponsor', 'platinum', 'active', 'https://goshencity.mw', '/assets/brand/goshen-city.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ptn_02', 'FDH Bank', 'Competition Sponsor', 'gold', 'active', 'https://fdh.co.mw', '/assets/brand/fdh-bank.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ptn_03', 'Castel Malawi', 'Challenge Cup Partner', 'gold', 'active', 'https://castel-malawi.com', '/assets/brand/castel.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Media Assets
INSERT OR IGNORE INTO `media` (`id`, `title`, `type`, `category`, `url`, `thumbnail_url`, `date`, `created_at`, `updated_at`) VALUES
('med_01', 'Dedza Stadium Matchday Highlights', 'video', 'highlights', 'https://youtu.be/dedza-highlights-1', '/assets/media/stadium-crowd.jpg', '2026-07-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('med_02', 'Castel Challenge Cup Semifinal Shootout', 'video', 'highlights', 'https://youtu.be/dedza-semifinal-shootout', '/assets/media/semifinal-penalties.jpg', '2026-02-19', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('med_03', 'First Team Squad Photo 2026/27', 'photo', 'gallery', '/assets/dedza-team-history.jpg', '/assets/dedza-team-history.jpg', '2026-10-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. Club Settings
INSERT OR REPLACE INTO `club_settings` (`key`, `value`, `updated_at`) VALUES
('club_name', 'Dedza Dynamos Football Club', CURRENT_TIMESTAMP),
('nickname', 'The Yellow Boys / Asilikali a ku Dedza', CURRENT_TIMESTAMP),
('stadium', 'Dedza Stadium', CURRENT_TIMESTAMP),
('capacity', '10,000', CURRENT_TIMESTAMP),
('contact_email', 'info@dedzadynamosfc.mw', CURRENT_TIMESTAMP),
('contact_phone', '+265 888 123 456', CURRENT_TIMESTAMP);

-- 7. Staff Profiles
INSERT OR IGNORE INTO `staff_profiles` (`user_id`, `display_name`, `email`, `role`, `created_at`, `updated_at`) VALUES
('staff_owner_01', 'Club Executive Admin', 'admin@dedzadynamosfc.mw', 'owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff_editor_01', 'Media & Communications Editor', 'media@dedzadynamosfc.mw', 'editor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('staff_viewer_01', 'Match Analyst / Staff Viewer', 'analytics@dedzadynamosfc.mw', 'viewer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
