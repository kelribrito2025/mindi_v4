ALTER TABLE `stories` ADD `storyType` enum('simple','product','promo') DEFAULT 'simple' NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` ADD `productId` int;--> statement-breakpoint
ALTER TABLE `stories` ADD `promoTitle` varchar(120);--> statement-breakpoint
ALTER TABLE `stories` ADD `promoText` varchar(255);--> statement-breakpoint
ALTER TABLE `stories` ADD `promoPrice` varchar(20);--> statement-breakpoint
ALTER TABLE `stories` ADD `promoExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `stories` ADD `actionLabel` varchar(40);