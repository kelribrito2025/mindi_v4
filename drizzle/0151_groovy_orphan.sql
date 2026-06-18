CREATE TABLE `weeklyGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`targetRevenue` decimal(10,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_weeklyGoals_estId` ON `weeklyGoals` (`establishmentId`);