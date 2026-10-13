CREATE TABLE `club_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text DEFAULT '14:30',
	`home` text NOT NULL,
	`away` text NOT NULL,
	`venue` text NOT NULL,
	`competition` text NOT NULL,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`score` text DEFAULT '',
	`round` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'photo' NOT NULL,
	`category` text DEFAULT 'highlights' NOT NULL,
	`url` text NOT NULL,
	`thumbnail_url` text,
	`date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`tier` text DEFAULT 'commercial' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`url` text,
	`logo_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
