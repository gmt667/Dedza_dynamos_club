CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`tier` text DEFAULT 'yellow' NOT NULL,
	`district` text DEFAULT 'Dedza' NOT NULL,
	`password_hash` text,
	`favorite_player` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notification_pref` text DEFAULT 'whatsapp' NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `members` (`id`, `full_name`, `email`, `phone`, `tier`, `district`, `favorite_player`, `status`, `notification_pref`, `joined_at`, `updated_at`) VALUES
('DD-2026-0101', 'Chimwemwe Banda', 'c.banda@gmail.com', '+265 888 123 456', 'gold', 'Dedza', 'Clement Nyondo', 'active', 'whatsapp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('DD-2026-0102', 'Tamandani Phiri', 't.phiri@yahoo.com', '+265 999 456 789', 'silver', 'Lilongwe', 'Chikondi Mbeta', 'active', 'whatsapp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('DD-2026-0103', 'Blessings Moyo', 'b.moyo@outlook.com', '+265 881 789 012', 'yellow', 'Dedza', 'Emmanuel Kondowe', 'active', 'sms', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('DD-2026-0104', 'Grace Chirwa', 'grace.chirwa@gmail.com', '+265 995 234 567', 'silver', 'Blantyre', 'Patrick Mwale', 'active', 'email', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('DD-2026-0105', 'Kondwani Chisi', 'kondwani.c@gmail.com', '+265 884 567 890', 'gold', 'Dedza', 'Clement Nyondo', 'active', 'whatsapp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
