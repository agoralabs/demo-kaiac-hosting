-- Nettoyage pour users.email
SELECT GROUP_CONCAT(INDEX_NAME) INTO @to_drop 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email'
GROUP BY COLUMN_NAME HAVING COUNT(*) > 1;

SET @sql = IF(@to_drop IS NOT NULL, 
    CONCAT('ALTER TABLE users DROP INDEX ', 
    SUBSTRING_INDEX(@to_drop, ',', 1)), 'SELECT "Aucun doublon"');
PREPARE stmt FROM @sql; EXECUTE stmt;

-- Nettoyage pour subscriptions.reference
SELECT GROUP_CONCAT(INDEX_NAME) INTO @to_drop 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_NAME = 'subscriptions' AND COLUMN_NAME = 'reference'
GROUP BY COLUMN_NAME HAVING COUNT(*) > 1;

SET @sql = IF(@to_drop IS NOT NULL, 
    CONCAT('ALTER TABLE subscriptions DROP INDEX ', 
    SUBSTRING_INDEX(@to_drop, ',', 1)), 'SELECT "Aucun doublon"');
PREPARE stmt FROM @sql; EXECUTE stmt;

-- Nettoyage pour invoices.invoice_number
SELECT GROUP_CONCAT(INDEX_NAME) INTO @to_drop 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_NAME = 'invoices' AND COLUMN_NAME = 'invoice_number'
GROUP BY COLUMN_NAME HAVING COUNT(*) > 1;

SET @sql = IF(@to_drop IS NOT NULL, 
    CONCAT('ALTER TABLE invoices DROP INDEX ', 
    SUBSTRING_INDEX(@to_drop, ',', 1)), 'SELECT "Aucun doublon"');
PREPARE stmt FROM @sql; EXECUTE stmt;

-- Nettoyage pour domains.domain_name
SELECT GROUP_CONCAT(INDEX_NAME) INTO @to_drop 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_NAME = 'domains' AND COLUMN_NAME = 'domain_name'
GROUP BY COLUMN_NAME HAVING COUNT(*) > 1;

SET @sql = IF(@to_drop IS NOT NULL, 
    CONCAT('ALTER TABLE domains DROP INDEX ', 
    SUBSTRING_INDEX(@to_drop, ',', 1)), 'SELECT "Aucun doublon"');
PREPARE stmt FROM @sql; EXECUTE stmt;


-- DROP INDEX `email_60` ON `wordpress_hosting`.`users`;
-- DROP INDEX `reference_55` ON `wordpress_hosting`.`subscriptions`;
-- DROP INDEX `invoice_number_54` ON `wordpress_hosting`.`invoices`;
-- DROP INDEX `domain_name_51` ON `wordpress_hosting`.`domains`;

-- users
-- subscriptions
-- invoices
-- domains