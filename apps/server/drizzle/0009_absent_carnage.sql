PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`meta` text,
	`is_read` integer DEFAULT 0 NOT NULL,
	`email_status` text DEFAULT 'failed' NOT NULL,
	`email_error` text,
	`email_sent_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "type", "title", "content", "meta", "is_read", "email_status", "email_error", "email_sent_at", "created_at", "updated_at") SELECT "id", "type", "title", "content", "meta", "is_read", "email_status", "email_error", "email_sent_at", "created_at", "updated_at" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
PRAGMA foreign_keys=ON;