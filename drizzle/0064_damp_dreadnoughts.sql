CREATE TABLE `scheduled_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`campaignName` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`recipients` json NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`scheduledAt` timestamp NOT NULL,
	`status` enum('pending','sent','cancelled','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`successCount` int NOT NULL DEFAULT 0,
	`failCount` int NOT NULL DEFAULT 0,
	`costPerSms` decimal(10,2) NOT NULL DEFAULT '0.10',
	`totalCost` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_campaigns_id` PRIMARY KEY(`id`)
);
