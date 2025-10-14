-- 创建充值记录表
CREATE TABLE `deposit_records` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '充值记录ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `deposit_address` varchar(50) NOT NULL COMMENT '充值地址',
  `transaction_hash` varchar(100) NOT NULL COMMENT '交易哈希',
  `from_address` varchar(50) NOT NULL COMMENT '发送方地址',
  `amount` decimal(15,8) NOT NULL COMMENT '充值金额',
  `currency` varchar(10) NOT NULL DEFAULT 'USDT' COMMENT '币种',
  `block_number` bigint(20) DEFAULT NULL COMMENT '区块高度',
  `confirmations` int(11) DEFAULT 0 COMMENT '确认数',
  `status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `tatum_notification_id` varchar(100) DEFAULT NULL COMMENT 'Tatum通知ID',
  `confirmed_at` timestamp NULL DEFAULT NULL COMMENT '确认时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_transaction_hash` (`transaction_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_deposit_address` (`deposit_address`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_deposit_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值记录表';

-- 创建提现记录表
CREATE TABLE `withdrawal_records` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '提现记录ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `withdrawal_address` varchar(50) NOT NULL COMMENT '提现地址',
  `amount` decimal(15,8) NOT NULL COMMENT '提现金额',
  `fee` decimal(15,8) NOT NULL DEFAULT 0.00000000 COMMENT '手续费',
  `actual_amount` decimal(15,8) NOT NULL COMMENT '实际到账金额',
  `currency` varchar(10) NOT NULL DEFAULT 'USDT' COMMENT '币种',
  `transaction_hash` varchar(100) DEFAULT NULL COMMENT '交易哈希',
  `status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `failure_reason` varchar(255) DEFAULT NULL COMMENT '失败原因',
  `processed_at` timestamp NULL DEFAULT NULL COMMENT '处理时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_transaction_hash` (`transaction_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_withdrawal_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';

-- 创建Tatum配置表
CREATE TABLE `tatum_configs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `config_value` text NOT NULL COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `is_encrypted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否加密存储',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tatum配置表';

-- 插入初始配置数据
INSERT INTO `tatum_configs` (`config_key`, `config_value`, `description`, `is_encrypted`) VALUES
('master_wallet_xpub', '', '主钱包扩展公钥', 0),
('master_wallet_mnemonic', '', '主钱包助记词', 1),
('next_derivation_index', '1', '下一个可用的地址派生索引', 0),
('webhook_secret', '', 'Webhook验证密钥', 1),
('min_deposit_amount', '1.00000000', '最小充值金额', 0),
('min_withdrawal_amount', '10.00000000', '最小提现金额', 0),
('withdrawal_fee_rate', '0.05', '提现手续费率', 0);

-- 为钱包交易表添加Tatum相关字段
ALTER TABLE `wallet_transactions` 
ADD COLUMN `deposit_record_id` bigint(20) unsigned DEFAULT NULL COMMENT '关联充值记录ID' AFTER `transaction_hash`,
ADD COLUMN `withdrawal_record_id` bigint(20) unsigned DEFAULT NULL COMMENT '关联提现记录ID' AFTER `deposit_record_id`;

-- 添加外键约束
ALTER TABLE `wallet_transactions` 
ADD CONSTRAINT `fk_wallet_transactions_deposit_record_id` FOREIGN KEY (`deposit_record_id`) REFERENCES `deposit_records` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_wallet_transactions_withdrawal_record_id` FOREIGN KEY (`withdrawal_record_id`) REFERENCES `withdrawal_records` (`id`) ON DELETE SET NULL;