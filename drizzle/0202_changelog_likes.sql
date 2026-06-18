CREATE TABLE `changelog_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version_id` int NOT NULL,
	`establishment_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `changelog_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_cl_version_establishment` UNIQUE(`version_id`,`establishment_id`)
);
--> statement-breakpoint
ALTER TABLE `changelog_likes` ADD CONSTRAINT `fk_changelog_likes_version` FOREIGN KEY (`version_id`) REFERENCES `changelog_versions`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `changelog_likes` ADD CONSTRAINT `fk_changelog_likes_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_cl_version` ON `changelog_likes` (`version_id`);
--> statement-breakpoint
CREATE INDEX `idx_cl_establishment` ON `changelog_likes` (`establishment_id`);
