# 裂金7日 - Tatum中心化钱包系统

## 项目简介

本项目为"裂金7日"游戏平台开发的中心化钱包系统，基于Tatum API实现TRC20 USDT的充值、提现、资金归集等核心功能。系统采用Node.js + Express架构，提供安全、稳定的钱包服务。

## 核心功能

### 🏦 钱包管理
- **独立地址生成**: 为每个玩家生成唯一的TRC20 USDT充值地址
- **余额管理**: 实时查询和更新用户钱包余额
- **交易记录**: 完整的充值、提现、归集交易历史

### 💰 充值功能
- **地址监听**: 自动监听用户充值地址的入账交易
- **确认机制**: 区块确认后自动更新用户余额
- **重复防护**: 防止重复入账的安全机制

### 💸 提现功能
- **智能手续费**: 固定费用(2 USDT) + 浮动费用(1%-5%)
- **安全验证**: 多重验证确保提现安全
- **实时处理**: 自动化提现处理流程

### 🔄 资金归集
- **批量归集**: 定期将子钱包资金归集到主钱包
- **手动触发**: 管理员可手动执行归集操作
- **状态跟踪**: 完整的归集操作记录

### 👥 用户管理
- **用户认证**: JWT令牌认证系统
- **权限控制**: 基于角色的访问控制
- **管理界面**: 完整的用户和交易管理界面

## 技术架构

### 后端技术栈
- **Node.js 18+**: 服务器运行环境
- **Express 4.x**: Web应用框架
- **MySQL 8.0**: 主数据库
- **Redis 6.x**: 缓存和会话存储
- **JWT**: 身份认证
- **Helmet**: 安全中间件
- **Morgan**: 日志记录

### 前端技术栈
- **原生JavaScript**: 前端逻辑
- **Bootstrap 5**: UI框架
- **Chart.js**: 数据可视化
- **响应式设计**: 移动端适配

### 第三方服务
- **Tatum API**: 区块链钱包服务
- **Nginx**: 反向代理
- **PM2**: 进程管理

## 快速开始

### 环境要求
- Node.js 18.0+
- MySQL 8.0+
- Redis 6.0+
- Nginx (生产环境)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd backend
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和API密钥
```

4. **数据库初始化**
```bash
node scripts/init-database.js
```

5. **启动服务**
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## 环境变量配置

```env
# 服务器配置
NODE_ENV=production
PORT=8080

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gold7_game
DB_USER=your_username
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Tatum API配置
TATUM_API_KEY=your_tatum_api_key
TATUM_TESTNET=true

# 钱包配置
MAIN_WALLET_ADDRESS=your_main_wallet_address
FEE_WALLET_ADDRESS=your_fee_wallet_address
```

## API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌

### 钱包接口
- `GET /api/wallet/balance` - 查询余额
- `GET /api/wallet/deposit-address` - 获取充值地址
- `POST /api/wallet/withdraw` - 申请提现
- `GET /api/wallet/transactions` - 交易历史

### 管理员接口
- `GET /api/admin/users` - 用户管理
- `GET /api/admin/transactions` - 交易管理
- `POST /api/admin/consolidate` - 资金归集
- `GET /api/admin/stats` - 系统统计

### 系统接口
- `GET /api/health` - 健康检查
- `GET /api/metrics` - 性能指标

## 项目结构

```
backend/
├── config/              # 配置文件
│   ├── database.js      # 数据库配置
│   ├── redis.js         # Redis配置
│   └── security.js      # 安全配置
├── controllers/         # 控制器
│   ├── authController.js
│   ├── walletController.js
│   └── adminController.js
├── middleware/          # 中间件
│   ├── auth.js          # 认证中间件
│   ├── validation.js    # 数据验证
│   └── errorHandler.js  # 错误处理
├── models/              # 数据模型
│   ├── User.js
│   ├── Transaction.js
│   └── Admin.js
├── routes/              # 路由定义
│   ├── auth.js
│   ├── wallet.js
│   └── admin.js
├── services/            # 业务服务
│   ├── authService.js
│   └── transactionService.js
├── scripts/             # 工具脚本
│   ├── init-database.js
│   ├── monitoring-dashboard.js
│   └── security-audit.js
├── docs/                # 项目文档
│   ├── deployment-guide.md
│   ├── operations-manual.md
│   └── project-summary.md
├── public/              # 静态文件
│   ├── admin/           # 管理员界面
│   └── user/            # 用户界面
├── logs/                # 日志文件
├── reports/             # 系统报告
└── server.js            # 服务器入口
```

## 监控和运维

### 系统监控
```bash
# 启动监控仪表板
./start-monitoring.sh

# 或者使用
node scripts/launch-dashboard.js
```

### 性能分析
```bash
# 运行性能分析
node scripts/performance-optimization.js
```

### 安全审计
```bash
# 执行安全审计
node scripts/security-audit.js
```

### 系统验证
```bash
# 最终系统验证
node scripts/final-system-validation.js
```

## 部署指南

### 开发环境部署
参考快速开始部分的安装步骤。

### 生产环境部署
详细的生产环境部署指南请参考 [部署指南](docs/deployment-guide.md)。

### 运维手册
日常运维和故障处理请参考 [运维手册](docs/operations-manual.md)。

## 安全措施

### 认证和授权
- JWT令牌认证
- 基于角色的访问控制
- 会话管理和令牌刷新

### 数据安全
- 输入验证和清理
- SQL注入防护
- XSS攻击防护

### 网络安全
- HTTPS强制加密
- CORS跨域控制
- 速率限制

### 系统安全
- 敏感文件权限控制
- 环境变量保护
- 日志安全记录

## 性能优化

### 数据库优化
- 索引优化
- 查询优化
- 连接池管理

### 缓存策略
- Redis缓存
- 会话缓存
- 查询结果缓存

### 系统优化
- Gzip压缩
- 静态资源优化
- 负载均衡

## 故障排除

### 常见问题
1. **数据库连接失败**: 检查数据库配置和网络连接
2. **Redis连接失败**: 检查Redis服务状态和配置
3. **API调用失败**: 检查Tatum API密钥和网络连接
4. **权限错误**: 检查JWT令牌和用户权限

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log

# 查看访问日志
tail -f logs/access.log
```

### 健康检查
```bash
# 检查系统健康状态
curl http://localhost:8080/api/health
```

## 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循JavaScript标准规范
- 添加适当的注释和文档

### 测试
```bash
# 运行单元测试
npm test

# 运行集成测试
npm run test:integration

# 运行安全测试
npm run test:security
```

### 贡献指南
1. Fork项目
2. 创建功能分支
3. 提交代码更改
4. 创建Pull Request

## 版本历史

### v1.0.0 (当前版本)
- ✅ 基础钱包功能实现
- ✅ 用户认证系统
- ✅ 管理员界面
- ✅ 监控和日志系统
- ✅ 安全措施实施
- ✅ 部署和运维文档

### 后续版本计划
- v1.1.0: Tatum API完整集成
- v1.2.0: 高级监控和报警
- v1.3.0: 性能优化和扩展

## 支持和联系

### 技术支持
- 查看文档: [docs/](docs/)
- 问题反馈: 创建Issue
- 紧急支持: 参考运维手册

### 开发团队
- 项目负责人: 开发团队
- 技术架构: Node.js + Express
- 数据库: MySQL + Redis

## 许可证

本项目采用 MIT 许可证。详情请参考 LICENSE 文件。

---

**注意**: 本项目为"裂金7日"游戏平台的核心钱包系统，请确保在生产环境中正确配置所有安全措施和环境变量。