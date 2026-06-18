CREATE TABLE `stockCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`categoryId` int,
	`name` varchar(255) NOT NULL,
	`currentQuantity` decimal(10,2) NOT NULL DEFAULT '0',
	`minQuantity` decimal(10,2) NOT NULL DEFAULT '0',
	`maxQuantity` decimal(10,2),
	`unit` enum('kg','g','L','ml','unidade','pacote','caixa','dúzia') NOT NULL DEFAULT 'unidade',
	`costPerUnit` decimal(10,2),
	`status` enum('ok','low','critical','out_of_stock') NOT NULL DEFAULT 'ok',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stockItemId` int NOT NULL,
	`type` enum('entry','exit','adjustment','loss') NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`previousQuantity` decimal(10,2) NOT NULL,
	`newQuantity` decimal(10,2) NOT NULL,
	`reason` varchar(255),
	`orderId` int,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMovements_id` PRIMARY KEY(`id`)
);
