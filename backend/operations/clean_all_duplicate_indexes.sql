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

DROP INDEX `domain_name_1` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_2` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_3` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_4` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_5` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_6` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_7` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_8` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_9` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_10` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_11` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_12` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_13` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_14` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_15` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_16` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_17` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_18` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_19` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_20` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_21` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_22` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_23` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_24` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_25` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_26` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_27` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_28` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_29` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_30` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_31` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_32` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_33` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_34` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_35` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_36` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_37` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_38` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_39` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_40` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_41` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_42` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_43` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_44` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_45` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_46` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_47` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_48` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_49` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_50` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_51` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_52` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_53` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_54` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_55` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_56` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_57` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_58` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_59` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_60` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_61` ON `wordpress_hosting`.`domains`;
DROP INDEX `domain_name_62` ON `wordpress_hosting`.`domains`;

DROP INDEX `invoice_number_1` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_2` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_3` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_4` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_5` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_6` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_7` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_8` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_9` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_10` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_11` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_12` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_13` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_14` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_15` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_16` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_17` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_18` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_19` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_20` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_21` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_22` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_23` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_24` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_25` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_26` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_27` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_28` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_29` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_30` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_31` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_32` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_33` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_34` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_35` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_36` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_37` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_38` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_39` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_40` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_41` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_42` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_43` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_44` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_45` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_46` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_47` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_48` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_49` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_50` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_51` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_52` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_53` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_54` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_55` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_56` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_57` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_58` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_59` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_60` ON `wordpress_hosting`.`invoices`;
DROP INDEX `invoice_number_61` ON `wordpress_hosting`.`invoices`;


DROP INDEX `reference_2` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_3` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_4` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_5` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_6` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_7` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_8` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_9` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_10` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_11` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_12` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_13` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_14` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_15` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_16` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_17` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_18` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_19` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_20` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_21` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_22` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_23` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_24` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_25` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_26` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_27` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_28` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_29` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_30` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_31` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_32` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_33` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_34` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_35` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_36` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_37` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_38` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_39` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_40` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_41` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_42` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_43` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_44` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_45` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_46` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_47` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_48` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_49` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_50` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_51` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_52` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_53` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_54` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_55` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_56` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_57` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_58` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_59` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_60` ON `wordpress_hosting`.`subscriptions`;
DROP INDEX `reference_61` ON `wordpress_hosting`.`subscriptions`;


DROP INDEX `email_2` ON `wordpress_hosting`.`users`;
DROP INDEX `email_3` ON `wordpress_hosting`.`users`;
DROP INDEX `email_4` ON `wordpress_hosting`.`users`;
DROP INDEX `email_5` ON `wordpress_hosting`.`users`;
DROP INDEX `email_6` ON `wordpress_hosting`.`users`;
DROP INDEX `email_7` ON `wordpress_hosting`.`users`;
DROP INDEX `email_8` ON `wordpress_hosting`.`users`;
DROP INDEX `email_9` ON `wordpress_hosting`.`users`;
DROP INDEX `email_10` ON `wordpress_hosting`.`users`;
DROP INDEX `email_11` ON `wordpress_hosting`.`users`;
DROP INDEX `email_12` ON `wordpress_hosting`.`users`;
DROP INDEX `email_13` ON `wordpress_hosting`.`users`;
DROP INDEX `email_14` ON `wordpress_hosting`.`users`;
DROP INDEX `email_15` ON `wordpress_hosting`.`users`;
DROP INDEX `email_16` ON `wordpress_hosting`.`users`;
DROP INDEX `email_17` ON `wordpress_hosting`.`users`;
DROP INDEX `email_18` ON `wordpress_hosting`.`users`;
DROP INDEX `email_19` ON `wordpress_hosting`.`users`;
DROP INDEX `email_20` ON `wordpress_hosting`.`users`;
DROP INDEX `email_21` ON `wordpress_hosting`.`users`;
DROP INDEX `email_22` ON `wordpress_hosting`.`users`;
DROP INDEX `email_23` ON `wordpress_hosting`.`users`;
DROP INDEX `email_24` ON `wordpress_hosting`.`users`;
DROP INDEX `email_25` ON `wordpress_hosting`.`users`;
DROP INDEX `email_26` ON `wordpress_hosting`.`users`;
DROP INDEX `email_27` ON `wordpress_hosting`.`users`;
DROP INDEX `email_28` ON `wordpress_hosting`.`users`;
DROP INDEX `email_29` ON `wordpress_hosting`.`users`;
DROP INDEX `email_30` ON `wordpress_hosting`.`users`;
DROP INDEX `email_31` ON `wordpress_hosting`.`users`;
DROP INDEX `email_32` ON `wordpress_hosting`.`users`;
DROP INDEX `email_33` ON `wordpress_hosting`.`users`;
DROP INDEX `email_34` ON `wordpress_hosting`.`users`;
DROP INDEX `email_35` ON `wordpress_hosting`.`users`;
DROP INDEX `email_36` ON `wordpress_hosting`.`users`;
DROP INDEX `email_37` ON `wordpress_hosting`.`users`;
DROP INDEX `email_38` ON `wordpress_hosting`.`users`;
DROP INDEX `email_39` ON `wordpress_hosting`.`users`;
DROP INDEX `email_40` ON `wordpress_hosting`.`users`;
DROP INDEX `email_41` ON `wordpress_hosting`.`users`;
DROP INDEX `email_42` ON `wordpress_hosting`.`users`;
DROP INDEX `email_43` ON `wordpress_hosting`.`users`;
DROP INDEX `email_44` ON `wordpress_hosting`.`users`;
DROP INDEX `email_45` ON `wordpress_hosting`.`users`;
DROP INDEX `email_46` ON `wordpress_hosting`.`users`;
DROP INDEX `email_47` ON `wordpress_hosting`.`users`;
DROP INDEX `email_48` ON `wordpress_hosting`.`users`;
DROP INDEX `email_49` ON `wordpress_hosting`.`users`;
DROP INDEX `email_50` ON `wordpress_hosting`.`users`;
DROP INDEX `email_51` ON `wordpress_hosting`.`users`;
DROP INDEX `email_52` ON `wordpress_hosting`.`users`;
DROP INDEX `email_53` ON `wordpress_hosting`.`users`;
DROP INDEX `email_54` ON `wordpress_hosting`.`users`;
DROP INDEX `email_55` ON `wordpress_hosting`.`users`;
DROP INDEX `email_56` ON `wordpress_hosting`.`users`;
DROP INDEX `email_57` ON `wordpress_hosting`.`users`;
DROP INDEX `email_58` ON `wordpress_hosting`.`users`;
DROP INDEX `email_59` ON `wordpress_hosting`.`users`;
DROP INDEX `email_60` ON `wordpress_hosting`.`users`;
DROP INDEX `email_61` ON `wordpress_hosting`.`users`;