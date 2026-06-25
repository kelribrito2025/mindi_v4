CREATE TABLE `sse_connectivity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishment_id` int NOT NULL,
	`event` enum('disconnected','order_missed','reconnected') NOT NULL,
	`message` text NOT NULL,
	`order_id` int,
	`details` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sse_connectivity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_sseConnLogs_establishment` ON `sse_connectivity_logs` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `idx_sseConnLogs_event` ON `sse_connectivity_logs` (`event`);--> statement-breakpoint
CREATE INDEX `idx_sseConnLogs_createdAt` ON `sse_connectivity_logs` (`created_at`);