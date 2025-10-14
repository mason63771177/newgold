const logger = require('../utils/logger');

/**
 * 管理员权限验证中间件
 * 验证用户是否具有管理员权限
 */
const adminMiddleware = (req, res, next) => {
    try {
        // 检查用户是否已认证
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '用户未认证'
            });
        }

        // 检查用户是否为管理员
        // 这里简化处理，实际应该从数据库查询用户角色
        const adminUserIds = [1, 118]; // 假设用户ID为1和118的是管理员
        const isAdmin = adminUserIds.includes(req.user.id) || req.user.role === 'admin';

        if (!isAdmin) {
            logger.warn('非管理员用户尝试访问管理员功能', {
                userId: req.user.id,
                username: req.user.username,
                path: req.path,
                method: req.method
            });

            return res.status(403).json({
                success: false,
                message: '权限不足，需要管理员权限'
            });
        }

        // 为后续中间件添加管理员标识
        req.user.isAdmin = true;
        
        logger.info('管理员权限验证通过', {
            userId: req.user.id,
            username: req.user.username,
            path: req.path,
            method: req.method
        });

        next();
        
    } catch (error) {
        logger.error('管理员权限验证失败', {
            error: error.message,
            userId: req.user?.id,
            path: req.path
        });

        res.status(500).json({
            success: false,
            message: '权限验证失败'
        });
    }
};

module.exports = adminMiddleware;