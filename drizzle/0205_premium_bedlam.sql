ALTER TABLE `establishments` ADD `paytimeCardFeePassthrough` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `printers` ADD `deviceId` varchar(128);--> statement-breakpoint
ALTER TABLE `printers` ADD `deviceModel` varchar(128);--> statement-breakpoint
ALTER TABLE `printers` ADD `platform` varchar(20);--> statement-breakpoint
ALTER TABLE `printers` ADD `lastSeenAt` timestamp;