ALTER TABLE `establishments` MODIFY COLUMN `planType` enum('trial','free','basic','pro','enterprise') NOT NULL DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE `establishments` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `establishments` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `establishments` ADD `billingPeriod` enum('monthly','annual');--> statement-breakpoint
ALTER TABLE `establishments` ADD `planExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `establishments` ADD `planActivatedAt` timestamp;