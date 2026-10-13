CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`shirt_number` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`position` text NOT NULL,
	`squad_role` text,
	`nationality` text,
	`bio` text,
	`photo_url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`display_order` integer DEFAULT 999 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
