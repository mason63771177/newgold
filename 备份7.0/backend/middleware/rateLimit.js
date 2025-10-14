/**
 * 速率限制中间件
 * 防止API滥用和恶意攻击
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * 通用速率限制配置
 */
const createRateLimit = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100, // 最大请求数
        message: {
            success: false,
            message: '请求过于频繁，请稍后再试',
            retryAfter: Math.ceil(options.windowMs / 1000) || 900
        },
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
            sendCommand: (...args) => redis.call(...args),
        }),
        keyGenerator: (req) => {
            // 优先使用用户ID，其次使用IP地址
            return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
        },
        onLimitReached: (req, res, options) => {
            const identifier = req.user?.id ? `用户${req.user.id}` : `IP${req.ip}`;
            logger.warn('速率限制触发', {
                identifier,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent')
            });
        }
    };

    return rateLimit({
        ...defaultOptions,
        ...options,
        message: {
            ...defaultOptions.message,
            ...options.message
        }
    });
};

/**
 * 严格的速率限制 - 用于敏感操作
 */
const strictRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最大5次请求
    message: {
        success: false,
        message: '敏感操作请求过于频繁，请15分钟后再试',
        retryAfter: 900
    }
});

/**
 * 中等速率限制 - 用于一般API
 */
const moderateRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 50, // 最大50次请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: 900
    }
});

/**
 * 宽松的速率限制 - 用于查询操作
 */
const lenientRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 200, // 最大200次请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: 900
    }
});

/**
 * 登录速率限制 - 防止暴力破解
 */
const loginRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10, // 最大10次登录尝试
    skipSuccessfulRequests: true, // 成功的请求不计入限制
    keyGenerator: (req) => {
        // 使用邮箱和IP的组合作为键
        const email = req.body?.email || 'unknown';
        return `login:${email}:${req.ip}`;
    },
    message: {
        success: false,
        message: '登录尝试过于频繁，请15分钟后再试',
        retryAfter: 900
    }
});

/**
 * 注册速率限制 - 防止批量注册
 */
const registerRateLimit = createRateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 3, // 最大3次注册
    keyGenerator: (req) => `register:${req.ip}`,
    message: {
        success: false,
        message: '注册过于频繁，请1小时后再试',
        retryAfter: 3600
    }
});

/**
 * 提现速率限制 - 防止频繁提现
 */
const withdrawRateLimit = createRateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 10, // 最大10次提现
    keyGenerator: (req) => {
        return req.user?.id ? `withdraw:user:${req.user.id}` : `withdraw:ip:${req.ip}`;
    },
    message: {
        success: false,
        message: '提现操作过于频繁，请1小时后再试',
        retryAfter: 3600
    }
});

/**
 * 钱包操作速率限制
 */
const walletRateLimit = createRateLimit({
    windowMs: 5 * 60 * 1000, // 5分钟
    max: 30, // 最大30次请求
    keyGenerator: (req) => {
        return req.user?.id ? `wallet:user:${req.user.id}` : `wallet:ip:${req.ip}`;
    },
    message: {
        success: false,
        message: '钱包操作过于频繁，请5分钟后再试',
        retryAfter: 300
    }
});

/**
 * 管理员操作速率限制
 */
const adminRateLimit = createRateLimit({
    windowMs: 5 * 60 * 1000, // 5分钟
    max: 100, // 最大100次请求
    keyGenerator: (req) => {
        return req.user?.id ? `admin:user:${req.user.id}` : `admin:ip:${req.ip}`;
    },
    message: {
        success: false,
        message: '管理员操作过于频繁，请稍后再试',
        retryAfter: 300
    }
});

/**
 * API密钥速率限制 - 用于API密钥访问
 */
const apiKeyRateLimit = createRateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 60, // 最大60次请求
    keyGenerator: (req) => {
        const apiKey = req.headers['x-api-key'] || req.query.apiKey;
        return apiKey ? `apikey:${apiKey}` : `ip:${req.ip}`;
    },
    message: {
        success: false,
        message: 'API请求过于频繁，请稍后再试',
        retryAfter: 60
    }
});

/**
 * 动态速率限制 - 根据用户等级调整限制
 */
const dynamicRateLimit = (req, res, next) => {
    const user = req.user;
    let maxRequests = 50; // 默认限制
    
    if (user) {
        // 根据用户等级或VIP状态调整限制
        if (user.isVip) {
            maxRequests = 200;
        } else if (user.level >= 5) {
            maxRequests = 100;
        }
    }

    const dynamicLimit = createRateLimit({
        windowMs: 15 * 60 * 1000,
        max: maxRequests,
        keyGenerator: (req) => {
            return req.user?.id ? `dynamic:user:${req.user.id}` : `dynamic:ip:${req.ip}`;
        }
    });

    return dynamicLimit(req, res, next);
};

/**
 * 创建自定义速率限制
 * @param {Object} config - 配置选项
 * @returns {Function} 速率限制中间件
 */
const createCustomRateLimit = (config) => {
    return createRateLimit(config);
};

/**
 * 速率限制状态检查中间件
 */
const rateLimitStatus = async (req, res, next) => {
    try {
        const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
        const current = await redis.get(`rl:${key}`);
        
        if (current) {
            res.set('X-RateLimit-Remaining', Math.max(0, 100 - parseInt(current)));
        }
        
        next();
    } catch (error) {
        logger.error('速率限制状态检查失败', { error: error.message });
        next();
    }
};

module.exports = {
    // 基础速率限制
    strictRateLimit,
    moderateRateLimit,
    lenientRateLimit,
    
    // 功能特定速率限制
    loginRateLimit,
    registerRateLimit,
    withdrawRateLimit,
    walletRateLimit,
    adminRateLimit,
    apiKeyRateLimit,
    
    // 动态和自定义速率限制
    dynamicRateLimit,
    createCustomRateLimit,
    createRateLimit,
    
    // 工具函数
    rateLimitStatus
};