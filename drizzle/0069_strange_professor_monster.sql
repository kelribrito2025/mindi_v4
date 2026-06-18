CREATE TABLE `pending_online_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`establishmentId` int NOT NULL,
	`orderData` json NOT NULL,
	`status` enum('pending','completed','expired') NOT NULL DEFAULT 'pending',
	`resultOrderId` int,
	`resultOrderNumber` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pending_online_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `pending_online_orders_sessionId_unique` UNIQUE(`sessionId`)
);
