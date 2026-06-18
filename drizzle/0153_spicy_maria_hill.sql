CREATE TABLE `scheduled_closures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`type` enum('specific_date','recurring') NOT NULL,
	`specificDate` date,
	`recurringRule` varchar(50),
	`reason` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_closures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_sc_estab` ON `scheduled_closures` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_sc_type` ON `scheduled_closures` (`type`);--> statement-breakpoint
CREATE INDEX `idx_sc_date` ON `scheduled_closures` (`specificDate`);