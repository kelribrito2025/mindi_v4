ALTER TABLE `establishments` ADD `manuallyOpened` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `manuallyOpenedAt` timestamp;