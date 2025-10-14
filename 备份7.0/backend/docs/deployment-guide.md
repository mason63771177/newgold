# 裂金7日 - 生产环境部署指南

## 概述

本文档提供了裂金7日项目的完整生产环境部署指南，包括系统要求、环境配置、部署步骤和运维管理。

## 系统要求

### 硬件要求
- **CPU**: 最少 2 核，推荐 4 核以上
- **内存**: 最少 4GB，推荐 8GB 以上
- **存储**: 最少 50GB SSD，推荐 100GB 以上
- **网络**: 稳定的互联网连接，带宽 ≥ 10Mbps

### 软件要求
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8+
- **Node.js**: v18.0.0 或更高版本
- **MySQL**: v8.0 或更高版本
- **Redis**: v6.0 或更高版本
- **Nginx**: v1.18 或更高版本
- **PM2**: 进程管理器

## 环境准备

### 1. 系统更新
```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# CentOS
sudo yum update -y
```

### 2. 安装 Node.js
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 安装 MySQL
```bash
# Ubuntu
sudo apt install mysql-server -y

# 安全配置
sudo mysql_secure_installation

# 创建数据库和用户
sudo mysql -u root -p
```

```sql
CREATE DATABASE gold7_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gold7_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON gold7_game.* TO 'gold7_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 安装 Redis
```bash
# Ubuntu
sudo apt install redis-server -y

# 启动并启用服务
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 验证安装
redis-cli ping
```

### 5. 安装 Nginx
```bash
# Ubuntu
sudo apt install nginx -y

# 启动并启用服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. 安装 PM2
```bash
npm install -g pm2
```

## 项目部署

### 1. 代码部署
```bash
# 创建项目目录
sudo mkdir -p /var/www/gold7-game
sudo chown $USER:$USER /var/www/gold7-game

# 克隆项目代码
cd /var/www/gold7-game
git clone <your-repository-url> .

# 安装依赖
cd backend
npm install --production
```

### 2. 环境配置
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑环境配置
nano .env
```

**生产环境 .env 配置示例:**
```env
# 服务器配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gold7_game
DB_USER=gold7_user
DB_PASSWORD=your_secure_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT 配置
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Tatum API 配置
TATUM_API_KEY=your_tatum_api_key
TATUM_TESTNET=false

# 主钱包配置
MAIN_WALLET_MNEMONIC=your_main_wallet_mnemonic_phrase
MAIN_WALLET_ADDRESS=your_main_wallet_address

# 手续费配置
FIXED_FEE=2
VARIABLE_FEE_RATE=0.02

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# 安全配置
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12

# 监控配置
ENABLE_MONITORING=true
LOG_LEVEL=info
```

### 3. 数据库初始化
```bash
# 运行数据库迁移
node scripts/init-database.js

# 验证数据库结构
mysql -u gold7_user -p gold7_game -e "SHOW TABLES;"
```

### 4. SSL 证书配置
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 验证自动续期
sudo certbot renew --dry-run
```

### 5. Nginx 配置
```bash
# 创建站点配置
sudo nano /etc/nginx/sites-available/gold7-game
```

**Nginx 配置示例:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 静态文件
    location / {
        root /var/www/gold7-game;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
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

    # WebSocket 支持
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/gold7-game /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 6. PM2 进程管理
```bash
# 创建 PM2 配置文件
nano ecosystem.config.js
```

**PM2 配置示例:**
```javascript
module.exports = {
  apps: [{
    name: 'gold7-game-backend',
    script: './server.js',
    cwd: '/var/www/gold7-game/backend',
    instances: 'max',
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
```

```bash
# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 监控和日志

### 1. 系统监控
```bash
# 安装系统监控工具
sudo apt install htop iotop nethogs -y

# PM2 监控
pm2 monit

# 查看应用状态
pm2 status
pm2 logs gold7-game-backend
```

### 2. 日志管理
```bash
# 创建日志目录
mkdir -p /var/www/gold7-game/backend/logs

# 配置日志轮转
sudo nano /etc/logrotate.d/gold7-game
```

**日志轮转配置:**
```
/var/www/gold7-game/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reload gold7-game-backend
    endscript
}
```

### 3. 健康检查
```bash
# 创建健康检查脚本
nano /var/www/gold7-game/scripts/health-check.sh
```

```bash
#!/bin/bash
# 健康检查脚本

API_URL="https://your-domain.com/api/health"
WEBHOOK_URL="your-slack-webhook-url"

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -ne 200 ]; then
    echo "API 健康检查失败: HTTP $response"
    # 发送告警通知
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 Gold7 Game API 健康检查失败: HTTP '$response'"}' \
        $WEBHOOK_URL
    exit 1
fi

echo "API 健康检查正常"
```

```bash
# 设置定时健康检查
chmod +x /var/www/gold7-game/scripts/health-check.sh
crontab -e

# 添加以下行（每5分钟检查一次）
*/5 * * * * /var/www/gold7-game/scripts/health-check.sh
```

## 安全配置

### 1. 防火墙设置
```bash
# 启用 UFW
sudo ufw enable

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 限制数据库访问
sudo ufw allow from localhost to any port 3306
sudo ufw allow from localhost to any port 6379

# 查看状态
sudo ufw status
```

### 2. 系统安全加固
```bash
# 禁用 root 登录
sudo nano /etc/ssh/sshd_config
# 设置 PermitRootLogin no

# 配置自动安全更新
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. 数据库安全
```bash
# MySQL 安全配置
sudo mysql -u root -p
```

```sql
-- 删除匿名用户
DELETE FROM mysql.user WHERE User='';

-- 删除测试数据库
DROP DATABASE IF EXISTS test;

-- 刷新权限
FLUSH PRIVILEGES;
```

## 备份策略

### 1. 数据库备份
```bash
# 创建备份脚本
nano /var/www/gold7-game/scripts/backup-database.sh
```

```bash
#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="/var/backups/gold7-game"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="gold7_game"
DB_USER="gold7_user"
DB_PASS="your_secure_password"

mkdir -p $BACKUP_DIR

# 创建数据库备份
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

```bash
# 设置定时备份
chmod +x /var/www/gold7-game/scripts/backup-database.sh
crontab -e

# 添加以下行（每天凌晨2点备份）
0 2 * * * /var/www/gold7-game/scripts/backup-database.sh
```

### 2. 代码备份
```bash
# 创建代码备份脚本
nano /var/www/gold7-game/scripts/backup-code.sh
```

```bash
#!/bin/bash
# 代码备份脚本

BACKUP_DIR="/var/backups/gold7-game"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/gold7-game"

mkdir -p $BACKUP_DIR

# 创建代码备份
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz -C $PROJECT_DIR .

# 删除30天前的备份
find $BACKUP_DIR -name "code_backup_*.tar.gz" -mtime +30 -delete

echo "代码备份完成: $BACKUP_DIR/code_backup_$DATE.tar.gz"
```

## 性能优化

### 1. Node.js 优化
```bash
# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=2048"

# 启用生产模式
export NODE_ENV=production
```

### 2. MySQL 优化
```bash
# 编辑 MySQL 配置
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
# 基本配置
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 查询缓存
query_cache_type = 1
query_cache_size = 128M

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

### 3. Redis 优化
```bash
# 编辑 Redis 配置
sudo nano /etc/redis/redis.conf
```

```ini
# 内存优化
maxmemory 1gb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000

# 网络优化
tcp-keepalive 300
timeout 0
```

## 故障排除

### 1. 常见问题
- **应用无法启动**: 检查环境变量和依赖安装
- **数据库连接失败**: 验证数据库配置和权限
- **Redis 连接失败**: 检查 Redis 服务状态
- **SSL 证书问题**: 验证证书有效性和配置

### 2. 日志分析
```bash
# 查看应用日志
pm2 logs gold7-game-backend

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看系统日志
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f
```

### 3. 性能诊断
```bash
# 系统资源监控
htop
iotop
nethogs

# 数据库性能
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW ENGINE INNODB STATUS\G"

# Redis 性能
redis-cli info
redis-cli monitor
```

## 更新和维护

### 1. 应用更新
```bash
# 拉取最新代码
cd /var/www/gold7-game
git pull origin main

# 安装新依赖
cd backend
npm install --production

# 重启应用
pm2 reload gold7-game-backend
```

### 2. 系统维护
```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# 清理日志
sudo journalctl --vacuum-time=30d

# 清理包缓存
sudo apt autoremove -y
sudo apt autoclean
```

### 3. 监控检查
```bash
# 检查服务状态
sudo systemctl status nginx
sudo systemctl status mysql
sudo systemctl status redis-server

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

## 联系信息

如有部署问题，请联系技术支持团队：
- 邮箱: tech-support@gold7game.com
- 文档: https://docs.gold7game.com
- 问题追踪: https://github.com/your-org/gold7-game/issues

---

**注意**: 请根据实际环境调整配置参数，确保所有敏感信息（密码、密钥等）的安全性。