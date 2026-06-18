CREATE TABLE `neighborhoodFees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`neighborhood` varchar(255) NOT NULL,
	`fee` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `neighborhoodFees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `establishments` ADD `deliveryTimeEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `deliveryTimeMin` int DEFAULT 20;--> statement-breakpoint
ALTER TABLE `establishments` ADD `deliveryTimeMax` int DEFAULT 60;--> statement-breakpoint
ALTER TABLE `establishments` ADD `minimumOrderEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `minimumOrderValue` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `establishments` ADD `deliveryFeeType` enum('free','fixed','byNeighborhood') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `deliveryFeeFixed` decimal(10,2) DEFAULT '0';