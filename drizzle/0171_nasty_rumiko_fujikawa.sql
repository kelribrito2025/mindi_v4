ALTER TABLE `establishments` ADD `paytimeBankingActive` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `paytimeSubPaytimeActive` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `paytimeKycUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `establishments` ADD `paytimeKycStatus` enum('not_started','pending','approved','rejected') DEFAULT 'not_started' NOT NULL;