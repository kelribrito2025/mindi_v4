CREATE TABLE `ifoodConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`clientId` varchar(100),
	`clientSecret` varchar(200),
	`merchantId` varchar(100),
	`isActive` boolean NOT NULL DEFAULT false,
	`lastTokenRefresh` timestamp,
	`webhookConfigured` boolean NOT NULL DEFAULT false,
	`autoAcceptOrders` boolean NOT NULL DEFAULT false,
	`notifyOnNewOrder` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ifoodConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `ifoodConfig_establishmentId_unique` UNIQUE(`establishmentId`)
);
