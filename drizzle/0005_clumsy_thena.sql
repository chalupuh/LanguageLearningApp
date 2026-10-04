CREATE TABLE `ai_quota` (
	`user_id` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feature_requests` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`email` text,
	`kind` text NOT NULL,
	`language` text NOT NULL,
	`text` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`release_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`seen_at` integer,
	PRIMARY KEY(`user_id`, `id`)
);
