CREATE TABLE `session_drafts` (
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `source`)
);
