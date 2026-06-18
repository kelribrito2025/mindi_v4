ALTER TABLE `botApiKeys` ADD `apiKeyHash` varchar(64);--> statement-breakpoint
CREATE INDEX `idx_botApiKeys_hash` ON `botApiKeys` (`apiKeyHash`);