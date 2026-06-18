CREATE TABLE `cancel_retention_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`subscriptionId` int NOT NULL,
	`cancelReason` enum('too_expensive','not_using','missing_features','found_alternative','technical_issues','other') NOT NULL,
	`cancelReasonText` text,
	`offerType` varchar(50) NOT NULL,
	`offerAccepted` boolean NOT NULL DEFAULT false,
	`discountPercent` int NOT NULL,
	`discountMonths` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cancel_retention_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `plan_subscriptions` MODIFY COLUMN `status` enum('active','pending','past_due','canceled','expired','canceling') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `plan_subscriptions` ADD `cancelReason` text;--> statement-breakpoint
ALTER TABLE `plan_subscriptions` ADD `cancelAt` timestamp;--> statement-breakpoint
ALTER TABLE `plan_subscriptions` ADD `discountPercent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `plan_subscriptions` ADD `discountUntil` timestamp;--> statement-breakpoint
ALTER TABLE `plan_subscriptions` ADD `discountMonthsRemaining` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `plan_subscriptions` ADD `lastRetentionOfferAt` timestamp;--> statement-breakpoint
CREATE INDEX `idx_cancelRetention_estab` ON `cancel_retention_offers` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_cancelRetention_sub` ON `cancel_retention_offers` (`subscriptionId`);