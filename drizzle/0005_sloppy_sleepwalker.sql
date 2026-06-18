ALTER TABLE `establishments` ADD `rating` decimal(2,1) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `establishments` ADD `reviewCount` int DEFAULT 0 NOT NULL;