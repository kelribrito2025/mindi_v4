CREATE TABLE `storyEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storyId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`eventType` enum('click','add_to_cart','order_completed') NOT NULL,
	`productId` int,
	`orderId` int,
	`orderValue` decimal(10,2),
	`sessionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storyEvents_id` PRIMARY KEY(`id`)
);
