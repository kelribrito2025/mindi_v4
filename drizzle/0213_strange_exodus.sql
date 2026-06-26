CREATE TABLE `pizzaCrusts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` decimal(10,2) NOT NULL DEFAULT '0',
	`pdvCode` varchar(50),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`version` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pizzaCrusts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pizzaEdges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` decimal(10,2) NOT NULL DEFAULT '0',
	`pdvCode` varchar(50),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`version` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pizzaEdges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pizzaSizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slices` int NOT NULL DEFAULT 1,
	`maxFlavors` int NOT NULL DEFAULT 1,
	`imageUrl` text,
	`pdvCode` varchar(50),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`version` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pizzaSizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sse_connectivity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishment_id` int NOT NULL,
	`event` enum('disconnected','order_missed','reconnected') NOT NULL,
	`message` text NOT NULL,
	`order_id` int,
	`details` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sse_connectivity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cashMovements` MODIFY COLUMN `type` enum('sangria','suprimento') NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` MODIFY COLUMN `serviceChargeDestination` varchar(20) DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `categories` ADD `categoryType` enum('regular','pizza') DEFAULT 'regular' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `pizzaPriceRule` enum('highest','average') DEFAULT 'highest';--> statement-breakpoint
ALTER TABLE `establishments` ADD `publicChatEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_pizzaCrusts_categoryId` ON `pizzaCrusts` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_pizzaCrusts_version` ON `pizzaCrusts` (`version`);--> statement-breakpoint
CREATE INDEX `idx_pizzaEdges_categoryId` ON `pizzaEdges` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_pizzaEdges_version` ON `pizzaEdges` (`version`);--> statement-breakpoint
CREATE INDEX `idx_pizzaSizes_categoryId` ON `pizzaSizes` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_pizzaSizes_version` ON `pizzaSizes` (`version`);--> statement-breakpoint
CREATE INDEX `idx_sseConnLogs_establishment` ON `sse_connectivity_logs` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `idx_sseConnLogs_event` ON `sse_connectivity_logs` (`event`);--> statement-breakpoint
CREATE INDEX `idx_sseConnLogs_createdAt` ON `sse_connectivity_logs` (`created_at`);