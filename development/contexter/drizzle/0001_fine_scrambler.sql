CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`api_token` text NOT NULL,
	`name` text,
	`email` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_api_token_unique` ON `users` (`api_token`);
--> statement-breakpoint
CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`shared_with_id` text,
	`share_token` text NOT NULL,
	`scope` text DEFAULT 'all' NOT NULL,
	`permission` text DEFAULT 'read' NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shared_with_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_share_token_unique` ON `shares` (`share_token`);
--> statement-breakpoint
ALTER TABLE `documents` ADD `user_id` text DEFAULT 'anonymous' NOT NULL;
--> statement-breakpoint
ALTER TABLE `chunks` ADD `user_id` text DEFAULT 'anonymous' NOT NULL;
--> statement-breakpoint
ALTER TABLE `jobs` ADD `user_id` text DEFAULT 'anonymous' NOT NULL;
