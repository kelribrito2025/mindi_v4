CREATE TABLE `pdv_customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`phone` varchar(30) NOT NULL,
	`name` varchar(255),
	`street` varchar(255),
	`number` varchar(50),
	`complement` varchar(255),
	`neighborhood` varchar(255),
	`reference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdv_customers_id` PRIMARY KEY(`id`)
);
