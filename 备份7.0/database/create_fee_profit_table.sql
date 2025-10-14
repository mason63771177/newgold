-- 创建手续费利润记录表
CREATE TABLE IF NOT EXISTS fee_profit_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    withdrawal_id VARCHAR(50) NOT NULL COMMENT '提币记录ID',
    original_amount DECIMAL(20, 8) NOT NULL COMMENT '原始提币金额',
    customer_fee DECIMAL(20, 8) NOT NULL COMMENT '客户支付的手续费',
    tatum_fee DECIMAL(20, 8) NOT NULL COMMENT 'Tatum实际手续费',
    profit_amount DECIMAL(20, 8) NOT NULL COMMENT '利润金额',
    profit_margin DECIMAL(5, 2) NOT NULL COMMENT '利润率百分比',
    profit_tx_hash VARCHAR(100) DEFAULT NULL COMMENT '利润转账交易哈希',
    profit_wallet_address VARCHAR(50) DEFAULT 'TProfit1234567890123456789012345' COMMENT '利润钱包地址',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending' COMMENT '状态',
    error_message TEXT DEFAULT NULL COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_withdrawal_id (withdrawal_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='手续费利润记录表';

-- 创建手续费利润统计视图
CREATE OR REPLACE VIEW fee_profit_stats AS
SELECT 
    DATE(created_at) as profit_date,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_records,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN profit_amount ELSE 0 END), 0) as total_profit,
    COALESCE(AVG(CASE WHEN status = 'completed' THEN profit_amount END), 0) as avg_profit,
    COALESCE(MAX(CASE WHEN status = 'completed' THEN profit_amount END), 0) as max_profit,
    COALESCE(MIN(CASE WHEN status = 'completed' THEN profit_amount END), 0) as min_profit
FROM fee_profit_records 
GROUP BY DATE(created_at)
ORDER BY profit_date DESC;