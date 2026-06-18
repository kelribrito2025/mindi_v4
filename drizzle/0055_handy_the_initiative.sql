CREATE TABLE `tabItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tabId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`complements` json,
	`notes` text,
	`status` enum('pending','preparing','ready','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`orderedAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tabItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`number` int NOT NULL,
	`name` varchar(100),
	`capacity` int NOT NULL DEFAULT 4,
	`status` enum('free','occupied','reserved','requesting_bill') NOT NULL DEFAULT 'free',
	`currentGuests` int NOT NULL DEFAULT 0,
	`occupiedAt` timestamp,
	`reservedFor` timestamp,
	`reservedName` varchar(255),
	`reservedPhone` varchar(30),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tabs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`tableId` int,
	`tabNumber` varchar(50) NOT NULL,
	`customerName` varchar(255),
	`customerPhone` varchar(30),
	`status` enum('open','requesting_bill','closed','cancelled') NOT NULL DEFAULT 'open',
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0',
	`discount` decimal(10,2) NOT NULL DEFAULT '0',
	`serviceCharge` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL DEFAULT '0',
	`paymentMethod` varchar(50),
	`paidAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`changeAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`notes` text,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tabs_id` PRIMARY KEY(`id`)
);
