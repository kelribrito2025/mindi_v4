ALTER TABLE `orders` ADD `newAt` timestamp;--> statement-breakpoint
UPDATE `orders` SET `newAt` = `createdAt` WHERE `status` = 'new' AND `newAt` IS NULL;--> statement-breakpoint
CREATE INDEX `idx_orders_status_newAt` ON `orders` (`status`,`newAt`);--> statement-breakpoint
CREATE INDEX `idx_orders_status_readyAt` ON `orders` (`status`,`readyAt`);
