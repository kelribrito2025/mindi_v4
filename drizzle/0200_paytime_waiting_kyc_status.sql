ALTER TABLE `establishments` MODIFY COLUMN `paytimeKycStatus` enum('not_started','waiting_kyc','pending','approved','rejected') NOT NULL DEFAULT 'not_started';
