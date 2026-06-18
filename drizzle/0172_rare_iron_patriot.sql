ALTER TABLE `paytime_transactions` ADD `statusOrigin` varchar(20) DEFAULT 'webhook';--> statement-breakpoint
ALTER TABLE `paytime_transactions` ADD `fallbackCheckedAt` timestamp;--> statement-breakpoint
ALTER TABLE `paytime_transactions` ADD `fallbackAttempts` int DEFAULT 0 NOT NULL;