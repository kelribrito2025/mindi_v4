CREATE TABLE `complement_substitutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complement_item_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`additional_price` int NOT NULL DEFAULT 0,
	`image_url` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complement_substitutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_establishments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`establishmentId` int NOT NULL,
	`role` enum('owner','staff') NOT NULL DEFAULT 'owner',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_establishments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `activeEstablishmentId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `defaultEstablishmentId` int;--> statement-breakpoint
CREATE INDEX `idx_complement_substitutions_item_id` ON `complement_substitutions` (`complement_item_id`);--> statement-breakpoint
CREATE INDEX `idx_user_establishments_userId` ON `user_establishments` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_user_establishments_establishmentId` ON `user_establishments` (`establishmentId`);