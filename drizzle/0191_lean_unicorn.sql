CREATE TABLE `ifood_category_mapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`localCategoryId` int NOT NULL,
	`ifoodCategoryId` varchar(100) NOT NULL,
	`ifoodCatalogId` varchar(100) NOT NULL,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ifood_category_mapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_ifood_cat_mapping_est_cat` UNIQUE(`establishmentId`,`localCategoryId`)
);
--> statement-breakpoint
CREATE TABLE `ifood_complement_mapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`localGroupId` int NOT NULL,
	`localItemId` int,
	`ifoodOptionGroupId` varchar(100),
	`ifoodOptionId` varchar(100),
	`ifoodProductId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ifood_complement_mapping_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ifood_product_mapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`localProductId` int NOT NULL,
	`localCategoryId` int,
	`ifoodItemId` varchar(100) NOT NULL,
	`ifoodProductId` varchar(100) NOT NULL,
	`ifoodCategoryId` varchar(100) NOT NULL,
	`ifoodCatalogId` varchar(100) NOT NULL,
	`lastSyncedAt` timestamp,
	`syncStatus` enum('synced','pending','error') NOT NULL DEFAULT 'synced',
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ifood_product_mapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_ifood_mapping_est_product` UNIQUE(`establishmentId`,`localProductId`)
);
--> statement-breakpoint
CREATE INDEX `idx_ifood_cat_mapping_estId` ON `ifood_category_mapping` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_ifood_comp_mapping_estId` ON `ifood_complement_mapping` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_ifood_comp_mapping_localGroupId` ON `ifood_complement_mapping` (`localGroupId`);--> statement-breakpoint
CREATE INDEX `idx_ifood_mapping_estId` ON `ifood_product_mapping` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_ifood_mapping_localProductId` ON `ifood_product_mapping` (`localProductId`);--> statement-breakpoint
CREATE INDEX `idx_ifood_mapping_ifoodItemId` ON `ifood_product_mapping` (`ifoodItemId`);