CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`establishmentId` int,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_userPrefs_user_est_key` UNIQUE(`userId`,`establishmentId`,`key`)
);
--> statement-breakpoint
CREATE INDEX `idx_userPrefs_userId` ON `user_preferences` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_userPrefs_estId` ON `user_preferences` (`establishmentId`);