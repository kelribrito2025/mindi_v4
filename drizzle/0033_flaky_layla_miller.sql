ALTER TABLE `printerSettings` ADD `posPrinterEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `posPrinterLinkcode` varchar(100);--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `posPrinterNumber` int DEFAULT 1 NOT NULL;