ALTER TABLE `orders` ADD `discount` decimal(10,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `couponCode` varchar(50);