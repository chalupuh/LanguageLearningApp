CREATE TABLE `saved_recordings` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`slot` integer NOT NULL,
	`source` text NOT NULL,
	`task` text NOT NULL,
	`transcript` text NOT NULL,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` integer NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recording_slot` ON `saved_recordings` (`user_id`,`slot`);