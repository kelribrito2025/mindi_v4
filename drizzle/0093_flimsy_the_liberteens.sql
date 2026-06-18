CREATE TABLE `recurringExpenseHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recurringExpenseId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`field` varchar(100) NOT NULL,
	`oldValue` varchar(500) NOT NULL,
	`newValue` varchar(500) NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recurringExpenseHistory_id` PRIMARY KEY(`id`)
);
