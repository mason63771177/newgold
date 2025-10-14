-- 排行榜功能数据库优化索引
-- 用于提升排行榜查询性能

-- 检查并添加用户表索引
SET @sql = 'ALTER TABLE users ADD INDEX idx_team_count_earnings (team_count DESC, total_earnings DESC)';
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_team_count_earnings');
SET @sql = IF(@index_exists = 0, @sql, 'SELECT "Index idx_team_count_earnings already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'ALTER TABLE users ADD INDEX idx_total_earnings (total_earnings DESC)';
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_total_earnings');
SET @sql = IF(@index_exists = 0, @sql, 'SELECT "Index idx_total_earnings already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加团队关系表索引
SET @sql = 'ALTER TABLE team_relations ADD INDEX idx_inviter_id (inviter_id)';
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_relations' AND INDEX_NAME = 'idx_inviter_id');
SET @sql = IF(@index_exists = 0, @sql, 'SELECT "Index idx_inviter_id already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'ALTER TABLE team_relations ADD INDEX idx_user_level (user_id, level)';
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_relations' AND INDEX_NAME = 'idx_user_level');
SET @sql = IF(@index_exists = 0, @sql, 'SELECT "Index idx_user_level already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 红包记录表索引
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'redpacket_records' AND index_name = 'idx_user_amount') = 0,
    'ALTER TABLE redpacket_records ADD INDEX idx_user_amount (user_id, amount)',
    'SELECT "Index idx_user_amount already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'redpacket_records' AND index_name = 'idx_grabbed_at') = 0,
    'ALTER TABLE redpacket_records ADD INDEX idx_grabbed_at (grabbed_at)',
    'SELECT "Index idx_grabbed_at already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 红包事件表索引
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'redpacket_events' AND index_name = 'idx_event_date_time') = 0,
    'ALTER TABLE redpacket_events ADD INDEX idx_event_date_time (event_date, event_time)',
    'SELECT "Index idx_event_date_time already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'redpacket_events' AND index_name = 'idx_status') = 0,
    'ALTER TABLE redpacket_events ADD INDEX idx_status (status)',
    'SELECT "Index idx_status already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 任务表索引
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'tasks' AND index_name = 'idx_user_task_type_status') = 0,
    'ALTER TABLE tasks ADD INDEX idx_user_task_type_status (user_id, task_type, status)',
    'SELECT "Index idx_user_task_type_status already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() AND table_name = 'tasks' AND index_name = 'idx_completed_at') = 0,
    'ALTER TABLE tasks ADD INDEX idx_completed_at (completed_at)',
    'SELECT "Index idx_completed_at already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加钱包交易表索引
SET @sql = 'ALTER TABLE wallet_transactions ADD INDEX idx_user_amount (user_id, amount DESC)';
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wallet_transactions' AND INDEX_NAME = 'idx_user_amount');
SET @sql = IF(@index_exists = 0, @sql, 'SELECT "Index idx_user_amount already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = 'ALTER TABLE wallet_transactions ADD INDEX idx_type_status (type, status)';
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wallet_transactions' AND INDEX_NAME = 'idx_type_status');
SET @sql = IF(@index_exists = 0, @sql, 'SELECT "Index idx_type_status already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 系统日志表索引优化（已在创建表时添加）
-- 这些索引已在 init-database.js 中定义

-- 查看索引使用情况的查询
-- SELECT 
--   TABLE_NAME,
--   INDEX_NAME,
--   COLUMN_NAME,
--   CARDINALITY
-- FROM INFORMATION_SCHEMA.STATISTICS 
-- WHERE TABLE_SCHEMA = 'gold7_game' 
-- ORDER BY TABLE_NAME, INDEX_NAME;
