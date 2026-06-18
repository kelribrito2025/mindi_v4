CREATE TABLE `printLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`orderId` int NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`trigger` enum('new_order','accept','manual','reprint') NOT NULL DEFAULT 'new_order',
	`method` enum('sse','pos_driver','socket_tcp','direct') NOT NULL DEFAULT 'sse',
	`status` enum('sent','delivered','failed') NOT NULL DEFAULT 'sent',
	`printerConnections` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `printLogs_id` PRIMARY KEY(`id`)
);
