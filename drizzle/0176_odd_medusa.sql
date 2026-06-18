CREATE TABLE `linked_suggestion_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkedSuggestionId` int NOT NULL,
	`suggestedProductId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `linked_suggestion_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linked_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`triggerProductId` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`scheduleEnabled` boolean NOT NULL DEFAULT false,
	`scheduleDays` json,
	`scheduleStartTime` varchar(5),
	`scheduleEndTime` varchar(5),
	`scheduleLabel` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linked_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_linkedSuggestionItems_linkedSuggestionId` ON `linked_suggestion_items` (`linkedSuggestionId`);--> statement-breakpoint
CREATE INDEX `idx_linkedSuggestionItems_suggestedProductId` ON `linked_suggestion_items` (`suggestedProductId`);--> statement-breakpoint
CREATE INDEX `idx_linkedSuggestions_establishmentId` ON `linked_suggestions` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_linkedSuggestions_triggerProductId` ON `linked_suggestions` (`triggerProductId`);