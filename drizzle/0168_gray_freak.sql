CREATE TABLE `plan_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` varchar(50) NOT NULL,
	`text` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plan_features_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` varchar(50) NOT NULL,
	`monthlyPriceCents` int NOT NULL DEFAULT 0,
	`annualPriceCents` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plan_prices_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_prices_planId_unique` UNIQUE(`planId`)
);
--> statement-breakpoint
CREATE INDEX `idx_planFeatures_planId` ON `plan_features` (`planId`);