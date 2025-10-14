-- 创建资金归集记录表
CREATE TABLE IF NOT EXISTS fund_consolidation_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(50) DEFAULT NULL COMMENT '批次ID',
    from_address VARCHAR(100) NOT NULL COMMENT '源地址（用户充值地址）',
    to_address VARCHAR(100) NOT NULL COMMENT '目标地址（主钱包地址）',
    user_id INT DEFAULT NULL COMMENT '用户ID',
    amount DECIMAL(20,6) NOT NULL COMMENT '归集金额',
    fee DECIMAL(20,6) DEFAULT 0 COMMENT '手续费',
    tx_hash VARCHAR(100) DEFAULT NULL COMMENT '交易哈希',
    status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending' COMMENT '状态：pending-待确认，confirmed-已确认，failed-失败',
    failure_reason TEXT DEFAULT NULL COMMENT '失败原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资金归集记录表';

-- 创建索引
CREATE INDEX idx_fund_consolidation_batch_id ON fund_consolidation_records(batch_id);
CREATE INDEX idx_fund_consolidation_from_address ON fund_consolidation_records(from_address);
CREATE INDEX idx_fund_consolidation_user_id ON fund_consolidation_records(user_id);
CREATE INDEX idx_fund_consolidation_status ON fund_consolidation_records(status);
CREATE INDEX idx_fund_consolidation_created_at ON fund_consolidation_records(created_at);