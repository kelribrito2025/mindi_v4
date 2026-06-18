CREATE TABLE `comboGroupItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`comboGroupId` int NOT NULL,
	`productId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comboGroupItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comboGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT true,
	`maxQuantity` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comboGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `isCombo` boolean DEFAULT false NOT NULL;