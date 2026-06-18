CREATE TABLE IF NOT EXISTS `menu_sessions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sessionId` varchar(64) NOT NULL,
  `establishmentId` int NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `menu_sessions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `menu_views_daily` (
  `id` int AUTO_INCREMENT NOT NULL,
  `establishmentId` int NOT NULL,
  `date` varchar(10) NOT NULL,
  `viewCount` int NOT NULL DEFAULT 0,
  `uniqueVisitors` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `menu_views_daily_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_establishment_updated` ON `menu_sessions` (`establishmentId`, `updatedAt`);
CREATE UNIQUE INDEX `idx_session_establishment` ON `menu_sessions` (`sessionId`, `establishmentId`);
CREATE INDEX `idx_establishment_date` ON `menu_views_daily` (`establishmentId`, `date`);
