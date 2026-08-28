CREATE TABLE `usage_samples` (
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`seq` integer NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	PRIMARY KEY(`user_id`, `session_id`, `seq`)
);
--> statement-breakpoint
CREATE INDEX `idx_usage_samples_user_end` ON `usage_samples` (`user_id`,`end`);--> statement-breakpoint
CREATE TABLE `usage_sessions` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`email` text,
	`source` text NOT NULL,
	`started_at` integer NOT NULL,
	`last_active_at` integer NOT NULL,
	`stage` integer NOT NULL,
	`completed_at` integer,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE INDEX `idx_usage_sessions_email_active` ON `usage_sessions` (`email`,`last_active_at`);