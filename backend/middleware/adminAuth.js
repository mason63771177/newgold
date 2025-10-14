const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * 管理员认证中间件
 * 验证管理员token的有效性
 */
const adminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: '访问被拒绝，需要管理员权限' 
            });
        }

        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 检查是否为管理员
        if (!decoded.isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: '权限不足，需要管理员权限' 
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.error('管理员认证错误:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Token无效或已过期' 
        });
    }
};

/**
 * 管理员登录验证
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Object} 验证结果
 */
const validateAdminLogin = async (username, password) => {
    try {
        console.log('开始验证登录:', { username, password }); // 调试日志
        
        // 简化的管理员验证，直接比较明文密码（仅用于测试）
        const adminAccounts = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'super_admin',
                permissions: ['all']
            },
            {
                id: 2,
                username: 'manager',
                password: 'manager123',
                role: 'manager',
                permissions: ['users', 'transactions', 'tasks']
            }
        ];

        // 查找管理员账户
        const admin = adminAccounts.find(acc => acc.username === username);
        console.log('找到的管理员账户:', admin); // 调试日志
        
        if (!admin) {
            console.log('用户名不存在'); // 调试日志
            return { success: false, message: '用户名不存在' };
        }

        // 验证密码（简化版本）
        if (password !== admin.password) {
            console.log('密码错误'); // 调试日志
            return { success: false, message: '密码错误' };
        }

        console.log('密码验证成功，生成token'); // 调试日志

        // 生成JWT token
        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                permissions: admin.permissions,
                isAdmin: true
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        return {
            success: true,
            token,
            user: {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                permissions: admin.permissions
            }
        };
    } catch (error) {
        console.error('管理员登录验证错误:', error);
        return { success: false, message: '服务器错误' };
    }
};

/**
 * 检查特定权限
 * @param {Array} requiredPermissions - 需要的权限列表
 */
const checkPermission = (requiredPermissions) => {
    return (req, res, next) => {
        const adminPermissions = req.admin.permissions;
        
        // 超级管理员拥有所有权限
        if (adminPermissions.includes('all')) {
            return next();
        }

        // 检查是否拥有所需权限
        const hasPermission = requiredPermissions.some(permission => 
            adminPermissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: '权限不足，无法执行此操作'
            });
        }

        next();
    };
};

/**
 * 记录管理员操作日志
 * @param {string} action - 操作类型
 * @param {Object} details - 操作详情
 */
const logAdminAction = (action, details = {}) => {
    return (req, res, next) => {
        // 记录操作信息
        const logData = {
            adminId: req.admin.id,
            adminUsername: req.admin.username,
            action,
            details,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date()
        };

        // 这里可以将日志保存到数据库或文件
        console.log('管理员操作日志:', JSON.stringify(logData, null, 2));
        
        next();
    };
};

module.exports = {
    adminAuth,
    validateAdminLogin,
    checkPermission,
    logAdminAction
};