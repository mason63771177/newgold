const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
require('dotenv').config();

const { testConnection, closeConnections } = require('./config/database');
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

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // 生产环境域名
    : ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:8001', 'http://127.0.0.1:8001', 'http://localhost:3001', 'http://127.0.0.1:3001'], // 开发环境
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // 支持旧版浏览器
}));

// 全局限流
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
app.use('/api/team', teamRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/activation', require('./routes/activation'));
app.use('/api/empty-structure', require('./routes/emptyStructure'));
app.use('/api/websocket', require('./routes/websocket'));
app.use('/api/admin', adminRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('全局错误处理:', err);
  
  // 数据库连接错误
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      success: false,
      message: '数据库连接失败，请稍后重试'
    });
  }
  
  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '访问令牌已过期'
    });
  }
  
  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }
  
  // 默认错误
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化WebSocket服务
webSocketService.init(server);

// 启动服务器
server.listen(PORT, async () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  
  try {
    // 测试数据库连接
    await testConnection();
    console.log('✅ 数据库连接测试成功');
    
    // 启动倒计时服务
    countdownService.start();
    console.log('✅ 倒计时服务已启动');
    
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  
  server.close(async () => {
    console.log('HTTP服务器已关闭');
    
    try {
      await closeConnections();
      console.log('数据库连接已关闭');
      
      countdownService.stop();
      console.log('倒计时服务已停止');
      
      process.exit(0);
    } catch (error) {
      console.error('关闭过程中出现错误:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  
  server.close(async () => {
    console.log('HTTP服务器已关闭');
    
    try {
      await closeConnections();
      console.log('数据库连接已关闭');
      
      countdownService.stop();
      console.log('倒计时服务已停止');
      
      process.exit(0);
    } catch (error) {
      console.error('关闭过程中出现错误:', error);
      process.exit(1);
    }
  });
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

module.exports = app;