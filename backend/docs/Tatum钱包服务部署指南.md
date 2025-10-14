# Tatum 中心化钱包服务部署指南

## 概述

本文档提供了 Tatum 中心化钱包服务的完整部署指南，包括环境配置、安全设置、监控和维护。

## 系统要求

### 硬件要求
- CPU: 2核心以上
- 内存: 4GB 以上
- 存储: 50GB 以上 SSD
- 网络: 稳定的互联网连接

### 软件要求
- Node.js 18.x 或更高版本
- MySQL 8.0 或更高版本
- Redis 6.0 或更高版本
- PM2 进程管理器
- Nginx (可选，用于反向代理)

## 环境配置

### 1. 环境变量设置

创建 `.env` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=gold7_game

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Tatum API 配置
TATUM_API_KEY=your_tatum_api_key
TATUM_TESTNET=false

# 钱包配置
MASTER_WALLET_MNEMONIC=your_master_wallet_mnemonic
ENCRYPTION_KEY=your_32_character_encryption_key

# 服务配置
PORT=3000
NODE_ENV=production

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=./logs/wallet-service.log
```

### 2. 数据库初始化

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE gold7_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行初始化脚本
node scripts/init-database.js
```

### 3. 依赖安装

```bash
npm install --production
```

## 安全配置

### 1. 助记词安全

- 助记词必须存储在安全的环境变量中
- 使用硬件安全模块 (HSM) 或密钥管理服务
- 定期备份助记词到离线存储

### 2. API 密钥管理

- Tatum API 密钥应具有最小权限
- 定期轮换 API 密钥
- 监控 API 使用情况

### 3. 数据库安全

- 使用强密码
- 启用 SSL 连接
- 限制数据库访问权限
- 定期备份数据库

### 4. 网络安全

- 使用防火墙限制端口访问
- 启用 HTTPS
- 实施 IP 白名单

## 部署步骤

### 1. 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tatum-wallet-service',
    script: 'server.js',
    cwd: '/path/to/your/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location /api/wallet/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

## 监控和日志

### 1. 日志配置

日志文件位置：
- 应用日志: `./logs/wallet-service.log`
- 错误日志: `./logs/err.log`
- 访问日志: `./logs/out.log`

### 2. 监控指标

关键监控指标：
- 服务可用性
- 响应时间
- 错误率
- 数据库连接状态
- Redis 连接状态
- 钱包余额变化
- 交易处理量

### 3. 告警设置

设置以下告警：
- 服务宕机
- 响应时间超过 5 秒
- 错误率超过 1%
- 数据库连接失败
- 主钱包余额低于阈值

## 维护操作

### 1. 定期任务

```bash
# 创建定期任务脚本
cat > maintenance.sh << EOF
#!/bin/bash

# 日志轮转
find ./logs -name "*.log" -size +100M -exec gzip {} \;
find ./logs -name "*.gz" -mtime +30 -delete

# 数据库优化
mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "OPTIMIZE TABLE wallet_transactions, wallet_mappings, users;"

# 清理过期数据
node scripts/cleanup-expired-data.js

# 资金归集
node scripts/auto-consolidation.js
EOF

chmod +x maintenance.sh

# 添加到 crontab
echo "0 2 * * * /path/to/maintenance.sh" | crontab -
```

### 2. 备份策略

```bash
# 数据库备份脚本
cat > backup.sh << EOF
#!/bin/bash

BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/database.sql

# 配置文件备份
cp .env $BACKUP_DIR/
cp ecosystem.config.js $BACKUP_DIR/

# 压缩备份
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# 清理旧备份
find /backup -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# 每日备份
echo "0 1 * * * /path/to/backup.sh" | crontab -
```

## 故障排除

### 1. 常见问题

**服务无法启动**
- 检查环境变量配置
- 验证数据库连接
- 查看错误日志

**交易处理失败**
- 检查 Tatum API 密钥
- 验证网络连接
- 检查主钱包余额

**数据库连接超时**
- 检查数据库服务状态
- 验证连接池配置
- 检查网络连接

### 2. 日志分析

```bash
# 查看实时日志
pm2 logs tatum-wallet-service

# 搜索错误日志
grep -i error ./logs/wallet-service.log

# 分析交易日志
grep "transaction" ./logs/wallet-service.log | tail -100
```

## 性能优化

### 1. 数据库优化

- 添加适当的索引
- 定期优化表结构
- 配置连接池参数

### 2. 缓存策略

- 使用 Redis 缓存频繁查询的数据
- 实施查询结果缓存
- 配置合适的过期时间

### 3. 负载均衡

- 使用 PM2 集群模式
- 配置 Nginx 负载均衡
- 实施数据库读写分离

## 安全检查清单

- [ ] 助记词安全存储
- [ ] API 密钥权限最小化
- [ ] 数据库访问控制
- [ ] 网络防火墙配置
- [ ] SSL 证书配置
- [ ] 日志敏感信息过滤
- [ ] 定期安全审计
- [ ] 备份恢复测试

## 联系支持

如遇到技术问题，请联系：
- 技术支持邮箱: support@example.com
- 紧急联系电话: +86-xxx-xxxx-xxxx
- 文档更新: 请查看项目 README.md

---

**注意**: 本文档应定期更新，确保与最新的系统配置保持一致。