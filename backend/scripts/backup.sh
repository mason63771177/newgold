#!/bin/bash

# Tatum 钱包服务备份脚本
# 用于定期备份重要数据和配置

set -e

# 配置
BACKUP_BASE_DIR="/backup"
BACKUP_DIR="$BACKUP_BASE_DIR/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=7
PROJECT_DIR="/Users/mason1236/0930/backend"

echo "开始执行备份任务 - $(date)"

# 创建备份目录
mkdir -p $BACKUP_DIR
echo "备份目录: $BACKUP_DIR"

# 1. 数据库备份
echo "1. 备份数据库..."
if [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    mysqldump -u $DB_USER -p$DB_PASSWORD \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --hex-blob \
        $DB_NAME > $BACKUP_DIR/database.sql
    
    # 压缩数据库备份
    gzip $BACKUP_DIR/database.sql
    echo "   - 数据库备份完成: database.sql.gz"
else
    echo "   - 数据库配置不完整，跳过数据库备份"
fi

# 2. 配置文件备份
echo "2. 备份配置文件..."
if [ -f "$PROJECT_DIR/.env" ]; then
    # 备份环境配置（敏感信息会被脱敏）
    sed 's/=.*/=***MASKED***/g' $PROJECT_DIR/.env > $BACKUP_DIR/env.template
    echo "   - 环境配置模板已备份"
fi

if [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
    cp $PROJECT_DIR/ecosystem.config.js $BACKUP_DIR/
    echo "   - PM2 配置已备份"
fi

if [ -f "$PROJECT_DIR/package.json" ]; then
    cp $PROJECT_DIR/package.json $BACKUP_DIR/
    echo "   - 包配置已备份"
fi

# 3. 日志备份（最近7天）
echo "3. 备份重要日志..."
if [ -d "$PROJECT_DIR/logs" ]; then
    mkdir -p $BACKUP_DIR/logs
    find $PROJECT_DIR/logs -name "*.log" -mtime -7 -exec cp {} $BACKUP_DIR/logs/ \;
    find $BACKUP_DIR/logs -name "*.log" -exec gzip {} \;
    echo "   - 最近7天的日志已备份并压缩"
fi

# 4. 脚本备份
echo "4. 备份重要脚本..."
if [ -d "$PROJECT_DIR/scripts" ]; then
    mkdir -p $BACKUP_DIR/scripts
    cp -r $PROJECT_DIR/scripts/* $BACKUP_DIR/scripts/
    echo "   - 脚本文件已备份"
fi

# 5. 创建备份清单
echo "5. 创建备份清单..."
cat > $BACKUP_DIR/backup_manifest.txt << EOF
备份清单
========

备份时间: $(date)
备份目录: $BACKUP_DIR
项目目录: $PROJECT_DIR

备份内容:
$(ls -la $BACKUP_DIR)

系统信息:
- 主机名: $(hostname)
- 操作系统: $(uname -a)
- 磁盘使用: $(df -h $PROJECT_DIR | tail -1)
- 内存使用: $(free -h | grep Mem)

数据库信息:
- 数据库名: $DB_NAME
- 备份大小: $(ls -lh $BACKUP_DIR/database.sql.gz 2>/dev/null | awk '{print $5}' || echo "未备份")

注意事项:
- 本备份不包含敏感的环境变量值
- 助记词和私钥需要单独安全备份
- 建议定期测试备份恢复流程
EOF

# 6. 压缩整个备份
echo "6. 压缩备份文件..."
cd $BACKUP_BASE_DIR
tar -czf $(basename $BACKUP_DIR).tar.gz $(basename $BACKUP_DIR)
rm -rf $BACKUP_DIR
echo "   - 备份已压缩: $(basename $BACKUP_DIR).tar.gz"

# 7. 清理旧备份
echo "7. 清理旧备份..."
find $BACKUP_BASE_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "   - 已删除 $RETENTION_DAYS 天前的备份文件"

# 8. 备份统计
echo "8. 备份统计..."
BACKUP_COUNT=$(find $BACKUP_BASE_DIR -name "*.tar.gz" | wc -l)
BACKUP_SIZE=$(du -sh $BACKUP_BASE_DIR | cut -f1)
echo "   - 当前备份文件数量: $BACKUP_COUNT"
echo "   - 备份目录总大小: $BACKUP_SIZE"

echo "备份任务完成 - $(date)"
echo "备份文件: $BACKUP_BASE_DIR/$(basename $BACKUP_DIR).tar.gz"
echo "=================================="

# 9. 发送备份通知（可选）
if command -v mail >/dev/null 2>&1 && [ -n "$BACKUP_NOTIFICATION_EMAIL" ]; then
    echo "备份完成通知 - $(date)" | mail -s "Tatum钱包服务备份完成" $BACKUP_NOTIFICATION_EMAIL
fi