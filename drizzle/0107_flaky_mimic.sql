ALTER TABLE `printerSettings` ADD `mindiFontSize` int DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiFontWeight` int DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiTitleFontSize` int DEFAULT 16 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiTitleFontWeight` int DEFAULT 700 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiItemFontSize` int DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiItemFontWeight` int DEFAULT 700 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiObsFontSize` int DEFAULT 11 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiObsFontWeight` int DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiShowDividers` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiBoxPadding` int DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiItemBorderStyle` varchar(20) DEFAULT 'rounded' NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiPaperWidth` varchar(10) DEFAULT '80mm' NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiShowLogo` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiHeaderMessage` text;--> statement-breakpoint
ALTER TABLE `printerSettings` ADD `mindiFooterMessage` text;