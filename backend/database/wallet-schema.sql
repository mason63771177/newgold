-- 钱包相关数据库表结构
-- 用于支持Tatum中心化钱包功能

-- 用户钱包地址映射表
CREATE TABLE IF NOT EXISTS user_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(100) NOT NULL,
    private_key_encrypted TEXT NOT NULL COMMENT '加密存储的私钥',
    derivation_index INT NOT NULL COMMENT '派生索引',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_wallet (user_id),
    UNIQUE KEY unique_wallet_address (wallet_address),
    UNIQUE KEY unique_derivation_index (derivation_index),
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户钱包地址映射表';

-- 用户充值记录表
CREATE TABLE IF NOT EXISTS user_deposits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    tx_hash VARCHAR(100) NOT NULL COMMENT '交易哈希',
    amount DECIMAL(20,6) NOT NULL COMMENT '充值金额',
    from_address VARCHAR(100) NOT NULL COMMENT '发送地址',
    to_address VARCHAR(100) NOT NULL COMMENT '接收地址（用户钱包地址）',
    block_number BIGINT DEFAULT NULL COMMENT '区块号',
    confirmations INT DEFAULT 0 COMMENT '确认数',
    status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_tx_hash (tx_hash),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户充值记录表';

-- 用户提现记录表
CREATE TABLE IF NOT EXISTS user_withdrawals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    to_address VARCHAR(100) NOT NULL COMMENT '提现目标地址',
    original_amount DECIMAL(20,6) NOT NULL COMMENT '原始提现金额',
    net_amount DECIMAL(20,6) NOT NULL COMMENT '实际到账金额',
    fixed_fee DECIMAL(20,6) DEFAULT 2.000000 COMMENT '固定手续费',
    percentage_fee DECIMAL(20,6) DEFAULT 0 COMMENT '百分比手续费',
    total_fee DECIMAL(20,6) NOT NULL COMMENT '总手续费',
    tx_hash VARCHAR(100) DEFAULT NULL COMMENT '交易哈希',
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    failure_reason TEXT DEFAULT NULL COMMENT '失败原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户提现记录表';

-- 余额变动日志表
CREATE TABLE IF NOT EXISTS balance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    amount DECIMAL(20,6) NOT NULL COMMENT '变动金额（正数为增加，负数为减少）',
    balance_before DECIMAL(20,6) DEFAULT NULL COMMENT '变动前余额',
    balance_after DECIMAL(20,6) DEFAULT NULL COMMENT '变动后余额',
    type ENUM('deposit', 'withdrawal', 'consolidation', 'adjustment', 'game_win', 'game_loss') NOT NULL COMMENT '变动类型',
    reference_id VARCHAR(100) DEFAULT NULL COMMENT '关联ID（如交易哈希、订单ID等）',
    description TEXT DEFAULT NULL COMMENT '变动描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_reference_id (reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='余额变动日志表';

-- 资金归集记录表
CREATE TABLE IF NOT EXISTS fund_consolidations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_address VARCHAR(100) NOT NULL COMMENT '源地址',
    to_address VARCHAR(100) NOT NULL COMMENT '目标地址（主钱包）',
    amount DECIMAL(20,6) NOT NULL COMMENT '归集金额',
    tx_hash VARCHAR(100) DEFAULT NULL COMMENT '交易哈希',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    failure_reason TEXT DEFAULT NULL COMMENT '失败原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_status (status),
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资金归集记录表';

-- 钱包监控配置表
CREATE TABLE IF NOT EXISTS wallet_monitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用监控',
    last_checked_block BIGINT DEFAULT 0 COMMENT '最后检查的区块号',
    webhook_url VARCHAR(500) DEFAULT NULL COMMENT 'Webhook回调地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_wallet_monitor (wallet_address),
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包监控配置表';

-- 系统配置表（钱包相关）
CREATE TABLE IF NOT EXISTS wallet_system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT DEFAULT NULL COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包系统配置表';

-- 插入默认配置
INSERT INTO wallet_system_config (config_key, config_value, description) VALUES
('withdrawal_fixed_fee', '2.000000', '提现固定手续费（USDT）'),
('withdrawal_percentage_fee_min', '0.01', '提现百分比手续费最小值（1%）'),
('withdrawal_percentage_fee_max', '0.05', '提现百分比手续费最大值（5%）'),
('min_withdrawal_amount', '10.000000', '最小提现金额（USDT）'),
('max_withdrawal_amount', '10000.000000', '最大提现金额（USDT）'),
('consolidation_threshold', '0.1', '资金归集阈值（USDT）'),
('confirmation_blocks', '1', '交易确认所需区块数'),
('master_wallet_address', '', '主钱包地址'),
('fee_wallet_address', '', '手续费收取钱包地址')
ON DUPLICATE KEY UPDATE 
    config_value = VALUES(config_value),
    updated_at = CURRENT_TIMESTAMP;

-- 为users表添加余额字段（如果不存在）
-- 注意：MySQL不支持ADD COLUMN IF NOT EXISTS，需要手动检查
-- ALTER TABLE users ADD COLUMN balance DECIMAL(20,6) DEFAULT 0.000000 COMMENT '用户USDT余额';
-- ALTER TABLE users ADD COLUMN frozen_balance DECIMAL(20,6) DEFAULT 0.000000 COMMENT '冻结余额';

-- 添加索引优化查询性能
-- ALTER TABLE users ADD INDEX idx_balance (balance);

-- 创建触发器：在余额变动时自动记录日志
DELIMITER //

CREATE TRIGGER IF NOT EXISTS tr_balance_change_log
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.balance != NEW.balance THEN
        INSERT INTO balance_logs (
            user_id, 
            amount, 
            balance_before, 
            balance_after, 
            type, 
            description
        ) VALUES (
            NEW.id,
            NEW.balance - OLD.balance,
            OLD.balance,
            NEW.balance,
            'adjustment',
            CONCAT('余额变动: ', OLD.balance, ' -> ', NEW.balance)
        );
    END IF;
END//

DELIMITER ;