CREATE TABLE `changelog_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version_id` int NOT NULL,
	`type` enum('feature','improvement','fix') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `changelog_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `changelog_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(20) NOT NULL,
	`title` varchar(200) NOT NULL,
	`is_published` boolean NOT NULL DEFAULT false,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `changelog_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_ce_version` ON `changelog_entries` (`version_id`);