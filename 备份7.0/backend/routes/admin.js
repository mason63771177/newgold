const express = require('express');
const router = express.Router();
const { adminAuth, validateAdminLogin, checkPermission, logAdminAction } = require('../middleware/adminAuth');

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
                message: '登录成功',
                token: result.token,
                user: result.user
            });
        } else {
            res.status(401).json({
                success: false,
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
    // 在实际应用中，可以将token加入黑名单
    res.json({
        success: true,
        message: '登出成功'
    });
});

/**
 * 获取系统统计数据
 * GET /api/admin/stats
 */
router.get('/stats', adminAuth, async (req, res) => {
    try {
        // 这里需要根据实际数据库查询统计数据
        const stats = {
            users: {
                total: 0,
                active: 0,
                newToday: 0
            },
            transactions: {
                total: 0,
                todayAmount: 0,
                pendingCount: 0
            },
            wallets: {
                totalBalance: 0,
                activeAddresses: 0,
                poolAddresses: 0
            },
            tasks: {
                totalCompleted: 0,
                activeUsers: 0
            },
            redPackets: {
                totalSent: 0,
                totalAmount: 0,
                todayCount: 0
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
});

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users', adminAuth, checkPermission(['users', 'all']), async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status = '' } = req.query;
        
        // 这里需要根据实际数据库查询用户数据
        const users = {
            data: [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                pages: 0
            }
        };

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
router.get('/users/:id', adminAuth, checkPermission(['users', 'all']), async (req, res) => {
    try {
        const userId = req.params.id;
        
        // 这里需要根据实际数据库查询用户详情
        const user = {
            id: userId,
            // 用户详细信息
        };

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('获取用户详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户详情失败'
        });
    }
});

/**
 * 更新用户状态
 * PUT /api/admin/users/:id/status
 */
router.put('/users/:id/status', 
    adminAuth, 
    checkPermission(['users', 'all']), 
    logAdminAction('update_user_status'),
    async (req, res) => {
        try {
            const userId = req.params.id;
            const { status } = req.body;

            // 这里需要根据实际数据库更新用户状态
            
            res.json({
                success: true,
                message: '用户状态更新成功'
            });
        } catch (error) {
            console.error('更新用户状态错误:', error);
            res.status(500).json({
                success: false,
                message: '更新用户状态失败'
            });
        }
    }
);

/**
 * 获取交易记录
 * GET /api/admin/transactions
 */
router.get('/transactions', adminAuth, checkPermission(['transactions', 'all']), async (req, res) => {
    try {
        const { page = 1, limit = 20, type = '', status = '' } = req.query;
        
        // 这里需要根据实际数据库查询交易记录
        const transactions = {
            data: [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                pages: 0
            }
        };

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('获取交易记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易记录失败'
        });
    }
});

/**
 * 获取钱包地址列表
 * GET /api/admin/wallets
 */
router.get('/wallets', adminAuth, checkPermission(['wallets', 'all']), async (req, res) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;
        
        // 这里需要根据实际数据库查询钱包地址
        const wallets = {
            data: [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                pages: 0
            }
        };

        res.json({
            success: true,
            data: wallets
        });
    } catch (error) {
        console.error('获取钱包地址错误:', error);
        res.status(500).json({
            success: false,
            message: '获取钱包地址失败'
        });
    }
});

// 获取系统统计数据
router.get('/stats', adminAuth, async (req, res) => {
    try {
        // 获取用户统计
        const totalUsersResult = await db.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = totalUsersResult[0].count;

        // 获取昨日用户数用于计算增长
        const yesterdayUsersResult = await db.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE DATE(created_at) = DATE(NOW() - INTERVAL 1 DAY)
        `);
        const yesterdayUsers = yesterdayUsersResult[0].count;
        const userChange = yesterdayUsers > 0 ? `+${((yesterdayUsers / totalUsers) * 100).toFixed(1)}%` : '0%';

        // 获取钱包总余额
        const totalBalanceResult = await db.query('SELECT SUM(balance) as total FROM wallets');
        const totalBalance = totalBalanceResult[0].total || 0;

        // 获取今日交易数
        const todayTransactionsResult = await db.query(`
            SELECT COUNT(*) as count FROM transactions 
            WHERE DATE(created_at) = CURDATE()
        `);
        const todayTransactions = todayTransactionsResult[0].count;

        // 获取已完成任务数
        const completedTasksResult = await db.query(`
            SELECT COUNT(*) as count FROM user_tasks 
            WHERE status = 'completed'
        `);
        const completedTasks = completedTasksResult[0].count;

        // 获取红包发放数
        const redPacketsSentResult = await db.query(`
            SELECT COUNT(*) as count FROM red_packet_records 
            WHERE DATE(created_at) = CURDATE()
        `);
        const redPacketsSent = redPacketsSentResult[0].count;

        // 获取活跃团队数
        const activeTeamsResult = await db.query(`
            SELECT COUNT(DISTINCT inviter_id) as count FROM users 
            WHERE inviter_id IS NOT NULL
        `);
        const activeTeams = activeTeamsResult[0].count;

        res.json({
            success: true,
            data: {
                totalUsers,
                userChange,
                totalBalance,
                balanceChange: '+8.3%', // 模拟数据
                todayTransactions,
                transactionChange: '+15.2%', // 模拟数据
                completedTasks,
                taskChange: '+22.1%', // 模拟数据
                redPacketsSent,
                redPacketChange: '+5.4%', // 模拟数据
                activeTeams,
                teamChange: '+18.7%' // 模拟数据
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
});

// 获取实时活动
router.get('/activity', adminAuth, async (req, res) => {
    try {
        // 获取最近的活动记录
        const activities = await db.query(`
            SELECT 
                'user' as type,
                CONCAT('用户 ', username, ' 注册成功') as description,
                created_at as createdAt
            FROM users 
            WHERE created_at >= NOW() - INTERVAL 1 HOUR
            
            UNION ALL
            
            SELECT 
                'transaction' as type,
                CONCAT('用户 ', u.username, ' ', 
                    CASE t.type 
                        WHEN 'deposit' THEN '充值' 
                        WHEN 'withdraw' THEN '提现' 
                        ELSE '交易' 
                    END, ' ', t.amount, ' TRX') as description,
                t.created_at as createdAt
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.created_at >= NOW() - INTERVAL 1 HOUR
            
            UNION ALL
            
            SELECT 
                'task' as type,
                CONCAT('用户 ', u.username, ' 完成任务') as description,
                ut.updated_at as createdAt
            FROM user_tasks ut
            JOIN users u ON ut.user_id = u.id
            WHERE ut.status = 'completed' AND ut.updated_at >= NOW() - INTERVAL 1 HOUR
            
            ORDER BY createdAt DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('获取活动记录失败:', error);
        res.status(500).json({
            success: false,
            message: '获取活动记录失败'
        });
    }
});

// 获取系统状态
router.get('/system-status', adminAuth, async (req, res) => {
    try {
        const status = {
            database: {
                status: 'healthy',
                responseTime: 15
            },
            tatum: {
                status: 'healthy',
                responseTime: 120
            },
            redis: {
                status: 'healthy',
                responseTime: 5
            },
            server: {
                status: 'healthy',
                load: 0.15
            }
        };

        res.json(status);
    } catch (error) {
        console.error('获取系统状态失败:', error);
        res.status(500).json({ success: false, message: '获取系统状态失败' });
    }
});

// 获取用户增长数据
router.get('/user-growth', adminAuth, async (req, res) => {
    try {
        const period = parseInt(req.query.period) || 30;
        
        // 生成模拟数据
        const labels = [];
        const values = [];
        const today = new Date();
        
        for (let i = period - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
            values.push(Math.floor(Math.random() * 50) + 10);
        }

        res.json({ labels, values });
    } catch (error) {
        console.error('获取用户增长数据失败:', error);
        res.status(500).json({ success: false, message: '获取用户增长数据失败' });
    }
});

// 获取交易类型分布
router.get('/transaction-distribution', adminAuth, async (req, res) => {
    try {
        const values = [
            Math.floor(Math.random() * 100) + 50, // 充值
            Math.floor(Math.random() * 80) + 30,  // 提现
            Math.floor(Math.random() * 60) + 20,  // 转账
            Math.floor(Math.random() * 40) + 15,  // 红包
            Math.floor(Math.random() * 70) + 25   // 任务奖励
        ];

        res.json({ values });
    } catch (error) {
        console.error('获取交易分布数据失败:', error);
        res.status(500).json({ success: false, message: '获取交易分布数据失败' });
    }
});

// 获取收支数据
router.get('/revenue-data', adminAuth, async (req, res) => {
    try {
        const income = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10000) + 5000);
        const expense = Array.from({ length: 6 }, () => Math.floor(Math.random() * 8000) + 3000);

        res.json({ income, expense });
    } catch (error) {
        console.error('获取收支数据失败:', error);
        res.status(500).json({ success: false, message: '获取收支数据失败' });
    }
});

// 获取用户活跃度数据
router.get('/user-activity', adminAuth, async (req, res) => {
    try {
        const thisWeek = Array.from({ length: 6 }, () => Math.floor(Math.random() * 100));
        const lastWeek = Array.from({ length: 6 }, () => Math.floor(Math.random() * 100));

        res.json({ thisWeek, lastWeek });
    } catch (error) {
        console.error('获取用户活跃度数据失败:', error);
        res.status(500).json({ success: false, message: '获取用户活跃度数据失败' });
    }
});

// 获取任务完成数据
router.get('/task-completion', adminAuth, async (req, res) => {
    try {
        const values = [
            Math.floor(Math.random() * 100) + 50, // 新手任务
            Math.floor(Math.random() * 80) + 30,  // 答题任务
            Math.floor(Math.random() * 60) + 20   // 大神任务
        ];

        res.json({ values });
    } catch (error) {
        console.error('获取任务完成数据失败:', error);
        res.status(500).json({ success: false, message: '获取任务完成数据失败' });
    }
});

// 获取红包趋势数据
router.get('/redpacket-trend', adminAuth, async (req, res) => {
    try {
        const labels = [];
        const redpackets = [];
        const participants = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
            redpackets.push(Math.floor(Math.random() * 20) + 5);
            participants.push(Math.floor(Math.random() * 200) + 50);
        }

        res.json({ labels, redpackets, participants });
    } catch (error) {
        console.error('获取红包趋势数据失败:', error);
        res.status(500).json({ success: false, message: '获取红包趋势数据失败' });
    }
});

// 红包活动趋势数据
router.get('/redpacket-trends', adminAuth, (req, res) => {
    // 模拟红包活动趋势数据
    const data = {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        redpackets: [12, 19, 15, 25, 22, 18, 30],
        participants: [120, 190, 150, 250, 220, 180, 300]
    };
    
    res.json(data);
});

// ==================== 高级用户管理 API ====================

/**
 * 获取用户列表（支持分页、搜索、筛选、排序）
 */
router.get('/users', adminAuth, (req, res) => {
    const {
        page = 1,
        pageSize = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        status = 'all',
        role = 'all',
        dateRange = 'all',
        searchTerm = ''
    } = req.query;

    // 模拟用户数据
    const allUsers = [];
    for (let i = 1; i <= 150; i++) {
        const statuses = ['active', 'inactive', 'suspended', 'banned'];
        const roles = ['user', 'vip', 'admin'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        
        allUsers.push({
            id: i,
            username: `user${i}`,
            email: `user${i}@example.com`,
            phone: `138${String(i).padStart(8, '0')}`,
            status: randomStatus,
            role: randomRole,
            balance: Math.floor(Math.random() * 10000),
            avatar: null,
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            last_login: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            login_count: Math.floor(Math.random() * 100)
        });
    }

    // 应用筛选
    let filteredUsers = allUsers.filter(user => {
        // 状态筛选
        if (status !== 'all' && user.status !== status) return false;
        
        // 角色筛选
        if (role !== 'all' && user.role !== role) return false;
        
        // 搜索筛选
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            if (!user.username.toLowerCase().includes(term) &&
                !user.email.toLowerCase().includes(term) &&
                !user.phone.includes(term)) {
                return false;
            }
        }
        
        // 日期范围筛选
        if (dateRange !== 'all') {
            const userDate = new Date(user.created_at);
            const now = new Date();
            
            switch (dateRange) {
                case 'today':
                    if (userDate.toDateString() !== now.toDateString()) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (userDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    if (userDate < monthAgo) return false;
                    break;
                case 'quarter':
                    const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    if (userDate < quarterAgo) return false;
                    break;
            }
        }
        
        return true;
    });

    // 排序
    filteredUsers.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'created_at' || sortBy === 'last_login') {
            aValue = new Date(aValue || 0);
            bValue = new Date(bValue || 0);
        }
        
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // 分页
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const users = filteredUsers.slice(startIndex, endIndex);

    // 统计信息
    const stats = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.status === 'active').length,
        newUsers: allUsers.filter(u => {
            const userDate = new Date(u.created_at);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return userDate > monthAgo;
        }).length,
        totalBalance: allUsers.reduce((sum, u) => sum + u.balance, 0)
    };

    res.json({
        users,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems,
            pageSize: parseInt(pageSize)
        },
        stats
    });
});

/**
 * 获取用户详情
 */
router.get('/users/:id', adminAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    
    // 模拟用户详情数据
    const user = {
        id: userId,
        username: `user${userId}`,
        email: `user${userId}@example.com`,
        phone: `138${String(userId).padStart(8, '0')}`,
        status: 'active',
        role: 'user',
        balance: Math.floor(Math.random() * 10000),
        total_income: Math.floor(Math.random() * 50000),
        total_expense: Math.floor(Math.random() * 40000),
        avatar: null,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        login_count: Math.floor(Math.random() * 100)
    };
    
    res.json(user);
});

/**
 * 获取用户交易记录
 */
router.get('/users/:id/transactions', adminAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    
    // 模拟交易记录
    const transactions = [];
    for (let i = 1; i <= 10; i++) {
        const types = ['income', 'expense'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        transactions.push({
            id: i,
            type,
            amount: Math.floor(Math.random() * 1000),
            description: type === 'income' ? '任务奖励' : '红包支出',
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    res.json(transactions);
});

/**
 * 获取用户活动记录
 */
router.get('/users/:id/activity-log', adminAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    
    // 模拟活动记录
    const activities = [];
    const activityTypes = [
        { type: 'login', description: '用户登录' },
        { type: 'task', description: '完成任务' },
        { type: 'redpacket', description: '参与红包' },
        { type: 'transaction', description: '钱包交易' }
    ];
    
    for (let i = 1; i <= 20; i++) {
        const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        activities.push({
            id: i,
            type: activity.type,
            description: activity.description,
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
            user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    res.json(activities);
});

/**
 * 获取用户行为分析数据
 */
router.get('/users/:id/behavior-analysis', adminAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    
    // 模拟行为分析数据
    const data = {
        activityTrend: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            data: [12, 19, 15, 25, 22, 18, 30]
        },
        taskCompletion: {
            labels: ['新手任务', '答题任务', '大神任务'],
            data: [85, 65, 42]
        }
    };
    
    res.json(data);
});

/**
 * 添加新用户
 */
router.post('/users', adminAuth, (req, res) => {
    const { username, email, phone, password, role, balance } = req.body;
    
    // 验证必填字段
    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: '用户名、邮箱和密码为必填项'
        });
    }
    
    // 模拟添加用户
    const newUser = {
        id: Date.now(),
        username,
        email,
        phone: phone || null,
        role: role || 'user',
        balance: parseFloat(balance) || 0,
        status: 'active',
        created_at: new Date().toISOString(),
        last_login: null,
        login_count: 0
    };
    
    res.json({
        success: true,
        message: '用户添加成功',
        user: newUser
    });
});

/**
 * 更新用户信息
 */
router.put('/users/:id', adminAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    const updates = req.body;
    
    // 模拟更新用户
    res.json({
        success: true,
        message: '用户信息更新成功'
    });
});

/**
 * 切换用户状态
 */
router.patch('/users/:id/status', adminAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    const { status } = req.body;
    
    // 模拟状态切换
    res.json({
        success: true,
        message: `用户状态已更新为${status}`
    });
});

/**
 * 删除用户
 */
router.delete('/users/:id', adminAuth, (req, res) => {
    const userId = parseInt(req.params.id);
    
    // 模拟删除用户
    res.json({
        success: true,
        message: '用户删除成功'
    });
});

/**
 * 批量操作用户
 */
router.post('/users/batch', adminAuth, (req, res) => {
    const { action, userIds } = req.body;
    
    if (!action || !userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
            success: false,
            message: '参数错误'
        });
    }
    
    // 模拟批量操作
    let message = '';
    switch (action) {
        case 'activate':
            message = `已激活 ${userIds.length} 个用户`;
            break;
        case 'suspend':
            message = `已暂停 ${userIds.length} 个用户`;
            break;
        case 'delete':
            message = `已删除 ${userIds.length} 个用户`;
            break;
        default:
            return res.status(400).json({
                success: false,
                message: '不支持的操作'
            });
    }
    
    res.json({
        success: true,
        message
    });
});

/**
 * 导出用户数据
 */
router.get('/users/export', adminAuth, (req, res) => {
    const { userIds, format = 'csv' } = req.query;
    
    // 模拟导出功能
    res.json({
        success: true,
        message: '导出任务已创建',
        downloadUrl: '/api/admin/download/users-export.csv'
    });
});

// ==================== 交易分析相关路由 ====================

// 获取交易分析数据
router.get('/analytics/transactions', adminAuth, async (req, res) => {
    try {
        const { range = 'week', filter = 'all' } = req.query;
        
        // 模拟生成交易分析数据
        const analyticsData = generateTransactionAnalytics(range, filter);
        
        res.json({
            success: true,
            statistics: analyticsData.statistics,
            charts: analyticsData.charts,
            transactions: analyticsData.transactions,
            anomalies: analyticsData.anomalies
        });
    } catch (error) {
        console.error('获取交易分析数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易分析数据失败'
        });
    }
});

// 获取交易详情
router.get('/transactions/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 模拟交易详情数据
        const transaction = {
            id: id,
            user: {
                id: Math.floor(Math.random() * 1000),
                username: `user_${Math.floor(Math.random() * 1000)}`
            },
            type: ['deposit', 'withdraw', 'redpacket', 'task_reward'][Math.floor(Math.random() * 4)],
            amount: (Math.random() * 1000 - 500).toFixed(2),
            status: ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)],
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            details: {
                description: '交易详细描述',
                reference: `REF_${Date.now()}`,
                fee: (Math.random() * 10).toFixed(2)
            }
        };
        
        res.json({
            success: true,
            transaction: transaction
        });
    } catch (error) {
        console.error('获取交易详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取交易详情失败'
        });
    }
});

// 处理异常交易
router.post('/anomalies/:id/handle', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 模拟处理异常交易
        console.log(`处理异常交易: ${id}`);
        
        res.json({
            success: true,
            message: '异常交易处理成功'
        });
    } catch (error) {
        console.error('处理异常交易错误:', error);
        res.status(500).json({
            success: false,
            message: '处理异常交易失败'
        });
    }
});

// 导出交易报表
router.get('/analytics/export', adminAuth, async (req, res) => {
    try {
        const { range = 'week', filter = 'all' } = req.query;
        
        // 模拟生成Excel报表数据
        const reportData = generateTransactionReport(range, filter);
        
        res.json({
            success: true,
            data: reportData,
            message: '报表导出成功'
        });
    } catch (error) {
        console.error('导出交易报表错误:', error);
        res.status(500).json({
            success: false,
            message: '导出交易报表失败'
        });
    }
});

// 任务系统增强 API 路由
router.get('/tasks/analytics', (req, res) => {
    try {
        const analytics = generateTaskAnalytics();
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取任务分析数据失败'
        });
    }
});

router.get('/tasks/templates', (req, res) => {
    try {
        const { page = 1, limit = 10, search, type, status } = req.query;
        const templates = generateTaskTemplates(page, limit, search, type, status);
        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取任务模板失败'
        });
    }
});

router.post('/tasks', (req, res) => {
    try {
        const taskData = req.body;
        // 模拟保存任务
        const newTask = {
            id: Date.now().toString(),
            ...taskData,
            createdAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: newTask,
            message: '任务创建成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建任务失败'
        });
    }
});

router.put('/tasks/:id', (req, res) => {
    try {
        const { id } = req.params;
        const taskData = req.body;
        
        res.json({
            success: true,
            data: { id, ...taskData },
            message: '任务更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新任务失败'
        });
    }
});

router.delete('/tasks/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        res.json({
            success: true,
            message: '任务删除成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除任务失败'
        });
    }
});

router.post('/tasks/export', (req, res) => {
    try {
        const report = generateTaskReport();
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '导出任务数据失败'
        });
    }
});

router.get('/rewards/configs', (req, res) => {
    try {
        const configs = generateRewardConfigs();
        res.json({
            success: true,
            data: configs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取奖励配置失败'
        });
    }
});

router.post('/rewards/configs', (req, res) => {
    try {
        const configData = req.body;
        const newConfig = {
            id: Date.now().toString(),
            ...configData,
            createdAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: newConfig,
            message: '奖励配置创建成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建奖励配置失败'
        });
    }
});

router.get('/automation/rules', (req, res) => {
    try {
        const rules = generateAutomationRules();
        res.json({
            success: true,
            data: rules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取自动化规则失败'
        });
    }
});

// 系统监控数据
router.get('/system-monitoring', (req, res) => {
    try {
        const data = generateSystemMonitoringData();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取系统监控数据失败'
        });
    }
});

// 导出系统监控报告
router.post('/system-monitoring/export', (req, res) => {
    try {
        const report = generateMonitoringReport();
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '导出监控报告失败'
        });
    }
});

// ==================== 数据生成辅助函数 ====================

/**
 * 生成交易分析数据
 */
function generateTransactionAnalytics(range, filter) {
    const now = new Date();
    const days = range === 'today' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 90 : 365;
    
    // 生成统计数据
    const statistics = {
        totalIncome: Math.floor(Math.random() * 100000) + 50000,
        totalExpense: Math.floor(Math.random() * 80000) + 30000,
        netProfit: 0,
        transactionCount: Math.floor(Math.random() * 1000) + 500,
        incomeChange: (Math.random() * 20 - 10).toFixed(1),
        expenseChange: (Math.random() * 20 - 10).toFixed(1),
        profitChange: (Math.random() * 30 - 15).toFixed(1),
        countChange: (Math.random() * 25 - 12.5).toFixed(1)
    };
    statistics.netProfit = statistics.totalIncome - statistics.totalExpense;

    // 生成趋势图表数据
    const trendLabels = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        trendLabels.push(date.toLocaleDateString());
        incomeData.push(Math.floor(Math.random() * 5000) + 1000);
        expenseData.push(Math.floor(Math.random() * 3000) + 500);
    }

    // 生成交易类型分布数据
    const typeData = {
        labels: ['充值', '提现', '红包', '任务奖励', '转账'],
        values: [
            Math.floor(Math.random() * 100) + 50,
            Math.floor(Math.random() * 80) + 30,
            Math.floor(Math.random() * 60) + 20,
            Math.floor(Math.random() * 40) + 10,
            Math.floor(Math.random() * 30) + 5
        ]
    };

    // 生成收支对比数据
    const incomeExpenseData = {
        labels: trendLabels.slice(-7), // 最近7天
        income: incomeData.slice(-7),
        expense: expenseData.slice(-7)
    };

    // 生成异常监控数据
    const anomalyData = {
        normal: Array.from({ length: 50 }, () => ({
            x: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            y: Math.random() * 1000 + 100
        })),
        anomalies: Array.from({ length: 5 }, () => ({
            x: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            y: Math.random() * 5000 + 2000
        }))
    };

    // 生成交易记录
    const transactions = Array.from({ length: 20 }, (_, i) => ({
        id: `TXN_${Date.now()}_${i}`,
        user: {
            id: Math.floor(Math.random() * 1000),
            username: `user_${Math.floor(Math.random() * 1000)}`
        },
        type: ['deposit', 'withdraw', 'redpacket', 'task_reward'][Math.floor(Math.random() * 4)],
        amount: (Math.random() * 1000 - 500).toFixed(2),
        status: ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)],
        createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }));

    // 生成异常警报
    const anomalies = Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => ({
        id: `ANOMALY_${Date.now()}_${i}`,
        type: ['high_amount', 'frequent', 'suspicious', 'failed'][Math.floor(Math.random() * 4)],
        title: ['大额交易警报', '频繁交易警报', '可疑交易警报', '失败交易警报'][Math.floor(Math.random() * 4)],
        description: '检测到异常交易行为，请及时处理',
        severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        timestamp: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)
    }));

    return {
        statistics,
        charts: {
            trend: {
                labels: trendLabels,
                income: incomeData,
                expense: expenseData
            },
            types: typeData,
            incomeExpense: incomeExpenseData,
            anomalies: anomalyData
        },
        transactions,
        anomalies
    };
}

/**
 * 生成交易报表数据
 */
function generateTransactionReport(range, filter) {
    return {
        filename: `transaction-report-${range}-${filter}-${new Date().toISOString().split('T')[0]}.xlsx`,
        summary: {
            totalTransactions: Math.floor(Math.random() * 1000) + 500,
            totalAmount: Math.floor(Math.random() * 100000) + 50000,
            successRate: (Math.random() * 10 + 90).toFixed(2) + '%'
        },
        data: Array.from({ length: 100 }, (_, i) => ({
            id: `TXN_${Date.now()}_${i}`,
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            user: `user_${Math.floor(Math.random() * 1000)}`,
            type: ['deposit', 'withdraw', 'redpacket', 'task_reward'][Math.floor(Math.random() * 4)],
            amount: (Math.random() * 1000).toFixed(2),
            status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)]
        }))
    };
/**
 * 生成系统监控数据
 */
function generateSystemMonitoringData() {
    const now = new Date();
    
    // 生成系统状态数据
    const systemStatus = {
        cpu: Math.floor(Math.random() * 40) + 30, // 30-70%
        memory: Math.floor(Math.random() * 50) + 40, // 40-90%
        disk: Math.floor(Math.random() * 30) + 50, // 50-80%
        network: (Math.random() * 50 + 10).toFixed(1), // 10-60 MB/s
        apiCalls: Math.floor(Math.random() * 200) + 100, // 100-300
        errors: Math.floor(Math.random() * 5), // 0-5
        cpuChange: (Math.random() * 10 - 5).toFixed(1),
        memoryChange: (Math.random() * 8 - 4).toFixed(1),
        diskChange: (Math.random() * 2 - 1).toFixed(1),
        networkChange: (Math.random() * 20 - 10).toFixed(1),
        apiChange: (Math.random() * 30 - 15).toFixed(1),
        errorChange: (Math.random() * 100 - 50).toFixed(1)
    };

    // 生成图表数据
    const chartLabels = [];
    const cpuData = [];
    const memoryData = [];
    const diskData = [];
    const apiSuccessData = [];
    const apiFailedData = [];

    for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        chartLabels.push(time.getHours() + ':00');
        cpuData.push(Math.floor(Math.random() * 40) + 30);
        memoryData.push(Math.floor(Math.random() * 50) + 40);
        diskData.push(Math.floor(Math.random() * 30) + 50);
        apiSuccessData.push(Math.floor(Math.random() * 100) + 50);
        apiFailedData.push(Math.floor(Math.random() * 10) + 1);
    }

    const charts = {
        performance: {
            labels: chartLabels,
            cpu: cpuData,
            memory: memoryData,
            disk: diskData
        },
        api: {
            labels: chartLabels.slice(-12), // 最近12小时
            success: apiSuccessData.slice(-12),
            failed: apiFailedData.slice(-12)
        }
    };

    // 生成日志数据
    const logLevels = ['error', 'warning', 'info'];
    const logs = Array.from({ length: 20 }, (_, i) => ({
        id: `LOG_${Date.now()}_${i}`,
        level: logLevels[Math.floor(Math.random() * logLevels.length)],
        message: [
            '用户登录失败，IP: 192.168.1.100',
            '数据库连接超时',
            'API请求处理完成',
            '内存使用率达到警告阈值',
            '新用户注册成功',
            '支付接口调用异常',
            '定时任务执行完成',
            '缓存清理操作',
            '文件上传失败',
            '系统备份完成'
        ][Math.floor(Math.random() * 10)],
        timestamp: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)
    }));

    // 生成告警数据
    const alertTypes = ['system', 'performance', 'security', 'network'];
    const severities = ['high', 'medium', 'low'];
    const alerts = Array.from({ length: Math.floor(Math.random() * 3) }, (_, i) => ({
        id: `ALERT_${Date.now()}_${i}`,
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        title: [
            'CPU使用率过高',
            '内存不足警告',
            '磁盘空间不足',
            '网络连接异常',
            '数据库响应慢',
            '安全威胁检测'
        ][Math.floor(Math.random() * 6)],
        message: '系统检测到异常情况，请及时处理',
        timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000)
    }));

    // 生成服务状态数据
    const services = [
        {
            name: 'Web服务器',
            type: 'web',
            status: Math.random() > 0.1 ? 'running' : 'stopped',
            uptime: Math.floor(Math.random() * 30) + 'd ' + Math.floor(Math.random() * 24) + 'h'
        },
        {
            name: '数据库',
            type: 'database',
            status: Math.random() > 0.05 ? 'running' : 'error',
            uptime: Math.floor(Math.random() * 60) + 'd ' + Math.floor(Math.random() * 24) + 'h'
        },
        {
            name: 'Redis缓存',
            type: 'cache',
            status: Math.random() > 0.1 ? 'running' : 'warning',
            uptime: Math.floor(Math.random() * 15) + 'd ' + Math.floor(Math.random() * 24) + 'h'
        },
        {
            name: '消息队列',
            type: 'queue',
            status: Math.random() > 0.15 ? 'running' : 'stopped',
            uptime: Math.floor(Math.random() * 7) + 'd ' + Math.floor(Math.random() * 24) + 'h'
        },
        {
            name: '文件存储',
            type: 'storage',
            status: Math.random() > 0.05 ? 'running' : 'warning',
            uptime: Math.floor(Math.random() * 90) + 'd ' + Math.floor(Math.random() * 24) + 'h'
        }
    ];

    return {
        systemStatus,
        charts,
        logs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        alerts: alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        services
    };
}

/**
 * 生成监控报告数据
 */
function generateMonitoringReport() {
    return {
        filename: `system-monitoring-report-${new Date().toISOString().split('T')[0]}.pdf`,
        downloadUrl: `/reports/system-monitoring-${Date.now()}.pdf`,
        summary: {
            reportDate: new Date().toISOString().split('T')[0],
            avgCpuUsage: (Math.random() * 20 + 40).toFixed(1) + '%',
            avgMemoryUsage: (Math.random() * 30 + 50).toFixed(1) + '%',
            totalApiCalls: Math.floor(Math.random() * 10000) + 5000,
            totalErrors: Math.floor(Math.random() * 50) + 10,
            uptime: '99.9%'
        }
    };
}

/**
 * 生成任务分析数据
 */
function generateTaskAnalytics() {
    return {
        totalTasks: Math.floor(Math.random() * 500) + 100,
        completedTasks: Math.floor(Math.random() * 300) + 50,
        completionRate: (Math.random() * 40 + 60).toFixed(1),
        activeUsers: Math.floor(Math.random() * 200) + 50,
        recentTasks: Array.from({ length: 10 }, (_, i) => ({
            id: `task_${Date.now()}_${i}`,
            name: `任务 ${i + 1}`,
            type: ['newbie', 'daily', 'special', 'quiz'][Math.floor(Math.random() * 4)],
            reward: (Math.random() * 50 + 10).toFixed(2),
            status: ['active', 'inactive', 'draft'][Math.floor(Math.random() * 3)],
            completionRate: (Math.random() * 100).toFixed(1),
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
    };
}

/**
 * 生成任务模板数据
 */
function generateTaskTemplates(page, limit, search, type, status) {
    const templates = Array.from({ length: 50 }, (_, i) => ({
        id: `template_${i + 1}`,
        name: `任务模板 ${i + 1}`,
        type: ['newbie', 'daily', 'special', 'quiz'][Math.floor(Math.random() * 4)],
        reward: (Math.random() * 100 + 10).toFixed(2),
        status: ['active', 'inactive', 'draft'][Math.floor(Math.random() * 3)],
        usageCount: Math.floor(Math.random() * 1000),
        completionRate: (Math.random() * 100).toFixed(1),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));

    // 简单的筛选逻辑
    let filtered = templates;
    if (search) {
        filtered = filtered.filter(t => t.name.includes(search));
    }
    if (type) {
        filtered = filtered.filter(t => t.type === type);
    }
    if (status) {
        filtered = filtered.filter(t => t.status === status);
    }

    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    
    return {
        templates: filtered.slice(start, end),
        total: filtered.length,
        page: parseInt(page),
        limit: parseInt(limit)
    };
}

/**
 * 生成任务报告数据
 */
function generateTaskReport() {
    return {
        filename: `task-report-${new Date().toISOString().split('T')[0]}.xlsx`,
        downloadUrl: `/reports/task-report-${Date.now()}.xlsx`,
        summary: {
            reportDate: new Date().toISOString().split('T')[0],
            totalTasks: Math.floor(Math.random() * 500) + 100,
            completedTasks: Math.floor(Math.random() * 300) + 50,
            avgCompletionTime: (Math.random() * 60 + 30).toFixed(1) + ' 分钟',
            totalRewards: (Math.random() * 10000 + 5000).toFixed(2)
        }
    };
}

/**
 * 生成奖励配置数据
 */
function generateRewardConfigs() {
    return Array.from({ length: 10 }, (_, i) => ({
        id: `reward_config_${i + 1}`,
        name: `奖励配置 ${i + 1}`,
        taskType: ['newbie', 'daily', 'special', 'quiz'][Math.floor(Math.random() * 4)],
        baseReward: (Math.random() * 50 + 10).toFixed(2),
        maxReward: (Math.random() * 100 + 50).toFixed(2),
        status: ['active', 'inactive'][Math.floor(Math.random() * 2)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * 生成自动化规则数据
 */
function generateAutomationRules() {
    return Array.from({ length: 8 }, (_, i) => ({
        id: `auto_rule_${i + 1}`,
        name: `自动分配规则 ${i + 1}`,
        condition: `用户等级 >= ${Math.floor(Math.random() * 5) + 1}`,
        action: '自动分配日常任务',
        status: ['active', 'inactive'][Math.floor(Math.random() * 2)],
        triggerCount: Math.floor(Math.random() * 1000),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

/**
 * 生成钱包管理数据
 */
function generateWalletManagementData() {
    const wallets = Array.from({ length: 20 }, (_, i) => ({
        address: '0x' + Math.random().toString(16).substr(2, 40),
        balance: Math.random() * 10000,
        status: ['active', 'inactive', 'warning'][Math.floor(Math.random() * 3)],
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    return {
        overview: {
            totalWallets: wallets.length,
            totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
            availableAddresses: Math.floor(Math.random() * 100) + 50,
            todayTransfers: Math.floor(Math.random() * 50) + 10,
            walletsChange: Math.floor(Math.random() * 5),
            balanceChange: Math.random() * 1000,
            addressesChange: Math.floor(Math.random() * 10),
            transfersChange: Math.floor(Math.random() * 20),
            usedAddresses: Math.floor(Math.random() * 50) + 20,
            totalAddresses: 150
        },
        wallets
    };
}

/**
 * 生成钱包报告
 */
function generateWalletReport() {
    return {
        filename: `wallet-report-${new Date().toISOString().split('T')[0]}.xlsx`,
        downloadUrl: `/reports/wallet-report-${Date.now()}.xlsx`,
        summary: {
            reportDate: new Date().toISOString().split('T')[0],
            totalWallets: Math.floor(Math.random() * 100) + 50,
            totalBalance: (Math.random() * 100000 + 50000).toFixed(2),
            avgBalance: (Math.random() * 1000 + 500).toFixed(2),
            todayTransfers: Math.floor(Math.random() * 50) + 10
        }
    };
}

/**
 * 生成地址池数据
 */
function generateAddressPoolData() {
    return Array.from({ length: 100 }, (_, i) => ({
        address: '0x' + Math.random().toString(16).substr(2, 40),
        status: ['available', 'used', 'reserved'][Math.floor(Math.random() * 3)],
        balance: Math.random() * 1000,
        lastUsed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

// 钱包管理增强 API
router.get('/wallet-management', (req, res) => {
    try {
        const walletData = generateWalletManagementData();
        res.json({
            success: true,
            data: walletData
        });
    } catch (error) {
        console.error('获取钱包管理数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取钱包管理数据失败'
        });
    }
});

router.post('/batch-transfer', (req, res) => {
    try {
        const { type, sourceWallet, targetAddresses, totalAmount } = req.body;
        
        // 模拟批量转账处理
        const transferId = 'batch_' + Date.now();
        
        res.json({
            success: true,
            data: {
                transferId,
                status: 'processing',
                message: '批量转账已提交处理'
            }
        });
    } catch (error) {
        console.error('批量转账失败:', error);
        res.status(500).json({
            success: false,
            message: '批量转账失败'
        });
    }
});

router.post('/export-wallet-data', (req, res) => {
    try {
        const walletReport = generateWalletReport();
        
        // 设置响应头为Excel文件
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=wallet-data.xlsx');
        
        // 模拟Excel文件内容
        res.send(Buffer.from(walletReport));
    } catch (error) {
        console.error('导出钱包数据失败:', error);
        res.status(500).json({
            success: false,
            message: '导出钱包数据失败'
        });
    }
});

router.get('/address-pool', (req, res) => {
    try {
        const poolData = generateAddressPoolData();
        res.json({
            success: true,
            data: poolData
        });
    } catch (error) {
        console.error('获取地址池数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取地址池数据失败'
        });
    }
});

router.post('/generate-addresses', (req, res) => {
    try {
        const { count = 10 } = req.body;
        const newAddresses = [];
        
        for (let i = 0; i < count; i++) {
            newAddresses.push({
                address: '0x' + Math.random().toString(16).substr(2, 40),
                status: 'available',
                createdAt: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            data: {
                addresses: newAddresses,
                message: `成功生成 ${count} 个新地址`
            }
        });
    } catch (error) {
        console.error('生成地址失败:', error);
        res.status(500).json({
            success: false,
            message: '生成地址失败'
        });
    }
});

// 红包分析系统路由
router.post('/redpacket-analytics', adminAuth, async (req, res) => {
    try {
        const { dateRange, filters } = req.body;
        const analyticsData = await generateRedPacketAnalytics(dateRange, filters);
        res.json(analyticsData);
    } catch (error) {
        console.error('获取红包分析数据失败:', error);
        res.status(500).json({ error: '获取分析数据失败' });
    }
});

router.post('/redpacket-analytics/:view', adminAuth, async (req, res) => {
    try {
        const { view } = req.params;
        const { dateRange, filters } = req.body;
        const viewData = await generateRedPacketViewData(view, dateRange, filters);
        res.json(viewData);
    } catch (error) {
        console.error(`获取${view}数据失败:`, error);
        res.status(500).json({ error: '获取视图数据失败' });
    }
});

router.post('/redpacket-analytics/export', adminAuth, async (req, res) => {
    try {
        const { dateRange, filters, view } = req.body;
        const reportData = await generateRedPacketReport(dateRange, filters, view);
        
        // 这里应该生成Excel文件，示例返回JSON
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=redpacket-analytics.xlsx');
        res.json(reportData);
    } catch (error) {
        console.error('导出红包分析报告失败:', error);
        res.status(500).json({ error: '导出报告失败' });
    }
});

router.post('/redpacket-analytics/segments/:type', adminAuth, async (req, res) => {
    try {
        const { type } = req.params;
        const { dateRange, filters } = req.body;
        const segmentData = await generateRedPacketSegments(type, dateRange, filters);
        res.json(segmentData);
    } catch (error) {
        console.error(`获取${type}分群数据失败:`, error);
        res.status(500).json({ error: '获取分群数据失败' });
    }
});

// 用户行为分析API路由
router.post('/user-behavior/analytics', adminAuth, async (req, res) => {
    try {
        const { dateRange, userType, platform } = req.body;
        const data = generateUserBehaviorAnalytics(dateRange, userType, platform);
        res.json(data);
    } catch (error) {
        console.error('获取用户行为分析数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/user-behavior/activity', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateUserActivityData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取用户活跃度数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/user-behavior/retention', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateUserRetentionData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取用户留存数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/user-behavior/pathTracking', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateUserPathData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取用户路径数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/user-behavior/segments', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateUserSegmentData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取用户分群数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/user-behavior/export', adminAuth, async (req, res) => {
    try {
        const { view, filters } = req.body;
        const report = generateUserBehaviorReport(view, filters);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=user-behavior-${view}-${Date.now()}.xlsx`);
        res.send(report);
    } catch (error) {
        console.error('导出用户行为报告失败:', error);
        res.status(500).json({ error: '导出失败' });
    }
});

// 金融风控系统API路由
router.post('/risk-control/overview', adminAuth, async (req, res) => {
    try {
        const { dateRange, riskLevel } = req.body;
        const data = generateRiskControlOverview(dateRange, riskLevel);
        res.json(data);
    } catch (error) {
        console.error('获取风控概览数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/risk-control/detection', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateRiskDetectionData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取风险检测数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/risk-control/assessment', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateRiskAssessmentData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取风险评估数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/risk-control/fraud', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateAntiFraudData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取反欺诈数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/risk-control/rules', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateRiskRulesData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取风控规则数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/risk-control/alerts', adminAuth, async (req, res) => {
    try {
        const filters = req.body;
        const data = generateRiskAlertsData(filters);
        res.json(data);
    } catch (error) {
        console.error('获取风险预警数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/risk-control/export', adminAuth, async (req, res) => {
    try {
        const { view, filters } = req.body;
        const data = generateRiskControlReport(view, filters);
        res.json(data);
    } catch (error) {
        console.error('导出风控报告失败:', error);
        res.status(500).json({ error: '导出失败' });
    }
});

// 系统监控API路由
router.get('/system-monitoring/overview', adminAuth, async (req, res) => {
    try {
        const data = generateSystemMonitoringOverview();
        res.json(data);
    } catch (error) {
        console.error('获取系统监控概览失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.get('/system-monitoring/server', adminAuth, async (req, res) => {
    try {
        const data = generateServerStatusData();
        res.json(data);
    } catch (error) {
        console.error('获取服务器状态失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.get('/system-monitoring/performance', adminAuth, async (req, res) => {
    try {
        const { timeRange, metricType } = req.query;
        const data = generatePerformanceData(timeRange, metricType);
        res.json(data);
    } catch (error) {
        console.error('获取性能数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.get('/system-monitoring/logs', adminAuth, async (req, res) => {
    try {
        const { level, source, search, page } = req.query;
        const data = generateSystemLogsData(level, source, search, page);
        res.json(data);
    } catch (error) {
        console.error('获取系统日志失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.get('/system-monitoring/alerts', adminAuth, async (req, res) => {
    try {
        const data = generateAlertsData();
        res.json(data);
    } catch (error) {
        console.error('获取告警数据失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/system-monitoring/export', adminAuth, async (req, res) => {
    try {
        const { type, timeRange } = req.body;
        const data = generateSystemMonitoringReport(type, timeRange);
        res.json(data);
    } catch (error) {
        console.error('导出系统监控报告失败:', error);
        res.status(500).json({ error: '导出失败' });
    }
});

// 数据备份系统 API 路由
router.get('/data-backup/overview', adminAuth, async (req, res) => {
    try {
        const data = generateDataBackupOverview();
        res.json(data);
    } catch (error) {
        console.error('获取数据备份概览失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.get('/data-backup/backups', adminAuth, async (req, res) => {
    try {
        const { type, status, date, page = 1, limit = 20 } = req.query;
        const data = generateBackupsList({ type, status, date, page, limit });
        res.json(data);
    } catch (error) {
        console.error('获取备份列表失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.get('/data-backup/schedule', adminAuth, async (req, res) => {
    try {
        const data = generateScheduleData();
        res.json(data);
    } catch (error) {
        console.error('获取定时任务失败:', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

router.post('/data-backup/create', adminAuth, async (req, res) => {
    try {
        const { name, type, scope, description } = req.body;
        const result = await createBackupTask({ name, type, scope, description });
        res.json(result);
    } catch (error) {
        console.error('创建备份任务失败:', error);
        res.status(500).json({ error: '创建失败' });
    }
});

router.post('/data-backup/restore', adminAuth, async (req, res) => {
    try {
        const { backupId, password, options } = req.body;
        const result = await restoreBackupTask({ backupId, password, options });
        res.json(result);
    } catch (error) {
        console.error('恢复备份失败:', error);
        res.status(500).json({ error: '恢复失败' });
    }
});

router.post('/data-backup/schedule', adminAuth, async (req, res) => {
    try {
        const { name, frequency, time, retentionDays, backupType } = req.body;
        const result = await createScheduleTask({ name, frequency, time, retentionDays, backupType });
        res.json(result);
    } catch (error) {
        console.error('创建定时任务失败:', error);
        res.status(500).json({ error: '创建失败' });
    }
});

router.get('/data-backup/download/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const backupFile = await getBackupFile(id);
        res.download(backupFile.path, backupFile.name);
    } catch (error) {
        console.error('下载备份失败:', error);
        res.status(500).json({ error: '下载失败' });
    }
});

router.delete('/data-backup/delete/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteBackup(id);
        res.json(result);
    } catch (error) {
        console.error('删除备份失败:', error);
        res.status(500).json({ error: '删除失败' });
    }
});

router.get('/data-backup/export', adminAuth, async (req, res) => {
    try {
        const { type } = req.query;
        const data = generateDataBackupReport(type);
        res.json(data);
    } catch (error) {
        console.error('导出数据备份报告失败:', error);
        res.status(500).json({ error: '导出失败' });
    }
});

// 通知中心相关辅助函数
function generateNotificationData() {
    return {
        stats: {
            todaySent: Math.floor(Math.random() * 2000) + 500,
            successRate: (Math.random() * 5 + 95).toFixed(1),
            clickRate: (Math.random() * 10 + 10).toFixed(1),
            activeTemplates: Math.floor(Math.random() * 20) + 10
        },
        notifications: Array.from({length: 50}, (_, i) => ({
            id: i + 1,
            title: `通知标题 ${i + 1}`,
            content: `这是通知内容 ${i + 1}`,
            type: ['system', 'promotion', 'warning', 'info'][Math.floor(Math.random() * 4)],
            priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
            status: ['sent', 'pending', 'failed', 'draft'][Math.floor(Math.random() * 4)],
            target: ['所有用户', '活跃用户', '非活跃用户', 'VIP用户'][Math.floor(Math.random() * 4)],
            channels: ['push', 'email', 'sms', 'in-app'],
            sentCount: Math.floor(Math.random() * 10000),
            clickCount: Math.floor(Math.random() * 1000),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            sentAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null
        })),
        templates: Array.from({length: 15}, (_, i) => ({
            id: i + 1,
            name: `模板 ${i + 1}`,
            type: ['welcome', 'promotion', 'reminder', 'alert', 'custom'][Math.floor(Math.random() * 5)],
            titleTemplate: `标题模板 {username} ${i + 1}`,
            contentTemplate: `内容模板 {username}，这是第 ${i + 1} 个模板，金额：{amount}，日期：{date}`,
            usageCount: Math.floor(Math.random() * 500),
            createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
    };
}

function generateNotificationAnalytics() {
    const dates = Array.from({length: 30}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();

    return {
        sendTrend: dates.map(date => ({
            date,
            sent: Math.floor(Math.random() * 2000) + 500,
            success: Math.floor(Math.random() * 1900) + 450,
            failed: Math.floor(Math.random() * 100) + 10
        })),
        channelStats: [
            { channel: 'push', sent: 15420, success: 14890, rate: 96.6 },
            { channel: 'email', sent: 8930, success: 8456, rate: 94.7 },
            { channel: 'sms', sent: 5670, success: 5523, rate: 97.4 },
            { channel: 'in-app', sent: 12340, success: 12201, rate: 98.9 }
        ],
        typeStats: [
            { type: 'system', count: 1250, rate: 98.2 },
            { type: 'promotion', count: 3420, rate: 85.6 },
            { type: 'warning', count: 890, rate: 99.1 },
            { type: 'info', count: 2340, rate: 92.3 }
        ]
    };
}

// 通知中心API路由

// 获取通知数据
router.get('/notifications', (req, res) => {
    try {
        const data = generateNotificationData();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取通知数据失败',
            error: error.message
        });
    }
});

// 创建通知
router.post('/notifications', (req, res) => {
    try {
        const { title, content, type, priority, channels, target, sendTime, scheduledTime } = req.body;
        
        // 模拟创建通知
        const notification = {
            id: Date.now(),
            title,
            content,
            type,
            priority,
            channels,
            target,
            sendTime,
            scheduledTime,
            status: sendTime === 'now' ? 'sent' : 'pending',
            createdAt: new Date().toISOString(),
            sentAt: sendTime === 'now' ? new Date().toISOString() : null
        };

        res.json({
            success: true,
            message: '通知创建成功',
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建通知失败',
            error: error.message
        });
    }
});

// 获取通知模板
router.get('/notification-templates', (req, res) => {
    try {
        const data = generateNotificationData();
        res.json({
            success: true,
            data: data.templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取模板数据失败',
            error: error.message
        });
    }
});

// 创建通知模板
router.post('/notification-templates', (req, res) => {
    try {
        const { name, type, titleTemplate, contentTemplate } = req.body;
        
        const template = {
            id: Date.now(),
            name,
            type,
            titleTemplate,
            contentTemplate,
            usageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            message: '模板创建成功',
            data: template
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建模板失败',
            error: error.message
        });
    }
});

// 批量发送通知
router.post('/batch-notifications', (req, res) => {
    try {
        const { templateId, userList, interval } = req.body;
        
        // 模拟批量发送
        const batchJob = {
            id: Date.now(),
            templateId,
            userCount: userList ? userList.split('\n').filter(u => u.trim()).length : 0,
            interval,
            status: 'processing',
            createdAt: new Date().toISOString(),
            progress: 0
        };

        res.json({
            success: true,
            message: '批量发送任务已启动',
            data: batchJob
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '批量发送失败',
            error: error.message
        });
    }
});

// 获取通知分析数据
router.get('/notification-analytics', (req, res) => {
    try {
        const data = generateNotificationAnalytics();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取分析数据失败',
            error: error.message
        });
    }
});

// 获取推送设置
router.get('/push-settings', (req, res) => {
    try {
        const settings = {
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: false,
            inAppEnabled: true,
            rateLimits: {
                push: 1000,
                email: 500,
                sms: 100,
                inApp: 2000
            },
            templates: {
                welcome: true,
                promotion: true,
                reminder: true,
                alert: true
            }
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取推送设置失败',
            error: error.message
        });
    }
});

// 更新推送设置
router.put('/push-settings', (req, res) => {
    try {
        const settings = req.body;
        
        res.json({
            success: true,
            message: '推送设置更新成功',
            data: settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新推送设置失败',
            error: error.message
        });
    }
});

// 报表系统相关路由
router.get('/reports', (req, res) => {
    try {
        const reports = generateReportData();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: '获取报表数据失败' });
    }
});

router.post('/reports', (req, res) => {
    try {
        const { name, type, dataSource, timeRange, formats, description } = req.body;
        
        // 模拟创建报表
        const newReport = {
            id: Date.now().toString(),
            name,
            type,
            dataSource,
            timeRange,
            formats,
            description,
            status: 'processing',
            createdAt: new Date().toISOString(),
            fileSize: null
        };
        
        // 模拟异步处理
        setTimeout(() => {
            newReport.status = 'completed';
            newReport.fileSize = '2.5MB';
        }, 3000);
        
        res.json({ success: true, report: newReport });
    } catch (error) {
        res.status(500).json({ error: '创建报表失败' });
    }
});

router.get('/reports/:id/download', (req, res) => {
    try {
        const reportId = req.params.id;
        // 模拟文件下载
        res.setHeader('Content-Disposition', `attachment; filename=report_${reportId}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send('模拟Excel文件内容');
    } catch (error) {
        res.status(500).json({ error: '下载报表失败' });
    }
});

router.delete('/reports/:id', (req, res) => {
    try {
        const reportId = req.params.id;
        // 模拟删除报表
        res.json({ success: true, message: '报表删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除报表失败' });
    }
});

router.get('/report-templates', (req, res) => {
    try {
        const templates = generateReportTemplates();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: '获取报表模板失败' });
    }
});

router.post('/report-templates', (req, res) => {
    try {
        const { name, type, config, description } = req.body;
        
        const newTemplate = {
            id: Date.now().toString(),
            name,
            type,
            config,
            description,
            usageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        res.json({ success: true, template: newTemplate });
    } catch (error) {
        res.status(500).json({ error: '创建模板失败' });
    }
});

router.get('/report-schedules', (req, res) => {
    try {
        const schedules = generateReportSchedules();
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: '获取定时任务失败' });
    }
});

router.post('/report-schedules', (req, res) => {
    try {
        const { name, reportId, frequency, time, emails, status } = req.body;
        
        const newSchedule = {
            id: Date.now().toString(),
            name,
            reportId,
            frequency,
            time,
            emails,
            status,
            createdAt: new Date().toISOString(),
            lastRun: null,
            nextRun: calculateNextRun(frequency, time)
        };
        
        res.json({ success: true, schedule: newSchedule });
    } catch (error) {
        res.status(500).json({ error: '创建定时任务失败' });
    }
});

router.post('/report-schedules/:id/run', (req, res) => {
    try {
        const scheduleId = req.params.id;
        // 模拟执行定时任务
        res.json({ success: true, message: '任务执行成功' });
    } catch (error) {
        res.status(500).json({ error: '执行任务失败' });
    }
});

// 报表系统辅助函数
function generateReportData() {
    return {
        reports: [
            {
                id: '1',
                name: '用户活跃度报表',
                type: 'user',
                status: 'completed',
                createdAt: '2024-01-15T10:30:00Z',
                fileSize: '2.5MB',
                downloadUrl: '/api/admin/reports/1/download'
            },
            {
                id: '2',
                name: '交易统计报表',
                type: 'transaction',
                status: 'processing',
                createdAt: '2024-01-15T11:00:00Z',
                fileSize: null,
                downloadUrl: null
            },
            {
                id: '3',
                name: '钱包余额报表',
                type: 'wallet',
                status: 'failed',
                createdAt: '2024-01-15T09:45:00Z',
                fileSize: null,
                downloadUrl: null
            }
        ],
        statistics: {
            total: 15,
            completed: 12,
            processing: 2,
            failed: 1
        }
    };
}

function generateReportTemplates() {
    return [
        {
            id: '1',
            name: '日活跃用户模板',
            type: 'user',
            description: '统计每日活跃用户数据',
            usageCount: 25,
            createdAt: '2024-01-10T08:00:00Z'
        },
        {
            id: '2',
            name: '交易汇总模板',
            type: 'transaction',
            description: '汇总交易数据和统计信息',
            usageCount: 18,
            createdAt: '2024-01-12T14:30:00Z'
        },
        {
            id: '3',
            name: '红包活动模板',
            type: 'redpacket',
            description: '红包活动参与度和效果分析',
            usageCount: 8,
            createdAt: '2024-01-14T16:20:00Z'
        }
    ];
}

function generateReportSchedules() {
    return [
        {
            id: '1',
            name: '每日用户报表',
            reportId: '1',
            frequency: 'daily',
            time: '09:00',
            emails: ['admin@example.com'],
            status: 'active',
            lastRun: '2024-01-15T09:00:00Z',
            nextRun: '2024-01-16T09:00:00Z'
        },
        {
            id: '2',
            name: '周度交易汇总',
            reportId: '2',
            frequency: 'weekly',
            time: '10:00',
            emails: ['finance@example.com', 'manager@example.com'],
            status: 'active',
            lastRun: '2024-01-08T10:00:00Z',
            nextRun: '2024-01-15T10:00:00Z'
        }
    ];
}

function calculateNextRun(frequency, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    if (frequency === 'daily') {
        if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
    } else if (frequency === 'weekly') {
        nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay()));
    } else if (frequency === 'monthly') {
        nextRun.setMonth(nextRun.getMonth() + 1, 1);
    }
    
    return nextRun.toISOString();
}

// 红包分析系统辅助函数
function generateRedPacketAnalytics(dateRange, filters) {
    return {
        totalPackets: Math.floor(Math.random() * 10000) + 5000,
        totalAmount: Math.floor(Math.random() * 500000) + 100000,
        participationRate: (Math.random() * 20 + 70).toFixed(1),
        successRate: (Math.random() * 10 + 85).toFixed(1),
        trendData: {
            labels: Array.from({length: 30}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 29 + i);
                return date.toISOString().split('T')[0];
            }),
            values: Array.from({length: 30}, () => Math.floor(Math.random() * 500) + 100)
        },
        timeWindowData: {
            values: [
                Math.floor(Math.random() * 3000) + 1000, // 上午场
                Math.floor(Math.random() * 4000) + 1500, // 中午场
                Math.floor(Math.random() * 5000) + 2000  // 晚上场
            ]
        }
    };
}

function generateRedPacketViewData(view, dateRange, filters) {
    switch (view) {
        case 'distribution':
            return {
                todayPackets: Math.floor(Math.random() * 500) + 100,
                weekPackets: Math.floor(Math.random() * 3000) + 1000,
                monthPackets: Math.floor(Math.random() * 12000) + 5000,
                avgAmount: (Math.random() * 50 + 10).toFixed(2),
                todayChange: (Math.random() * 20 - 10).toFixed(1),
                weekChange: (Math.random() * 30 - 15).toFixed(1),
                monthChange: (Math.random() * 40 - 20).toFixed(1),
                avgChange: (Math.random() * 10 - 5).toFixed(1),
                records: Array.from({length: 30}, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    return {
                        date: date.toISOString(),
                        timeWindow: ['上午场', '中午场', '晚上场'][Math.floor(Math.random() * 3)],
                        packetCount: Math.floor(Math.random() * 200) + 50,
                        totalAmount: Math.floor(Math.random() * 10000) + 2000,
                        avgAmount: (Math.random() * 50 + 10).toFixed(2),
                        participants: Math.floor(Math.random() * 500) + 100,
                        completionRate: (Math.random() * 20 + 75).toFixed(1)
                    };
                })
            };
        case 'participation':
            return {
                totalParticipants: Math.floor(Math.random() * 50000) + 20000,
                activeUsers: Math.floor(Math.random() * 30000) + 15000,
                newUsers: Math.floor(Math.random() * 5000) + 1000,
                returnRate: (Math.random() * 30 + 60).toFixed(1),
                participantsTrend: (Math.random() * 20 - 10).toFixed(1),
                activeUsersTrend: (Math.random() * 15 - 7).toFixed(1),
                newUsersTrend: (Math.random() * 25 - 12).toFixed(1),
                returnRateTrend: (Math.random() * 10 - 5).toFixed(1)
            };
        case 'timewindow':
            return {
                morning: {
                    participation: (Math.random() * 20 + 70).toFixed(1),
                    completion: (Math.random() * 15 + 80).toFixed(1),
                    amount: (Math.random() * 30 + 20).toFixed(2)
                },
                noon: {
                    participation: (Math.random() * 25 + 75).toFixed(1),
                    completion: (Math.random() * 10 + 85).toFixed(1),
                    amount: (Math.random() * 40 + 25).toFixed(2)
                },
                evening: {
                    participation: (Math.random() * 30 + 80).toFixed(1),
                    completion: (Math.random() * 8 + 88).toFixed(1),
                    amount: (Math.random() * 50 + 30).toFixed(2)
                },
                suggestions: [
                    {
                        icon: 'fa-clock',
                        title: '优化时间窗口',
                        description: '建议将晚上场时间调整至20:30，可提升15%参与率',
                        impact: '15%参与率提升'
                    },
                    {
                        icon: 'fa-coins',
                        title: '调整红包金额',
                        description: '中午场红包金额可适当提高，增强吸引力',
                        impact: '10%完成率提升'
                    }
                ],
                performance: Array.from({length: 20}, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    return {
                        date: date.toISOString(),
                        timeWindow: ['上午场', '中午场', '晚上场'][Math.floor(Math.random() * 3)],
                        startTime: ['09:00:00', '12:00:00', '20:00:00'][Math.floor(Math.random() * 3)],
                        endTime: ['09:01:17', '12:01:17', '20:01:17'][Math.floor(Math.random() * 3)],
                        participants: Math.floor(Math.random() * 500) + 100,
                        packetCount: Math.floor(Math.random() * 200) + 50,
                        completionTime: Math.floor(Math.random() * 60) + 20,
                        score: Math.floor(Math.random() * 30) + 70
                    };
                })
            };
        case 'effectiveness':
            return {
                roi: (Math.random() * 50 + 150).toFixed(1),
                engagement: (Math.random() * 5 + 3).toFixed(1),
                conversion: (Math.random() * 15 + 25).toFixed(1),
                satisfaction: (Math.random() * 2 + 8).toFixed(1),
                lifecycle: {
                    newUsers: { count: Math.floor(Math.random() * 5000) + 1000, value: Math.floor(Math.random() * 50000) + 10000 },
                    activeUsers: { count: Math.floor(Math.random() * 15000) + 5000, value: Math.floor(Math.random() * 200000) + 50000 },
                    loyalUsers: { count: Math.floor(Math.random() * 8000) + 2000, value: Math.floor(Math.random() * 300000) + 100000 },
                    churnedUsers: { count: Math.floor(Math.random() * 2000) + 500, value: Math.floor(Math.random() * 20000) + 5000 }
                },
                recommendations: {
                    time: '建议将高峰时段红包金额提升20%，可有效提高用户参与度',
                    amount: '小额红包(1-5元)参与度最高，建议增加此类红包比例',
                    user: '针对新用户推出专属红包活动，提升转化率',
                    effectiveness: '结合用户行为数据，实现个性化红包推送'
                }
            };
        default:
            return {};
    }
}
}

function generateRedPacketReport(dateRange, filters, view) {
    return {
        reportName: `红包分析报告_${view}`,
        dateRange: dateRange,
        filters: filters,
        data: generateRedPacketViewData(view, dateRange, filters),
        generatedAt: new Date().toISOString()
    };
}

function generateRedPacketSegments(type, dateRange, filters) {
    const segmentTypes = {
        frequency: [
            { name: '高频用户', count: 1250, participationRate: 95, avgAmount: 45.6, activity: '极高', description: '每日参与，活跃度极高' },
            { name: '中频用户', count: 3800, participationRate: 78, avgAmount: 32.4, activity: '较高', description: '每周参与3-5次' },
            { name: '低频用户', count: 8900, participationRate: 45, avgAmount: 18.9, activity: '一般', description: '偶尔参与，需要激励' }
        ],
        amount: [
            { name: '大额偏好', count: 890, participationRate: 88, avgAmount: 68.5, activity: '高', description: '偏好大额红包，价值敏感' },
            { name: '中额偏好', count: 4200, participationRate: 72, avgAmount: 35.2, activity: '中等', description: '对中等金额红包响应良好' },
            { name: '小额偏好', count: 9800, participationRate: 65, avgAmount: 12.8, activity: '中等', description: '参与门槛低，数量庞大' }
        ],
        time: [
            { name: '上午活跃', count: 2100, participationRate: 82, avgAmount: 28.9, activity: '高', description: '上午时段活跃用户' },
            { name: '中午活跃', count: 5600, participationRate: 76, avgAmount: 35.4, activity: '高', description: '午休时间参与度高' },
            { name: '晚间活跃', count: 7200, participationRate: 89, avgAmount: 42.1, activity: '极高', description: '晚间黄金时段用户' }
        ]
    };

    return {
        segments: segmentTypes[type] || []
    };
}

// 用户行为分析相关辅助函数
function generateUserBehaviorAnalytics(dateRange, userType, platform) {
    return {
        totalUsers: Math.floor(Math.random() * 10000) + 5000,
        activeUsers: Math.floor(Math.random() * 5000) + 2000,
        avgSessionTime: Math.floor(Math.random() * 1800) + 300, // 5-35分钟
        bounceRate: Math.random() * 30 + 20, // 20-50%
        usersTrend: (Math.random() * 20 - 10).toFixed(1),
        activeTrend: (Math.random() * 15 - 7).toFixed(1),
        sessionTrend: (Math.random() * 25 - 12).toFixed(1),
        bounceTrend: (Math.random() * 10 - 5).toFixed(1),
        insights: [
            {
                icon: '📈',
                title: '用户活跃度提升',
                description: '本周活跃用户数较上周增长12.5%，主要来源于新功能的推出',
                impact: '活跃度提升12.5%'
            },
            {
                icon: '⏱️',
                title: '会话时长优化',
                description: '平均会话时长增加3分钟，用户粘性显著提升',
                impact: '粘性提升18%'
            },
            {
                icon: '🎯',
                title: '跳出率改善',
                description: '通过优化首页体验，跳出率下降5.2%',
                impact: '跳出率降低5.2%'
            }
        ]
    };
}

function generateUserActivityData(filters) {
    return {
        users: Array.from({length: 50}, (_, i) => ({
            id: `user_${i + 1}`,
            lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            sessions: Math.floor(Math.random() * 20) + 1,
            totalTime: Math.floor(Math.random() * 7200) + 300,
            score: Math.floor(Math.random() * 40) + 60
        })),
        activityTrend: Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: date.toISOString().split('T')[0],
                dau: Math.floor(Math.random() * 2000) + 1000,
                wau: Math.floor(Math.random() * 8000) + 4000,
                mau: Math.floor(Math.random() * 25000) + 15000
            };
        }).reverse(),
        hourlyDistribution: Array.from({length: 24}, (_, hour) => ({
            hour,
            users: Math.floor(Math.random() * 500) + 100,
            sessions: Math.floor(Math.random() * 800) + 200
        }))
    };
}

function generateUserRetentionData(filters) {
    return {
        retention: {
            day1: Math.random() * 20 + 60, // 60-80%
            day7: Math.random() * 15 + 35, // 35-50%
            day30: Math.random() * 10 + 15  // 15-25%
        },
        cohort: Array.from({length: 12}, (_, weekIndex) => {
            const cohortData = {
                week: weekIndex,
                users: Math.floor(Math.random() * 1000) + 500,
                retention: []
            };
            
            // 生成每周的留存率数据
            for (let i = 0; i <= 12; i++) {
                const baseRetention = Math.max(0, 100 - i * 8 - Math.random() * 10);
                cohortData.retention.push(Math.max(0, baseRetention).toFixed(1));
            }
            
            return cohortData;
        }),
        retentionTrend: Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: date.toISOString().split('T')[0],
                day1: Math.random() * 10 + 65,
                day7: Math.random() * 8 + 40,
                day30: Math.random() * 5 + 18
            };
        }).reverse()
    };
}

function generateUserPathData(filters) {
    const pages = ['首页', '任务页', '红包页', '钱包页', '团队页', '排行榜', '个人中心', '设置页'];
    
    return {
        pathStats: {
            total: Math.floor(Math.random() * 5000) + 2000,
            avgLength: (Math.random() * 3 + 2).toFixed(1),
            conversion: Math.floor(Math.random() * 1000) + 500
        },
        paths: Array.from({length: 20}, (_, i) => {
            const pathLength = Math.floor(Math.random() * 4) + 2;
            const sequence = [];
            
            for (let j = 0; j < pathLength; j++) {
                const page = pages[Math.floor(Math.random() * pages.length)];
                if (!sequence.includes(page)) {
                    sequence.push(page);
                }
            }
            
            return {
                id: `path_${i + 1}`,
                sequence,
                users: Math.floor(Math.random() * 500) + 50,
                conversionRate: Math.random() * 0.3 + 0.1,
                avgDuration: Math.floor(Math.random() * 1800) + 300,
                bounceRate: Math.random() * 0.4 + 0.1
            };
        }),
        flowData: {
            nodes: pages.map(page => ({ id: page, name: page })),
            links: Array.from({length: 15}, () => ({
                source: pages[Math.floor(Math.random() * pages.length)],
                target: pages[Math.floor(Math.random() * pages.length)],
                value: Math.floor(Math.random() * 1000) + 100
            }))
        }
    };
}

function generateUserSegmentData(filters) {
    const segmentTypes = ['高价值用户', '活跃用户', '新用户', '流失风险用户', '沉睡用户'];
    
    return {
        segments: segmentTypes.map((name, i) => ({
            id: `segment_${i + 1}`,
            name,
            description: `${name}的详细描述和特征分析`,
            size: Math.floor(Math.random() * 2000) + 500,
            activity: Math.floor(Math.random() * 40) + 60,
            value: (Math.random() * 500 + 100).toFixed(2)
        })),
        distribution: segmentTypes.map(name => ({
            name,
            value: Math.floor(Math.random() * 2000) + 500,
            percentage: (Math.random() * 30 + 10).toFixed(1)
        })),
        insights: [
            {
                icon: '💎',
                title: '高价值用户增长',
                description: '高价值用户群体本月增长15%，主要来源于任务完成度提升',
                impact: '收入增长8%'
            },
            {
                icon: '⚠️',
                title: '流失风险预警',
                description: '检测到200名用户有流失风险，建议及时干预',
                impact: '预防流失200人'
            }
        ]
    };
}

function generateUserBehaviorReport(view, filters) {
    // 这里应该生成实际的Excel报告
    // 为了演示，返回一个简单的字符串
    return Buffer.from(`用户行为分析报告 - ${view}\n生成时间: ${new Date().toLocaleString()}\n筛选条件: ${JSON.stringify(filters)}`);
}

// 金融风控系统辅助函数
function generateRiskControlOverview(dateRange, riskLevel) {
    return {
        stats: {
            totalTransactions: Math.floor(Math.random() * 50000) + 20000,
            riskTransactions: Math.floor(Math.random() * 500) + 100,
            blockedTransactions: Math.floor(Math.random() * 50) + 10,
            riskScore: (Math.random() * 30 + 70).toFixed(1)
        },
        riskTrends: Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: date.toISOString().split('T')[0],
                riskCount: Math.floor(Math.random() * 20) + 5,
                riskScore: Math.random() * 20 + 60,
                blockedCount: Math.floor(Math.random() * 5) + 1
            };
        }).reverse(),
        riskDistribution: [
            { level: '低风险', count: Math.floor(Math.random() * 1000) + 500, color: '#52c41a' },
            { level: '中风险', count: Math.floor(Math.random() * 300) + 100, color: '#faad14' },
            { level: '高风险', count: Math.floor(Math.random() * 100) + 20, color: '#f5222d' },
            { level: '极高风险', count: Math.floor(Math.random() * 20) + 5, color: '#722ed1' }
        ],
        alerts: Array.from({length: 10}, (_, i) => ({
            id: `alert_${i + 1}`,
            type: ['异常交易', '可疑账户', '频繁操作', '大额转账'][Math.floor(Math.random() * 4)],
            level: ['低', '中', '高', '紧急'][Math.floor(Math.random() * 4)],
            description: `检测到异常行为 ${i + 1}`,
            time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            status: ['待处理', '处理中', '已处理'][Math.floor(Math.random() * 3)]
        }))
    };
}

function generateRiskDetectionData(filters) {
    return {
        detectionStats: {
            totalChecks: Math.floor(Math.random() * 10000) + 5000,
            riskDetected: Math.floor(Math.random() * 200) + 50,
            falsePositive: Math.floor(Math.random() * 20) + 5,
            accuracy: (Math.random() * 5 + 95).toFixed(1)
        },
        riskTransactions: Array.from({length: 50}, (_, i) => ({
            id: `tx_${i + 1}`,
            userId: `user_${Math.floor(Math.random() * 1000) + 1}`,
            amount: (Math.random() * 10000 + 100).toFixed(2),
            type: ['充值', '提现', '转账', '红包'][Math.floor(Math.random() * 4)],
            riskScore: Math.floor(Math.random() * 100),
            riskFactors: ['异常金额', '频繁操作', '异常时间', '设备异常'].slice(0, Math.floor(Math.random() * 3) + 1),
            status: ['待审核', '已通过', '已拒绝', '需人工'][Math.floor(Math.random() * 4)],
            time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)]
        })),
        riskRules: [
            { name: '大额交易检测', triggered: Math.floor(Math.random() * 50) + 10, accuracy: '96.5%' },
            { name: '频繁操作检测', triggered: Math.floor(Math.random() * 30) + 5, accuracy: '94.2%' },
            { name: '异常时间检测', triggered: Math.floor(Math.random() * 20) + 3, accuracy: '92.8%' },
            { name: '设备指纹检测', triggered: Math.floor(Math.random() * 15) + 2, accuracy: '98.1%' }
        ]
    };
}

function generateRiskAssessmentData(filters) {
    return {
        assessmentStats: {
            totalUsers: Math.floor(Math.random() * 5000) + 2000,
            highRiskUsers: Math.floor(Math.random() * 100) + 20,
            avgRiskScore: (Math.random() * 20 + 40).toFixed(1),
            assessmentAccuracy: (Math.random() * 3 + 97).toFixed(1)
        },
        userRiskProfiles: Array.from({length: 30}, (_, i) => ({
            userId: `user_${i + 1}`,
            username: `用户${i + 1}`,
            riskScore: Math.floor(Math.random() * 100),
            riskLevel: ['低', '中', '高', '极高'][Math.floor(Math.random() * 4)],
            factors: {
                transactionPattern: Math.floor(Math.random() * 100),
                deviceSecurity: Math.floor(Math.random() * 100),
                behaviorConsistency: Math.floor(Math.random() * 100),
                networkSecurity: Math.floor(Math.random() * 100)
            },
            lastAssessment: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            actions: ['监控', '限制', '冻结', '正常'][Math.floor(Math.random() * 4)]
        })),
        riskFactors: [
            { name: '交易模式', weight: 0.3, impact: '高' },
            { name: '设备安全', weight: 0.25, impact: '中' },
            { name: '行为一致性', weight: 0.2, impact: '中' },
            { name: '网络环境', weight: 0.15, impact: '低' },
            { name: '历史记录', weight: 0.1, impact: '低' }
        ]
    };
}

function generateAntiFraudData(filters) {
    return {
        fraudStats: {
            totalCases: Math.floor(Math.random() * 200) + 50,
            confirmedFraud: Math.floor(Math.random() * 50) + 10,
            preventedLoss: (Math.random() * 100000 + 50000).toFixed(2),
            detectionRate: (Math.random() * 5 + 95).toFixed(1)
        },
        fraudCases: Array.from({length: 20}, (_, i) => ({
            id: `fraud_${i + 1}`,
            type: ['账户盗用', '虚假交易', '洗钱行为', '套现欺诈'][Math.floor(Math.random() * 4)],
            severity: ['低', '中', '高', '严重'][Math.floor(Math.random() * 4)],
            amount: (Math.random() * 50000 + 1000).toFixed(2),
            status: ['调查中', '已确认', '已驳回', '待审核'][Math.floor(Math.random() * 4)],
            reportTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            involvedUsers: Math.floor(Math.random() * 5) + 1,
            evidence: ['交易记录', '设备信息', '行为分析', 'IP追踪'].slice(0, Math.floor(Math.random() * 3) + 1)
        })),
        fraudPatterns: [
            { pattern: '批量注册', frequency: Math.floor(Math.random() * 20) + 5, riskLevel: '高' },
            { pattern: '异常登录', frequency: Math.floor(Math.random() * 30) + 10, riskLevel: '中' },
            { pattern: '快速提现', frequency: Math.floor(Math.random() * 15) + 3, riskLevel: '高' },
            { pattern: '设备共享', frequency: Math.floor(Math.random() * 25) + 8, riskLevel: '中' }
        ],
        preventionMeasures: [
            { measure: '实名认证', effectiveness: '98.5%', status: '已启用' },
            { measure: '设备指纹', effectiveness: '96.2%', status: '已启用' },
            { measure: '行为分析', effectiveness: '94.8%', status: '已启用' },
            { measure: 'IP白名单', effectiveness: '92.1%', status: '部分启用' }
        ]
    };
}

function generateRiskRulesData(filters) {
    return {
        rulesStats: {
            totalRules: Math.floor(Math.random() * 50) + 30,
            activeRules: Math.floor(Math.random() * 40) + 25,
            triggeredToday: Math.floor(Math.random() * 100) + 20,
            avgAccuracy: (Math.random() * 5 + 95).toFixed(1)
        },
        riskRules: Array.from({length: 15}, (_, i) => ({
            id: `rule_${i + 1}`,
            name: `风控规则 ${i + 1}`,
            category: ['交易监控', '账户安全', '行为分析', '设备检测'][Math.floor(Math.random() * 4)],
            priority: ['低', '中', '高', '紧急'][Math.floor(Math.random() * 4)],
            status: ['启用', '禁用', '测试'][Math.floor(Math.random() * 3)],
            triggeredCount: Math.floor(Math.random() * 500) + 10,
            accuracy: (Math.random() * 10 + 90).toFixed(1),
            falsePositive: (Math.random() * 5 + 1).toFixed(1),
            lastTriggered: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            description: `这是风控规则 ${i + 1} 的详细描述`,
            conditions: [
                { field: '交易金额', operator: '>', value: '10000' },
                { field: '交易频次', operator: '>', value: '10/小时' }
            ],
            actions: ['记录日志', '发送警告', '暂停交易', '人工审核'].slice(0, Math.floor(Math.random() * 3) + 1)
        })),
        ruleCategories: [
            { name: '交易监控', count: Math.floor(Math.random() * 10) + 5, active: Math.floor(Math.random() * 8) + 4 },
            { name: '账户安全', count: Math.floor(Math.random() * 8) + 3, active: Math.floor(Math.random() * 6) + 2 },
            { name: '行为分析', count: Math.floor(Math.random() * 12) + 6, active: Math.floor(Math.random() * 10) + 5 },
            { name: '设备检测', count: Math.floor(Math.random() * 6) + 2, active: Math.floor(Math.random() * 4) + 1 }
        ]
    };
}

function generateRiskAlertsData(filters) {
    return {
        alertStats: {
            totalAlerts: Math.floor(Math.random() * 500) + 100,
            unhandledAlerts: Math.floor(Math.random() * 50) + 10,
            avgResponseTime: Math.floor(Math.random() * 30) + 5,
            resolutionRate: (Math.random() * 10 + 85).toFixed(1)
        },
        alerts: Array.from({length: 30}, (_, i) => ({
            id: `alert_${i + 1}`,
            title: `风险预警 ${i + 1}`,
            type: ['交易异常', '账户风险', '系统异常', '规则触发'][Math.floor(Math.random() * 4)],
            level: ['信息', '警告', '严重', '紧急'][Math.floor(Math.random() * 4)],
            status: ['未处理', '处理中', '已处理', '已忽略'][Math.floor(Math.random() * 4)],
            priority: Math.floor(Math.random() * 5) + 1,
            description: `这是风险预警 ${i + 1} 的详细描述`,
            source: ['自动检测', '用户举报', '系统监控', '人工发现'][Math.floor(Math.random() * 4)],
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            handledAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
            assignee: Math.random() > 0.5 ? `处理员${Math.floor(Math.random() * 5) + 1}` : null,
            relatedData: {
                userId: `user_${Math.floor(Math.random() * 1000) + 1}`,
                transactionId: `tx_${Math.floor(Math.random() * 10000) + 1}`,
                riskScore: Math.floor(Math.random() * 100)
            }
        })),
        alertTrends: Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: date.toISOString().split('T')[0],
                total: Math.floor(Math.random() * 50) + 10,
                handled: Math.floor(Math.random() * 40) + 5,
                pending: Math.floor(Math.random() * 15) + 2
            };
        }).reverse()
    };
}

function generateRiskControlReport(view, filters) {
    // 这里应该生成实际的Excel报告
    // 为了演示，返回一个简单的字符串
    return Buffer.from(`金融风控报告 - ${view}\n生成时间: ${new Date().toLocaleString()}\n筛选条件: ${JSON.stringify(filters)}`);
}

// 系统监控相关辅助函数
function generateSystemMonitoringOverview() {
    return {
        stats: [
            { title: 'CPU使用率', value: '45%', change: -2.3, type: 'success' },
            { title: '内存使用率', value: '68%', change: 1.5, type: 'warning' },
            { title: '磁盘使用率', value: '32%', change: 0.8, type: 'success' },
            { title: '网络流量', value: '125MB/s', change: 5.2, type: 'info' }
        ],
        cpuData: Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            value: Math.floor(Math.random() * 40) + 30
        })),
        memoryData: Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            value: Math.floor(Math.random() * 30) + 50
        })),
        recentAlerts: [
            {
                title: 'CPU使用率过高',
                message: '服务器CPU使用率超过80%',
                time: '2024-01-15 14:30:00',
                level: 'warning'
            },
            {
                title: '磁盘空间不足',
                message: '数据库服务器磁盘使用率超过90%',
                time: '2024-01-15 13:45:00',
                level: 'danger'
            },
            {
                title: '网络连接异常',
                message: '检测到异常网络连接',
                time: '2024-01-15 12:20:00',
                level: 'info'
            }
        ]
    };
}

function generateServerStatusData() {
    return {
        servers: [
            {
                name: 'Web服务器-01',
                status: 'online',
                statusText: '正常',
                cpu: 45,
                memory: 68,
                disk: 32,
                network: '正常'
            },
            {
                name: 'Web服务器-02',
                status: 'online',
                statusText: '正常',
                cpu: 52,
                memory: 71,
                disk: 28,
                network: '正常'
            },
            {
                name: '数据库服务器',
                status: 'warning',
                statusText: '警告',
                cpu: 78,
                memory: 85,
                disk: 92,
                network: '正常'
            },
            {
                name: '缓存服务器',
                status: 'online',
                statusText: '正常',
                cpu: 35,
                memory: 45,
                disk: 15,
                network: '正常'
            }
        ]
    };
}

function generatePerformanceData(timeRange = '24h', metricType = 'all') {
    const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168;
    
    return {
        loadData: Array.from({ length: hours }, (_, i) => ({
            time: `${i}:00`,
            value: Math.floor(Math.random() * 50) + 20
        })),
        responseData: Array.from({ length: hours }, (_, i) => ({
            time: `${i}:00`,
            value: Math.floor(Math.random() * 200) + 100
        }))
    };
}

function generateSystemLogsData(level = 'all', source = 'all', search = '', page = 1) {
    const logs = [
        {
            time: '2024-01-15 14:35:22',
            level: 'error',
            source: 'api',
            message: '数据库连接超时',
            details: 'Connection timeout after 30 seconds'
        },
        {
            time: '2024-01-15 14:32:15',
            level: 'warning',
            source: 'system',
            message: 'CPU使用率过高',
            details: 'CPU usage: 85%'
        },
        {
            time: '2024-01-15 14:28:45',
            level: 'info',
            source: 'api',
            message: '用户登录成功',
            details: 'User ID: 12345'
        },
        {
            time: '2024-01-15 14:25:30',
            level: 'error',
            source: 'database',
            message: '查询执行失败',
            details: 'SQL syntax error in query'
        },
        {
            time: '2024-01-15 14:22:18',
            level: 'warning',
            source: 'system',
            message: '内存使用率过高',
            details: 'Memory usage: 90%'
        }
    ];

    return {
        logs: logs.slice((page - 1) * 20, page * 20),
        total: logs.length,
        page: parseInt(page),
        pageSize: 20
    };
}

function generateAlertsData() {
    return {
        alertRules: [
            {
                name: 'CPU使用率告警',
                metric: 'CPU使用率',
                threshold: '> 80%',
                status: 'active',
                statusText: '启用',
                lastTriggered: '2024-01-15 14:30:00'
            },
            {
                name: '内存使用率告警',
                metric: '内存使用率',
                threshold: '> 85%',
                status: 'active',
                statusText: '启用',
                lastTriggered: '2024-01-15 13:45:00'
            },
            {
                name: '磁盘空间告警',
                metric: '磁盘使用率',
                threshold: '> 90%',
                status: 'active',
                statusText: '启用',
                lastTriggered: '2024-01-15 12:20:00'
            },
            {
                name: '响应时间告警',
                metric: '平均响应时间',
                threshold: '> 2000ms',
                status: 'inactive',
                statusText: '禁用',
                lastTriggered: null
            }
        ]
    };
}

function generateSystemMonitoringReport(type, timeRange) {
    // 为了演示，返回一个简单的字符串
    return Buffer.from(`系统监控报告 - ${type}\n生成时间: ${new Date().toLocaleString()}\n时间范围: ${timeRange}`);
}

// 数据备份系统相关辅助函数
function generateDataBackupOverview() {
    return {
        stats: {
            totalBackups: Math.floor(Math.random() * 200) + 100,
            storageUsed: (Math.random() * 2 + 1).toFixed(1) + 'TB',
            successRate: (Math.random() * 5 + 95).toFixed(1) + '%',
            lastBackup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        },
        recentBackups: Array.from({length: 10}, (_, i) => ({
            id: i + 1,
            name: `备份任务 ${i + 1}`,
            type: ['full', 'incremental', 'differential'][Math.floor(Math.random() * 3)],
            status: ['success', 'failed', 'running'][Math.floor(Math.random() * 3)],
            size: (Math.random() * 5 + 0.1).toFixed(2) + 'GB',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        })),
        alerts: [
            {
                type: 'info',
                message: '下次自动备份将在今晚 2:00 AM 执行'
            },
            {
                type: 'warning',
                message: '备份存储空间使用率已达到 85%，建议清理旧备份'
            }
        ]
    };
}

function generateBackupsList(filters) {
    const { type, status, date, page = 1, limit = 20 } = filters;
    const total = Math.floor(Math.random() * 500) + 100;
    
    return {
        backups: Array.from({length: Math.min(limit, 20)}, (_, i) => ({
            id: (page - 1) * limit + i + 1,
            name: `数据备份 ${(page - 1) * limit + i + 1}`,
            type: type || ['full', 'incremental', 'differential'][Math.floor(Math.random() * 3)],
            status: status || ['success', 'failed', 'running', 'pending'][Math.floor(Math.random() * 4)],
            size: (Math.random() * 10 + 0.1).toFixed(2) + 'GB',
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : null,
            description: `自动生成的备份任务 ${(page - 1) * limit + i + 1}`
        })),
        pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            pageSize: parseInt(limit),
            totalItems: total
        }
    };
}

function generateScheduleData() {
    return {
        schedules: Array.from({length: 5}, (_, i) => ({
            id: i + 1,
            name: `定时任务 ${i + 1}`,
            frequency: ['daily', 'weekly', 'monthly'][Math.floor(Math.random() * 3)],
            time: `0${Math.floor(Math.random() * 6) + 1}:00`,
            backupType: ['full', 'incremental'][Math.floor(Math.random() * 2)],
            retentionDays: [7, 15, 30, 60, 90][Math.floor(Math.random() * 5)],
            status: ['active', 'inactive'][Math.floor(Math.random() * 2)],
            nextRun: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            lastRun: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
    };
}

async function createBackupTask(params) {
    const { name, type, scope, description } = params;
    // 模拟创建备份任务
    return {
        success: true,
        taskId: Math.random().toString(36).substr(2, 9),
        message: '备份任务已创建并开始执行',
        estimatedTime: Math.floor(Math.random() * 60) + 10 + ' 分钟'
    };
}

async function restoreBackupTask(params) {
    const { backupId, password, options } = params;
    // 模拟恢复备份任务
    if (password !== 'admin123') {
        throw new Error('密码错误');
    }
    return {
        success: true,
        taskId: Math.random().toString(36).substr(2, 9),
        message: '恢复任务已启动',
        estimatedTime: Math.floor(Math.random() * 120) + 30 + ' 分钟'
    };
}

async function createScheduleTask(params) {
    const { name, frequency, time, retentionDays, backupType } = params;
    // 模拟创建定时任务
    return {
        success: true,
        scheduleId: Math.random().toString(36).substr(2, 9),
        message: '定时任务已创建',
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
}

async function getBackupFile(id) {
    // 模拟获取备份文件
    return {
        path: `/tmp/backup_${id}.zip`,
        name: `backup_${id}_${new Date().toISOString().split('T')[0]}.zip`
    };
}

async function deleteBackup(id) {
    // 模拟删除备份
    return {
        success: true,
        message: '备份已删除'
    };
}

function generateDataBackupReport(type) {
    // 模拟生成备份报告
    return Buffer.from(`数据备份报告 - ${type}\n生成时间: ${new Date().toLocaleString()}\n报告类型: ${type}`);
}

module.exports = router;