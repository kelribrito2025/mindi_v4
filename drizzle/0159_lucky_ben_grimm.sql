CREATE TABLE `order_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishment_id` int,
	`order_id` int,
	`customer_id` int,
	`customer_name` varchar(255),
	`customer_phone` varchar(50),
	`level` enum('info','warn','error') NOT NULL DEFAULT 'info',
	`event` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`details` json,
	`source` varchar(50) NOT NULL DEFAULT 'server',
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_orderLogs_establishment` ON `order_logs` (`establishment_id`);--> statement-breakpoint
CREATE INDEX `idx_orderLogs_orderId` ON `order_logs` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_orderLogs_level` ON `order_logs` (`level`);--> statement-breakpoint
CREATE INDEX `idx_orderLogs_event` ON `order_logs` (`event`);--> statement-breakpoint
CREATE INDEX `idx_orderLogs_createdAt` ON `order_logs` (`created_at`);