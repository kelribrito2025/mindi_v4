CREATE TABLE `feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`establishmentId` int,
	`type` enum('bug','suggestion','question','other') NOT NULL DEFAULT 'suggestion',
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`screenshotUrl` text,
	`page` varchar(255),
	`status` enum('new','read','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedbacks_id` PRIMARY KEY(`id`)
);
