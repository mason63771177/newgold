-- PostgreSQL初始化数据脚本
-- 为H5游戏项目插入基础配置和测试数据

-- 系统配置初始化
INSERT INTO system_configs (config_key, config_value, description) VALUES
('activation_amount', '100.00000000', '激活金额(USDT)'),
('countdown_hours', '168', '倒计时小时数'),
('commission_per_level', '10.00000000', '每层佣金(USDT)'),
('withdraw_fixed_fee', '2.00000000', '提现固定手续费(USDT)'),
('withdraw_min_amount', '20.00000000', '最小提现金额(USDT)'),
('withdraw_max_amount', '2000.00000000', '最大提现金额(USDT)'),
('daily_withdraw_limit', '50000.00000000', '每日提现限额(USDT)'),
('redpacket_times', '["09:00:00","12:00:00","20:00:00"]', '红包时间'),
('redpacket_duration', '77', '红包持续时间(秒)'),
('base_fee_rate', '5.00', '基础手续费率(%)'),
('min_fee_rate', '1.00', '最低手续费率(%)'),
('fee_reduction_per_question', '0.20', '每题减少手续费率(%)'),
('max_team_levels', '7', '最大团队层级'),
('invite_link_expire_hours', '72', '邀请链接过期小时数'),
('redpacket_pool_amount', '1000.00000000', '每场红包池金额(USDT)'),
('master_task_unlock_threshold', '20', '大神任务解锁阈值(完成题目数)'),
('daily_redpacket_limit', '3', '每日红包场次'),
('team_commission_rates', '[10, 8, 6, 4, 2, 1, 0.5]', '团队各层级佣金率(USDT)');

-- 题库初始化（示例题目）
INSERT INTO quiz_records (user_id, question_id, question, options, correct_answer) VALUES
(0, 'Q001', '如何正确发展下线？', '["A. 诚实介绍项目", "B. 夸大收益", "C. 隐瞒风险", "D. 强制推荐"]', 'A'),
(0, 'Q002', '团队裂变的核心是什么？', '["A. 数量", "B. 质量", "C. 培训", "D. 激励"]', 'C'),
(0, 'Q003', '投资理财的基本原则是？', '["A. 高风险高收益", "B. 分散投资", "C. 全仓操作", "D. 跟风投资"]', 'B'),
(0, 'Q004', '区块链技术的特点不包括？', '["A. 去中心化", "B. 不可篡改", "C. 完全匿名", "D. 透明公开"]', 'C'),
(0, 'Q005', 'USDT是什么类型的数字货币？', '["A. 比特币", "B. 以太坊", "C. 稳定币", "D. 山寨币"]', 'C'),
(0, 'Q006', '什么是智能合约？', '["A. 纸质合同", "B. 自动执行的程序", "C. 法律文件", "D. 银行协议"]', 'B'),
(0, 'Q007', '数字钱包的作用是？', '["A. 存储现金", "B. 存储数字货币", "C. 存储文件", "D. 存储照片"]', 'B'),
(0, 'Q008', '去中心化交易所的优势是？', '["A. 速度快", "B. 手续费低", "C. 资产安全", "D. 操作简单"]', 'C'),
(0, 'Q009', '什么是私钥？', '["A. 公开密码", "B. 个人密码", "C. 数字签名工具", "D. 验证码"]', 'C'),
(0, 'Q010', 'DeFi是什么的缩写？', '["A. 数字金融", "B. 去中心化金融", "C. 分布式金融", "D. 数据金融"]', 'B'),
(0, 'Q011', '什么是Gas费？', '["A. 汽油费", "B. 网络手续费", "C. 服务费", "D. 管理费"]', 'B'),
(0, 'Q012', '冷钱包的特点是？', '["A. 联网存储", "B. 离线存储", "C. 云端存储", "D. 手机存储"]', 'B'),
(0, 'Q013', '什么是挖矿？', '["A. 挖掘矿物", "B. 计算验证交易", "C. 寻找宝藏", "D. 数据挖掘"]', 'B'),
(0, 'Q014', '区块链的共识机制不包括？', '["A. PoW", "B. PoS", "C. DPoS", "D. PoP"]', 'D'),
(0, 'Q015', '什么是哈希值？', '["A. 随机数", "B. 固定长度的字符串", "C. 密码", "D. 地址"]', 'B'),
(0, 'Q016', 'NFT的全称是？', '["A. 新金融技术", "B. 非同质化代币", "C. 网络文件传输", "D. 数字艺术品"]', 'B'),
(0, 'Q017', '什么是流动性挖矿？', '["A. 挖掘流动资金", "B. 提供流动性获得奖励", "C. 寻找投资机会", "D. 资金管理"]', 'B'),
(0, 'Q018', '跨链技术的作用是？', '["A. 连接不同区块链", "B. 提高速度", "C. 降低成本", "D. 增加安全性"]', 'A'),
(0, 'Q019', '什么是闪电网络？', '["A. 快速网络", "B. 比特币扩容方案", "C. 通信协议", "D. 数据传输"]', 'B'),
(0, 'Q020', 'DAO是什么？', '["A. 数据访问对象", "B. 去中心化自治组织", "C. 数字艺术作品", "D. 开发工具"]', 'B');

-- 创建默认红包活动（当天的三个时间段）
INSERT INTO redpacket_events (event_date, event_time, total_amount, status) VALUES
(CURRENT_DATE, '09:00:00', 1000.00000000, 'pending'),
(CURRENT_DATE, '12:00:00', 1000.00000000, 'pending'),
(CURRENT_DATE, '20:00:00', 1000.00000000, 'pending');

-- 创建明天的红包活动
INSERT INTO redpacket_events (event_date, event_time, total_amount, status) VALUES
(CURRENT_DATE + INTERVAL '1 day', '09:00:00', 1000.00000000, 'pending'),
(CURRENT_DATE + INTERVAL '1 day', '12:00:00', 1000.00000000, 'pending'),
(CURRENT_DATE + INTERVAL '1 day', '20:00:00', 1000.00000000, 'pending');

-- 创建测试用户（可选，用于开发测试）
-- 注意：在生产环境中应该删除这些测试数据
INSERT INTO users (email, password_hash, invite_code, status, wallet_balance) VALUES
('admin@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'ADMIN001', 2, 1000.00000000),
('test1@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'TEST0001', 1, 0.00000000),
('test2@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'TEST0002', 2, 500.00000000);

-- 创建测试任务数据
INSERT INTO tasks (user_id, task_type, task_id, task_name, description, target_count, reward_amount, status) VALUES
(2, 'newbie', 'newbie_0', '注册账号', '完成账号注册', 1, 5.00000000, 'completed'),
(2, 'newbie', 'newbie_1', '邀请1人', '邀请1个新用户注册', 1, 10.00000000, 'pending'),
(3, 'newbie', 'newbie_0', '注册账号', '完成账号注册', 1, 5.00000000, 'completed');

-- 创建通知模板数据
INSERT INTO notifications (user_id, type, title, content) VALUES
(0, 'system', '欢迎加入', '欢迎加入H5游戏平台！请完成新手任务开始您的赚钱之旅。'),
(0, 'task', '任务完成', '恭喜您完成任务，获得奖励！'),
(0, 'redpacket', '红包提醒', '红包活动即将开始，请准时参与！'),
(0, 'withdraw', '提现成功', '您的提现申请已处理完成。');

-- 更新序列值（确保自增ID从正确的值开始）
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));
SELECT setval('quiz_records_id_seq', (SELECT MAX(id) FROM quiz_records));
SELECT setval('redpacket_events_id_seq', (SELECT MAX(id) FROM redpacket_events));
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
SELECT setval('system_configs_id_seq', (SELECT MAX(id) FROM system_configs));

-- 创建视图用于常用查询
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.status,
    u.wallet_balance,
    u.master_level,
    COUNT(DISTINCT tr.user_id) as team_count,
    COUNT(DISTINCT t.id) as completed_tasks,
    COUNT(DISTINCT rr.id) as redpacket_count,
    SUM(CASE WHEN wt.type = 'commission' THEN wt.amount ELSE 0 END) as total_commission
FROM users u
LEFT JOIN team_relations tr ON u.id = tr.ancestor_id
LEFT JOIN tasks t ON u.id = t.user_id AND t.status = 'completed'
LEFT JOIN redpacket_records rr ON u.id = rr.user_id
LEFT JOIN wallet_transactions wt ON u.id = wt.user_id AND wt.status = 'completed'
GROUP BY u.id, u.email, u.status, u.wallet_balance, u.master_level;

-- 创建红包排行榜视图
CREATE VIEW redpacket_ranking AS
SELECT 
    u.id,
    u.email,
    u.username,
    COUNT(rr.id) as grab_count,
    SUM(rr.amount) as total_amount,
    AVG(rr.amount) as avg_amount,
    MAX(rr.amount) as max_amount
FROM users u
JOIN redpacket_records rr ON u.id = rr.user_id
GROUP BY u.id, u.email, u.username
ORDER BY total_amount DESC;

-- 创建团队排行榜视图
CREATE VIEW team_ranking AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.master_level,
    COUNT(DISTINCT tr.user_id) as direct_team_count,
    COUNT(DISTINCT tr2.user_id) as total_team_count
FROM users u
LEFT JOIN team_relations tr ON u.id = tr.ancestor_id AND tr.level = 1
LEFT JOIN team_relations tr2 ON u.id = tr2.ancestor_id
WHERE u.status >= 2
GROUP BY u.id, u.email, u.username, u.master_level
ORDER BY total_team_count DESC, u.master_level DESC;