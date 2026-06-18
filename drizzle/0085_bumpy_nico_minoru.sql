CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`orderId` int NOT NULL,
	`driverId` int NOT NULL,
	`deliveryFee` decimal(10,2) NOT NULL,
	`repasseValue` decimal(10,2) NOT NULL,
	`paymentStatus` enum('pending','paid') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`whatsappSent` boolean NOT NULL DEFAULT false,
	`whatsappSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`whatsapp` varchar(30) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`repasseStrategy` enum('neighborhood','fixed','percentage') NOT NULL DEFAULT 'neighborhood',
	`fixedValue` decimal(10,2),
	`percentageValue` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`)
);
