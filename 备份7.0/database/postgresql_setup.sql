-- PostgreSQL数据库初始化脚本
-- 适配H5游戏项目的数据库结构

-- 创建数据库（需要在postgres数据库中执行）
-- CREATE DATABASE h5_game_db 
-- WITH 
--     ENCODING = 'UTF8'
--     LC_COLLATE = 'en_US.UTF-8'
--     LC_CTYPE = 'en_US.UTF-8'
--     TEMPLATE = template0;

-- 连接到h5_game_db数据库后执行以下脚本

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 用户表 (users)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(100),
    username VARCHAR(100),
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    inviter_id BIGINT REFERENCES users(id),
    inviter_telegram_id VARCHAR(100),
    inviter_username VARCHAR(100),
    status SMALLINT NOT NULL DEFAULT 1 CHECK (status IN (1, 2, 3)),
    wallet_balance DECIMAL(15,8) NOT NULL DEFAULT 0.00000000,
    fee_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    repurchase_count INTEGER NOT NULL DEFAULT 0,
    enter_status_time TIMESTAMP WITH TIME ZONE,
    countdown_end_time TIMESTAMP WITH TIME ZONE,
    invite_link_expire_time TIMESTAMP WITH TIME ZONE,
    master_level SMALLINT NOT NULL DEFAULT 0,
    max_master_level SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 用户表注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户ID';
COMMENT ON COLUMN users.email IS '邮箱';
COMMENT ON COLUMN users.password_hash IS '密码哈希';
COMMENT ON COLUMN users.telegram_id IS 'Telegram ID';
COMMENT ON COLUMN users.username IS 'Telegram用户名';
COMMENT ON COLUMN users.invite_code IS '邀请码';
COMMENT ON COLUMN users.inviter_id IS '邀请人ID';
COMMENT ON COLUMN users.status IS '状态：1-新手 2-已入金 3-倒计时结束';
COMMENT ON COLUMN users.wallet_balance IS '钱包余额';
COMMENT ON COLUMN users.fee_rate IS '提现手续费率(%)';

-- 2. 任务表 (tasks)
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('newbie', 'quiz', 'master')),
    task_id VARCHAR(50) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    target_count INTEGER,
    current_count INTEGER DEFAULT 0,
    reward_amount DECIMAL(15,8),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_type, task_id)
);

COMMENT ON TABLE tasks IS '任务表';
COMMENT ON COLUMN tasks.task_type IS '任务类型：newbie-新手任务，quiz-答题任务，master-大神任务';

-- 3. 答题记录表 (quiz_records)
CREATE TABLE quiz_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    user_answer VARCHAR(10),
    is_correct BOOLEAN,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id)
);

COMMENT ON TABLE quiz_records IS '答题记录表';

-- 4. 红包活动表 (redpacket_events)
CREATE TABLE redpacket_events (
    id BIGSERIAL PRIMARY KEY,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    total_amount DECIMAL(15,8) NOT NULL,
    participant_count INTEGER NOT NULL DEFAULT 0,
    distributed_amount DECIMAL(15,8) NOT NULL DEFAULT 0.00000000,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_date, event_time)
);

COMMENT ON TABLE redpacket_events IS '红包活动表';

-- 5. 红包记录表 (redpacket_records)
CREATE TABLE redpacket_records (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES redpacket_events(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,8) NOT NULL,
    grab_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

COMMENT ON TABLE redpacket_records IS '红包记录表';

-- 6. 钱包交易表 (wallet_transactions)
CREATE TABLE wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('activate', 'withdraw', 'redpacket', 'task', 'commission')),
    amount DECIMAL(15,8) NOT NULL,
    fee DECIMAL(15,8) DEFAULT 0.00000000,
    balance_before DECIMAL(15,8) NOT NULL,
    balance_after DECIMAL(15,8) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description VARCHAR(255),
    blockchain_tx_hash VARCHAR(255),
    wallet_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE wallet_transactions IS '钱包交易表';

-- 7. 团队关系表 (team_relations)
CREATE TABLE team_relations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ancestor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 7),
    path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ancestor_id, level)
);

COMMENT ON TABLE team_relations IS '团队关系表';
COMMENT ON COLUMN team_relations.level IS '层级(1-7)';

-- 8. 激活订单表 (activation_orders)
CREATE TABLE activation_orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(15,8) NOT NULL DEFAULT 100.00000000,
    currency VARCHAR(10) NOT NULL DEFAULT 'USDT',
    wallet_address VARCHAR(255) NOT NULL,
    blockchain_tx_hash VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'expired')),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE activation_orders IS '激活订单表';

-- 9. 系统配置表 (system_configs)
CREATE TABLE system_configs (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_configs IS '系统配置表';

-- 10. 通知记录表 (notifications)
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notifications IS '通知记录表';

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新updated_at的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redpacket_events_updated_at BEFORE UPDATE ON redpacket_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activation_orders_updated_at BEFORE UPDATE ON activation_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();