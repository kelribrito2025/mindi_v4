CREATE TABLE `chat_shortcuts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishment_id` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_shortcuts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_cs_establishment` ON `chat_shortcuts` (`establishment_id`);