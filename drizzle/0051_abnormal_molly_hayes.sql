CREATE TABLE `menu_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`establishmentId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_views_daily` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`uniqueVisitors` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_views_daily_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_views_hourly` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`hour` int NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_views_hourly_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_balance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0',
	`costPerSms` decimal(10,4) NOT NULL DEFAULT '0.0800',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sms_balance_id` PRIMARY KEY(`id`),
	CONSTRAINT `sms_balance_establishmentId_unique` UNIQUE(`establishmentId`)
);
--> statement-breakpoint
CREATE TABLE `sms_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`type` enum('credit','debit') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`smsCount` int NOT NULL DEFAULT 0,
	`balanceBefore` decimal(10,2) NOT NULL,
	`balanceAfter` decimal(10,2) NOT NULL,
	`description` varchar(255),
	`campaignName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ifoodConfig` ADD `accessToken` text;--> statement-breakpoint
ALTER TABLE `ifoodConfig` ADD `refreshToken` text;--> statement-breakpoint
ALTER TABLE `ifoodConfig` ADD `tokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `ifoodConfig` ADD `authorizationCodeVerifier` varchar(255);--> statement-breakpoint
ALTER TABLE `ifoodConfig` ADD `userCode` varchar(50);--> statement-breakpoint
ALTER TABLE `ifoodConfig` ADD `userCodeExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `ifoodConfig` ADD `merchantName` varchar(255);--> statement-breakpoint
ALTER TABLE `ifoodConfig` ADD `isConnected` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `ifoodConfig` DROP COLUMN `clientId`;--> statement-breakpoint
ALTER TABLE `ifoodConfig` DROP COLUMN `clientSecret`;--> statement-breakpoint
ALTER TABLE `ifoodConfig` DROP COLUMN `webhookConfigured`;