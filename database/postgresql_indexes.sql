-- PostgreSQL索引优化脚本
-- 为H5游戏项目创建性能优化索引

-- 用户表索引
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_inviter_id ON users(inviter_id);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_status_countdown ON users(status, countdown_end_time);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 任务表索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_user_type_status ON tasks(user_id, task_type, status);

-- 答题记录表索引
CREATE INDEX idx_quiz_records_user_id ON quiz_records(user_id);
CREATE INDEX idx_quiz_records_question_id ON quiz_records(question_id);

-- 红包活动表索引
CREATE INDEX idx_redpacket_events_status ON redpacket_events(status);
CREATE INDEX idx_redpacket_events_date_time ON redpacket_events(event_date, event_time);

-- 红包记录表索引
CREATE INDEX idx_redpacket_records_user_id ON redpacket_records(user_id);
CREATE INDEX idx_redpacket_records_event_id ON redpacket_records(event_id);
CREATE INDEX idx_redpacket_records_grab_time ON redpacket_records(grab_time);
CREATE INDEX idx_redpacket_records_user_amount ON redpacket_records(user_id, amount);

-- 钱包交易表索引
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_wallet_transactions_user_type_time ON wallet_transactions(user_id, type, created_at);
CREATE INDEX idx_wallet_transactions_blockchain_tx ON wallet_transactions(blockchain_tx_hash);

-- 团队关系表索引
CREATE INDEX idx_team_relations_user_id ON team_relations(user_id);
CREATE INDEX idx_team_relations_ancestor_id ON team_relations(ancestor_id);
CREATE INDEX idx_team_relations_level ON team_relations(level);
CREATE INDEX idx_team_relations_ancestor_level ON team_relations(ancestor_id, level);

-- 激活订单表索引
CREATE INDEX idx_activation_orders_user_id ON activation_orders(user_id);
CREATE INDEX idx_activation_orders_status ON activation_orders(status);
CREATE INDEX idx_activation_orders_wallet_address ON activation_orders(wallet_address);
CREATE INDEX idx_activation_orders_created_at ON activation_orders(created_at);

-- 系统配置表索引（已有唯一索引config_key）

-- 通知记录表索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 复合索引用于复杂查询
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed_at) WHERE status = 'completed';
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at) WHERE is_read = FALSE;

-- 部分索引（条件索引）用于特定查询优化
CREATE INDEX idx_users_active_countdown ON users(countdown_end_time) 
    WHERE status = 2 AND countdown_end_time IS NOT NULL;

CREATE INDEX idx_redpacket_active_events ON redpacket_events(start_time, end_time) 
    WHERE status = 'active';

-- 函数索引用于特殊查询需求
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_username_lower ON users(LOWER(username));

-- 统计信息更新
ANALYZE users;
ANALYZE tasks;
ANALYZE quiz_records;
ANALYZE redpacket_events;
ANALYZE redpacket_records;
ANALYZE wallet_transactions;
ANALYZE team_relations;
ANALYZE activation_orders;
ANALYZE system_configs;
ANALYZE notifications;