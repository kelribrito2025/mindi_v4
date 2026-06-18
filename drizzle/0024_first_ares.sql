CREATE TABLE `loyaltyCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`customerPhone` varchar(30) NOT NULL,
	`customerName` varchar(255),
	`password4Hash` varchar(255) NOT NULL,
	`stamps` int NOT NULL DEFAULT 0,
	`totalStampsEarned` int NOT NULL DEFAULT 0,
	`couponsEarned` int NOT NULL DEFAULT 0,
	`activeCouponId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loyaltyCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyStamps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loyaltyCardId` int NOT NULL,
	`orderId` int NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`orderTotal` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyaltyStamps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `establishments` ADD `loyaltyEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `loyaltyStampsRequired` int DEFAULT 6;--> statement-breakpoint
ALTER TABLE `establishments` ADD `loyaltyCouponType` enum('fixed','percentage','free_delivery') DEFAULT 'fixed';--> statement-breakpoint
ALTER TABLE `establishments` ADD `loyaltyCouponValue` decimal(10,2) DEFAULT '10';--> statement-breakpoint
ALTER TABLE `establishments` ADD `loyaltyMinOrderValue` decimal(10,2) DEFAULT '0';