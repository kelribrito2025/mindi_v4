ALTER TABLE `categories` ADD `version` enum('draft','published') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `publishedSourceId` int;--> statement-breakpoint
ALTER TABLE `complementGroups` ADD `version` enum('draft','published') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `complementItems` ADD `version` enum('draft','published') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `version` enum('draft','published') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `publishedSourceId` int;--> statement-breakpoint
CREATE INDEX `idx_categories_version` ON `categories` (`establishmentId`,`version`);--> statement-breakpoint
CREATE INDEX `idx_complementGroups_version` ON `complementGroups` (`version`);--> statement-breakpoint
CREATE INDEX `idx_complementItems_version` ON `complementItems` (`version`);--> statement-breakpoint
CREATE INDEX `idx_products_version` ON `products` (`establishmentId`,`version`);