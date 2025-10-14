const express = require('express');
const router = express.Router();
const { adminAuth, checkPermission, logAdminAction } = require('../middleware/adminAuth');
const { pool } = require('../config/database');

/**
 * 获取验证码
 * GET /api/admin/captcha
 */
router.get('/captcha', (req, res) => {
    try {
        // 简单的验证码实现，返回一个固定的验证码图片URL
        const captchaUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMzMzIj4xMjM0PC90ZXh0Pjwvc3ZnPg==';
        
        res.json({
            success: true,
            message: '获取验证码成功',
            data: {
                captchaUrl: captchaUrl
            }
        });
    } catch (error) {
        console.error('获取验证码失败:', error);
        res.status(500).json({
            success: false,
            message: '获取验证码失败'
        });
    }
});

/**
 * 管理员登录
 * POST /api/admin/login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('登录请求:', { username, password }); // 调试日志
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 临时简化登录逻辑，直接验证用户名密码
        if (username === 'admin' && password === 'admin123') {
            // 生成简单的 token
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                {
                    id: 1,
                    username: 'admin',
                    role: 'super_admin',
                    permissions: ['all'],
                    isAdmin: true
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            req.session.adminUser = {
                id: 1,
                username: 'admin',
                role: 'super_admin',
                permissions: ['all']
            };
            
            res.json({
                success: true,
                message: '登录成功',
                data: {
                    token: token,
                    username: 'admin',
                    role: 'super_admin',
                    permissions: ['all']
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('管理员登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败'
        });
    }
});

/**
 * 验证管理员登录状态
 * GET /api/admin/verify
 */
router.get('/verify', adminAuth, (req, res) => {
    res.json({
        success: true,
        data: {
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
    req.session.destroy();
    res.json({ success: true, message: '登出成功' });
});

/**
 * 获取用户统计数据
 * GET /api/admin/users/stats
 */
router.get('/users/stats', adminAuth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
                    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_new_users
                FROM users
            `);
            
            res.json({
                success: true,
                data: stats[0]
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
            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_volume
                FROM wallet_transactions
            `);
            
            res.json({
                success: true,
                data: stats[0]
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
 * 获取交易统计数据（详细版本）
 * GET /api/admin/transactions/statistics
 */
router.get('/transactions/statistics', adminAuth, checkPermission(['transactions', 'all']), async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        const connection = await pool.getConnection();
        
        try {
            // 根据时间段设置条件
            let dateCondition = '';
            switch (period) {
                case '1d':
                    dateCondition = 'AND DATE(created_at) = CURDATE()';
                    break;
                case '7d':
                    dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                    break;
                case '30d':
                    dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                    break;
                case 'all':
                default:
                    dateCondition = '';
                    break;
            }

            // 检查表是否存在
            const [tableExists] = await connection.execute(
                `SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'wallet_transactions'`
            );

            if (tableExists[0].count === 0) {
                // 表不存在，返回空数据
                return res.json({
                    success: true,
                    data: {
                        basic: {
                            total_transactions: 0,
                            completed_transactions: 0,
                            pending_transactions: 0,
                            failed_transactions: 0,
                            total_volume: 0,
                            avg_amount: 0
                        },
                        byType: [],
                        byRisk: [
                            { risk_level: 'low', count: 0 },
                            { risk_level: 'medium', count: 0 },
                            { risk_level: 'high', count: 0 }
                        ],
                        byApproval: [
                            { approval_status: 'pending', count: 0 },
                            { approval_status: 'approved', count: 0 },
                            { approval_status: 'rejected', count: 0 }
                        ],
                        period: period
                    }
                });
            }

            // 基础统计 - 使用字符串拼接而不是模板字符串
            const basicStatsQuery = 
                `SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_volume,
                    COALESCE(AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END), 0) as avg_amount
                FROM wallet_transactions 
                WHERE 1=1 ` + dateCondition;
            const [basicStats] = await connection.execute(basicStatsQuery);

            // 按类型统计 - 使用字符串拼接而不是模板字符串
            const typeStatsQuery = 
                `SELECT 
                    type,
                    COUNT(*) as count,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as volume
                FROM wallet_transactions 
                WHERE 1=1 ` + dateCondition + `
                GROUP BY type`;
            const [typeStats] = await connection.execute(typeStatsQuery);

            // 风险等级统计 - 使用固定值，因为表中没有此字段
            const riskStats = [
                { risk_level: 'low', count: 0 },
                { risk_level: 'medium', count: 0 },
                { risk_level: 'high', count: 0 }
            ];

            // 审批状态统计 - 使用固定值，因为表中没有此字段  
            const approvalStats = [
                { approval_status: 'pending', count: 0 },
                { approval_status: 'approved', count: 0 },
                { approval_status: 'rejected', count: 0 }
            ];

            res.json({
                success: true,
                data: {
                    basic: basicStats[0],
                    byType: typeStats,
                    byRisk: riskStats,
                    byApproval: approvalStats,
                    period: period
                }
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
            
            // 风险等级筛选 - 暂时注释掉，因为数据库表中没有这个字段
            // if (riskLevel) {
            //     whereClause += ' AND wt.risk_level = ?';
            //     params.push(riskLevel);
            // }

            // 获取交易列表
            const transactionQuery = `
                SELECT 
                    wt.id, wt.user_id, wt.type, wt.amount, wt.balance_before, 
                    wt.balance_after, wt.status, wt.transaction_hash, wt.description,
                    wt.deposit_record_id, wt.withdrawal_record_id, wt.created_at, wt.updated_at,
                    u.email, u.invite_code, u.status as user_status
                FROM wallet_transactions wt
                LEFT JOIN users u ON wt.user_id = u.id
                ${whereClause}
                ORDER BY wt.created_at DESC 
                LIMIT ${limitNum} OFFSET ${offset}
            `;
            const [transactions] = await connection.execute(transactionQuery, params);

            // 获取总数
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM wallet_transactions wt
                LEFT JOIN users u ON wt.user_id = u.id
                ${whereClause}
            `;
            const [countResult] = await connection.execute(countQuery, params);

            const total = countResult[0].total;

            res.json({
                success: true,
                data: {
                    transactions: transactions.map(tx => ({
                        ...tx,
                        amount: parseFloat(tx.amount),
                        balance_before: parseFloat(tx.balance_before),
                        balance_after: parseFloat(tx.balance_after)
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
 * 获取单个交易详情
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
                    wt.*,
                    u.email as username,
                    u.email,
                    u.telegram_username
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

            // 获取相关交易
            const [relatedTransactions] = await connection.execute(`
                SELECT id, type, amount, status, created_at
                FROM wallet_transactions 
                WHERE user_id = ? AND id != ?
                ORDER BY created_at DESC 
                LIMIT 5
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
                        fee: parseFloat(transaction.fee || 0)
                    },
                    relatedTransactions: relatedTransactions.map(t => ({
                        ...t,
                        amount: parseFloat(t.amount)
                    })),
                    riskAssessments
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('获取交易详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取交易详情失败'
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
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users', adminAuth, checkPermission(['users', 'all']), async (req, res) => {
    try {
        const connection = await pool.getConnection();

        try {
            // 获取用户列表 - 最简化查询，不使用参数绑定
            const [users] = await connection.query(`
                SELECT 
                    u.id,
                    u.email,
                    u.status,
                    u.created_at
                FROM users u
                ORDER BY u.id DESC
                LIMIT 10 OFFSET 0
            `);

            // 获取总数 - 简化查询，不使用参数绑定
            const [countResult] = await connection.query(`
                SELECT COUNT(*) as total
                FROM users u
            `);

            const total = countResult[0].total;

            res.json({
                success: true,
                message: '获取用户列表成功',
                data: {
                    users: users.map(user => ({
                        id: user.id,
                        email: user.email,
                        status: user.status,
                        created_at: user.created_at
                    })),
                    pagination: {
                        page: 1,
                        limit: 10,
                        total,
                        totalPages: Math.ceil(total / 10)
                    }
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
router.get('/users/:id', adminAuth, checkPermission(['users', 'all']), async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();

        try {
            // 获取用户基本信息
            const [users] = await connection.execute(`
                SELECT 
                    u.id,
                    u.email as username,
                    u.email,
                    u.telegram_username,
                    u.status,
                    u.invite_code as inviteCode,
                    u.inviter_id as invitedBy,
                    u.created_at as createdAt,
                    u.updated_at as updatedAt,
                    COALESCE(u.balance, 0) as balance,
                    COALESCE(u.frozen_balance, 0) as frozenBalance,
                    u.total_earnings as totalEarnings,
                    u.team_count as teamCount,
                    u.activation_count as activationCount,
                    u.last_activation_time as lastActivationTime,
                    u.countdown_end_time as countdownEndTime,
                    uw.wallet_address as walletAddress
                FROM users u
                LEFT JOIN user_wallets uw ON u.id = uw.user_id
                WHERE u.id = ?
            `, [id]);

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            const user = users[0];

            // 获取用户统计信息
            const [stats] = await connection.execute(`
                SELECT 
                    COUNT(CASE WHEN t.type = 'deposit' AND t.status = 'completed' THEN 1 END) as totalDeposits,
                    COUNT(CASE WHEN t.type = 'withdraw' AND t.status = 'completed' THEN 1 END) as totalWithdraws,
                    COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) as totalDepositAmount,
                    COALESCE(SUM(CASE WHEN t.type = 'withdraw' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) as totalWithdrawAmount,
                    COUNT(CASE WHEN DATE(t.created_at) = CURDATE() THEN 1 END) as todayTransactions
                FROM wallet_transactions t
                WHERE t.user_id = ?
            `, [id]);

            // 获取邀请的用户数量
            const [inviteStats] = await connection.execute(`
                SELECT COUNT(*) as invitedUsers
                FROM users
                WHERE invited_by = ?
            `, [id]);

            res.json({
                success: true,
                message: '获取用户详情成功',
                data: {
                    user: {
                        ...user,
                        balance: parseFloat(user.balance || '0'),
                        frozenBalance: parseFloat(user.frozenBalance || '0')
                    },
                    statistics: {
                        ...stats[0],
                        totalDepositAmount: parseFloat(stats[0].totalDepositAmount || '0'),
                        totalWithdrawAmount: parseFloat(stats[0].totalWithdrawAmount || '0'),
                        invitedUsers: inviteStats[0].invitedUsers
                    }
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('获取用户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 更新用户状态
 * PUT /api/admin/users/:id/status
 */
router.put('/users/:id/status', adminAuth, checkPermission(['users', 'all']), logAdminAction('update_user_status'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        // 验证状态值
        const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的用户状态'
            });
        }

        const connection = await pool.getConnection();

        try {
            // 检查用户是否存在
            const [users] = await connection.execute('SELECT id, status FROM users WHERE id = ?', [id]);
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            const currentStatus = users[0].status;

            // 更新用户状态
            await connection.execute(`
                UPDATE users 
                SET status = ?, updated_at = NOW() 
                WHERE id = ?
            `, [status, id]);

            // 记录状态变更日志
            await connection.execute(`
                INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at)
                VALUES (?, 'update_user_status', 'user', ?, ?, NOW())
            `, [
                req.adminUser.id,
                id,
                JSON.stringify({
                    oldStatus: currentStatus,
                    newStatus: status,
                    reason: reason || '管理员操作'
                })
            ]);

            res.json({
                success: true,
                message: '用户状态更新成功',
                data: {
                    userId: parseInt(id),
                    oldStatus: currentStatus,
                    newStatus: status
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户状态失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 删除用户
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', adminAuth, checkPermission(['users', 'all']), logAdminAction('delete_user'), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 检查用户是否存在
            const [users] = await connection.execute('SELECT id, name as username, email FROM users WHERE id = ?', [id]);
            
            if (users.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            const user = users[0];

            // 检查用户是否有未完成的交易
            const [pendingTransactions] = await connection.execute(`
                SELECT COUNT(*) as count 
                FROM wallet_transactions 
                WHERE user_id = ? AND status = 'pending'
            `, [id]);

            if (pendingTransactions[0].count > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: '用户有未完成的交易，无法删除'
                });
            }

            // 软删除用户（标记为已删除，不实际删除数据）
            await connection.execute(`
                UPDATE users 
                SET status = 'deleted', 
                    email = CONCAT(email, '_deleted_', UNIX_TIMESTAMP()),
                    name = CONCAT(name, '_deleted_', UNIX_TIMESTAMP()),
                    updated_at = NOW() 
                WHERE id = ?
            `, [id]);

            // 记录删除日志
            await connection.execute(`
                INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at)
                VALUES (?, 'delete_user', 'user', ?, ?, NOW())
            `, [
                req.adminUser.id,
                id,
                JSON.stringify({
                    username: user.username,
                    email: user.email,
                    reason: reason || '管理员删除'
                })
            ]);

            await connection.commit();

            res.json({
                success: true,
                message: '用户删除成功',
                data: {
                    userId: parseInt(id),
                    username: user.username
                }
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({
            success: false,
            message: '删除用户失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;