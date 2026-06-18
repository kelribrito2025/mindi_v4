CREATE TABLE `paytime_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`orderId` int,
	`paytimeTransactionId` varchar(100) NOT NULL,
	`paytimeGatewayKey` varchar(100),
	`referenceId` varchar(100),
	`paymentType` enum('PIX','CREDIT_CARD','BOLETO') NOT NULL DEFAULT 'PIX',
	`status` enum('PENDING','APPROVED','CANCELLED','REFUNDED','EXPIRED') NOT NULL DEFAULT 'PENDING',
	`amountCents` int NOT NULL,
	`emv` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paytime_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_paytime_establishmentId` ON `paytime_transactions` (`establishmentId`);--> statement-breakpoint
CREATE INDEX `idx_paytime_orderId` ON `paytime_transactions` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_paytime_transactionId` ON `paytime_transactions` (`paytimeTransactionId`);--> statement-breakpoint
CREATE INDEX `idx_paytime_status` ON `paytime_transactions` (`status`);