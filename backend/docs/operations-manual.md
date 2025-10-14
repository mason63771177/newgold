# 裂金7日 - 运维手册

## 概述

本手册提供了裂金7日项目的日常运维指南，包括监控、故障处理、性能优化和安全管理等内容。

## 目录

1. [日常监控](#日常监控)
2. [故障处理](#故障处理)
3. [性能优化](#性能优化)
4. [安全管理](#安全管理)
5. [备份恢复](#备份恢复)
6. [更新部署](#更新部署)
7. [应急响应](#应急响应)

## 日常监控

### 1. 系统健康检查

#### 自动监控脚本
```bash
# 运行系统健康检查
cd /var/www/gold7-game/backend
node scripts/health-check.js

# 查看监控仪表板
node scripts/monitoring-dashboard.js --url https://your-domain.com --token your-admin-token
```

#### 关键指标监控
- **响应时间**: < 100ms (正常), < 500ms (警告), > 500ms (严重)
- **CPU 使用率**: < 70% (正常), < 85% (警告), > 85% (严重)
- **内存使用率**: < 80% (正常), < 90% (警告), > 90% (严重)
- **磁盘使用率**: < 80% (正常), < 90% (警告), > 90% (严重)
- **数据库连接**: 正常连接数 < 80% 最大连接数

#### 日常检查清单
- [ ] 应用服务状态正常
- [ ] 数据库服务运行正常
- [ ] Redis 服务运行正常
- [ ] Nginx 服务运行正常
- [ ] SSL 证书有效期 > 30天
- [ ] 磁盘空间充足
- [ ] 备份任务执行正常
- [ ] 日志文件大小合理

### 2. 应用监控

#### PM2 监控
```bash
# 查看应用状态
pm2 status

# 查看实时监控
pm2 monit

# 查看应用日志
pm2 logs gold7-game-backend --lines 100

# 查看错误日志
pm2 logs gold7-game-backend --err --lines 50
```

#### 数据库监控
```bash
# 连接数监控
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# 慢查询监控
mysql -u root -p -e "SHOW STATUS LIKE 'Slow_queries';"

# 查看正在执行的查询
mysql -u root -p -e "SHOW PROCESSLIST;"

# 检查表锁定情况
mysql -u root -p -e "SHOW STATUS LIKE 'Table_locks%';"
```

#### Redis 监控
```bash
# 查看 Redis 信息
redis-cli info

# 查看内存使用
redis-cli info memory

# 查看连接数
redis-cli info clients

# 查看慢查询
redis-cli slowlog get 10
```

### 3. 业务监控

#### 钱包服务监控
```bash
# 检查主钱包余额
curl -H "Authorization: Bearer your-admin-token" \
     https://your-domain.com/api/admin/wallet/balance

# 检查待处理交易
curl -H "Authorization: Bearer your-admin-token" \
     https://your-domain.com/api/admin/transactions/pending

# 检查充值监听状态
curl -H "Authorization: Bearer your-admin-token" \
     https://your-domain.com/api/admin/deposits/status
```

#### 用户活动监控
```bash
# 查看在线用户数
curl -H "Authorization: Bearer your-admin-token" \
     https://your-domain.com/api/admin/users/online

# 查看今日注册用户
curl -H "Authorization: Bearer your-admin-token" \
     https://your-domain.com/api/admin/users/today

# 查看异常登录
curl -H "Authorization: Bearer your-admin-token" \
     https://your-domain.com/api/admin/security/suspicious-logins
```

## 故障处理

### 1. 应用故障

#### 应用无响应
```bash
# 检查进程状态
pm2 status

# 重启应用
pm2 restart gold7-game-backend

# 如果重启失败，强制重启
pm2 delete gold7-game-backend
pm2 start ecosystem.config.js
```

#### 内存泄漏
```bash
# 查看内存使用
pm2 monit

# 生成内存快照
node --inspect server.js &
# 使用 Chrome DevTools 连接并生成 heap snapshot

# 重启应用释放内存
pm2 restart gold7-game-backend
```

#### 高 CPU 使用率
```bash
# 查看进程 CPU 使用
top -p $(pgrep -f "node.*server.js")

# 生成 CPU 性能分析
node --prof server.js &
# 运行一段时间后停止，分析 isolate-*.log 文件

# 临时限制 CPU 使用
cpulimit -p $(pgrep -f "node.*server.js") -l 50
```

### 2. 数据库故障

#### 连接数过多
```bash
# 查看当前连接
mysql -u root -p -e "SHOW PROCESSLIST;"

# 杀死长时间运行的查询
mysql -u root -p -e "KILL <process_id>;"

# 增加最大连接数（临时）
mysql -u root -p -e "SET GLOBAL max_connections = 300;"
```

#### 慢查询问题
```bash
# 查看慢查询日志
sudo tail -f /var/log/mysql/slow.log

# 分析慢查询
mysqldumpslow /var/log/mysql/slow.log

# 优化查询（添加索引）
mysql -u root -p gold7_game -e "EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';"
```

#### 磁盘空间不足
```bash
# 清理二进制日志
mysql -u root -p -e "PURGE BINARY LOGS BEFORE DATE_SUB(NOW(), INTERVAL 7 DAY);"

# 优化表
mysql -u root -p gold7_game -e "OPTIMIZE TABLE users, transactions, wallets;"

# 清理临时文件
sudo find /tmp -name "mysql*" -mtime +1 -delete
```

### 3. Redis 故障

#### Redis 内存不足
```bash
# 查看内存使用
redis-cli info memory

# 清理过期键
redis-cli --scan --pattern "*" | xargs redis-cli del

# 手动触发内存回收
redis-cli memory purge

# 调整内存策略
redis-cli config set maxmemory-policy allkeys-lru
```

#### Redis 连接问题
```bash
# 检查 Redis 服务状态
sudo systemctl status redis-server

# 重启 Redis 服务
sudo systemctl restart redis-server

# 检查配置文件
sudo nano /etc/redis/redis.conf
```

### 4. Nginx 故障

#### 502 Bad Gateway
```bash
# 检查后端服务状态
pm2 status

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx
```

#### SSL 证书过期
```bash
# 检查证书有效期
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout | grep "Not After"

# 手动续期证书
sudo certbot renew

# 重启 Nginx
sudo systemctl restart nginx
```

## 性能优化

### 1. 应用性能优化

#### 启用缓存
```javascript
// 在应用中启用 Redis 缓存
const redis = require('redis');
const client = redis.createClient();

// 缓存用户数据
app.get('/api/users/:id', async (req, res) => {
    const cacheKey = `user:${req.params.id}`;
    const cached = await client.get(cacheKey);
    
    if (cached) {
        return res.json(JSON.parse(cached));
    }
    
    const user = await getUserFromDB(req.params.id);
    await client.setex(cacheKey, 300, JSON.stringify(user));
    res.json(user);
});
```

#### 数据库连接池优化
```javascript
// 优化 MySQL 连接池配置
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 20,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});
```

#### 启用压缩
```javascript
// 在 Express 应用中启用 gzip 压缩
const compression = require('compression');
app.use(compression());
```

### 2. 数据库性能优化

#### 索引优化
```sql
-- 为常用查询添加索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_wallets_address ON wallets(address);

-- 复合索引
CREATE INDEX idx_transactions_user_status ON transactions(user_id, status);
```

#### 查询优化
```sql
-- 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM transactions WHERE user_id = 1 AND status = 'completed';

-- 优化分页查询
SELECT * FROM transactions 
WHERE id > (SELECT id FROM transactions ORDER BY id LIMIT 1000, 1) 
ORDER BY id LIMIT 20;
```

### 3. 系统性能优化

#### 内核参数调优
```bash
# 编辑系统参数
sudo nano /etc/sysctl.conf

# 添加以下参数
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000

# 应用参数
sudo sysctl -p
```

#### 文件描述符限制
```bash
# 编辑限制配置
sudo nano /etc/security/limits.conf

# 添加以下行
* soft nofile 65535
* hard nofile 65535

# 重启系统或重新登录生效
```

## 安全管理

### 1. 访问控制

#### 防火墙管理
```bash
# 查看防火墙状态
sudo ufw status

# 添加 IP 白名单
sudo ufw allow from 192.168.1.100 to any port 22

# 封禁恶意 IP
sudo ufw deny from 192.168.1.200

# 限制连接频率
sudo ufw limit ssh
```

#### SSH 安全
```bash
# 禁用密码登录，只允许密钥登录
sudo nano /etc/ssh/sshd_config
# 设置 PasswordAuthentication no

# 更改默认端口
# 设置 Port 2222

# 重启 SSH 服务
sudo systemctl restart sshd
```

### 2. 应用安全

#### 安全头配置
```javascript
// 在 Express 应用中添加安全头
const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

#### 输入验证
```javascript
// 使用 joi 进行输入验证
const Joi = require('joi');

const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
});
```

### 3. 数据安全

#### 敏感数据加密
```javascript
// 加密敏感数据
const crypto = require('crypto');

function encrypt(text) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: cipher.getAuthTag().toString('hex')
    };
}
```

#### 数据库安全
```sql
-- 定期更改数据库密码
ALTER USER 'gold7_user'@'localhost' IDENTIFIED BY 'new_secure_password';

-- 审计数据库访问
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/general.log';
```

## 备份恢复

### 1. 自动备份

#### 数据库备份脚本
```bash
#!/bin/bash
# /var/www/gold7-game/scripts/backup-database.sh

BACKUP_DIR="/var/backups/gold7-game"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="gold7_game"
DB_USER="gold7_user"
DB_PASS="your_secure_password"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u $DB_USER -p$DB_PASS --single-transaction --routines --triggers $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 上传到云存储（可选）
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/

# 删除本地旧备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

#### 文件备份脚本
```bash
#!/bin/bash
# /var/www/gold7-game/scripts/backup-files.sh

BACKUP_DIR="/var/backups/gold7-game"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/gold7-game"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 文件备份（排除 node_modules 和日志）
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='.git' \
    -C $PROJECT_DIR .

# 删除本地旧备份
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +30 -delete

echo "文件备份完成: $BACKUP_DIR/files_backup_$DATE.tar.gz"
```

### 2. 数据恢复

#### 数据库恢复
```bash
# 停止应用
pm2 stop gold7-game-backend

# 恢复数据库
gunzip < /var/backups/gold7-game/db_backup_20231201_020000.sql.gz | mysql -u gold7_user -p gold7_game

# 重启应用
pm2 start gold7-game-backend
```

#### 文件恢复
```bash
# 停止应用
pm2 stop gold7-game-backend

# 备份当前文件
mv /var/www/gold7-game /var/www/gold7-game.backup

# 恢复文件
mkdir -p /var/www/gold7-game
tar -xzf /var/backups/gold7-game/files_backup_20231201_020000.tar.gz -C /var/www/gold7-game

# 重新安装依赖
cd /var/www/gold7-game/backend
npm install --production

# 重启应用
pm2 start ecosystem.config.js
```

## 更新部署

### 1. 滚动更新

#### 零停机部署脚本
```bash
#!/bin/bash
# /var/www/gold7-game/scripts/deploy.sh

PROJECT_DIR="/var/www/gold7-game"
BACKUP_DIR="/var/backups/gold7-game/deployments"
DATE=$(date +%Y%m%d_%H%M%S)

echo "开始部署..."

# 创建部署备份
mkdir -p $BACKUP_DIR
cp -r $PROJECT_DIR $BACKUP_DIR/backup_$DATE

# 拉取最新代码
cd $PROJECT_DIR
git fetch origin
git checkout main
git pull origin main

# 安装依赖
cd backend
npm install --production

# 运行数据库迁移（如果有）
# node scripts/migrate.js

# 重新加载应用（零停机）
pm2 reload gold7-game-backend

# 等待应用启动
sleep 10

# 健康检查
if curl -f -s https://your-domain.com/api/health > /dev/null; then
    echo "部署成功！"
    # 清理旧备份
    find $BACKUP_DIR -name "backup_*" -mtime +7 -exec rm -rf {} \;
else
    echo "部署失败，回滚..."
    # 回滚到备份版本
    rm -rf $PROJECT_DIR
    cp -r $BACKUP_DIR/backup_$DATE $PROJECT_DIR
    pm2 restart gold7-game-backend
    exit 1
fi
```

### 2. 蓝绿部署

#### 蓝绿部署脚本
```bash
#!/bin/bash
# 蓝绿部署脚本

BLUE_DIR="/var/www/gold7-game-blue"
GREEN_DIR="/var/www/gold7-game-green"
CURRENT_LINK="/var/www/gold7-game"

# 确定当前环境
if [ -L $CURRENT_LINK ]; then
    CURRENT=$(readlink $CURRENT_LINK)
    if [[ $CURRENT == *"blue"* ]]; then
        DEPLOY_TO=$GREEN_DIR
        DEPLOY_COLOR="green"
    else
        DEPLOY_TO=$BLUE_DIR
        DEPLOY_COLOR="blue"
    fi
else
    DEPLOY_TO=$BLUE_DIR
    DEPLOY_COLOR="blue"
fi

echo "部署到 $DEPLOY_COLOR 环境..."

# 部署新版本
git clone https://github.com/your-org/gold7-game.git $DEPLOY_TO
cd $DEPLOY_TO/backend
npm install --production

# 启动新环境
pm2 start ecosystem.config.js --name "gold7-game-$DEPLOY_COLOR"

# 健康检查
sleep 10
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    # 切换流量
    ln -sfn $DEPLOY_TO $CURRENT_LINK
    
    # 停止旧环境
    if [[ $DEPLOY_COLOR == "blue" ]]; then
        pm2 delete gold7-game-green 2>/dev/null || true
    else
        pm2 delete gold7-game-blue 2>/dev/null || true
    fi
    
    echo "部署成功！"
else
    echo "部署失败！"
    pm2 delete "gold7-game-$DEPLOY_COLOR"
    exit 1
fi
```

## 应急响应

### 1. 紧急情况处理

#### 服务器宕机
1. **立即响应**
   - 检查服务器状态
   - 联系云服务提供商
   - 启动备用服务器

2. **数据保护**
   - 确认数据完整性
   - 启动数据恢复程序
   - 通知相关人员

3. **服务恢复**
   - 在备用服务器上恢复服务
   - 更新 DNS 记录
   - 监控服务状态

#### 安全事件
1. **事件识别**
   - 监控异常登录
   - 检查系统日志
   - 分析攻击模式

2. **立即响应**
   - 隔离受影响系统
   - 更改所有密码
   - 启用额外安全措施

3. **事后处理**
   - 修复安全漏洞
   - 更新安全策略
   - 生成事件报告

### 2. 联系信息

#### 紧急联系人
- **技术负责人**: +86-xxx-xxxx-xxxx
- **运维负责人**: +86-xxx-xxxx-xxxx
- **安全负责人**: +86-xxx-xxxx-xxxx

#### 外部服务商
- **云服务商**: 400-xxx-xxxx
- **CDN 服务商**: 400-xxx-xxxx
- **监控服务商**: 400-xxx-xxxx

### 3. 应急预案

#### 预案清单
- [ ] 服务器宕机应急预案
- [ ] 数据库故障应急预案
- [ ] 网络攻击应急预案
- [ ] 数据泄露应急预案
- [ ] 自然灾害应急预案

#### 恢复时间目标 (RTO)
- **关键服务**: 15 分钟
- **一般服务**: 1 小时
- **非关键服务**: 4 小时

#### 恢复点目标 (RPO)
- **交易数据**: 5 分钟
- **用户数据**: 1 小时
- **日志数据**: 24 小时

---

**注意**: 本手册应定期更新，确保所有信息的准确性和时效性。建议每季度进行一次应急演练，验证预案的有效性。