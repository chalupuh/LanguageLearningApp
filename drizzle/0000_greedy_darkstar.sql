CREATE TABLE `learner_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text,
	`state` text NOT NULL,
	`updated_at` integer NOT NULL
);
