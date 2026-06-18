ALTER TABLE `establishments` ADD `planType` enum('trial','basic','pro','enterprise') DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `trialStartDate` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `establishments` ADD `trialDays` int DEFAULT 15 NOT NULL;