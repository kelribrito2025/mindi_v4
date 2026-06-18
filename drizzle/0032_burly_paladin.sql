CREATE TABLE `printQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`orderId` int NOT NULL,
	`printerId` int,
	`status` enum('pending','printing','completed','failed') NOT NULL DEFAULT 'pending',
	`copies` int NOT NULL DEFAULT 1,
	`errorMessage` text,
	`printedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `printQueue_id` PRIMARY KEY(`id`)
);
