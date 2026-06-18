CREATE TABLE `printerSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`autoPrintEnabled` boolean NOT NULL DEFAULT false,
	`printOnNewOrder` boolean NOT NULL DEFAULT true,
	`printOnStatusChange` boolean NOT NULL DEFAULT false,
	`copies` int NOT NULL DEFAULT 1,
	`showLogo` boolean NOT NULL DEFAULT true,
	`showQrCode` boolean NOT NULL DEFAULT false,
	`footerMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `printerSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `printerSettings_establishmentId_unique` UNIQUE(`establishmentId`)
);
--> statement-breakpoint
CREATE TABLE `printers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`port` int NOT NULL DEFAULT 9100,
	`isActive` boolean NOT NULL DEFAULT true,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `printers_id` PRIMARY KEY(`id`)
);
