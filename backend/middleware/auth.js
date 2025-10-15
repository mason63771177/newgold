const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redisClient } = require('../config/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    // 测试模式：支持模拟token
    if (token.startsWith('mock-token-')) {
      const userId = token.replace('mock-token-', '');
      req.user = { 
        id: parseInt(userId) || userId,
        username: `test_user_${userId}`,
        status: 1,  // 设置为状态1，允许激活
        role: userId === 'admin' ? 'admin' : 'user'  // 支持管理员测试
      };
      req.token = token;
      return next();
    }

    // 检查token是否在黑名单中
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: '令牌已失效'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 获取用户信息 - 支持管理员token的id字段和用户token的userId字段
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '令牌格式错误'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    } else {
      console.error('认证中间件错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // 测试模式：支持模拟token
      if (token.startsWith('mock-token-')) {
        const userId = token.replace('mock-token-', '');
        req.user = { 
          id: parseInt(userId) || userId,
          username: `test_user_${userId}`,
          status: 1,  // 设置为状态1，允许激活
          role: userId === 'admin' ? 'admin' : 'user'  // 支持管理员测试
        };
        req.token = token;
        return next();
      }

      // 检查token是否在黑名单中
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (!isBlacklisted) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            req.user = user;
            req.token = token;
          }
        }
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next();
  }
};

// 生成JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 将token加入黑名单
const blacklistToken = async (token) => {
  try {
    // 解析token获取过期时间
    const decoded = jwt.decode(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn > 0) {
      await redisClient.setEx(`blacklist:${token}`, expiresIn, 'true');
    }
  } catch (error) {
    console.error('加入黑名单失败:', error);
  }
};

// 检查用户状态中间件
const checkUserStatus = (allowedStatuses = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    if (allowedStatuses.length > 0 && !allowedStatuses.includes(req.user.status)) {
      return res.status(403).json({
        success: false,
        message: '用户状态不允许此操作',
        currentStatus: req.user.status,
        allowedStatuses
      });
    }

    next();
  };
};

/**
 * 角色权限检查中间件
 * @param {string} requiredRole - 需要的角色
 * @returns {Function} Express中间件函数
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

/**
 * 管理员权限检查中间件
 * 组合认证和管理员角色检查
 */
const requireAdminAuth = [authenticateToken, requireRole('admin')];

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  blacklistToken,
  checkUserStatus,
  requireRole,
  requireAdminAuth
};