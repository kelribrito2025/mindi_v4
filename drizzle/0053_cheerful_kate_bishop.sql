ALTER TABLE `establishments` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `establishments` ADD `cnpj` varchar(20);--> statement-breakpoint
ALTER TABLE `establishments` ADD `responsibleName` varchar(255);--> statement-breakpoint
ALTER TABLE `establishments` ADD `responsiblePhone` varchar(30);--> statement-breakpoint
ALTER TABLE `establishments` ADD `twoFactorEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `twoFactorEmail` varchar(320);