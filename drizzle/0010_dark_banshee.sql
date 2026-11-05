CREATE TABLE `grammar_completions` (
	`user_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `exercise_id`)
);
