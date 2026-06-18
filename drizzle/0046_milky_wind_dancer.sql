ALTER TABLE `complementItems` ADD `availabilityType` enum('always','scheduled') DEFAULT 'always' NOT NULL;--> statement-breakpoint
ALTER TABLE `complementItems` ADD `availableDays` json;--> statement-breakpoint
ALTER TABLE `complementItems` ADD `availableHours` json;