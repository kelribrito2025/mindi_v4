ALTER TABLE `reviews` ADD `responseText` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `responseDate` timestamp;--> statement-breakpoint
ALTER TABLE `reviews` ADD `isRead` boolean DEFAULT false NOT NULL;