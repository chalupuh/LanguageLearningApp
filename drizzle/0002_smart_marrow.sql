CREATE TABLE `journey_events` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`source` text NOT NULL,
	`xp` integer NOT NULL,
	`created_at` integer NOT NULL,
	`details` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `journey_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`historical_xp` integer NOT NULL,
	`avatar` text DEFAULT 'default' NOT NULL,
	`background` text DEFAULT 'default' NOT NULL,
	`frame` text DEFAULT 'default' NOT NULL,
	`weekly_goal` integer DEFAULT 3 NOT NULL
);
