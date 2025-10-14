# PostgreSQL 数据库设置指南

## 概述
本目录包含H5游戏项目的PostgreSQL数据库初始化脚本和配置文件。

## 文件说明

### 1. postgresql_setup.sql
- **用途**: 创建数据库表结构
- **包含**: 所有业务表的创建语句、约束、注释和触发器
- **执行顺序**: 第一个执行

### 2. postgresql_indexes.sql  
- **用途**: 创建性能优化索引
- **包含**: 普通索引、复合索引、部分索引、函数索引
- **执行顺序**: 第二个执行

### 3. postgresql_init_data.sql
- **用途**: 初始化基础数据
- **包含**: 系统配置、题库、测试数据、视图
- **执行顺序**: 第三个执行

## 安装步骤

### 1. 安装PostgreSQL
```bash
# macOS (使用Homebrew)
brew install postgresql
brew services start postgresql

# 创建数据库用户
createuser -s postgres
```

### 2. 创建数据库
```bash
# 连接到PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE h5_game_db 
WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

# 连接到新数据库
\c h5_game_db
```

### 3. 执行初始化脚本
```bash
# 按顺序执行脚本
psql -U postgres -d h5_game_db -f postgresql_setup.sql
psql -U postgres -d h5_game_db -f postgresql_indexes.sql
psql -U postgres -d h5_game_db -f postgresql_init_data.sql
```

## 数据库配置

### 环境变量设置
在 `backend/.env` 文件中配置PostgreSQL连接：

```env
# PostgreSQL配置
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=h5_game_db
```

### 连接池配置
```javascript
// backend/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 表结构说明

### 核心业务表
1. **users** - 用户表：存储用户基本信息、状态、余额等
2. **tasks** - 任务表：管理新手任务、答题任务、大神任务
3. **quiz_records** - 答题记录：存储用户答题历史和成绩
4. **redpacket_events** - 红包活动：管理每日三场红包活动
5. **redpacket_records** - 红包记录：记录用户抢红包历史
6. **wallet_transactions** - 钱包交易：所有资金流水记录
7. **team_relations** - 团队关系：多层级团队结构管理
8. **activation_orders** - 激活订单：用户入金激活记录
9. **system_configs** - 系统配置：业务参数配置
10. **notifications** - 通知记录：系统消息管理

### 关键字段说明
- **用户状态**: 1-新手, 2-已入金, 3-倒计时结束
- **任务类型**: newbie-新手任务, quiz-答题任务, master-大神任务
- **交易类型**: activate-激活, withdraw-提现, redpacket-红包, task-任务奖励, commission-佣金

## 性能优化

### 索引策略
- 为所有外键创建索引
- 为常用查询字段创建复合索引
- 使用部分索引优化特定条件查询
- 创建函数索引支持大小写不敏感搜索

### 查询优化
- 使用视图简化复杂查询
- 合理使用EXPLAIN分析查询计划
- 定期更新表统计信息

## 数据备份

### 备份脚本
```bash
#!/bin/bash
# 创建备份
pg_dump -U postgres -h localhost h5_game_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
gzip backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复数据
```bash
# 恢复数据库
psql -U postgres -d h5_game_db < backup_file.sql
```

## 监控和维护

### 性能监控
```sql
-- 查看慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 定期维护
```sql
-- 更新统计信息
ANALYZE;

-- 清理死元组
VACUUM;

-- 重建索引（如需要）
REINDEX DATABASE h5_game_db;
```

## 安全建议

1. **用户权限**: 为应用创建专用数据库用户，限制权限
2. **连接安全**: 使用SSL连接，配置防火墙规则
3. **密码策略**: 使用强密码，定期更换
4. **备份加密**: 对备份文件进行加密存储
5. **审计日志**: 启用数据库审计日志

## 故障排除

### 常见问题
1. **连接失败**: 检查服务状态、端口、防火墙
2. **权限错误**: 确认用户权限和数据库所有者
3. **性能问题**: 分析慢查询，检查索引使用
4. **空间不足**: 监控磁盘空间，清理日志文件

### 日志查看
```bash
# 查看PostgreSQL日志
tail -f /usr/local/var/log/postgresql.log

# 查看错误日志
grep ERROR /usr/local/var/log/postgresql.log
```

## 开发建议

1. **事务管理**: 合理使用事务，避免长事务
2. **连接管理**: 使用连接池，及时释放连接
3. **SQL优化**: 避免N+1查询，使用批量操作
4. **数据类型**: 选择合适的数据类型，节省存储空间
5. **约束使用**: 充分利用数据库约束保证数据完整性