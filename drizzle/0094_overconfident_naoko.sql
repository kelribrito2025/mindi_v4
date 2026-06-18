CREATE TABLE `financialGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`targetValue` decimal(10,2) NOT NULL,
	`type` enum('profit','revenue','savings','custom') NOT NULL DEFAULT 'custom',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financialGoals_id` PRIMARY KEY(`id`)
);
