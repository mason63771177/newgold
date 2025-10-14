/**
 * 安全配置文件
 * 包含应用程序的安全设置和最佳实践
 */

module.exports = {
    // JWT 配置
    jwt: {
        // JWT 密钥应至少 32 个字符
        secretMinLength: 32,
        // JWT 过期时间
        expiresIn: '24h',
        // 刷新令牌过期时间
        refreshExpiresIn: '7d'
    },

    // 密码策略
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    },

    // 速率限制
    rateLimit: {
        // 全局限制
        global: {
            windowMs: 15 * 60 * 1000, // 15分钟
            max: 100 // 每个IP最多100个请求
        },
        // 登录限制
        login: {
            windowMs: 15 * 60 * 1000, // 15分钟
            max: 5 // 每个IP最多5次登录尝试
        },
        // API限制
        api: {
            windowMs: 1 * 60 * 1000, // 1分钟
            max: 60 // 每个IP每分钟最多60个API请求
        }
    },

    // 会话配置
    session: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        sameSite: 'strict'
    },

    // CORS 配置
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.ALLOWED_ORIGINS?.split(',') || []
            : ['http://localhost:8000', 'http://127.0.0.1:8000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // 内容安全策略
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },

    // 文件上传限制
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf'
        ],
        maxFiles: 5
    },

    // 数据库安全
    database: {
        // 连接池配置
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
        // SSL 配置
        ssl: process.env.NODE_ENV === 'production',
        // 查询超时
        queryTimeout: 30000
    },

    // Redis 安全
    redis: {
        // 连接超时
        connectTimeout: 10000,
        // 命令超时
        commandTimeout: 5000,
        // 重试配置
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
    },

    // 日志配置
    logging: {
        // 敏感字段，不应记录在日志中
        sensitiveFields: [
            'password',
            'token',
            'secret',
            'key',
            'mnemonic',
            'privateKey',
            'authorization'
        ],
        // 日志级别
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    },

    // 监控配置
    monitoring: {
        // 健康检查间隔
        healthCheckInterval: 30000, // 30秒
        // 性能监控
        performanceMonitoring: true,
        // 错误追踪
        errorTracking: true
    }
};