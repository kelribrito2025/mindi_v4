ALTER TABLE `establishments` ADD `telegramEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `telegramChatId` varchar(100);