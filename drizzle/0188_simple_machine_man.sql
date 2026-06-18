CREATE TABLE `gateway_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gateway` varchar(50) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`displayName` varchar(100),
	`sortOrder` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gateway_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `gateway_settings_gateway_unique` UNIQUE(`gateway`)
);
--> statement-breakpoint
CREATE TABLE `plan_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`planId` varchar(50) NOT NULL,
	`billingPeriod` enum('monthly','annual') NOT NULL,
	`gateway` varchar(50) NOT NULL,
	`status` enum('active','pending','past_due','canceled','expired') NOT NULL DEFAULT 'pending',
	`paytimeTransactionId` varchar(100),
	`paytimeCardToken` varchar(500),
	`paytimeCardBrand` varchar(50),
	`paytimeCardLast4` varchar(4),
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`amountCents` int NOT NULL,
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`gracePeriodEnd` timestamp,
	`canceledAt` timestamp,
	`lastPaymentAt` timestamp,
	`nextRenewalAt` timestamp,
	`renewalAttempts` int NOT NULL DEFAULT 0,
	`lastRenewalError` text,
	`renewalNotifiedAt` timestamp,
	`renewalPixEmv` text,
	`renewalPixTransactionId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plan_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_planSubs_establishmentId` ON `plan_subscriptions` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_planSubs_status` ON `plan_subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_planSubs_nextRenewal` ON `plan_subscriptions` (`nextRenewalAt`);--> statement-breakpoint
CREATE INDEX `idx_planSubs_gateway` ON `plan_subscriptions` (`gateway`);