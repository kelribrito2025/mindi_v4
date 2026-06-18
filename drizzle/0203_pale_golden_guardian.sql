CREATE TABLE `cashMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`sessionId` int NOT NULL,
	`type` enum('sangria','suprimento') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` text,
	`operatorName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cashSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`operatorName` varchar(255) NOT NULL,
	`operatorId` int,
	`openingAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`closingAmount` decimal(10,2),
	`expectedAmount` decimal(10,2),
	`difference` decimal(10,2),
	`observation` text,
	`closingObservation` text,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cashSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_cashMovements_session` ON `cashMovements` (`sessionId`);--> statement-breakpoint
CREATE INDEX `idx_cashMovements_estab` ON `cashMovements` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_cashSessions_estab` ON `cashSessions` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_cashSessions_estab_status` ON `cashSessions` (`establishmentId`,`status`);