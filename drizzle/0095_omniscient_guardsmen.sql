CREATE TABLE `cashbackBalances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`customerPhone` varchar(30) NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0',
	`totalEarned` decimal(10,2) NOT NULL DEFAULT '0',
	`totalUsed` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cashbackBalances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cashbackTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`customerPhone` varchar(30) NOT NULL,
	`type` enum('credit','debit') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`orderId` int,
	`orderNumber` varchar(50),
	`description` varchar(500),
	`balanceBefore` decimal(10,2) NOT NULL,
	`balanceAfter` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashbackTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `establishments` ADD `rewardProgramType` enum('none','loyalty','cashback') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `cashbackEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `cashbackPercent` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `establishments` ADD `cashbackApplyMode` enum('all','categories') DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `cashbackCategoryIds` json;--> statement-breakpoint
ALTER TABLE `establishments` ADD `cashbackAllowPartialUse` boolean DEFAULT true NOT NULL;