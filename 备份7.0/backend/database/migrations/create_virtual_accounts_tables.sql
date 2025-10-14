-- Tatum虚拟账户系统数据库表结构
-- 用于存储会员虚拟账户、充值记录、归集记录等信息

-- 会员虚拟账户表
CREATE TABLE IF NOT EXISTS `member_virtual_accounts` (
    `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` varchar(50) NOT NULL COMMENT '会员ID',
    `account_id` varchar(100) NOT NULL COMMENT 'Tatum虚拟账户ID',
    `deposit_address` varchar(100) NOT NULL COMMENT 'TRC20 USDT充值地址',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    UNIQUE KEY `uk_account_id` (`account_id`),
    UNIQUE KEY `uk_deposit_address` (`deposit_address`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员虚拟账户表';

-- 会员充值记录表
CREATE TABLE IF NOT EXISTS `member_deposits` (
    `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` varchar(50) NOT NULL COMMENT '会员ID',
    `account_id` varchar(100) NOT NULL COMMENT 'Tatum虚拟账户ID',
    `amount` decimal(18,6) NOT NULL COMMENT '充值金额',
    `tx_hash` varchar(100) NOT NULL COMMENT '交易哈希',
    `block_number` bigint(20) DEFAULT NULL COMMENT '区块号',
    `from_address` varchar(100) DEFAULT NULL COMMENT '发送方地址',
    `status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending' COMMENT '状态',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tx_hash` (`tx_hash`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_account_id` (`account_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员充值记录表';

-- 资金归集记录表
CREATE TABLE IF NOT EXISTS `fund_consolidations` (
    `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `from_account_id` varchar(100) NOT NULL COMMENT '源虚拟账户ID',
    `to_account_id` varchar(100) NOT NULL COMMENT '目标虚拟账户ID（主账户）',
    `amount` decimal(18,6) NOT NULL COMMENT '归集金额',
    `transaction_id` varchar(100) NOT NULL COMMENT 'Tatum交易ID',
    `status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending' COMMENT '状态',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_transaction_id` (`transaction_id`),
    INDEX `idx_from_account_id` (`from_account_id`),
    INDEX `idx_to_account_id` (`to_account_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资金归集记录表';

-- Webhook订阅记录表
CREATE TABLE IF NOT EXISTS `webhook_subscriptions` (
    `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `account_id` varchar(100) NOT NULL COMMENT 'Tatum虚拟账户ID',
    `subscription_id` varchar(100) NOT NULL COMMENT 'Tatum订阅ID',
    `webhook_url` varchar(255) NOT NULL COMMENT 'Webhook回调URL',
    `subscription_type` varchar(50) NOT NULL DEFAULT 'ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION' COMMENT '订阅类型',
    `status` enum('active','inactive','failed') NOT NULL DEFAULT 'active' COMMENT '状态',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_account_subscription` (`account_id`, `subscription_type`),
    INDEX `idx_account_id` (`account_id`),
    INDEX `idx_subscription_id` (`subscription_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Webhook订阅记录表';

-- 余额变动日志表
CREATE TABLE IF NOT EXISTS `balance_logs` (
    `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` varchar(50) NOT NULL COMMENT '会员ID',
    `amount` decimal(18,6) NOT NULL COMMENT '变动金额',
    `type` enum('deposit','withdraw','consolidate','fee') NOT NULL COMMENT '变动类型',
    `description` varchar(255) DEFAULT NULL COMMENT '描述',
    `reference_id` varchar(100) DEFAULT NULL COMMENT '关联ID（如交易ID、充值ID等）',
    `balance_before` decimal(18,6) DEFAULT NULL COMMENT '变动前余额',
    `balance_after` decimal(18,6) DEFAULT NULL COMMENT '变动后余额',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_reference_id` (`reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='余额变动日志表';

-- Webhook回调日志表
CREATE TABLE IF NOT EXISTS `webhook_logs` (
    `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `subscription_type` varchar(50) NOT NULL COMMENT '订阅类型',
    `account_id` varchar(100) DEFAULT NULL COMMENT '虚拟账户ID',
    `tx_hash` varchar(100) DEFAULT NULL COMMENT '交易哈希',
    `amount` decimal(18,6) DEFAULT NULL COMMENT '金额',
    `currency` varchar(20) DEFAULT NULL COMMENT '币种',
    `webhook_data` text COMMENT 'Webhook原始数据',
    `processing_status` enum('success','failed','pending') NOT NULL DEFAULT 'pending' COMMENT '处理状态',
    `error_message` text DEFAULT NULL COMMENT '错误信息',
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `processed_at` timestamp NULL DEFAULT NULL COMMENT '处理时间',
    PRIMARY KEY (`id`),
    INDEX `idx_subscription_type` (`subscription_type`),
    INDEX `idx_account_id` (`account_id`),
    INDEX `idx_tx_hash` (`tx_hash`),
    INDEX `idx_processing_status` (`processing_status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Webhook回调日志表';

-- 插入初始化数据（如果需要）
-- INSERT INTO `member_virtual_accounts` (`user_id`, `account_id`, `deposit_address`) VALUES 
-- ('test_user_1', 'test_account_1', 'TTestAddress123456789') 
-- ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;