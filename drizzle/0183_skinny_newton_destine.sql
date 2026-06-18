CREATE TABLE `onboarding_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishmentId` int NOT NULL,
	`step` int NOT NULL DEFAULT 1,
	`data` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_drafts_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_onbDraft_estId` UNIQUE(`establishmentId`)
);
