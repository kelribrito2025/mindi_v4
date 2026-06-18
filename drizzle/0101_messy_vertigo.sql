CREATE TABLE `botApiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`apiKey` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`requestCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `botApiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `botApiKeys_apiKey_unique` UNIQUE(`apiKey`)
);
