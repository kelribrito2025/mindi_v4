ALTER TABLE `establishments` ADD `schedulingEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `schedulingMinAdvance` int DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `schedulingMaxDays` int DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `schedulingInterval` int DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `schedulingMoveMinutes` int DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `isScheduled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `scheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `movedToQueue` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `movedToQueueAt` timestamp;