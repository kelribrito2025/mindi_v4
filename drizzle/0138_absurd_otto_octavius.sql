CREATE TABLE `tabPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tabId` int NOT NULL,
	`tableId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(50) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tabPayments_id` PRIMARY KEY(`id`)
);
