ALTER TABLE `establishments` ADD `paytimeEstablishmentId` varchar(100);--> statement-breakpoint
ALTER TABLE `establishments` ADD `paytimeOnboardingStatus` enum('not_started','pending','submitted','approved','rejected') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `paytimeGatewayActive` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `paytimeSplitConfigured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `paytimeSplitRuleId` varchar(100);--> statement-breakpoint
ALTER TABLE `establishments` ADD `representativeName` varchar(255);--> statement-breakpoint
ALTER TABLE `establishments` ADD `representativeLastName` varchar(255);--> statement-breakpoint
ALTER TABLE `establishments` ADD `representativeCpf` varchar(20);--> statement-breakpoint
ALTER TABLE `establishments` ADD `representativeEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `establishments` ADD `representativePhone` varchar(30);--> statement-breakpoint
ALTER TABLE `establishments` ADD `representativeBirthDate` varchar(10);--> statement-breakpoint
ALTER TABLE `establishments` ADD `cnae` varchar(20);--> statement-breakpoint
ALTER TABLE `establishments` ADD `razaoSocial` varchar(255);--> statement-breakpoint
ALTER TABLE `establishments` ADD `nomeFantasia` varchar(255);