-- 资金归集相关数据库表

-- 资金归集记录表
CREATE TABLE IF NOT EXISTS fund_consolidations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL COMMENT '任务ID',
  from_address VARCHAR(100) NOT NULL COMMENT '源地址',
  to_address VARCHAR(100) NOT NULL COMMENT '目标地址',
  amount DECIMAL(20,8) NOT NULL COMMENT '归集金额',
  transaction_hash VARCHAR(100) COMMENT '交易哈希',
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending' COMMENT '状态',
  error_message TEXT COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资金归集记录表';

-- 自动归集配置表
CREATE TABLE IF NOT EXISTS auto_consolidation_config (
  id INT PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用',
  interval_minutes INT DEFAULT 30 COMMENT '执行间隔(分钟)',
  min_balance DECIMAL(10,2) DEFAULT 10.00 COMMENT '最小余额阈值',
  max_concurrent INT DEFAULT 5 COMMENT '最大并发数',
  schedule_time TIME DEFAULT '02:00:00' COMMENT '定时执行时间',
  notification_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用通知',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自动归集配置表';

-- 资金归集历史记录表（兼容现有服务）
CREATE TABLE IF NOT EXISTS fund_consolidation_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_address VARCHAR(100) NOT NULL COMMENT '源地址',
  to_address VARCHAR(100) NOT NULL COMMENT '目标地址',
  amount DECIMAL(20,8) NOT NULL COMMENT '归集金额',
  tx_hash VARCHAR(100) COMMENT '交易哈希',
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending' COMMENT '状态',
  failure_reason TEXT COMMENT '失败原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资金归集历史记录表';

-- 插入默认配置
INSERT IGNORE INTO auto_consolidation_config (id, enabled, interval_minutes, min_balance, max_concurrent, schedule_time, notification_enabled)
VALUES (1, FALSE, 30, 10.00, 5, '02:00:00', TRUE);