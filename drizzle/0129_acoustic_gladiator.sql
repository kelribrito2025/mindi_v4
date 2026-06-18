ALTER TABLE `establishments` MODIFY COLUMN `aiImageCredits` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `establishments` ADD `aiCreditsGranted` boolean DEFAULT false NOT NULL;