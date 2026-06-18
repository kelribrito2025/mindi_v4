CREATE TABLE `radiusFees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`maxKm` decimal(6,2) NOT NULL,
	`fee` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `radiusFees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `establishments` MODIFY COLUMN `deliveryFeeType` enum('free','fixed','byNeighborhood','byRadius') NOT NULL DEFAULT 'free';--> statement-breakpoint
CREATE INDEX `idx_radiusFees_estId` ON `radiusFees` (`establishmentId`);