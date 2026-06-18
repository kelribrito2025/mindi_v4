ALTER TABLE `establishments` ADD `freeDeliveryEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `freeDeliveryMinValue` decimal(10,2) DEFAULT '0';