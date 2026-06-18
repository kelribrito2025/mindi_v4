ALTER TABLE `printerSettings` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `headerMessage` text;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `paperWidth` varchar(10) DEFAULT '80mm' NOT NULL;--> statement-breakpoint
ALTER TABLE `printers` ADD `printerType` varchar(20) DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `printers` ADD `categoryIds` text;