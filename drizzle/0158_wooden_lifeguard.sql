ALTER TABLE `collaborators` ADD `resetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `collaborators` ADD `resetTokenExpiresAt` timestamp;