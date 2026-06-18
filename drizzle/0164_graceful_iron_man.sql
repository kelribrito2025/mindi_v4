ALTER TABLE `paytime_transactions` MODIFY COLUMN `status` enum('PENDING','APPROVED','CANCELLED','REFUNDED','EXPIRED','PAID','FAILED','WAITING_ANTIFRAUD') NOT NULL DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE `paytime_transactions` ADD `antifraudId` varchar(255);--> statement-breakpoint
ALTER TABLE `paytime_transactions` ADD `antifraudSession` text;--> statement-breakpoint
ALTER TABLE `paytime_transactions` ADD `antifraudRequired` varchar(20);--> statement-breakpoint
ALTER TABLE `paytime_transactions` ADD `cardBrand` varchar(50);--> statement-breakpoint
ALTER TABLE `paytime_transactions` ADD `cardLast4` varchar(4);--> statement-breakpoint
ALTER TABLE `paytime_transactions` ADD `installments` int DEFAULT 1;