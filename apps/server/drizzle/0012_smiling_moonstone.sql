PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_friend_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_name` text NOT NULL,
	`site_url` text NOT NULL,
	`icon_url` text,
	`description` text,
	`applicant_email` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reject_reason` text,
	`approved_at` integer,
	`rejected_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_friend_links`("id", "site_name", "site_url", "icon_url", "description", "applicant_email", "status", "reject_reason", "approved_at", "rejected_at", "created_at", "updated_at") SELECT "id", "site_name", "site_url", "icon_url", "description", "applicant_email", "status", "reject_reason", "approved_at", "rejected_at", "created_at", "updated_at" FROM `friend_links`;--> statement-breakpoint
DROP TABLE `friend_links`;--> statement-breakpoint
ALTER TABLE `__new_friend_links` RENAME TO `friend_links`;--> statement-breakpoint
PRAGMA foreign_keys=ON;