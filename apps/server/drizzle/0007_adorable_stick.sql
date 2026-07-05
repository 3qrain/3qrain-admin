ALTER TABLE `notifications` ADD `email_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `email_error` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `email_sent_at` integer;