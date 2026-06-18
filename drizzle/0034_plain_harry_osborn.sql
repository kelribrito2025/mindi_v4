ALTER TABLE `printerSettings` ADD `directPrintEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `directPrintIp` varchar(50);--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `directPrintPort` int DEFAULT 9100 NOT NULL;