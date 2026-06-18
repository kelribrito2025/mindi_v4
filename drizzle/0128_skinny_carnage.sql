CREATE TABLE `ai_image_credit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`userId` int NOT NULL,
	`action` enum('use','purchase','bonus','refund') NOT NULL,
	`quantity` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` varchar(255),
	`stripeSessionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_image_credit_logs_id` PRIMARY KEY(`id`)
);
