CREATE TABLE `order_counters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`counterDate` varchar(10) NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_counters_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_est_date` UNIQUE(`establishmentId`,`counterDate`)
);
