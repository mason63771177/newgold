# 最佳实践指南

## 概述

本文档描述了H5游戏化金融产品后端开发的最佳实践，遵循Context7规范，确保代码质量和项目可维护性。

## 代码规范

### 1. 命名规范

#### 变量和函数命名
- 使用驼峰命名法 (camelCase)
- 变量名应具有描述性
- 布尔变量使用 `is`、`has`、`can` 等前缀

```javascript
// ✅ 好的命名
const userName = 'john_doe';
const isUserActive = true;
const canUserWithdraw = false;
const hasPermission = true;

// ❌ 避免的命名
const u = 'john_doe';
const flag = true;
const temp = false;
```

#### 常量命名
- 使用大写字母和下划线

```javascript
// ✅ 好的常量命名
const MAX_WITHDRAWAL_AMOUNT = 10000;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;
```

#### 类和构造函数命名
- 使用帕斯卡命名法 (PascalCase)

```javascript
// ✅ 好的类命名
class UserController {
  // ...
}

class WalletService {
  // ...
}
```

### 2. 函数设计原则

#### 单一职责原则
每个函数应该只做一件事情

```javascript
// ✅ 好的设计
async function validateUserInput(userData) {
  // 只负责验证用户输入
}

async function saveUserToDatabase(userData) {
  // 只负责保存用户到数据库
}

// ❌ 避免的设计
async function validateAndSaveUser(userData) {
  // 同时做验证和保存，职责不单一
}
```

#### 函数参数
- 参数数量不超过3个
- 使用对象参数传递多个参数

```javascript
// ✅ 好的参数设计
async function createUser({ username, email, password, inviteCode }) {
  // ...
}

// ❌ 避免的参数设计
async function createUser(username, email, password, inviteCode, status, balance) {
  // 参数过多
}
```

### 3. 错误处理

#### 统一错误响应格式

```javascript
// ✅ 统一的错误响应
function sendErrorResponse(res, statusCode, message, code = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    timestamp: new Date().toISOString()
  });
}

// 使用示例
try {
  // 业务逻辑
} catch (error) {
  console.error('操作失败:', error);
  return sendErrorResponse(res, 500, '服务器内部错误', 'INTERNAL_ERROR');
}
```

#### 错误日志记录

```javascript
const winston = require('winston');

// ✅ 结构化日志记录
logger.error('用户登录失败', {
  userId: req.user?.id,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  error: error.message,
  stack: error.stack
});
```

## 数据库操作

### 1. 连接池使用

```javascript
// ✅ 使用连接池
const { pool } = require('../config/database');

async function getUserById(userId) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    return rows[0];
  } catch (error) {
    console.error('数据库查询失败:', error);
    throw error;
  }
}
```

### 2. SQL注入防护

```javascript
// ✅ 使用参数化查询
const [users] = await pool.execute(
  'SELECT * FROM users WHERE email = ? AND status = ?',
  [email, status]
);

// ❌ 避免字符串拼接
const query = `SELECT * FROM users WHERE email = '${email}'`; // 危险！
```

### 3. 事务处理

```javascript
// ✅ 正确的事务处理
async function transferBalance(fromUserId, toUserId, amount) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 扣除发送方余额
    await connection.execute(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [amount, fromUserId]
    );
    
    // 增加接收方余额
    await connection.execute(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, toUserId]
    );
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

## 安全最佳实践

### 1. 输入验证

```javascript
const { body, validationResult } = require('express-validator');

// ✅ 输入验证中间件
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名格式不正确'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('邮箱格式不正确'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码强度不够'),
];
```

### 2. 密码处理

```javascript
const bcrypt = require('bcryptjs');

// ✅ 密码加密
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// ✅ 密码验证
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
```

### 3. JWT Token管理

```javascript
const jwt = require('jsonwebtoken');

// ✅ Token生成
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'h5-game-backend',
    audience: 'h5-game-frontend'
  });
}

// ✅ Token验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    req.user = user;
    next();
  });
}
```

## 性能优化

### 1. 数据库查询优化

```javascript
// ✅ 使用索引和限制查询结果
async function getUsersWithPagination(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const [users] = await pool.execute(`
    SELECT id, username, email, status, created_at 
    FROM users 
    WHERE status = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `, [1, limit, offset]);
  
  return users;
}
```

### 2. 缓存策略

```javascript
const Redis = require('redis');
const redis = Redis.createClient();

// ✅ 缓存用户信息
async function getCachedUserInfo(userId) {
  const cacheKey = `user:${userId}`;
  
  // 先从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 缓存未命中，从数据库获取
  const user = await getUserById(userId);
  if (user) {
    // 缓存5分钟
    await redis.setex(cacheKey, 300, JSON.stringify(user));
  }
  
  return user;
}
```

### 3. 异步处理

```javascript
// ✅ 使用异步处理耗时操作
async function processUserRegistration(userData) {
  try {
    // 同步处理关键操作
    const user = await createUser(userData);
    
    // 异步处理非关键操作
    setImmediate(async () => {
      try {
        await sendWelcomeEmail(user.email);
        await updateUserStatistics();
      } catch (error) {
        console.error('异步任务失败:', error);
      }
    });
    
    return user;
  } catch (error) {
    throw error;
  }
}
```

## 测试最佳实践

### 1. 单元测试

```javascript
// ✅ 单元测试示例
const { UserController } = require('../controllers/userController');

describe('UserController', () => {
  describe('validateStatusTransition', () => {
    test('应该允许从状态1切换到状态2', () => {
      const result = UserController.validateStatusTransition(1, 2);
      expect(result).toBe(true);
    });
    
    test('应该拒绝无效的状态切换', () => {
      const result = UserController.validateStatusTransition(1, 3);
      expect(result).toBe(false);
    });
  });
});
```

### 2. 集成测试

```javascript
// ✅ API集成测试
const request = require('supertest');
const app = require('../server');

describe('User API', () => {
  let authToken;
  
  beforeAll(async () => {
    // 获取测试用户的token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });
    
    authToken = response.body.token;
  });
  
  test('GET /api/user/info 应该返回用户信息', async () => {
    const response = await request(app)
      .get('/api/user/info')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
  });
});
```

## 部署和监控

### 1. 环境配置

```javascript
// ✅ 环境变量管理
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
};

module.exports = config;
```

### 2. 健康检查

```javascript
// ✅ 健康检查端点
app.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await pool.execute('SELECT 1');
    
    // 检查Redis连接
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### 3. 日志记录

```javascript
const winston = require('winston');

// ✅ 结构化日志配置
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

## 总结

遵循这些最佳实践可以确保：

1. **代码质量**: 可读性强、易于维护
2. **安全性**: 防止常见的安全漏洞
3. **性能**: 高效的数据库操作和缓存策略
4. **可测试性**: 完善的测试覆盖
5. **可监控性**: 完整的日志和健康检查

定期审查和更新这些实践，确保项目始终遵循最新的行业标准。