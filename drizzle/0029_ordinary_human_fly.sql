ALTER TABLE `whatsappConfig` ADD `instanceId` varchar(100);--> statement-breakpoint
ALTER TABLE `whatsappConfig` ADD `instanceToken` varchar(500);--> statement-breakpoint
ALTER TABLE `whatsappConfig` DROP COLUMN `subdomain`;--> statement-breakpoint
ALTER TABLE `whatsappConfig` DROP COLUMN `token`;