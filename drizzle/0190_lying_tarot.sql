ALTER TABLE `whatsappConfig` ADD `provider` enum('uazapi','official') DEFAULT 'uazapi' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsappConfig` ADD `wabaId` varchar(100);--> statement-breakpoint
ALTER TABLE `whatsappConfig` ADD `phoneNumberId` varchar(100);--> statement-breakpoint
ALTER TABLE `whatsappConfig` ADD `accessToken` text;--> statement-breakpoint
ALTER TABLE `whatsappConfig` ADD `businessId` varchar(100);--> statement-breakpoint
ALTER TABLE `whatsappConfig` ADD `metaWebhookSecret` varchar(128);