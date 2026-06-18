ALTER TABLE `printerSettings` ADD `autoAcceptEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `autoAcceptTimerSeconds` int DEFAULT 10 NOT NULL;