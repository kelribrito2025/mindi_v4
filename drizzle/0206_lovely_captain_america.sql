CREATE TABLE `cashReminderLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`reminderType` enum('open','close') NOT NULL,
	`reminderDate` varchar(10) NOT NULL,
	`sentCount` int NOT NULL DEFAULT 1,
	`lastSentAt` timestamp NOT NULL DEFAULT (now()),
	`dismissed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashReminderLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cashReminderSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`openReminderEnabled` boolean NOT NULL DEFAULT true,
	`closeReminderEnabled` boolean NOT NULL DEFAULT true,
	`openReminderDelayMinutes` int NOT NULL DEFAULT 5,
	`closeReminderBeforeMinutes` int NOT NULL DEFAULT 5,
	`maxCloseReminders` int NOT NULL DEFAULT 3,
	`respectClosedDays` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cashReminderSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_cashReminderLogs_estab_date` ON `cashReminderLogs` (`establishmentId`,`reminderDate`);--> statement-breakpoint
CREATE INDEX `idx_cashReminderLogs_estab_type_date` ON `cashReminderLogs` (`establishmentId`,`reminderType`,`reminderDate`);--> statement-breakpoint
CREATE INDEX `idx_cashReminderSettings_estab` ON `cashReminderSettings` (`establishmentId`);