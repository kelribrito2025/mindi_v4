ALTER TABLE `scheduled_campaigns` MODIFY COLUMN `totalCost` decimal(10,4) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE `sms_balance` MODIFY COLUMN `balance` decimal(10,4) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE `sms_transactions` MODIFY COLUMN `amount` decimal(10,4) NOT NULL;--> statement-breakpoint
ALTER TABLE `sms_transactions` MODIFY COLUMN `balanceBefore` decimal(10,4) NOT NULL;--> statement-breakpoint
ALTER TABLE `sms_transactions` MODIFY COLUMN `balanceAfter` decimal(10,4) NOT NULL;