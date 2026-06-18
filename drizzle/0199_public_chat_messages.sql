CREATE TABLE IF NOT EXISTS `public_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`orderId` int NOT NULL,
	`customerPhone` varchar(30) NOT NULL,
	`customerName` varchar(255),
	`content` text NOT NULL,
	`direction` enum('incoming','outgoing') NOT NULL,
	`mediaUrl` text,
	`mediaType` varchar(20),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_pcm_estab` ON `public_chat_messages` (`establishmentId`);
--> statement-breakpoint
CREATE INDEX `idx_pcm_order` ON `public_chat_messages` (`orderId`);
--> statement-breakpoint
CREATE INDEX `idx_pcm_phone_estab` ON `public_chat_messages` (`customerPhone`,`establishmentId`);
