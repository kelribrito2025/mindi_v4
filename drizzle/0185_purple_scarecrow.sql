CREATE TABLE `ifood_processed_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`eventCode` varchar(50) NOT NULL,
	`orderId` varchar(255),
	`merchantId` varchar(255),
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `ifood_processed_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `ifood_processed_events_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE INDEX `idx_ifood_events_eventId` ON `ifood_processed_events` (`eventId`);--> statement-breakpoint
CREATE INDEX `idx_ifood_events_expiresAt` ON `ifood_processed_events` (`expiresAt`);