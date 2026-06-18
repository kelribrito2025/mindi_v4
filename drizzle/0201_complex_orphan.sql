CREATE TABLE `fixed_suggestion_category_scopes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fixedSuggestionId` int NOT NULL,
	`categoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fixed_suggestion_category_scopes_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_fixedSuggestionCategoryScopes_unique` UNIQUE(`fixedSuggestionId`,`categoryId`)
);
--> statement-breakpoint
ALTER TABLE `fixed_suggestion_category_scopes` ADD CONSTRAINT `fk_fixed_scopes_fixed_suggestion` FOREIGN KEY (`fixedSuggestionId`) REFERENCES `fixed_suggestions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fixed_suggestion_category_scopes` ADD CONSTRAINT `fk_fixed_scopes_category` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_fixedSuggestionCategoryScopes_fixedSuggestionId` ON `fixed_suggestion_category_scopes` (`fixedSuggestionId`);--> statement-breakpoint
CREATE INDEX `idx_fixedSuggestionCategoryScopes_categoryId` ON `fixed_suggestion_category_scopes` (`categoryId`);