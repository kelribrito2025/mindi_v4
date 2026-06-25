ALTER TABLE `establishments` ADD `publicChatEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `serviceChargeDestination` varchar(20) DEFAULT 'staff';