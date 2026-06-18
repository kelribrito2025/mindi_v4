CREATE TABLE `admin_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`adminEmail` varchar(320) NOT NULL,
	`action` varchar(100) NOT NULL,
	`targetType` varchar(50) NOT NULL,
	`targetId` int,
	`targetName` varchar(255),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_auditLog_adminId` ON `admin_audit_log` (`adminId`);--> statement-breakpoint
CREATE INDEX `idx_auditLog_action` ON `admin_audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_auditLog_createdAt` ON `admin_audit_log` (`createdAt`);