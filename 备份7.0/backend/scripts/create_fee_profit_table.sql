-- 创建手续费利润记录表
-- 用于记录每笔提币的手续费分配和利润转账情况

CREATE TABLE IF NOT EXISTS fee_profit_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    withdrawal_id VARCHAR(100) NOT NULL COMMENT '关联的提币记录ID',
    original_amount DECIMAL(20, 6) NOT NULL COMMENT '原始提币金额',
    customer_fee DECIMAL(20, 6) NOT NULL COMMENT '向客户收取的总手续费',
    tatum_fee DECIMAL(20, 6) NOT NULL COMMENT 'Tatum实际收取的手续费',
    profit_amount DECIMAL(20, 6) NOT NULL COMMENT '手续费利润金额',
    profit_margin DECIMAL(5, 2) NOT NULL COMMENT '利润率百分比',
    profit_tx_hash VARCHAR(100) NULL COMMENT '利润转账交易哈希',
    original_tx_hash VARCHAR(100) NULL COMMENT '原始提币交易哈希',
    from_address VARCHAR(100) NULL COMMENT '利润转账来源地址（主钱包）',
    to_address VARCHAR(100) NULL COMMENT '利润转账目标地址（利润钱包）',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending' COMMENT '转账状态',
    error_message TEXT NULL COMMENT '错误信息（失败时）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX idx_withdrawal_id (withdrawal_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_profit_tx_hash (profit_tx_hash),
    INDEX idx_original_tx_hash (original_tx_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='手续费利润记录表';

-- 创建手续费利润统计视图
CREATE OR REPLACE VIEW fee_profit_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_transactions,
    SUM(original_amount) as total_withdrawal_amount,
    SUM(customer_fee) as total_customer_fees,
    SUM(tatum_fee) as total_tatum_fees,
    SUM(profit_amount) as total_profit,
    AVG(profit_margin) as avg_profit_margin,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transfers,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transfers,
    (COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*)) * 100 as success_rate
FROM fee_profit_records 
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 插入示例数据（可选，用于测试）
-- INSERT INTO fee_profit_records (
--     withdrawal_id, original_amount, customer_fee, tatum_fee, 
--     profit_amount, profit_margin, status
-- ) VALUES 
-- ('withdraw_001', 100.00, 3.00, 1.00, 2.00, 66.67, 'completed'),
-- ('withdraw_002', 500.00, 17.00, 1.00, 16.00, 94.12, 'completed'),
-- ('withdraw_003', 1000.00, 52.00, 1.00, 51.00, 98.08, 'completed');

-- 查询今日手续费利润统计
-- SELECT * FROM fee_profit_stats WHERE date = CURDATE();

-- 查询本月手续费利润汇总
-- SELECT 
--     YEAR(date) as year,
--     MONTH(date) as month,
--     SUM(total_profit) as monthly_profit,
--     AVG(avg_profit_margin) as avg_monthly_margin,
--     SUM(total_transactions) as monthly_transactions
-- FROM fee_profit_stats 
-- WHERE date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
-- GROUP BY YEAR(date), MONTH(date);