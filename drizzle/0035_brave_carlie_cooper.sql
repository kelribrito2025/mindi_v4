ALTER TABLE `printerSettings` ADD `fontSize` int DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `fontWeight` int DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `titleFontSize` int DEFAULT 16 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `titleFontWeight` int DEFAULT 700 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `itemFontSize` int DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `itemFontWeight` int DEFAULT 700 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `obsFontSize` int DEFAULT 11 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `obsFontWeight` int DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `showDividers` boolean DEFAULT true NOT NULL;