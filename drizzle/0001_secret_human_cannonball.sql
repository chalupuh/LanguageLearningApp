CREATE TABLE `feedback_resolutions` (
	`user_id` text NOT NULL,
	`note_id` text NOT NULL,
	`handled` integer NOT NULL,
	`note_text` text NOT NULL,
	`message` text NOT NULL,
	`updated_at` integer NOT NULL,
	`seen_at` integer,
	PRIMARY KEY(`user_id`, `note_id`)
);
