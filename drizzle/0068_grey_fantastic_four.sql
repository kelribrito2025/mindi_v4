ALTER TABLE `orders` MODIFY COLUMN `paymentMethod` enum('cash','card','pix','boleto','card_online') NOT NULL DEFAULT 'cash';--> statement-breakpoint
ALTER TABLE `establishments` ADD `stripeAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `establishments` ADD `onlinePaymentEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `stripeOnboardingComplete` boolean DEFAULT false NOT NULL;