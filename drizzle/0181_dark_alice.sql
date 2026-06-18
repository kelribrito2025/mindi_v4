ALTER TABLE `establishments` ADD `stockLowThreshold` int DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `stockCriticalThreshold` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `stockOutThreshold` int DEFAULT 0 NOT NULL;