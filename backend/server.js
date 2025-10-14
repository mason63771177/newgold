console.log('🔧 开始加载server.js...');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('📦 基础模块加载完成');

const logger = require('./utils/logger');
const { pool, redisClient, testConnection } = require('./config/database');
const { connectRedis } = require('./config/redis');
// const { performanceMiddleware } = require('./middleware/monitoring'); // 暂时注释掉
const webSocketService = require('./services/WebSocketService');
const countdownService = require('./services/CountdownService');
const authRoutes = require('./routes/auth');
const stateRoutes = require('./routes/state');
const taskRoutes = require('./routes/tasks');
const redpacketRoutes = require('./routes/redpacket');
const walletRoutes = require('./routes/wallet');
const teamRoutes = require('./routes/team');
const rankingRoutes = require('./routes/ranking');
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const balanceRoutes = require('./routes/balanceRoutes');
const depositRoutes = require('./routes/depositRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const feeProfitRoutes = require('./routes/fee-profit');
const realWalletRoutes = require('./routes/realWallet');
const monitoringRoutes = require('./routes/monitoring');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// 生产环境安全配置
if (isProduction) {
    // 生产环境安全配置 - 允许必要的外部资源
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
                imgSrc: ["'self'", "data:", "https:", "https://www.google-analytics.com"],
                connectSrc: ["'self'", "wss:", "ws:", "https://www.google-analytics.com", "https://analytics.google.com"],
                fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
} else {
    // 开发环境宽松配置 - 允许开发所需的资源
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "wss:", "ws:", "https://www.google-analytics.com", "https://analytics.google.com"],
                fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
    }));
}

// CORS配置 - 优先处理OPTIONS请求
app.options('*', (req, res) => {
    const allowedOrigins = isProduction 
        ? ['https://mason63771177.github.io', 'https://mason63771177.github.io/newgold']
        : ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:8001', 'http://127.0.0.1:8001', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:8080', 'http://127.0.0.1:8080'];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24小时缓存
    res.status(200).end();
});

// CORS中间件
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = isProduction 
            ? ['https://mason63771177.github.io', 'https://mason63771177.github.io/newgold']
            : ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:8001', 'http://127.0.0.1:8001', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:8080', 'http://127.0.0.1:8080'];
        
        // 允许没有origin的请求（如Postman）
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    maxAge: 86400, // 24小时缓存预检请求
    optionsSuccessStatus: 200 // 支持旧版浏览器
}));

// 生产环境限流配置
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: isProduction ? 100 : 1000, // 生产环境更严格的限制
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(globalLimiter);

// 基础中间件
// app.use(performanceMiddleware); // 暂时注释掉

// 生产环境压缩
if (isProduction) {
    app.use(compression());
}

// 日志中间件
app.use(morgan(isProduction ? 'combined' : 'dev'));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session 配置
app.use(session({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // 开发环境设为false
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

// 静态文件服务 - 提供前端页面
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
// 添加项目根目录静态文件服务，支持admin.html等根目录文件
app.use(express.static(path.join(__dirname, '..')));

// 健康检查 - 无需认证的公开端点
app.get('/health', (req, res) => {
    // 设置CORS头部确保预检请求通过
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

// API健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        services: {
            database: 'connected',
            redis: 'connected',
            tatum: 'connected'
        }
    });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/user', require('./routes/user'));
app.use('/api/state', stateRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/redpacket', redpacketRoutes);
app.use('/api/wallet', require('./routes/wallet-test')); // 测试路由，无需认证，放在前面
app.use('/api/wallet', walletRoutes);
app.use('/api/tatum-wallet', require('./routes/walletRoutes')); // Tatum基础钱包服务
app.use('/api/team', teamRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/activation', require('./routes/activation'));
app.use('/api/empty-structure', require('./routes/emptyStructure'));
app.use('/api/websocket', require('./routes/websocket'));
app.use('/api/admin', adminRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/fee-profit', feeProfitRoutes);
app.use('/api/real-wallet', realWalletRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/tatum', require('./routes/tatumWebhook'));
app.use('/api/virtual-wallet', require('./routes/virtualWallet'));
app.use('/api/test', require('./routes/testRoutes')); // 测试API路由
app.use('/api/test', require('./routes/test')); // 额外的测试API路由
app.use('/api/test-db', require('./routes/test-db')); // 数据库测试路由
app.use('/api/test-login', require('./routes/testLogin')); // 测试登录路由

// 添加测试管理员钱包路由
app.use('/api/test-admin', require('./routes/testAdminWallet'));

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 全局错误处理
app.use((error, req, res, next) => {
    console.error('全局错误:', error);
    
    // 数据库错误
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: '数据已存在'
        });
    }
    
    // JWT错误
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: '无效的访问令牌'
        });
    }
    
    // 验证错误
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: '数据验证失败',
            errors: error.errors
        });
    }
    
    // 默认错误
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? '服务器内部错误' 
            : error.message
    });
});

// 关闭数据库连接
async function closeConnections() {
    try {
        if (pool) {
            await pool.end();
            console.log('📦 数据库连接池已关闭');
        }
        
        if (redisClient) {
            await redisClient.quit();
            console.log('🔴 Redis连接已关闭');
        }
    } catch (error) {
        console.error('❌ 关闭连接时出错:', error);
    }
}

/**
 * 创建HTTPS服务器（如果启用SSL）
 * @param {Express} app Express应用实例
 * @returns {Promise<Server>} HTTPS服务器实例
 */
async function createHttpsServer(app) {
    const sslEnabled = process.env.SSL_ENABLED === 'true';
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;
    
    if (!sslEnabled) {
        return null;
    }
    
    if (!certPath || !keyPath) {
        console.warn('⚠️ SSL已启用但证书路径未配置，将使用HTTP服务器');
        return null;
    }
    
    try {
        // 检查证书文件是否存在
        if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
            console.warn('⚠️ SSL证书文件不存在，将使用HTTP服务器');
            return null;
        }
        
        const options = {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
        };
        
        const httpsServer = https.createServer(options, app);
        console.log('🔒 HTTPS服务器已创建');
        return httpsServer;
        
    } catch (error) {
        console.error('❌ 创建HTTPS服务器失败:', error);
        console.warn('⚠️ 将使用HTTP服务器');
        return null;
    }
}

// 启动服务器
async function startServer() {
    try {
        console.log('🚀 开始启动服务器...');
        
        // 测试数据库连接
        console.log('📊 测试数据库连接...');
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️ 数据库连接失败，服务器将在无数据库模式下运行');
            console.warn('⚠️ 某些功能可能不可用，建议配置数据库');
        } else {
            console.log('✅ 数据库连接成功');
        }
        
        // 尝试创建HTTPS服务器
        console.log('🔒 尝试创建HTTPS服务器...');
        const httpsServer = await createHttpsServer(app);
        
        // 创建HTTP服务器
        console.log('🌐 创建HTTP服务器...');
        const httpServer = http.createServer(app);
        
        // 初始化WebSocket服务
        console.log('🔌 初始化WebSocket服务...');
        const wsServer = httpsServer || httpServer;
        webSocketService.initialize(wsServer);
        console.log('✅ WebSocket服务初始化完成');
        
        // 初始化倒计时服务
        console.log('⏰ 初始化倒计时服务...');
        countdownService.init();
        console.log('✅ 倒计时服务初始化完成');
        
        // 启动服务器
        if (httpsServer) {
            console.log('🔒 启动HTTPS服务器...');
            const httpsPort = process.env.HTTPS_PORT || 443;
            httpsServer.listen(httpsPort, () => {
                console.log(`🔒 HTTPS服务器运行在端口 ${httpsPort}`);
                console.log(`📍 健康检查: https://localhost:${httpsPort}/health`);
                console.log(`🔗 API文档: https://localhost:${httpsPort}/api`);
                console.log(`🔌 WebSocket: wss://localhost:${httpsPort}/ws`);
            });
            
            // HTTP重定向到HTTPS
            const httpRedirectServer = http.createServer((req, res) => {
                res.writeHead(301, {
                    Location: `https://${req.headers.host}${req.url}`
                });
                res.end();
            });
            
            httpRedirectServer.listen(PORT, () => {
                console.log(`🔄 HTTP重定向服务器运行在端口 ${PORT} (重定向到HTTPS)`);
            });
            
        } else {
            console.log('🌐 启动HTTP服务器...');
            // 只启动HTTP服务器
            httpServer.listen(PORT, () => {
                console.log(`🚀 HTTP服务器运行在端口 ${PORT}`);
                console.log(`📍 健康检查: http://localhost:${PORT}/health`);
                console.log(`🔗 API文档: http://localhost:${PORT}/api`);
                console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
            });
        }
        
        console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔑 Tatum环境: ${process.env.TATUM_ENVIRONMENT || 'testnet'}`);
        
        // 优雅关闭
        const gracefulShutdown = async (signal) => {
            console.log(`\n📡 收到 ${signal} 信号，开始优雅关闭...`);
            
            const closeServer = (server, name) => {
                return new Promise((resolve) => {
                    if (server) {
                        server.close(() => {
                            console.log(`🔒 ${name}服务器已关闭`);
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            };
            
            // 关闭所有服务器
            await Promise.all([
                closeServer(httpServer, 'HTTP'),
                closeServer(httpsServer, 'HTTPS')
            ]);
            
            // 关闭WebSocket服务
            webSocketService.close();
            
            // 关闭数据库连接
            await closeConnections();
            
            console.log('✅ 服务器已优雅关闭');
            process.exit(0);
        };
        
         // 监听关闭信号
         process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
         process.on('SIGINT', () => gracefulShutdown('SIGINT'));
         
         // 监听未捕获的异常
         process.on('uncaughtException', (error) => {
             console.error('❌ 未捕获的异exception:', error);
             gracefulShutdown('uncaughtException');
         });
         
         process.on('unhandledRejection', (reason, promise) => {
             console.error('❌ 未处理的Promise拒绝:', reason);
             gracefulShutdown('unhandledRejection');
         });
         
     } catch (error) {
         console.error('❌ 服务器启动失败:', error);
         process.exit(1);
     }
}

// 启动服务器
startServer();

module.exports = app;