CREATE TABLE `fixed_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`type` enum('product','category') NOT NULL,
	`productId` int,
	`categoryId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`scheduleEnabled` boolean NOT NULL DEFAULT false,
	`scheduleDays` json,
	`scheduleStartTime` varchar(5),
	`scheduleEndTime` varchar(5),
	`scheduleLabel` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fixed_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_fixedSuggestions_establishmentId` ON `fixed_suggestions` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_fixedSuggestions_productId` ON `fixed_suggestions` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_fixedSuggestions_categoryId` ON `fixed_suggestions` (`categoryId`);