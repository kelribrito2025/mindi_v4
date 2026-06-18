ALTER TABLE `categories` ADD `isUpsell` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `isUpsellPinned` boolean DEFAULT false NOT NULL;