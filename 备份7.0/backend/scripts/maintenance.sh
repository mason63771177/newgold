#!/bin/bash

# Tatum 钱包服务维护脚本
# 用于定期维护和清理任务

set -e

# 配置
LOG_DIR="./logs"
BACKUP_DIR="/backup/$(date +%Y%m%d)"
MAX_LOG_SIZE="100M"
LOG_RETENTION_DAYS=30
DB_RETENTION_DAYS=90

echo "开始执行维护任务 - $(date)"

# 1. 日志轮转和清理
echo "1. 执行日志维护..."
if [ -d "$LOG_DIR" ]; then
    # 压缩大日志文件
    find $LOG_DIR -name "*.log" -size +$MAX_LOG_SIZE -exec gzip {} \;
    echo "   - 已压缩大于 $MAX_LOG_SIZE 的日志文件"
    
    # 删除旧的压缩日志
    find $LOG_DIR -name "*.gz" -mtime +$LOG_RETENTION_DAYS -delete
    echo "   - 已删除 $LOG_RETENTION_DAYS 天前的压缩日志"
else
    echo "   - 日志目录不存在，跳过日志维护"
fi

# 2. 数据库优化
echo "2. 执行数据库优化..."
if [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
        OPTIMIZE TABLE wallet_transactions;
        OPTIMIZE TABLE wallet_mappings;
        OPTIMIZE TABLE users;
        OPTIMIZE TABLE balance_logs;
    " 2>/dev/null && echo "   - 数据库表优化完成" || echo "   - 数据库优化失败"
else
    echo "   - 数据库配置不完整，跳过数据库优化"
fi

# 3. 清理过期数据
echo "3. 清理过期数据..."
if [ -f "scripts/cleanup-expired-data.js" ]; then
    node scripts/cleanup-expired-data.js && echo "   - 过期数据清理完成" || echo "   - 过期数据清理失败"
else
    echo "   - 清理脚本不存在，跳过数据清理"
fi

# 4. 检查服务状态
echo "4. 检查服务状态..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 status tatum-wallet-service >/dev/null 2>&1 && echo "   - 钱包服务运行正常" || echo "   - 钱包服务状态异常"
else
    echo "   - PM2 未安装，无法检查服务状态"
fi

# 5. 检查磁盘空间
echo "5. 检查磁盘空间..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "   - 警告: 磁盘使用率 ${DISK_USAGE}%，请及时清理"
else
    echo "   - 磁盘使用率 ${DISK_USAGE}%，正常"
fi

# 6. 检查内存使用
echo "6. 检查内存使用..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 80 ]; then
    echo "   - 警告: 内存使用率 ${MEMORY_USAGE}%"
else
    echo "   - 内存使用率 ${MEMORY_USAGE}%，正常"
fi

# 7. 生成维护报告
echo "7. 生成维护报告..."
REPORT_FILE="$LOG_DIR/maintenance-$(date +%Y%m%d).log"
cat > $REPORT_FILE << EOF
维护报告 - $(date)
====================

系统状态:
- 磁盘使用率: ${DISK_USAGE}%
- 内存使用率: ${MEMORY_USAGE}%

执行的维护任务:
- 日志轮转和清理
- 数据库表优化
- 过期数据清理
- 服务状态检查

下次维护时间: $(date -d '+1 day' '+%Y-%m-%d %H:%M:%S')
EOF

echo "   - 维护报告已生成: $REPORT_FILE"

echo "维护任务完成 - $(date)"
echo "=================================="