CREATE TABLE `platform_whatsapp_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` varchar(100),
	`instanceToken` varchar(500),
	`instanceName` varchar(100) NOT NULL DEFAULT 'mindi_platform',
	`status` enum('disconnected','connecting','connected') NOT NULL DEFAULT 'disconnected',
	`connectedPhone` varchar(30),
	`connectedName` varchar(200),
	`lastQrCode` text,
	`templateRenewalPix` text,
	`templateRenewalCard` text,
	`templatePlanActivated` text,
	`templatePlanExpiring` text,
	`templatePlanDeactivated` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_whatsapp_config_id` PRIMARY KEY(`id`)
);
