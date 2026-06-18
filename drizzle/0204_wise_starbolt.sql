CREATE TABLE `cashOperators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashOperators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_cashOperators_estab` ON `cashOperators` (`establishmentId`);