CREATE TABLE `businessHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`openTime` varchar(5),
	`closeTime` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessHours_id` PRIMARY KEY(`id`)
);
