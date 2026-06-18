ALTER TABLE `orders` ADD `source` enum('internal','ifood','rappi','ubereats') DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `externalId` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `externalDisplayId` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `externalStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `externalData` json;