ALTER TABLE `categories` ADD `availabilityType` enum('always','scheduled') DEFAULT 'always' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `availableDays` json;--> statement-breakpoint
ALTER TABLE `categories` ADD `availableHours` json;