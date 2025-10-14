const express = require('express');
const router = express.Router();
const { adminAuth, validateAdminLogin, checkPermission, logAdminAction } = require('../middleware/adminAuth');
const { pool } = require('../config/database');

/**
 * 管理员登录
 * POST /api/admin/login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        const result = await validateAdminLogin(username, password);
        
        if (result.success) {
            res.json({
                success: true,
                code: 200,
                message: '登录成功',
                data: {
                    token: result.token,
                    user: result.user
                }
            });
        } else {
            res.status(401).json({
                success: false,
                code: 401,
                message: result.message
            });
        }
    } catch (error) {
        console.error('管理员登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * 验证管理员token
 * GET /api/admin/verify
 */
router.get('/verify', adminAuth, (req, res) => {
    res.json({
        success: true,
        message: 'Token有效',
        user: {
            id: req.admin.id,
            username: req.admin.username,
            role: req.admin.role,
            permissions: req.admin.permissions
        }
    });
});

/**
 * 管理员登出
 * POST /api/admin/logout
 */
router.post('/logout', adminAuth, logAdminAction('logout'), (req, res) => {
    res.json({
        success: true,
        message: '登出成功'
    });
});

/**
 * 获取用户统计数据
 * GET /api/admin/users/stats
 */
router.get('/users/stats', adminAuth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取用户统计
            const [userStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN status = 2 THEN 1 END) as active_users,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as new_users_today,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_week
                FROM users
            `);

            const stats = {
                total: userStats[0].total_users,
                active: userStats[0].active_users,
                newToday: userStats[0].new_users_today,
                newThisWeek: userStats[0].new_users_week
            };

            res.json({
                success: true,
                data: stats
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取用户统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户统计失败'
        });
    }
});

/**
 * 获取交易统计数据
 * GET /api/admin/transactions/stats
 */
router.get('/transactions/stats', adminAuth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取交易统计
            const [transactionStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as today_transactions,
                    COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN amount ELSE 0 END), 0) as today_volume,
                    COALESCE(SUM(amount), 0) as total_volume
                FROM wallet_transactions 
                WHERE status = 'completed'
            `);

            const stats = {
                total: transactionStats[0].total_transactions,
                today: transactionStats[0].today_transactions,
                todayVolume: parseFloat(transactionStats[0].today_volume),
                totalVolume: parseFloat(transactionStats[0].total_volume)
            };

            res.json({
                success: true,
                data: stats
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取交易统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取交易统计失败'
        });
    }
});

/**
 * 获取系统监控状态
 * GET /api/admin/monitoring/system
 */
router.get('/monitoring/system', adminAuth, async (req, res) => {
    try {
        const os = require('os');
        
        // 获取系统信息
        const systemInfo = {
            uptime: os.uptime(),
            loadavg: os.loadavg(),
            totalmem: os.totalmem(),
            freemem: os.freemem(),
            cpus: os.cpus().length,
            platform: os.platform(),
            arch: os.arch()
        };

        // 计算内存使用率
        const memoryUsage = ((systemInfo.totalmem - systemInfo.freemem) / systemInfo.totalmem * 100).toFixed(2);
        
        // 获取数据库连接状态
        let dbStatus = 'connected';
        try {
            const connection = await pool.getConnection();
            await connection.execute('SELECT 1');
            connection.release();
        } catch (error) {
            dbStatus = 'disconnected';
        }

        const status = {
            server: {
                status: 'running',
                uptime: systemInfo.uptime,
                memory: {
                    total: systemInfo.totalmem,
                    free: systemInfo.freemem,
                    used: systemInfo.totalmem - systemInfo.freemem,
                    usage: parseFloat(memoryUsage)
                },
                cpu: {
                    cores: systemInfo.cpus,
                    load: systemInfo.loadavg
                }
            },
            database: {
                status: dbStatus,
                connections: pool.config.connectionLimit || 10
            },
            services: {
                api: 'running',
                websocket: 'running',
                scheduler: 'running'
            }
        };

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('获取系统状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取系统状态失败'
        });
    }
});

/**
 * 获取系统统计数据
 * GET /api/admin/stats
 */
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取用户统计
            const [userStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN status = 2 THEN 1 END) as active_users,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as new_users_today,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_week
                FROM users
            `);

            // 获取钱包统计
            const [walletStats] = await connection.execute(`
                SELECT 
                    COUNT(DISTINCT user_id) as total_wallets,
                    COALESCE(SUM(balance), 0) as total_balance,
                    COALESCE(SUM(frozen_balance), 0) as total_frozen_balance
                FROM users
            `);

            // 获取交易统计
            const [transactionStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as today_transactions,
                    COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN amount ELSE 0 END), 0) as today_volume,
                    COALESCE(SUM(amount), 0) as total_volume
                FROM wallet_transactions 
                WHERE status = 'completed'
            `);

            // 获取红包统计
            const [redpacketStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_events,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
                    COALESCE(SUM(total_amount), 0) as total_distributed
                FROM redpacket_events
            `);

            // 获取任务统计
            const [taskStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as today_tasks
                FROM tasks
            `);

            const stats = {
                users: {
                    total: userStats[0].total_users,
                    active: userStats[0].active_users,
                    newToday: userStats[0].new_users_today,
                    newThisWeek: userStats[0].new_users_week
                },
                wallets: {
                    total: walletStats[0].total_wallets,
                    totalBalance: parseFloat(walletStats[0].total_balance),
                    frozenBalance: parseFloat(walletStats[0].total_frozen_balance)
                },
                transactions: {
                    total: transactionStats[0].total_transactions,
                    today: transactionStats[0].today_transactions,
                    todayVolume: parseFloat(transactionStats[0].today_volume),
                    totalVolume: parseFloat(transactionStats[0].total_volume)
                },
                redpackets: {
                    totalEvents: redpacketStats[0].total_events,
                    completedEvents: redpacketStats[0].completed_events,
                    totalDistributed: parseFloat(redpacketStats[0].total_distributed)
                },
                tasks: {
                    total: taskStats[0].total_tasks,
                    completed: taskStats[0].completed_tasks,
                    today: taskStats[0].today_tasks
                }
            };

            res.json({
                success: true,
                data: stats
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取系统统计数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取系统统计数据失败'
        });
    }
});

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users', adminAuth, checkPermission(['users', 'all']), async (req, res) => {
    try {
        const { page = 1, limit = 20, status = '', search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        
        const connection = await pool.getConnection();
        
        try {
            let whereClause = 'WHERE 1=1';
            let params = [];
            
            if (status) {
                whereClause += ' AND status = ?';
                params.push(status);
            }
            
            if (search) {
                whereClause += ' AND (email LIKE ? OR invite_code LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            // 使用最简单的查询方式，不使用任何参数绑定
            const [users] = await connection.query(`
                SELECT 
                    id, email, invite_code, inviter_code, status, balance, 
                    frozen_balance, total_earnings, team_count, activation_count,
                    last_activation_time, countdown_end_time, created_at, updated_at
                FROM users 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            // 获取总数
            const [countResult] = await connection.query(`
                SELECT COUNT(*) as total FROM users
            `);

            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    users: users,
                    pagination: {
                        page: 1,
                        limit: 5,
                        total: total,
                        totalPages: Math.ceil(total / 5)
                    }
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取用户列表错误:', error);
        console.error('错误详情:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取交易记录
 * GET /api/admin/transactions
 */
router.get('/transactions', adminAuth, checkPermission(['transactions', 'all']), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status = '', 
            type = '', 
            search = '',
            startDate = '',
            endDate = '',
            minAmount = '',
            maxAmount = '',
            riskLevel = ''
        } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        
        const connection = await pool.getConnection();
        
        try {
            let whereClause = 'WHERE 1=1';
            let params = [];
            
            // 状态筛选
            if (status) {
                whereClause += ' AND wt.status = ?';
                params.push(status);
            }
            
            // 交易类型筛选
            if (type) {
                whereClause += ' AND wt.type = ?';
                params.push(type);
            }
            
            // 搜索条件（用户邮箱、邀请码、交易哈希）
            if (search) {
                whereClause += ' AND (u.email LIKE ? OR u.invite_code LIKE ? OR wt.transaction_hash LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            // 时间范围筛选
            if (startDate) {
                whereClause += ' AND wt.created_at >= ?';
                params.push(startDate);
            }
            
            if (endDate) {
                whereClause += ' AND wt.created_at <= ?';
                params.push(endDate + ' 23:59:59');
            }
            
            // 金额范围筛选
            if (minAmount) {
                whereClause += ' AND wt.amount >= ?';
                params.push(parseFloat(minAmount));
            }
            
            if (maxAmount) {
                whereClause += ' AND wt.amount <= ?';
                params.push(parseFloat(maxAmount));
            }
            
            // 风险等级筛选
            if (riskLevel) {
                whereClause += ' AND wt.risk_level = ?';
                params.push(riskLevel);
            }

            // 获取交易列表
            const [transactions] = await connection.execute(`
                SELECT 
                    wt.id, wt.user_id, wt.type, wt.amount, wt.balance_before, 
                    wt.balance_after, wt.status, wt.transaction_hash, wt.description,
                    wt.risk_level, wt.risk_score, wt.approval_status, wt.approved_by,
                    wt.approval_time, wt.approval_notes, wt.created_at, wt.updated_at,
                    u.email, u.invite_code, u.status as user_status,
                    admin.username as approved_by_name
                FROM wallet_transactions wt
                LEFT JOIN users u ON wt.user_id = u.id
                LEFT JOIN admin_users admin ON wt.approved_by = admin.id
                ${whereClause}
                ORDER BY wt.created_at DESC 
                LIMIT ? OFFSET ?
            `, [...params, limitNum, offset]);

            // 获取总数
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as total 
                FROM wallet_transactions wt
                LEFT JOIN users u ON wt.user_id = u.id
                ${whereClause}
            `, params);

            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    transactions: transactions.map(tx => ({
                        ...tx,
                        amount: parseFloat(tx.amount),
                        balance_before: parseFloat(tx.balance_before),
                        balance_after: parseFloat(tx.balance_after),
                        risk_score: tx.risk_score ? parseFloat(tx.risk_score) : null
                    })),
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum)
                    }
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取交易记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易记录失败'
        });
    }
});

/**
 * 获取交易统计
 * GET /api/admin/transactions/statistics
 */
router.get('/transactions/statistics', adminAuth, checkPermission(['transactions', 'all']), async (req, res) => {
    try {
        const { period = 'today' } = req.query;
        const connection = await pool.getConnection();
        
        try {
            let dateCondition = '';
            switch (period) {
                case 'today':
                    dateCondition = 'DATE(created_at) = CURDATE()';
                    break;
                case 'week':
                    dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                    break;
                case 'month':
                    dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                    break;
                default:
                    dateCondition = '1=1';
            }

            // 基础统计
            const [basicStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_volume,
                    COALESCE(AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END), 0) as avg_amount
                FROM wallet_transactions 
                WHERE ${dateCondition}
            `);

            // 按类型统计
            const [typeStats] = await connection.execute(`
                SELECT 
                    type,
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as volume
                FROM wallet_transactions 
                WHERE ${dateCondition} AND status = 'completed'
                GROUP BY type
            `);

            // 风险等级统计 - 暂时返回空数组，因为表中没有risk_level字段
            const riskStats = [];

            // 审核状态统计 - 暂时返回空数组，因为表中没有approval_status字段
            const approvalStats = [];

            // 确保基础统计数据有默认值
            const basicData = basicStats[0] || {
                total_transactions: 0,
                completed_transactions: 0,
                pending_transactions: 0,
                failed_transactions: 0,
                total_volume: 0,
                avg_amount: 0
            };

            res.json({
                success: true,
                data: {
                    basic: {
                        total_transactions: parseInt(basicData.total_transactions) || 0,
                        completed_transactions: parseInt(basicData.completed_transactions) || 0,
                        pending_transactions: parseInt(basicData.pending_transactions) || 0,
                        failed_transactions: parseInt(basicData.failed_transactions) || 0,
                        total_volume: parseFloat(basicData.total_volume) || 0,
                        avg_amount: parseFloat(basicData.avg_amount) || 0
                    },
                    byType: typeStats.map(stat => ({
                        type: stat.type,
                        count: parseInt(stat.count) || 0,
                        volume: parseFloat(stat.volume) || 0
                    })),
                    byRisk: riskStats,
                    byApproval: approvalStats
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取交易统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易统计失败'
        });
    }
});

/**
 * 获取交易详情
 * GET /api/admin/transactions/:id
 */
router.get('/transactions/:id', adminAuth, checkPermission(['transactions', 'all']), async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        
        try {
            // 获取交易详情
            const [transactions] = await connection.execute(`
                SELECT 
                    wt.*, u.email, u.invite_code, u.status as user_status,
                    u.balance as current_balance, u.frozen_balance,
                    admin.username as approved_by_name
                FROM wallet_transactions wt
                LEFT JOIN users u ON wt.user_id = u.id
                LEFT JOIN admin_users admin ON wt.approved_by = admin.id
                WHERE wt.id = ?
            `, [id]);

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '交易记录不存在'
                });
            }

            const transaction = transactions[0];
            
            // 获取相关交易记录（同一用户的近期交易）
            const [relatedTransactions] = await connection.execute(`
                SELECT id, type, amount, status, created_at
                FROM wallet_transactions
                WHERE user_id = ? AND id != ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [transaction.user_id, id]);

            // 获取风险评估记录
            const [riskAssessments] = await connection.execute(`
                SELECT * FROM transaction_risk_assessments
                WHERE transaction_id = ?
                ORDER BY created_at DESC
            `, [id]);

            res.json({
                success: true,
                data: {
                    transaction: {
                        ...transaction,
                        amount: parseFloat(transaction.amount),
                        balance_before: parseFloat(transaction.balance_before),
                        balance_after: parseFloat(transaction.balance_after),
                        current_balance: parseFloat(transaction.current_balance),
                        frozen_balance: parseFloat(transaction.frozen_balance),
                        risk_score: transaction.risk_score ? parseFloat(transaction.risk_score) : null
                    },
                    relatedTransactions: relatedTransactions.map(tx => ({
                        ...tx,
                        amount: parseFloat(tx.amount)
                    })),
                    riskAssessments
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取交易详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易详情失败'
        });
    }
});

/**
 * 审核交易（批准）
 * PUT /api/admin/transactions/:id/approve
 */
router.put('/transactions/:id/approve', adminAuth, checkPermission(['transactions', 'all']), logAdminAction('approve_transaction'), async (req, res) => {
    try {
        const { id } = req.params;
        const { notes = '' } = req.body;
        const adminId = req.admin.id;
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 检查交易是否存在且可审核
            const [transactions] = await connection.execute(`
                SELECT * FROM wallet_transactions 
                WHERE id = ? AND approval_status = 'pending'
            `, [id]);

            if (transactions.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: '交易不存在或已审核'
                });
            }

            const transaction = transactions[0];

            // 更新交易审核状态
            await connection.execute(`
                UPDATE wallet_transactions 
                SET approval_status = 'approved',
                    approved_by = ?,
                    approval_time = NOW(),
                    approval_notes = ?,
                    status = 'completed',
                    updated_at = NOW()
                WHERE id = ?
            `, [adminId, notes, id]);

            // 如果是提现交易，需要处理实际的区块链转账
            if (transaction.type === 'withdrawal') {
                // 这里应该调用区块链转账服务
                // 暂时模拟处理
                await connection.execute(`
                    UPDATE wallet_transactions 
                    SET transaction_hash = ?,
                        updated_at = NOW()
                    WHERE id = ?
                `, [`0x${Math.random().toString(16).substr(2, 64)}`, id]);
            }

            await connection.commit();

            res.json({
                success: true,
                message: '交易审核通过'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('审核交易错误:', error);
        res.status(500).json({
            success: false,
            message: '审核交易失败'
        });
    }
});

/**
 * 拒绝交易
 * PUT /api/admin/transactions/:id/reject
 */
router.put('/transactions/:id/reject', adminAuth, checkPermission(['transactions', 'all']), logAdminAction('reject_transaction'), async (req, res) => {
    try {
        const { id } = req.params;
        const { notes = '' } = req.body;
        const adminId = req.admin.id;
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 检查交易是否存在且可审核
            const [transactions] = await connection.execute(`
                SELECT * FROM wallet_transactions 
                WHERE id = ? AND approval_status = 'pending'
            `, [id]);

            if (transactions.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: '交易不存在或已审核'
                });
            }

            const transaction = transactions[0];

            // 更新交易审核状态
            await connection.execute(`
                UPDATE wallet_transactions 
                SET approval_status = 'rejected',
                    approved_by = ?,
                    approval_time = NOW(),
                    approval_notes = ?,
                    status = 'failed',
                    updated_at = NOW()
                WHERE id = ?
            `, [adminId, notes, id]);

            // 如果是提现交易被拒绝，需要退还用户余额
            if (transaction.type === 'withdrawal') {
                await connection.execute(`
                    UPDATE users 
                    SET balance = balance + ?,
                        frozen_balance = frozen_balance - ?,
                        updated_at = NOW()
                    WHERE id = ?
                `, [transaction.amount, transaction.amount, transaction.user_id]);

                // 记录退款交易
                await connection.execute(`
                    INSERT INTO wallet_transactions 
                    (user_id, type, amount, balance_before, balance_after, status, description, created_at)
                    VALUES (?, 'refund', ?, ?, ?, 'completed', ?, NOW())
                `, [
                    transaction.user_id,
                    transaction.amount,
                    transaction.balance_before,
                    transaction.balance_before + transaction.amount,
                    `提现被拒绝，退还金额: ${notes}`
                ]);
            }

            await connection.commit();

            res.json({
                success: true,
                message: '交易已拒绝'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('拒绝交易错误:', error);
        res.status(500).json({
            success: false,
            message: '拒绝交易失败'
        });
    }
});

/**
 * 获取待审核交易
 * GET /api/admin/transactions/pending
 */
router.get('/transactions/pending', adminAuth, checkPermission(['transactions', 'all']), async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        
        const connection = await pool.getConnection();
        
        try {
            // 获取待审核交易
            const [transactions] = await connection.execute(`
                SELECT 
                    wt.id, wt.user_id, wt.type, wt.amount, wt.status,
                    wt.risk_level, wt.risk_score, wt.created_at,
                    u.email, u.invite_code
                FROM wallet_transactions wt
                LEFT JOIN users u ON wt.user_id = u.id
                WHERE wt.approval_status = 'pending'
                ORDER BY 
                    CASE wt.risk_level 
                        WHEN 'high' THEN 1 
                        WHEN 'medium' THEN 2 
                        WHEN 'low' THEN 3 
                        ELSE 4 
                    END,
                    wt.created_at ASC
                LIMIT ? OFFSET ?
            `, [limitNum, offset]);

            // 获取总数
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as total 
                FROM wallet_transactions 
                WHERE approval_status = 'pending'
            `);

            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    transactions: transactions.map(tx => ({
                        ...tx,
                        amount: parseFloat(tx.amount),
                        risk_score: tx.risk_score ? parseFloat(tx.risk_score) : null
                    })),
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum)
                    }
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取待审核交易错误:', error);
        res.status(500).json({
            success: false,
            message: '获取待审核交易失败'
        });
    }
});

/**
 * 交易风险评估
 * POST /api/admin/transactions/:id/assess-risk
 */
router.post('/transactions/:id/assess-risk', adminAuth, checkPermission(['transactions', 'all']), logAdminAction('assess_transaction_risk'), async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.id;
        
        const connection = await pool.getConnection();
        
        try {
            // 获取交易信息
            const [transactions] = await connection.execute(`
                SELECT wt.*, u.email, u.status as user_status, u.created_at as user_created_at
                FROM wallet_transactions wt
                LEFT JOIN users u ON wt.user_id = u.id
                WHERE wt.id = ?
            `, [id]);

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '交易不存在'
                });
            }

            const transaction = transactions[0];
            
            // 风险评估逻辑
            let riskScore = 0;
            let riskFactors = [];
            
            // 1. 金额风险评估
            if (transaction.amount > 10000) {
                riskScore += 30;
                riskFactors.push('大额交易');
            } else if (transaction.amount > 5000) {
                riskScore += 15;
                riskFactors.push('中额交易');
            }
            
            // 2. 用户账户年龄评估
            const accountAge = Math.floor((new Date() - new Date(transaction.user_created_at)) / (1000 * 60 * 60 * 24));
            if (accountAge < 7) {
                riskScore += 25;
                riskFactors.push('新注册用户');
            } else if (accountAge < 30) {
                riskScore += 10;
                riskFactors.push('账户较新');
            }
            
            // 3. 用户状态评估
            if (transaction.user_status !== 2) {
                riskScore += 20;
                riskFactors.push('用户状态异常');
            }
            
            // 4. 交易频率评估
            const [recentTxCount] = await connection.execute(`
                SELECT COUNT(*) as count
                FROM wallet_transactions
                WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `, [transaction.user_id]);
            
            if (recentTxCount[0].count > 5) {
                riskScore += 20;
                riskFactors.push('高频交易');
            }
            
            // 5. 交易时间评估（深夜交易）
            const hour = new Date(transaction.created_at).getHours();
            if (hour >= 0 && hour <= 6) {
                riskScore += 10;
                riskFactors.push('深夜交易');
            }
            
            // 确定风险等级
            let riskLevel = 'low';
            if (riskScore >= 60) {
                riskLevel = 'high';
            } else if (riskScore >= 30) {
                riskLevel = 'medium';
            }
            
            // 更新交易风险信息
            await connection.execute(`
                UPDATE wallet_transactions 
                SET risk_level = ?, risk_score = ?, updated_at = NOW()
                WHERE id = ?
            `, [riskLevel, riskScore, id]);
            
            // 记录风险评估详情
            await connection.execute(`
                INSERT INTO transaction_risk_assessments 
                (transaction_id, risk_score, risk_level, risk_factors, assessed_by, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [id, riskScore, riskLevel, JSON.stringify(riskFactors), adminId]);

            res.json({
                success: true,
                data: {
                    riskScore,
                    riskLevel,
                    riskFactors
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('交易风险评估错误:', error);
        res.status(500).json({
            success: false,
            message: '交易风险评估失败'
        });
    }
});

/**
 * 系统状态监控
 * GET /api/admin/system-status
 */
router.get('/system-status', adminAuth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取系统状态信息
            const [dbStatus] = await connection.execute('SELECT 1 as connected');
            
            res.json({
                success: true,
                data: {
                    database: {
                        connected: dbStatus.length > 0,
                        timestamp: new Date().toISOString()
                    },
                    server: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取系统状态错误:', error);
        res.status(500).json({
            success: false,
            message: '获取系统状态失败'
        });
    }
});

/**
 * 获取系统状态
 * GET /api/admin/system-status
 */
router.get('/system-status', adminAuth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取系统状态信息
            const [dbStatus] = await connection.execute('SELECT 1 as connected');
            
            res.json({
                success: true,
                data: {
                    database: {
                        connected: dbStatus.length > 0,
                        timestamp: new Date().toISOString()
                    },
                    server: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取系统状态错误:', error);
        res.status(500).json({
            success: false,
            message: '获取系统状态失败'
        });
    }
});

/**
 * 获取风险控制概览
 * GET /api/admin/risk-control/overview
 */
router.get('/risk-control/overview', adminAuth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 检查数据库连接
            const [dbCheck] = await connection.execute('SELECT 1 as status');
            const dbStatus = dbCheck.length > 0 ? 'healthy' : 'error';

            // 获取系统负载信息
            const [systemInfo] = await connection.execute(`
                SELECT 
                    COUNT(*) as active_connections
                FROM information_schema.processlist 
                WHERE db = DATABASE()
            `);

            // 获取最近的错误日志
            const [errorLogs] = await connection.execute(`
                SELECT COUNT(*) as error_count
                FROM system_logs 
                WHERE level = 'ERROR' 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `);

            const systemStatus = {
                database: {
                    status: dbStatus,
                    connections: systemInfo[0].active_connections
                },
                api: {
                    status: 'healthy',
                    uptime: process.uptime()
                },
                errors: {
                    lastHour: errorLogs[0].error_count
                },
                memory: {
                    used: process.memoryUsage().heapUsed,
                    total: process.memoryUsage().heapTotal
                },
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                data: systemStatus
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取系统状态错误:', error);
        res.status(500).json({
            success: false,
            message: '获取系统状态失败'
        });
    }
});

/**
 * 风控概览数据
 * GET /api/admin/risk-control/overview
 */
router.get('/risk-control/overview', adminAuth, async (req, res) => {
    try {
        // 模拟风控数据
        const data = {
            riskScore: Math.floor(Math.random() * 30) + 70, // 70-100
            alerts: Math.floor(Math.random() * 10) + 5,
            blockedTransactions: Math.floor(Math.random() * 20) + 10,
            suspiciousUsers: Math.floor(Math.random() * 15) + 5
        };
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('获取风控概览失败:', error);
        res.status(500).json({ 
            success: false,
            message: '获取风控概览失败' 
        });
    }
});

/**
 * 风控检测数据
 * GET /api/admin/risk-control/detection
 */
router.get('/risk-control/detection', adminAuth, async (req, res) => {
    try {
        // 模拟风控检测数据
        const data = {
            detectionRules: Math.floor(Math.random() * 50) + 20,
            activeRules: Math.floor(Math.random() * 40) + 15,
            triggeredAlerts: Math.floor(Math.random() * 25) + 10,
            falsePositives: Math.floor(Math.random() * 5) + 1
        };
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('获取风控检测数据失败:', error);
        res.status(500).json({ 
            success: false,
            message: '获取风控检测数据失败' 
        });
    }
});

/**
 * 获取钱包列表
 * GET /api/admin/wallets
 */
router.get('/wallets', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search = '', status = '', type = '' } = req.query;
        const offset = (page - 1) * pageSize;
        
        const connection = await pool.getConnection();
        
        try {
            // 构建查询条件
            let whereConditions = [];
            let queryParams = [];
            
            if (search) {
                whereConditions.push('(u.email LIKE ? OR u.invite_code LIKE ? OR uw.wallet_address LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            if (status) {
                whereConditions.push('u.status = ?');
                queryParams.push(status);
            }
            
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            
            // 获取钱包列表
            const [wallets] = await connection.query(`
                SELECT 
                    u.id as userId,
                    u.email,
                    u.invite_code,
                    u.balance,
                    u.frozen_balance,
                    u.status,
                    u.created_at as userCreatedAt,
                    uw.wallet_address,
                    uw.derivation_index,
                    uw.created_at as walletCreatedAt,
                    COALESCE(
                        (SELECT SUM(amount) FROM wallet_transactions 
                         WHERE user_id = u.id AND type = 'deposit' AND status = 'completed'), 0
                    ) as totalDeposit,
                    COALESCE(
                        (SELECT SUM(amount) FROM wallet_transactions 
                         WHERE user_id = u.id AND type = 'withdrawal' AND status = 'completed'), 0
                    ) as totalWithdraw,
                    (SELECT MAX(created_at) FROM wallet_transactions 
                     WHERE user_id = u.id) as lastTransactionAt
                FROM users u
                LEFT JOIN user_wallets uw ON u.id = uw.user_id
                ${whereClause}
                ORDER BY u.created_at DESC
                LIMIT ${pageSize} OFFSET ${offset}
            `, queryParams);

            // 获取总数
            const [countResult] = await connection.query(`
                SELECT COUNT(DISTINCT u.id) as total
                FROM users u
                LEFT JOIN user_wallets uw ON u.id = uw.user_id
                ${whereClause}
            `, queryParams);

            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    wallets: wallets.map(wallet => ({
                        id: wallet.userId,
                        address: wallet.wallet_address,
                        userId: wallet.userId,
                        username: wallet.email,
                        balance: parseFloat(wallet.balance || '0'),
                        frozenBalance: parseFloat(wallet.frozen_balance || '0'),
                        totalDeposit: parseFloat(wallet.totalDeposit || '0'),
                        totalWithdraw: parseFloat(wallet.totalWithdraw || '0'),
                        status: wallet.status === 'active' ? 'active' : 'frozen',
                        type: 'user',
                        createdAt: wallet.userCreatedAt,
                        updatedAt: wallet.userCreatedAt,
                        lastTransactionAt: wallet.lastTransactionAt
                    })),
                    pagination: {
                        page: parseInt(page),
                        pageSize: parseInt(pageSize),
                        total,
                        pages: Math.ceil(total / pageSize)
                    }
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取钱包列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取钱包列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取钱包详情
 * GET /api/admin/wallets/:address
 */
router.get('/wallets/:address', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const { address } = req.params;
        const connection = await pool.getConnection();
        
        try {
            // 获取钱包详细信息
            const [walletInfo] = await connection.query(`
                SELECT 
                    u.id as userId,
                    u.email,
                    u.invite_code,
                    u.balance,
                    u.frozen_balance,
                    u.status,
                    u.created_at as userCreatedAt,
                    uw.wallet_address,
                    uw.derivation_index,
                    uw.created_at as walletCreatedAt
                FROM users u
                LEFT JOIN user_wallets uw ON u.id = uw.user_id
                WHERE uw.wallet_address = ?
            `, [address]);

            if (walletInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '钱包不存在'
                });
            }

            const wallet = walletInfo[0];

            // 获取交易统计
            const [transactionStats] = await connection.query(`
                SELECT 
                    COUNT(*) as totalTransactions,
                    COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0) as totalDeposit,
                    COALESCE(SUM(CASE WHEN type = 'withdrawal' AND status = 'completed' THEN amount ELSE 0 END), 0) as totalWithdraw,
                    MAX(created_at) as lastTransactionAt
                FROM wallet_transactions
                WHERE user_id = ?
            `, [wallet.userId]);

            // 获取最近交易记录
            const [recentTransactions] = await connection.query(`
                SELECT 
                    id, type, amount, status, transaction_hash, 
                    description, created_at
                FROM wallet_transactions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [wallet.userId]);

            const stats = transactionStats[0];

            res.json({
                success: true,
                data: {
                    wallet: {
                        id: wallet.userId,
                        address: wallet.wallet_address,
                        userId: wallet.userId,
                        username: wallet.email,
                        balance: parseFloat(wallet.balance || '0'),
                        frozenBalance: parseFloat(wallet.frozen_balance || '0'),
                        totalDeposit: parseFloat(stats.totalDeposit || '0'),
                        totalWithdraw: parseFloat(stats.totalWithdraw || '0'),
                        status: wallet.status === 'active' ? 'active' : 'frozen',
                        type: 'user',
                        createdAt: wallet.userCreatedAt,
                        updatedAt: wallet.userCreatedAt,
                        lastTransactionAt: stats.lastTransactionAt,
                        derivationIndex: wallet.derivation_index
                    },
                    statistics: {
                        totalTransactions: stats.totalTransactions,
                        totalDeposit: parseFloat(stats.totalDeposit || '0'),
                        totalWithdraw: parseFloat(stats.totalWithdraw || '0'),
                        netFlow: parseFloat(stats.totalDeposit || '0') - parseFloat(stats.totalWithdraw || '0')
                    },
                    recentTransactions: recentTransactions.map(tx => ({
                        ...tx,
                        amount: parseFloat(tx.amount)
                    }))
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取钱包详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取钱包详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 更新钱包状态
 * PUT /api/admin/wallets/:address/status
 */
router.put('/wallets/:address/status', adminAuth, checkPermission(['wallets', 'all']), logAdminAction('update_wallet_status'), async (req, res) => {
    try {
        const { address } = req.params;
        const { status } = req.body;
        
        if (!['active', 'frozen', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的钱包状态'
            });
        }

        const connection = await pool.getConnection();
        
        try {
            // 查找钱包对应的用户
            const [walletInfo] = await connection.query(`
                SELECT u.id as userId, u.status as currentStatus
                FROM users u
                LEFT JOIN user_wallets uw ON u.id = uw.user_id
                WHERE uw.wallet_address = ?
            `, [address]);

            if (walletInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '钱包不存在'
                });
            }

            const userId = walletInfo[0].userId;
            const userStatus = status === 'active' ? 'active' : 'inactive';

            // 更新用户状态
            await connection.query(`
                UPDATE users 
                SET status = ?, updated_at = NOW()
                WHERE id = ?
            `, [userStatus, userId]);

            res.json({
                success: true,
                message: '钱包状态更新成功',
                data: {
                    address,
                    status,
                    updatedAt: new Date().toISOString()
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('更新钱包状态错误:', error);
        res.status(500).json({
            success: false,
            message: '更新钱包状态失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取钱包统计信息
 * GET /api/admin/wallets/stats
 */
router.get('/wallets/stats', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取钱包总体统计
            const [walletStats] = await connection.query(`
                SELECT 
                    COUNT(DISTINCT u.id) as totalWallets,
                    COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as activeWallets,
                    COUNT(DISTINCT CASE WHEN u.status = 'inactive' THEN u.id END) as frozenWallets,
                    COALESCE(SUM(u.balance), 0) as totalBalance,
                    COALESCE(SUM(u.frozen_balance), 0) as totalFrozenBalance
                FROM users u
                LEFT JOIN user_wallets uw ON u.id = uw.user_id
                WHERE uw.wallet_address IS NOT NULL
            `);

            // 获取交易统计
            const [transactionStats] = await connection.query(`
                SELECT 
                    COUNT(*) as totalTransactions,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as todayTransactions,
                    COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0) as totalDeposits,
                    COALESCE(SUM(CASE WHEN type = 'withdrawal' AND status = 'completed' THEN amount ELSE 0 END), 0) as totalWithdrawals,
                    COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN amount ELSE 0 END), 0) as todayDeposits,
                    COALESCE(SUM(CASE WHEN type = 'withdrawal' AND status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN amount ELSE 0 END), 0) as todayWithdrawals
                FROM wallet_transactions
            `);

            // 获取地址使用统计
            const [addressStats] = await connection.query(`
                SELECT 
                    COUNT(*) as totalAddresses,
                    COUNT(CASE WHEN balance > 0 THEN 1 END) as addressesWithBalance,
                    COUNT(CASE WHEN balance >= 10 THEN 1 END) as addressesNeedConsolidation
                FROM (
                    SELECT u.balance
                    FROM users u
                    LEFT JOIN user_wallets uw ON u.id = uw.user_id
                    WHERE uw.wallet_address IS NOT NULL
                ) as wallet_balances
            `);

            const walletData = walletStats[0];
            const transactionData = transactionStats[0];
            const addressData = addressStats[0];

            res.json({
                success: true,
                data: {
                    wallets: {
                        total: walletData.totalWallets,
                        active: walletData.activeWallets,
                        frozen: walletData.frozenWallets,
                        totalBalance: parseFloat(walletData.totalBalance || '0'),
                        totalFrozenBalance: parseFloat(walletData.totalFrozenBalance || '0')
                    },
                    transactions: {
                        total: transactionData.totalTransactions,
                        today: transactionData.todayTransactions,
                        totalDeposits: parseFloat(transactionData.totalDeposits || '0'),
                        totalWithdrawals: parseFloat(transactionData.totalWithdrawals || '0'),
                        todayDeposits: parseFloat(transactionData.todayDeposits || '0'),
                        todayWithdrawals: parseFloat(transactionData.todayWithdrawals || '0')
                    },
                    addresses: {
                        total: addressData.totalAddresses,
                        withBalance: addressData.addressesWithBalance,
                        needConsolidation: addressData.addressesNeedConsolidation
                    }
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取钱包统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取钱包统计失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 批量资金归集
 * POST /api/admin/wallets/collect
 */
router.post('/wallets/collect', adminAuth, checkPermission(['wallets', 'all']), logAdminAction('collect_funds'), async (req, res) => {
    try {
        const { addresses = [], minBalance = 10, type = 'manual' } = req.body;
        const fundConsolidationService = require('../services/fundConsolidationService');
        
        // 执行资金归集
        const result = await fundConsolidationService.consolidateFunds(
            addresses.length > 0 ? addresses : null,
            minBalance
        );
        
        res.json({
            success: true,
            message: '资金归集完成',
            data: {
                taskId: `collect_${Date.now()}`,
                type,
                total: result.total,
                successful: result.successful,
                failed: result.failed,
                totalAmount: result.totalAmount,
                results: result.results,
                status: 'completed'
            }
        });

    } catch (error) {
        console.error('资金归集错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '资金归集失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取归集历史
 * GET /api/admin/wallets/collect-history
 */
router.get('/wallets/collect-history', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;
        const fundConsolidationService = require('../services/fundConsolidationService');
        
        // 获取归集历史记录
        const result = await fundConsolidationService.getConsolidationHistory(
            parseInt(page),
            parseInt(limit),
            { status, startDate, endDate }
        );
        
        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('获取归集历史错误:', error);
        res.status(500).json({
            success: false,
            message: '获取归集历史失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取归集统计信息
 * GET /api/admin/wallets/collect-stats
 */
router.get('/wallets/collect-stats', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 今日归集统计
            const [todayStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_count,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                    SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_amount
                FROM fund_consolidations 
                WHERE DATE(created_at) = CURDATE()
            `);

            // 本周归集统计
            const [weekStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_count,
                    SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_amount
                FROM fund_consolidations 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            `);

            // 本月归集统计
            const [monthStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_count,
                    SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_amount
                FROM fund_consolidations 
                WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())
            `);

            // 待归集钱包数量
            const [pendingWallets] = await connection.execute(`
                SELECT COUNT(*) as count
                FROM user_wallet_addresses uwa
                WHERE uwa.balance >= 10 AND uwa.status = 'active'
            `);

            res.json({
                success: true,
                data: {
                    today: {
                        totalCount: todayStats[0].total_count || 0,
                        successCount: todayStats[0].success_count || 0,
                        failedCount: todayStats[0].failed_count || 0,
                        totalAmount: parseFloat(todayStats[0].total_amount) || 0
                    },
                    week: {
                        totalCount: weekStats[0].total_count || 0,
                        totalAmount: parseFloat(weekStats[0].total_amount) || 0
                    },
                    month: {
                        totalCount: monthStats[0].total_count || 0,
                        totalAmount: parseFloat(monthStats[0].total_amount) || 0
                    },
                    pendingWallets: pendingWallets[0].count || 0
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取归集统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取归集统计失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取自动归集配置
 * GET /api/admin/wallets/auto-collect-config
 */
router.get('/wallets/auto-collect-config', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const [configs] = await connection.execute(`
                SELECT * FROM auto_consolidation_config 
                WHERE id = 1
            `);

            const config = configs[0] || {
                enabled: false,
                interval_minutes: 30,
                min_balance: 10,
                max_concurrent: 5,
                schedule_time: '02:00',
                notification_enabled: true
            };

            res.json({
                success: true,
                data: config
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取自动归集配置错误:', error);
        res.status(500).json({
            success: false,
            message: '获取自动归集配置失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 更新自动归集配置
 * PUT /api/admin/wallets/auto-collect-config
 */
router.put('/wallets/auto-collect-config', adminAuth, checkPermission(['wallets', 'all']), logAdminAction('update_auto_collect_config'), async (req, res) => {
    try {
        const { 
            enabled, 
            intervalMinutes, 
            minBalance, 
            maxConcurrent, 
            scheduleTime, 
            notificationEnabled 
        } = req.body;

        const connection = await pool.getConnection();
        
        try {
            // 更新或插入配置
            await connection.execute(`
                INSERT INTO auto_consolidation_config 
                (id, enabled, interval_minutes, min_balance, max_concurrent, schedule_time, notification_enabled, updated_at)
                VALUES (1, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                enabled = VALUES(enabled),
                interval_minutes = VALUES(interval_minutes),
                min_balance = VALUES(min_balance),
                max_concurrent = VALUES(max_concurrent),
                schedule_time = VALUES(schedule_time),
                notification_enabled = VALUES(notification_enabled),
                updated_at = NOW()
            `, [enabled, intervalMinutes, minBalance, maxConcurrent, scheduleTime, notificationEnabled]);

            res.json({
                success: true,
                message: '自动归集配置已更新'
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('更新自动归集配置错误:', error);
        res.status(500).json({
            success: false,
            message: '更新自动归集配置失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取可归集的钱包列表
 * GET /api/admin/wallets/consolidatable
 */
router.get('/wallets/consolidatable', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const { minBalance = 10, page = 1, limit = 20 } = req.query;
        const fundConsolidationService = require('../services/fundConsolidationService');
        
        // 获取可归集的钱包列表
        const wallets = await fundConsolidationService.getWalletsForConsolidation(parseFloat(minBalance));
        
        // 分页处理
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const paginatedWallets = wallets.slice(offset, offset + parseInt(limit));
        
        res.json({
            success: true,
            data: {
                wallets: paginatedWallets,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: wallets.length,
                    pages: Math.ceil(wallets.length / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('获取可归集钱包列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取可归集钱包列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== 任务管理模块 ====================

/**
 * 获取任务统计信息
 * GET /api/admin/tasks/statistics
 */
router.get('/tasks/statistics', adminAuth, checkPermission(['tasks', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取任务完成统计
            const [taskStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as today_tasks,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as week_tasks,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as month_tasks
                FROM user_tasks
            `);

            // 获取任务类型统计
            const [typeStats] = await connection.execute(`
                SELECT 
                    task_type,
                    COUNT(*) as count,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    AVG(CASE WHEN status = 'completed' THEN reward_amount ELSE 0 END) as avg_reward
                FROM user_tasks 
                GROUP BY task_type
            `);

            // 获取奖励发放统计
            const [rewardStats] = await connection.execute(`
                SELECT 
                    SUM(CASE WHEN status = 'completed' THEN reward_amount ELSE 0 END) as total_rewards,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as rewarded_tasks,
                    AVG(CASE WHEN status = 'completed' THEN reward_amount ELSE 0 END) as avg_reward_amount
                FROM user_tasks
            `);

            res.json({
                success: true,
                data: {
                    overview: {
                        total: taskStats[0].total_tasks,
                        completed: taskStats[0].completed_tasks,
                        pending: taskStats[0].pending_tasks,
                        completionRate: taskStats[0].total_tasks > 0 ? 
                            (taskStats[0].completed_tasks / taskStats[0].total_tasks * 100).toFixed(2) : 0
                    },
                    timeStats: {
                        today: taskStats[0].today_tasks,
                        week: taskStats[0].week_tasks,
                        month: taskStats[0].month_tasks
                    },
                    typeStats: typeStats,
                    rewards: {
                        totalAmount: rewardStats[0].total_rewards || 0,
                        rewardedTasks: rewardStats[0].rewarded_tasks || 0,
                        avgAmount: rewardStats[0].avg_reward_amount || 0
                    }
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取任务统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取任务统计失败'
        });
    }
});

/**
 * 获取任务列表
 * GET /api/admin/tasks
 */
router.get('/tasks', adminAuth, checkPermission(['tasks', 'all']), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            taskType, 
            status, 
            search,
            startDate,
            endDate
        } = req.query;

        const offset = (page - 1) * limit;
        const connection = await pool.getConnection();
        
        try {
            let whereConditions = [];
            let queryParams = [];

            // 任务类型筛选
            if (taskType) {
                whereConditions.push('ut.task_type = ?');
                queryParams.push(taskType);
            }

            // 状态筛选
            if (status) {
                whereConditions.push('ut.status = ?');
                queryParams.push(status);
            }

            // 搜索条件
            if (search) {
                whereConditions.push('(u.email LIKE ? OR u.invite_code LIKE ? OR ut.task_name LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            // 日期范围筛选
            if (startDate) {
                whereConditions.push('ut.created_at >= ?');
                queryParams.push(startDate);
            }
            if (endDate) {
                whereConditions.push('ut.created_at <= ?');
                queryParams.push(endDate);
            }

            const whereClause = whereConditions.length > 0 ? 
                `WHERE ${whereConditions.join(' AND ')}` : '';

            // 获取任务列表
            const [tasks] = await connection.execute(`
                SELECT 
                    ut.id,
                    ut.user_id,
                    ut.task_type,
                    ut.task_name,
                    ut.task_description,
                    ut.reward_amount,
                    ut.status,
                    ut.completed_at,
                    ut.created_at,
                    u.email,
                    u.invite_code,
                    u.status as user_status
                FROM user_tasks ut
                LEFT JOIN users u ON ut.user_id = u.id
                ${whereClause}
                ORDER BY ut.created_at DESC
                LIMIT ? OFFSET ?
            `, [...queryParams, parseInt(limit), offset]);

            // 获取总数
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as total
                FROM user_tasks ut
                LEFT JOIN users u ON ut.user_id = u.id
                ${whereClause}
            `, queryParams);

            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    tasks,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取任务列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取任务列表失败'
        });
    }
});

/**
 * 获取任务详情
 * GET /api/admin/tasks/:id
 */
router.get('/tasks/:id', adminAuth, checkPermission(['tasks', 'all']), async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        
        try {
            // 获取任务详情
            const [taskResult] = await connection.execute(`
                SELECT 
                    ut.id,
                    ut.user_id,
                    ut.task_type,
                    ut.task_name,
                    ut.task_description,
                    ut.reward_amount,
                    ut.status,
                    ut.completed_at,
                    ut.created_at,
                    ut.updated_at,
                    u.email,
                    u.invite_code,
                    u.status as user_status,
                    u.balance,
                    u.created_at as user_created_at
                FROM user_tasks ut
                LEFT JOIN users u ON ut.user_id = u.id
                WHERE ut.id = ?
            `, [id]);

            if (taskResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }

            const task = taskResult[0];

            // 获取用户其他任务
            const [userTasks] = await connection.execute(`
                SELECT 
                    id,
                    task_type,
                    task_name,
                    status,
                    reward_amount,
                    completed_at,
                    created_at
                FROM user_tasks
                WHERE user_id = ? AND id != ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [task.user_id, id]);

            res.json({
                success: true,
                data: {
                    task,
                    userTasks
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取任务详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取任务详情失败'
        });
    }
});

/**
 * 更新任务状态
 * PUT /api/admin/tasks/:id/status
 */
router.put('/tasks/:id/status', adminAuth, checkPermission(['tasks', 'all']), logAdminAction('update_task_status'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (!['pending', 'completed', 'failed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的任务状态'
            });
        }

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // 获取任务信息
            const [taskResult] = await connection.execute(`
                SELECT ut.*, u.balance 
                FROM user_tasks ut
                LEFT JOIN users u ON ut.user_id = u.id
                WHERE ut.id = ?
            `, [id]);

            if (taskResult.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: '任务不存在'
                });
            }

            const task = taskResult[0];

            // 更新任务状态
            const updateData = [status];
            let updateSql = 'UPDATE user_tasks SET status = ?';

            if (status === 'completed') {
                updateSql += ', completed_at = NOW()';
                
                // 如果任务完成，发放奖励
                if (task.status !== 'completed' && task.reward_amount > 0) {
                    await connection.execute(`
                        UPDATE users 
                        SET balance = balance + ? 
                        WHERE id = ?
                    `, [task.reward_amount, task.user_id]);

                    // 记录奖励交易
                    await connection.execute(`
                        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
                        VALUES (?, 'task_reward', ?, 'completed', ?, NOW())
                    `, [task.user_id, task.reward_amount, `任务奖励: ${task.task_name}`]);
                }
            }

            updateSql += ', updated_at = NOW() WHERE id = ?';
            updateData.push(id);

            await connection.execute(updateSql, updateData);

            // 记录操作日志
            await connection.execute(`
                INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at)
                VALUES (?, 'update_task_status', 'task', ?, ?, NOW())
            `, [req.admin.id, id, JSON.stringify({ status, reason, taskName: task.task_name })]);

            await connection.commit();

            res.json({
                success: true,
                message: '任务状态更新成功'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('更新任务状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新任务状态失败'
        });
    }
});

/**
 * 批量发放任务奖励
 * POST /api/admin/tasks/batch-reward
 */
router.post('/tasks/batch-reward', adminAuth, checkPermission(['tasks', 'all']), logAdminAction('batch_reward_tasks'), async (req, res) => {
    try {
        const { taskIds, rewardAmount, description } = req.body;

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请选择要发放奖励的任务'
            });
        }

        if (!rewardAmount || rewardAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: '奖励金额必须大于0'
            });
        }

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            let successCount = 0;
            let failedTasks = [];

            for (const taskId of taskIds) {
                try {
                    // 获取任务信息
                    const [taskResult] = await connection.execute(`
                        SELECT ut.*, u.email 
                        FROM user_tasks ut
                        LEFT JOIN users u ON ut.user_id = u.id
                        WHERE ut.id = ? AND ut.status = 'completed'
                    `, [taskId]);

                    if (taskResult.length === 0) {
                        failedTasks.push({ taskId, reason: '任务不存在或未完成' });
                        continue;
                    }

                    const task = taskResult[0];

                    // 更新用户余额
                    await connection.execute(`
                        UPDATE users 
                        SET balance = balance + ? 
                        WHERE id = ?
                    `, [rewardAmount, task.user_id]);

                    // 记录奖励交易
                    await connection.execute(`
                        INSERT INTO transactions (user_id, type, amount, status, description, created_at)
                        VALUES (?, 'admin_reward', ?, 'completed', ?, NOW())
                    `, [task.user_id, rewardAmount, description || `管理员奖励: ${task.task_name}`]);

                    successCount++;
                } catch (error) {
                    console.error(`发放任务${taskId}奖励失败:`, error);
                    failedTasks.push({ taskId, reason: error.message });
                }
            }

            // 记录操作日志
            await connection.execute(`
                INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at)
                VALUES (?, 'batch_reward_tasks', 'tasks', ?, ?, NOW())
            `, [req.admin.id, taskIds.join(','), JSON.stringify({ 
                rewardAmount, 
                description, 
                successCount, 
                failedCount: failedTasks.length 
            })]);

            await connection.commit();

            res.json({
                success: true,
                message: `批量发放奖励完成，成功${successCount}个，失败${failedTasks.length}个`,
                data: {
                    successCount,
                    failedTasks
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('批量发放任务奖励失败:', error);
        res.status(500).json({
            success: false,
            message: '批量发放任务奖励失败'
        });
    }
});

/**
 * 获取任务配置
 * GET /api/admin/tasks/config
 */
router.get('/tasks/config', adminAuth, checkPermission(['tasks', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取任务配置
            const [configs] = await connection.execute(`
                SELECT 
                    id,
                    task_type,
                    task_name,
                    task_description,
                    reward_amount,
                    is_active,
                    sort_order,
                    created_at,
                    updated_at
                FROM task_configs
                ORDER BY task_type, sort_order
            `);

            // 按任务类型分组
            const configsByType = configs.reduce((acc, config) => {
                if (!acc[config.task_type]) {
                    acc[config.task_type] = [];
                }
                acc[config.task_type].push(config);
                return acc;
            }, {});

            res.json({
                success: true,
                data: {
                    configs: configsByType,
                    all: configs
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取任务配置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取任务配置失败'
        });
    }
});

/**
 * 更新任务配置
 * PUT /api/admin/tasks/config/:id
 */
router.put('/tasks/config/:id', adminAuth, checkPermission(['tasks', 'all']), logAdminAction('update_task_config'), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            task_name, 
            task_description, 
            reward_amount, 
            is_active, 
            sort_order 
        } = req.body;

        const connection = await pool.getConnection();
        
        try {
            // 检查配置是否存在
            const [existing] = await connection.execute(`
                SELECT id FROM task_configs WHERE id = ?
            `, [id]);

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '任务配置不存在'
                });
            }

            // 更新配置
            await connection.execute(`
                UPDATE task_configs 
                SET 
                    task_name = ?,
                    task_description = ?,
                    reward_amount = ?,
                    is_active = ?,
                    sort_order = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [task_name, task_description, reward_amount, is_active, sort_order, id]);

            // 记录操作日志
            await connection.execute(`
                INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at)
                VALUES (?, 'update_task_config', 'task_config', ?, ?, NOW())
            `, [req.admin.id, id, JSON.stringify({ task_name, reward_amount, is_active })]);

            res.json({
                success: true,
                message: '任务配置更新成功'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('更新任务配置失败:', error);
        res.status(500).json({
            success: false,
            message: '更新任务配置失败'
        });
    }
});

// ==================== 红包管理 API ====================

/**
 * 获取红包统计数据
 * GET /api/admin/redpackets/statistics
 */
router.get('/redpackets/statistics', adminAuth, checkPermission(['redpackets', 'all']), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // 获取红包活动统计
    const [eventStats] = await connection.execute(`
      SELECT 
        COUNT(*) as totalEvents,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activeEvents,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedEvents,
        COALESCE(SUM(total_amount), 0) as totalDistributed,
        COALESCE(AVG(total_amount), 0) as avgAmount
      FROM redpacket_events
    `);
    
    // 获取今日红包统计
    const [todayStats] = await connection.execute(`
      SELECT 
        COUNT(*) as todayEvents,
        COALESCE(SUM(total_amount), 0) as todayDistributed,
        COUNT(DISTINCT user_id) as todayParticipants
      FROM redpacket_events
      WHERE DATE(created_at) = CURDATE()
    `);
    
    // 获取红包记录统计
    const [recordStats] = await connection.execute(`
      SELECT 
        COUNT(*) as totalGrabs,
        COUNT(DISTINCT user_id) as uniqueUsers,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(AVG(amount), 0) as avgGrabAmount,
        COALESCE(MAX(amount), 0) as maxGrabAmount
      FROM redpacket_records
    `);
    
    // 获取时间窗口统计
    const [windowStats] = await connection.execute(`
      SELECT 
        HOUR(grabbed_at) as hour,
        COUNT(*) as grabCount,
        COALESCE(SUM(amount), 0) as totalAmount
      FROM redpacket_records
      WHERE grabbed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY HOUR(grabbed_at)
      ORDER BY hour
    `);
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalEvents: eventStats[0].totalEvents,
          activeEvents: eventStats[0].activeEvents,
          completedEvents: eventStats[0].completedEvents,
          totalDistributed: parseFloat(eventStats[0].totalDistributed),
          avgAmount: parseFloat(eventStats[0].avgAmount)
        },
        today: {
          events: todayStats[0].todayEvents,
          distributed: parseFloat(todayStats[0].todayDistributed),
          participants: todayStats[0].todayParticipants
        },
        grabs: {
          totalGrabs: recordStats[0].totalGrabs,
          uniqueUsers: recordStats[0].uniqueUsers,
          totalAmount: parseFloat(recordStats[0].totalAmount),
          avgAmount: parseFloat(recordStats[0].avgGrabAmount),
          maxAmount: parseFloat(recordStats[0].maxGrabAmount)
        },
        timeWindows: windowStats.map(row => ({
          hour: row.hour,
          grabCount: row.grabCount,
          totalAmount: parseFloat(row.totalAmount)
        }))
      }
    });
  } catch (error) {
    console.error('获取红包统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取红包统计失败'
    });
  }
});

/**
 * 获取红包活动列表
 * GET /api/admin/redpackets/events
 */
router.get('/redpackets/events', adminAuth, checkPermission(['redpackets', 'all']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      startDate, 
      endDate 
    } = req.query;
    
    const connection = await pool.getConnection();
    
    let whereConditions = [];
    let params = [];
    
    if (status) {
      whereConditions.push('re.status = ?');
      params.push(status);
    }
    
    if (search) {
      whereConditions.push('(re.event_name LIKE ? OR re.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (startDate) {
      whereConditions.push('re.created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('re.created_at <= ?');
      params.push(endDate);
    }
    
    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 获取总数
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM redpacket_events re
      ${whereClause}
    `, params);
    
    // 获取分页数据
    const offset = (page - 1) * limit;
    const [events] = await connection.execute(`
      SELECT 
        re.*,
        COUNT(rr.id) as grabCount,
        COALESCE(SUM(rr.amount), 0) as distributedAmount
      FROM redpacket_events re
      LEFT JOIN redpacket_records rr ON re.id = rr.event_id
      ${whereClause}
      GROUP BY re.id
      ORDER BY re.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        events: events.map(event => ({
          ...event,
          total_amount: parseFloat(event.total_amount),
          distributed_amount: parseFloat(event.distributedAmount),
          grab_count: event.grabCount
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取红包活动列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取红包活动列表失败'
    });
  }
});

/**
 * 获取红包记录列表
 * GET /api/admin/redpackets/records
 */
router.get('/redpackets/records', adminAuth, checkPermission(['redpackets', 'all']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      eventId, 
      userId, 
      search, 
      startDate, 
      endDate 
    } = req.query;
    
    const connection = await pool.getConnection();
    
    let whereConditions = [];
    let params = [];
    
    if (eventId) {
      whereConditions.push('rr.event_id = ?');
      params.push(eventId);
    }
    
    if (userId) {
      whereConditions.push('rr.user_id = ?');
      params.push(userId);
    }
    
    if (search) {
      whereConditions.push('(u.email LIKE ? OR u.invite_code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (startDate) {
      whereConditions.push('rr.grabbed_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('rr.grabbed_at <= ?');
      params.push(endDate);
    }
    
    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 获取总数
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM redpacket_records rr
      LEFT JOIN users u ON rr.user_id = u.id
      ${whereClause}
    `, params);
    
    // 获取分页数据
    const offset = (page - 1) * limit;
    const [records] = await connection.execute(`
      SELECT 
        rr.*,
        u.email,
        u.invite_code,
        u.status as user_status,
        re.event_name,
        re.total_amount as event_total_amount
      FROM redpacket_records rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN redpacket_events re ON rr.event_id = re.id
      ${whereClause}
      ORDER BY rr.grabbed_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        records: records.map(record => ({
          ...record,
          amount: parseFloat(record.amount),
          event_total_amount: parseFloat(record.event_total_amount)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取红包记录列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取红包记录列表失败'
    });
  }
});

/**
 * 创建红包活动
 * POST /api/admin/redpackets/events
 */
router.post('/redpackets/events', adminAuth, checkPermission(['redpackets', 'all']), logAdminAction('create_redpacket_event'), async (req, res) => {
  try {
    const {
      eventName,
      description,
      totalAmount,
      minAmount,
      maxAmount,
      timeWindows,
      duration,
      startTime,
      endTime
    } = req.body;
    
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(`
      INSERT INTO redpacket_events (
        event_name, description, total_amount, min_amount, max_amount,
        time_windows, duration, start_time, end_time, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      eventName, description, totalAmount, minAmount, maxAmount,
      JSON.stringify(timeWindows), duration, startTime, endTime
    ]);
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        eventId: result.insertId,
        message: '红包活动创建成功'
      }
    });
  } catch (error) {
    console.error('创建红包活动失败:', error);
    res.status(500).json({
      success: false,
      message: '创建红包活动失败'
    });
  }
});

/**
 * 更新红包活动状态
 * PUT /api/admin/redpackets/events/:id/status
 */
router.put('/redpackets/events/:id/status', adminAuth, checkPermission(['redpackets', 'all']), logAdminAction('update_redpacket_status'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const connection = await pool.getConnection();
    
    await connection.execute(`
      UPDATE redpacket_events 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `, [status, id]);
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        message: '红包活动状态更新成功'
      }
    });
  } catch (error) {
    console.error('更新红包活动状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新红包活动状态失败'
    });
  }
});

/**
 * 获取红包配置
 * GET /api/admin/redpackets/config
 */
router.get('/redpackets/config', adminAuth, checkPermission(['redpackets', 'all']), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [configs] = await connection.execute(`
      SELECT * FROM redpacket_config ORDER BY id DESC LIMIT 1
    `);
    
    connection.release();
    
    const defaultConfig = {
      timeWindows: [
        { hour: 9, minute: 0 },
        { hour: 12, minute: 0 },
        { hour: 20, minute: 0 }
      ],
      duration: 77,
      totalPool: 5000,
      minAmount: 1,
      maxAmount: 100,
      isActive: true
    };
    
    res.json({
      success: true,
      data: configs.length > 0 ? {
        ...configs[0],
        time_windows: JSON.parse(configs[0].time_windows)
      } : defaultConfig
    });
  } catch (error) {
    console.error('获取红包配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取红包配置失败'
    });
  }
});

/**
 * 更新红包配置
 * PUT /api/admin/redpackets/config
 */
router.put('/redpackets/config', adminAuth, checkPermission(['redpackets', 'all']), logAdminAction('update_redpacket_config'), async (req, res) => {
  try {
    const {
      timeWindows,
      duration,
      totalPool,
      minAmount,
      maxAmount,
      isActive
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // 检查是否存在配置
    const [existing] = await connection.execute(`
      SELECT id FROM redpacket_config ORDER BY id DESC LIMIT 1
    `);
    
    if (existing.length > 0) {
      // 更新现有配置
      await connection.execute(`
        UPDATE redpacket_config 
        SET time_windows = ?, duration = ?, total_pool = ?, 
            min_amount = ?, max_amount = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        JSON.stringify(timeWindows), duration, totalPool,
        minAmount, maxAmount, isActive, existing[0].id
      ]);
    } else {
      // 创建新配置
      await connection.execute(`
        INSERT INTO redpacket_config (
          time_windows, duration, total_pool, min_amount, max_amount, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        JSON.stringify(timeWindows), duration, totalPool,
        minAmount, maxAmount, isActive
      ]);
    }
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        message: '红包配置更新成功'
      }
    });
  } catch (error) {
    console.error('更新红包配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新红包配置失败'
    });
  }
});

/**
 * 钱包监控 - 获取监控统计
 * GET /api/admin/wallet-monitoring/statistics
 */
router.get('/wallet-monitoring/statistics', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取钱包总数和状态分布
            const [walletStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_wallets,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_wallets,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_wallets,
                    SUM(CASE WHEN status = 'frozen' THEN 1 ELSE 0 END) as frozen_wallets
                FROM user_wallets
            `);
            
            // 获取余额统计
            const [balanceStats] = await connection.execute(`
                SELECT 
                    SUM(balance) as total_balance,
                    AVG(balance) as avg_balance,
                    MAX(balance) as max_balance,
                    MIN(balance) as min_balance,
                    COUNT(CASE WHEN balance > 0 THEN 1 END) as non_zero_wallets
                FROM user_wallets
            `);
            
            // 获取今日交易统计
            const [todayStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as today_transactions,
                    SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as today_deposits,
                    SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as today_withdrawals,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions
                FROM wallet_transactions 
                WHERE DATE(created_at) = CURDATE()
            `);
            
            // 获取异常告警数量
            const [alertStats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_alerts,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_alerts,
                    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity_alerts
                FROM wallet_alerts 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);
            
            res.json({
                success: true,
                data: {
                    wallets: walletStats[0],
                    balance: balanceStats[0],
                    today: todayStats[0],
                    alerts: alertStats[0]
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取钱包监控统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取钱包监控统计失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 钱包监控 - 获取告警列表
 * GET /api/admin/wallet-monitoring/alerts
 */
router.get('/wallet-monitoring/alerts', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status = '', 
            severity = '',
            type = '',
            startDate = '',
            endDate = ''
        } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        
        const connection = await pool.getConnection();
        
        try {
            let whereClause = 'WHERE 1=1';
            let params = [];
            
            if (status) {
                whereClause += ' AND wa.status = ?';
                params.push(status);
            }
            
            if (severity) {
                whereClause += ' AND wa.severity = ?';
                params.push(severity);
            }
            
            if (type) {
                whereClause += ' AND wa.alert_type = ?';
                params.push(type);
            }
            
            if (startDate) {
                whereClause += ' AND wa.created_at >= ?';
                params.push(startDate);
            }
            
            if (endDate) {
                whereClause += ' AND wa.created_at <= ?';
                params.push(endDate + ' 23:59:59');
            }
            
            // 获取告警列表
            const [alerts] = await connection.execute(`
                SELECT 
                    wa.id, wa.alert_type, wa.severity, wa.status, wa.title, wa.description,
                    wa.wallet_address, wa.threshold_value, wa.actual_value, wa.resolved_at,
                    wa.resolved_by, wa.resolution_notes, wa.created_at, wa.updated_at,
                    u.email as user_email, u.invite_code,
                    admin.username as resolved_by_name
                FROM wallet_alerts wa
                LEFT JOIN user_wallets uw ON wa.wallet_address = uw.address
                LEFT JOIN users u ON uw.user_id = u.id
                LEFT JOIN admin_users admin ON wa.resolved_by = admin.id
                ${whereClause}
                ORDER BY wa.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, limitNum, offset]);
            
            // 获取总数
            const [countResult] = await connection.execute(`
                SELECT COUNT(*) as total
                FROM wallet_alerts wa
                LEFT JOIN user_wallets uw ON wa.wallet_address = uw.address
                LEFT JOIN users u ON uw.user_id = u.id
                ${whereClause}
            `, params);
            
            res.json({
                success: true,
                data: {
                    alerts,
                    pagination: {
                        current: pageNum,
                        pageSize: limitNum,
                        total: countResult[0].total
                    }
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取告警列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取告警列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 钱包监控 - 获取余额趋势
 * GET /api/admin/wallet-monitoring/balance-trends
 */
router.get('/wallet-monitoring/balance-trends', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const connection = await pool.getConnection();
        
        try {
            // 获取每日余额趋势
            const [trends] = await connection.execute(`
                SELECT 
                    DATE(created_at) as date,
                    SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as deposits,
                    SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as withdrawals,
                    COUNT(CASE WHEN type = 'deposit' THEN 1 END) as deposit_count,
                    COUNT(CASE WHEN type = 'withdraw' THEN 1 END) as withdraw_count
                FROM wallet_transactions 
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `, [parseInt(days)]);
            
            // 获取钱包余额分布
            const [distribution] = await connection.execute(`
                SELECT 
                    CASE 
                        WHEN balance = 0 THEN '0'
                        WHEN balance > 0 AND balance <= 100 THEN '0-100'
                        WHEN balance > 100 AND balance <= 1000 THEN '100-1000'
                        WHEN balance > 1000 AND balance <= 10000 THEN '1000-10000'
                        ELSE '10000+'
                    END as balance_range,
                    COUNT(*) as wallet_count
                FROM user_wallets
                GROUP BY balance_range
                ORDER BY 
                    CASE balance_range
                        WHEN '0' THEN 1
                        WHEN '0-100' THEN 2
                        WHEN '100-1000' THEN 3
                        WHEN '1000-10000' THEN 4
                        WHEN '10000+' THEN 5
                    END
            `);
            
            res.json({
                success: true,
                data: {
                    trends,
                    distribution
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取余额趋势失败:', error);
        res.status(500).json({
            success: false,
            message: '获取余额趋势失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 钱包监控 - 解决告警
 * PUT /api/admin/wallet-monitoring/alerts/:id/resolve
 */
router.put('/wallet-monitoring/alerts/:id/resolve', adminAuth, checkPermission(['wallets', 'all']), logAdminAction('resolve_wallet_alert'), async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution_notes } = req.body;
        const adminId = req.admin.id;
        
        const connection = await pool.getConnection();
        
        try {
            // 更新告警状态
            const [result] = await connection.execute(`
                UPDATE wallet_alerts 
                SET status = 'resolved', resolved_at = NOW(), resolved_by = ?, resolution_notes = ?
                WHERE id = ? AND status = 'active'
            `, [adminId, resolution_notes, id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '告警不存在或已被解决'
                });
            }
            
            res.json({
                success: true,
                message: '告警已解决'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('解决告警失败:', error);
        res.status(500).json({
            success: false,
            message: '解决告警失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 钱包监控 - 获取监控配置
 * GET /api/admin/wallet-monitoring/config
 */
router.get('/wallet-monitoring/config', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const [config] = await connection.execute(`
                SELECT * FROM wallet_monitoring_config ORDER BY id DESC LIMIT 1
            `);
            
            // 如果没有配置，返回默认配置
            if (config.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        balance_threshold: 10000,
                        transaction_threshold: 5000,
                        daily_limit: 50000,
                        alert_enabled: true,
                        email_notifications: true,
                        sms_notifications: false,
                        check_interval: 300 // 5分钟
                    }
                });
            }
            
            res.json({
                success: true,
                data: config[0]
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取监控配置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取监控配置失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 钱包监控 - 更新监控配置
 * PUT /api/admin/wallet-monitoring/config
 */
router.put('/wallet-monitoring/config', adminAuth, checkPermission(['wallets', 'all']), logAdminAction('update_wallet_monitoring_config'), async (req, res) => {
    try {
        const {
            balance_threshold,
            transaction_threshold,
            daily_limit,
            alert_enabled,
            email_notifications,
            sms_notifications,
            check_interval
        } = req.body;
        
        const connection = await pool.getConnection();
        
        try {
            // 检查是否已有配置
            const [existing] = await connection.execute(`
                SELECT id FROM wallet_monitoring_config ORDER BY id DESC LIMIT 1
            `);
            
            if (existing.length > 0) {
                // 更新现有配置
                await connection.execute(`
                    UPDATE wallet_monitoring_config 
                    SET balance_threshold = ?, transaction_threshold = ?, daily_limit = ?,
                        alert_enabled = ?, email_notifications = ?, sms_notifications = ?,
                        check_interval = ?, updated_at = NOW()
                    WHERE id = ?
                `, [
                    balance_threshold, transaction_threshold, daily_limit,
                    alert_enabled, email_notifications, sms_notifications,
                    check_interval, existing[0].id
                ]);
            } else {
                // 创建新配置
                await connection.execute(`
                    INSERT INTO wallet_monitoring_config 
                    (balance_threshold, transaction_threshold, daily_limit, alert_enabled,
                     email_notifications, sms_notifications, check_interval, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    balance_threshold, transaction_threshold, daily_limit,
                    alert_enabled, email_notifications, sms_notifications, check_interval
                ]);
            }
            
            res.json({
                success: true,
                message: '监控配置已更新'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('更新监控配置失败:', error);
        res.status(500).json({
            success: false,
            message: '更新监控配置失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== 地址管理相关接口 ====================

/**
 * 获取地址池统计信息
 * GET /api/admin/addresses/stats
 */
router.get('/addresses/stats', adminAuth, checkPermission(['addresses', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取地址池统计
            const [addressStats] = await connection.query(`
                SELECT 
                    COUNT(*) as totalAddresses,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as activeAddresses,
                    COUNT(CASE WHEN status = 'used' THEN 1 END) as usedAddresses,
                    COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reservedAddresses,
                    COUNT(CASE WHEN total_received > 0 THEN 1 END) as addressesWithBalance,
                    COALESCE(SUM(total_received), 0) as totalReceived,
                    COUNT(CASE WHEN last_deposit_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as recentActiveAddresses
                FROM user_addresses
            `);

            // 获取网络分布统计
            const [networkStats] = await connection.query(`
                SELECT 
                    network,
                    COUNT(*) as count,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as activeCount
                FROM user_addresses
                GROUP BY network
            `);

            // 获取币种分布统计
            const [currencyStats] = await connection.query(`
                SELECT 
                    currency,
                    COUNT(*) as count,
                    COALESCE(SUM(total_received), 0) as totalReceived
                FROM user_addresses
                GROUP BY currency
            `);

            const stats = addressStats[0];
            const usageRate = stats.totalAddresses > 0 ? 
                ((stats.usedAddresses + stats.reservedAddresses) / stats.totalAddresses * 100).toFixed(2) : 0;

            res.json({
                success: true,
                data: {
                    overview: {
                        totalAddresses: stats.totalAddresses,
                        activeAddresses: stats.activeAddresses,
                        usedAddresses: stats.usedAddresses,
                        reservedAddresses: stats.reservedAddresses,
                        usageRate: parseFloat(usageRate),
                        addressesWithBalance: stats.addressesWithBalance,
                        totalReceived: parseFloat(stats.totalReceived),
                        recentActiveAddresses: stats.recentActiveAddresses
                    },
                    networkDistribution: networkStats,
                    currencyDistribution: currencyStats
                },
                message: '地址池统计获取成功'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取地址池统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取地址池统计失败',
            error: error.message
        });
    }
});

/**
 * 获取地址列表
 * GET /api/admin/addresses
 */
router.get('/addresses', adminAuth, checkPermission(['addresses', 'all']), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            network, 
            currency,
            hasBalance,
            search 
        } = req.query;
        
        const offset = (page - 1) * limit;
        const connection = await pool.getConnection();
        
        try {
            // 构建查询条件
            let whereConditions = [];
            let queryParams = [];
            
            if (status) {
                whereConditions.push('ua.status = ?');
                queryParams.push(status);
            }
            
            if (network) {
                whereConditions.push('ua.network = ?');
                queryParams.push(network);
            }
            
            if (currency) {
                whereConditions.push('ua.currency = ?');
                queryParams.push(currency);
            }
            
            if (hasBalance === 'true') {
                whereConditions.push('ua.total_received > 0');
            } else if (hasBalance === 'false') {
                whereConditions.push('ua.total_received = 0');
            }
            
            if (search) {
                whereConditions.push('(ua.address LIKE ? OR u.email LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`);
            }
            
            const whereClause = whereConditions.length > 0 ? 
                'WHERE ' + whereConditions.join(' AND ') : '';
            
            // 获取地址列表
            const [addresses] = await connection.query(`
                SELECT 
                    ua.id,
                    ua.user_id,
                    ua.address,
                    ua.network,
                    ua.currency,
                    ua.status,
                    ua.total_received,
                    ua.last_deposit_at,
                    ua.created_at,
                    ua.updated_at,
                    u.email as userEmail,
                    u.invite_code as userInviteCode
                FROM user_addresses ua
                LEFT JOIN users u ON ua.user_id = u.id
                ${whereClause}
                ORDER BY ua.created_at DESC
                LIMIT ? OFFSET ?
            `, [...queryParams, parseInt(limit), offset]);
            
            // 获取总数
            const [countResult] = await connection.query(`
                SELECT COUNT(*) as total
                FROM user_addresses ua
                LEFT JOIN users u ON ua.user_id = u.id
                ${whereClause}
            `, queryParams);
            
            const total = countResult[0].total;
            
            res.json({
                success: true,
                data: {
                    addresses: addresses.map(addr => ({
                        id: addr.id,
                        userId: addr.user_id,
                        address: addr.address,
                        network: addr.network,
                        currency: addr.currency,
                        status: addr.status,
                        totalReceived: parseFloat(addr.total_received || 0),
                        lastDepositAt: addr.last_deposit_at,
                        createdAt: addr.created_at,
                        updatedAt: addr.updated_at,
                        userInfo: {
                            email: addr.userEmail,
                            inviteCode: addr.userInviteCode
                        }
                    })),
                    pagination: {
                        current: parseInt(page),
                        pageSize: parseInt(limit),
                        total: total,
                        totalPages: Math.ceil(total / limit)
                    }
                },
                message: '地址列表获取成功'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取地址列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取地址列表失败',
            error: error.message
        });
    }
});

/**
 * 批量生成地址
 * POST /api/admin/addresses/generate
 */
router.post('/addresses/generate', adminAuth, checkPermission(['addresses', 'all']), logAdminAction('generate_addresses'), async (req, res) => {
    try {
        const { count = 10, network = 'TRC20', currency = 'USDT' } = req.body;
        
        if (count > 100) {
            return res.status(400).json({
                success: false,
                message: '单次生成地址数量不能超过100个'
            });
        }
        
        const userWalletAddressService = require('../services/userWalletAddressService');
        const generatedAddresses = [];
        
        // 批量生成地址
        for (let i = 0; i < count; i++) {
            try {
                // 生成临时用户ID用于地址生成
                const tempUserId = `temp_${Date.now()}_${i}`;
                const addressInfo = await userWalletAddressService.generateNewAddress(tempUserId);
                
                // 保存到数据库（不关联用户）
                const connection = await pool.getConnection();
                try {
                    const [result] = await connection.execute(`
                        INSERT INTO user_addresses 
                        (address, network, currency, status, created_at, updated_at)
                        VALUES (?, ?, ?, 'active', NOW(), NOW())
                    `, [addressInfo.address, network, currency]);
                    
                    generatedAddresses.push({
                        id: result.insertId,
                        address: addressInfo.address,
                        network: network,
                        currency: currency,
                        status: 'active'
                    });
                } finally {
                    connection.release();
                }
            } catch (error) {
                console.error(`生成第${i + 1}个地址失败:`, error);
            }
        }
        
        res.json({
            success: true,
            data: {
                generated: generatedAddresses,
                count: generatedAddresses.length,
                requested: count
            },
            message: `成功生成${generatedAddresses.length}个地址`
        });
    } catch (error) {
        console.error('批量生成地址失败:', error);
        res.status(500).json({
            success: false,
            message: '批量生成地址失败',
            error: error.message
        });
    }
});

/**
 * 更新地址状态
 * PUT /api/admin/addresses/:id/status
 */
router.put('/addresses/:id/status', adminAuth, checkPermission(['addresses', 'all']), logAdminAction('update_address_status'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['active', 'used', 'reserved', 'disabled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的地址状态'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // 检查地址是否存在
            const [addressCheck] = await connection.query(
                'SELECT id, address, status FROM user_addresses WHERE id = ?',
                [id]
            );
            
            if (addressCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '地址不存在'
                });
            }
            
            // 更新地址状态
            await connection.execute(
                'UPDATE user_addresses SET status = ?, updated_at = NOW() WHERE id = ?',
                [status, id]
            );
            
            res.json({
                success: true,
                data: {
                    id: parseInt(id),
                    address: addressCheck[0].address,
                    oldStatus: addressCheck[0].status,
                    newStatus: status
                },
                message: '地址状态更新成功'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('更新地址状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新地址状态失败',
            error: error.message
        });
    }
});

/**
 * 获取地址白名单
 * GET /api/admin/addresses/whitelist
 */
router.get('/addresses/whitelist', adminAuth, checkPermission(['addresses', 'all']), async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (page - 1) * limit;
        const connection = await pool.getConnection();
        
        try {
            // 构建查询条件
            let whereClause = '';
            let queryParams = [];
            
            if (search) {
                whereClause = 'WHERE address LIKE ? OR label LIKE ?';
                queryParams.push(`%${search}%`, `%${search}%`);
            }
            
            // 获取白名单列表
            const [whitelist] = await connection.query(`
                SELECT id, address, label, network, status, created_at, updated_at
                FROM address_whitelist
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [...queryParams, parseInt(limit), offset]);
            
            // 获取总数
            const [countResult] = await connection.query(`
                SELECT COUNT(*) as total
                FROM address_whitelist
                ${whereClause}
            `, queryParams);
            
            const total = countResult[0].total;
            
            res.json({
                success: true,
                data: {
                    whitelist: whitelist,
                    pagination: {
                        current: parseInt(page),
                        pageSize: parseInt(limit),
                        total: total,
                        totalPages: Math.ceil(total / limit)
                    }
                },
                message: '地址白名单获取成功'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取地址白名单失败:', error);
        res.status(500).json({
            success: false,
            message: '获取地址白名单失败',
            error: error.message
        });
    }
});

/**
 * 添加地址到白名单
 * POST /api/admin/addresses/whitelist
 */
router.post('/addresses/whitelist', adminAuth, checkPermission(['addresses', 'all']), logAdminAction('add_address_whitelist'), async (req, res) => {
    try {
        const { address, label, network = 'TRC20' } = req.body;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                message: '地址不能为空'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // 检查地址是否已在白名单中
            const [existing] = await connection.query(
                'SELECT id FROM address_whitelist WHERE address = ?',
                [address]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '地址已在白名单中'
                });
            }
            
            // 添加到白名单
            const [result] = await connection.execute(`
                INSERT INTO address_whitelist (address, label, network, status, created_at, updated_at)
                VALUES (?, ?, ?, 'active', NOW(), NOW())
            `, [address, label || '', network]);
            
            res.json({
                success: true,
                data: {
                    id: result.insertId,
                    address: address,
                    label: label,
                    network: network,
                    status: 'active'
                },
                message: '地址已添加到白名单'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('添加地址白名单失败:', error);
        res.status(500).json({
            success: false,
            message: '添加地址白名单失败',
            error: error.message
        });
    }
});

/**
 * 从白名单移除地址
 * DELETE /api/admin/addresses/whitelist/:id
 */
router.delete('/addresses/whitelist/:id', adminAuth, checkPermission(['addresses', 'all']), logAdminAction('remove_address_whitelist'), async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        
        try {
            // 检查地址是否存在
            const [addressCheck] = await connection.query(
                'SELECT address FROM address_whitelist WHERE id = ?',
                [id]
            );
            
            if (addressCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '白名单地址不存在'
                });
            }
            
            // 删除地址
            await connection.execute(
                'DELETE FROM address_whitelist WHERE id = ?',
                [id]
            );
            
            res.json({
                success: true,
                data: {
                    id: parseInt(id),
                    address: addressCheck[0].address
                },
                message: '地址已从白名单移除'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('移除地址白名单失败:', error);
        res.status(500).json({
            success: false,
            message: '移除地址白名单失败',
            error: error.message
        });
    }
});

/**
 * 团队管理 - 获取团队统计信息
 * GET /api/admin/teams/stats
 */
router.get('/teams/stats', adminAuth, checkPermission(['teams', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取团队总体统计
            const [teamStats] = await connection.query(`
                SELECT 
                    COUNT(DISTINCT u.id) as totalUsers,
                    COUNT(DISTINCT CASE WHEN u.inviter_code IS NOT NULL THEN u.id END) as invitedUsers,
                    COUNT(DISTINCT u.inviter_code) as activeInviters,
                    AVG(u.team_count) as avgTeamSize,
                    MAX(u.team_count) as maxTeamSize,
                    SUM(u.team_count) as totalTeamMembers
                FROM users u
                WHERE u.status = 'active'
            `);

            // 获取邀请层级分布
            const [levelDistribution] = await connection.query(`
                WITH RECURSIVE team_hierarchy AS (
                    -- 根节点（没有邀请人的用户）
                    SELECT id, inviter_code, 1 as level
                    FROM users 
                    WHERE inviter_code IS NULL OR inviter_code = ''
                    
                    UNION ALL
                    
                    -- 递归查找下级
                    SELECT u.id, u.inviter_code, th.level + 1
                    FROM users u
                    INNER JOIN team_hierarchy th ON u.inviter_code = (
                        SELECT invite_code FROM users WHERE id = th.id
                    )
                    WHERE th.level < 10  -- 限制递归深度
                )
                SELECT 
                    level,
                    COUNT(*) as count
                FROM team_hierarchy
                GROUP BY level
                ORDER BY level
            `);

            // 获取今日新增团队数据
            const [todayStats] = await connection.query(`
                SELECT 
                    COUNT(*) as newUsersToday,
                    COUNT(CASE WHEN inviter_code IS NOT NULL THEN 1 END) as newInvitedToday
                FROM users 
                WHERE DATE(created_at) = CURDATE()
            `);

            // 获取活跃邀请人排行
            const [topInviters] = await connection.query(`
                SELECT 
                    u.id,
                    u.email as username,
                    u.invite_code,
                    u.team_count,
                    COUNT(invited.id) as directInvites,
                    u.total_earnings
                FROM users u
                LEFT JOIN users invited ON invited.inviter_code = u.invite_code
                WHERE u.team_count > 0
                GROUP BY u.id, u.email, u.invite_code, u.team_count, u.total_earnings
                ORDER BY u.team_count DESC, directInvites DESC
                LIMIT 10
            `);

            const teamData = teamStats[0];
            const todayData = todayStats[0];

            res.json({
                success: true,
                data: {
                    overview: {
                        totalUsers: teamData.totalUsers,
                        invitedUsers: teamData.invitedUsers,
                        activeInviters: teamData.activeInviters,
                        avgTeamSize: parseFloat(teamData.avgTeamSize || '0').toFixed(2),
                        maxTeamSize: teamData.maxTeamSize,
                        totalTeamMembers: teamData.totalTeamMembers,
                        newUsersToday: todayData.newUsersToday,
                        newInvitedToday: todayData.newInvitedToday
                    },
                    levelDistribution: levelDistribution,
                    topInviters: topInviters.map(inviter => ({
                        ...inviter,
                        username: inviter.username ? inviter.username.replace(/(.{3}).*(@.*)/, '$1***$2') : 'N/A'
                    }))
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取团队统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取团队统计失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 团队管理 - 获取团队列表
 * GET /api/admin/teams
 */
router.get('/teams', adminAuth, checkPermission(['teams', 'all']), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            sortBy = 'team_count', 
            sortOrder = 'desc',
            minTeamSize = 0,
            status = 'all'
        } = req.query;

        const connection = await pool.getConnection();
        
        try {
            let whereConditions = ['u.team_count >= ?'];
            let queryParams = [parseInt(minTeamSize)];

            // 搜索条件
            if (search) {
                whereConditions.push('(u.email LIKE ? OR u.invite_code LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`);
            }

            // 状态筛选
            if (status !== 'all') {
                whereConditions.push('u.status = ?');
                queryParams.push(status);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // 获取总数
            const [countResult] = await connection.query(`
                SELECT COUNT(*) as total 
                FROM users u 
                ${whereClause}
            `, queryParams);

            const total = countResult[0].total;

            // 获取团队列表
            const offset = (page - 1) * limit;
            const orderBy = `ORDER BY u.${sortBy} ${sortOrder.toUpperCase()}`;

            const [teams] = await connection.query(`
                SELECT 
                    u.id,
                    u.email,
                    u.invite_code,
                    u.inviter_code,
                    u.team_count,
                    u.activation_count,
                    u.total_earnings,
                    u.balance,
                    u.status,
                    u.created_at,
                    u.last_activation_time,
                    COUNT(invited.id) as directInvites,
                    inviter.email as inviterEmail
                FROM users u
                LEFT JOIN users invited ON invited.inviter_code = u.invite_code
                LEFT JOIN users inviter ON inviter.invite_code = u.inviter_code
                ${whereClause}
                GROUP BY u.id, u.email, u.invite_code, u.inviter_code, u.team_count, 
                         u.activation_count, u.total_earnings, u.balance, u.status, 
                         u.created_at, u.last_activation_time, inviter.email
                ${orderBy}
                LIMIT ? OFFSET ?
            `, [...queryParams, parseInt(limit), offset]);

            res.json({
                success: true,
                data: {
                    teams: teams.map(team => ({
                        ...team,
                        email: team.email ? team.email.replace(/(.{3}).*(@.*)/, '$1***$2') : 'N/A',
                        inviterEmail: team.inviterEmail ? team.inviterEmail.replace(/(.{3}).*(@.*)/, '$1***$2') : null
                    })),
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取团队列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取团队列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 团队管理 - 获取团队详情和结构
 * GET /api/admin/teams/:userId/structure
 */
router.get('/teams/:userId/structure', adminAuth, checkPermission(['teams', 'all']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { depth = 3 } = req.query;

        const connection = await pool.getConnection();
        
        try {
            // 获取用户基本信息
            const [userInfo] = await connection.query(`
                SELECT 
                    id, email, invite_code, inviter_code, team_count, 
                    activation_count, total_earnings, balance, status, created_at
                FROM users 
                WHERE id = ?
            `, [userId]);

            if (userInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            const user = userInfo[0];

            // 递归获取团队结构
            const getTeamStructure = async (inviteCode, currentDepth = 1, maxDepth = parseInt(depth)) => {
                if (currentDepth > maxDepth) return [];

                const [members] = await connection.query(`
                    SELECT 
                        id, email, invite_code, team_count, activation_count, 
                        total_earnings, balance, status, created_at
                    FROM users 
                    WHERE inviter_code = ?
                    ORDER BY created_at DESC
                `, [inviteCode]);

                const result = [];
                for (const member of members) {
                    const children = await getTeamStructure(member.invite_code, currentDepth + 1, maxDepth);
                    result.push({
                        ...member,
                        email: member.email ? member.email.replace(/(.{3}).*(@.*)/, '$1***$2') : 'N/A',
                        level: currentDepth,
                        children: children
                    });
                }

                return result;
            };

            const teamStructure = await getTeamStructure(user.invite_code);

            // 获取团队统计
            const [teamStats] = await connection.query(`
                WITH RECURSIVE team_members AS (
                    SELECT id, invite_code, inviter_code, 1 as level
                    FROM users 
                    WHERE id = ?
                    
                    UNION ALL
                    
                    SELECT u.id, u.invite_code, u.inviter_code, tm.level + 1
                    FROM users u
                    INNER JOIN team_members tm ON u.inviter_code = (
                        SELECT invite_code FROM users WHERE id = tm.id
                    )
                    WHERE tm.level < ?
                )
                SELECT 
                    COUNT(*) - 1 as totalMembers,
                    COUNT(CASE WHEN level = 2 THEN 1 END) as directMembers,
                    MAX(level) - 1 as maxDepth,
                    AVG(CASE WHEN level > 1 THEN level - 1 END) as avgDepth
                FROM team_members
            `, [userId, parseInt(depth) + 1]);

            res.json({
                success: true,
                data: {
                    userInfo: {
                        ...user,
                        email: user.email ? user.email.replace(/(.{3}).*(@.*)/, '$1***$2') : 'N/A'
                    },
                    teamStructure: teamStructure,
                    teamStats: teamStats[0]
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取团队结构错误:', error);
        res.status(500).json({
            success: false,
            message: '获取团队结构失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 团队管理 - 获取邀请关系分析
 * GET /api/admin/teams/invite-analysis
 */
router.get('/teams/invite-analysis', adminAuth, checkPermission(['teams', 'all']), async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        
        let dateCondition = '';
        switch (period) {
            case '1d':
                dateCondition = 'DATE(created_at) = CURDATE()';
                break;
            case '7d':
                dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case '30d':
                dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            default:
                dateCondition = '1=1';
        }

        const connection = await pool.getConnection();
        
        try {
            // 邀请趋势分析
            const [inviteTrends] = await connection.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as totalRegistrations,
                    COUNT(CASE WHEN inviter_code IS NOT NULL THEN 1 END) as invitedRegistrations,
                    COUNT(CASE WHEN inviter_code IS NULL THEN 1 END) as directRegistrations
                FROM users 
                WHERE ${dateCondition}
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `);

            // 邀请效果分析
            const [inviteEffectiveness] = await connection.query(`
                SELECT 
                    inviter.email as inviterEmail,
                    inviter.invite_code,
                    COUNT(invited.id) as totalInvites,
                    COUNT(CASE WHEN invited.activation_count > 0 THEN 1 END) as activatedInvites,
                    COUNT(CASE WHEN invited.${dateCondition.replace('created_at', 'invited.created_at')} THEN 1 END) as recentInvites,
                    AVG(invited.total_earnings) as avgEarnings,
                    SUM(invited.total_earnings) as totalEarnings
                FROM users inviter
                LEFT JOIN users invited ON invited.inviter_code = inviter.invite_code
                WHERE inviter.team_count > 0
                GROUP BY inviter.id, inviter.email, inviter.invite_code
                HAVING totalInvites > 0
                ORDER BY totalInvites DESC
                LIMIT 20
            `);

            // 转化率分析
            const [conversionAnalysis] = await connection.query(`
                SELECT 
                    COUNT(*) as totalInvited,
                    COUNT(CASE WHEN activation_count > 0 THEN 1 END) as activated,
                    COUNT(CASE WHEN activation_count > 0 THEN 1 END) / COUNT(*) * 100 as conversionRate,
                    AVG(CASE WHEN activation_count > 0 THEN TIMESTAMPDIFF(HOUR, created_at, last_activation_time) END) as avgActivationTime
                FROM users 
                WHERE inviter_code IS NOT NULL AND ${dateCondition}
            `);

            res.json({
                success: true,
                data: {
                    inviteTrends: inviteTrends,
                    inviteEffectiveness: inviteEffectiveness.map(item => ({
                        ...item,
                        inviterEmail: item.inviterEmail ? item.inviterEmail.replace(/(.{3}).*(@.*)/, '$1***$2') : 'N/A'
                    })),
                    conversionAnalysis: conversionAnalysis[0]
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取邀请关系分析错误:', error);
        res.status(500).json({
            success: false,
            message: '获取邀请关系分析失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 团队管理 - 更新团队成员状态
 * PUT /api/admin/teams/:userId/status
 */
router.put('/teams/:userId/status', adminAuth, checkPermission(['teams', 'all']), logAdminAction('update_team_member_status'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, reason } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }

        const connection = await pool.getConnection();
        
        try {
            // 检查用户是否存在
            const [userCheck] = await connection.query(`
                SELECT id, email, status as currentStatus FROM users WHERE id = ?
            `, [userId]);

            if (userCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            const user = userCheck[0];

            // 更新用户状态
            await connection.query(`
                UPDATE users 
                SET status = ?, updated_at = NOW() 
                WHERE id = ?
            `, [status, userId]);

            // 记录操作日志
            await connection.query(`
                INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at)
                VALUES (?, 'update_team_member_status', 'user', ?, ?, NOW())
            `, [
                req.admin.id,
                userId,
                JSON.stringify({
                    oldStatus: user.currentStatus,
                    newStatus: status,
                    reason: reason || '无',
                    userEmail: user.email
                })
            ]);

            res.json({
                success: true,
                message: '团队成员状态更新成功',
                data: {
                    userId: userId,
                    oldStatus: user.currentStatus,
                    newStatus: status
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('更新团队成员状态错误:', error);
        res.status(500).json({
            success: false,
            message: '更新团队成员状态失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;