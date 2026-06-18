-- WhatsApp Official API support
-- Adds Meta Cloud API fields to whatsappConfig while keeping all UAZAPI fields intact.
-- Default provider stays 'uazapi' so existing connections are not affected.

ALTER TABLE `whatsappConfig`
  ADD COLUMN `provider` ENUM('uazapi','official') NOT NULL DEFAULT 'uazapi' AFTER `webhookSecret`,
  ADD COLUMN `wabaId` VARCHAR(100) AFTER `provider`,
  ADD COLUMN `phoneNumberId` VARCHAR(100) AFTER `wabaId`,
  ADD COLUMN `accessToken` TEXT AFTER `phoneNumberId`,
  ADD COLUMN `businessId` VARCHAR(100) AFTER `accessToken`,
  ADD COLUMN `metaWebhookSecret` VARCHAR(128) AFTER `businessId`;
