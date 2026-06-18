CREATE TABLE `ifood_disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disputeId` varchar(64) NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`establishmentId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`handshakeType` varchar(64) NOT NULL,
	`message` text,
	`expiresAt` timestamp NOT NULL,
	`timeoutAction` varchar(64) NOT NULL,
	`status` enum('PENDING','ACCEPTED','REJECTED','ALTERNATIVE','EXPIRED') NOT NULL DEFAULT 'PENDING',
	`alternativesJson` text,
	`metadataJson` text,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ifood_disputes_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_ifood_disputes_disputeId` UNIQUE(`disputeId`)
);
--> statement-breakpoint
CREATE INDEX `idx_ifood_disputes_orderId` ON `ifood_disputes` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_ifood_disputes_estId` ON `ifood_disputes` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_ifood_disputes_status` ON `ifood_disputes` (`status`);