ALTER TABLE `establishments` ADD `manuallyClosed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `manuallyClosedAt` timestamp;