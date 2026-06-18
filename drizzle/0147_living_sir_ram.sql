CREATE TABLE `whatsapp_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`remoteJid` varchar(100) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`contactName` varchar(255),
	`profilePicUrl` text,
	`lastMessageText` text,
	`lastMessageAt` timestamp,
	`unreadCount` int NOT NULL DEFAULT 0,
	`status` enum('bot','human','closed') NOT NULL DEFAULT 'bot',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_wc_estab_jid` UNIQUE(`establishmentId`,`remoteJid`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`remoteJid` varchar(100) NOT NULL,
	`messageId` varchar(200),
	`direction` enum('incoming','outgoing') NOT NULL,
	`senderName` varchar(255),
	`messageType` enum('text','image','audio','video','document','sticker','location','contact','other') NOT NULL DEFAULT 'text',
	`content` text,
	`mediaUrl` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_wc_estab` ON `whatsapp_conversations` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_wm_conv` ON `whatsapp_messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `idx_wm_estab` ON `whatsapp_messages` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_wm_timestamp` ON `whatsapp_messages` (`timestamp`);