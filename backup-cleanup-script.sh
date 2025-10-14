#!/bin/bash

# 备份清理脚本 - 安全清理敏感信息
echo "🧹 开始备份清理..."
echo "清理时间: $(date)"

# 日志文件
LOG_FILE="/Users/mason1236/0930/backup-cleanup-log.txt"
echo "🧹 备份清理日志 - $(date)" > "$LOG_FILE"

# 备份目录列表
BACKUP_DIRS=(
    "/Users/mason1236/0930/备份6.3"
    "/Users/mason1236/0930/备份6.4" 
    "/Users/mason1236/0930/备份6.5"
    "/Users/mason1236/0930/备份6.2"
    "/Users/mason1236/0930/备份5.3"
    "/Users/mason1236/0930/备份5.4"
    "/Users/mason1236/0930/备份5.5"
    "/Users/mason1236/0930/备份6.0"
    "/Users/mason1236/0930/备份6.1"
    "/Users/mason1236/0930/备份/20251011_143651_remove_status_4"
    "/Users/mason1236/0930/备份5.7"
    "/Users/mason1236/0930/备份5.6"
)

# 保留的备份目录 (最新的2个)
KEEP_DIRS=(
    "/Users/mason1236/0930/备份6.5"
    "/Users/mason1236/0930/备份6.4"
)

# 敏感信息模式
SENSITIVE_PATTERNS=(
    "ripple scan offer arctic"
    "8b329227e0d3afa181c73469b79a140b6793a1868b8f7370e8ca7eace2f9e56d"
    "TSqQHRsBLSAyu18pcrN6dcwDrjwegcNnjr"
)

echo "📊 备份清理统计:" >> "$LOG_FILE"
echo "总备份目录数: ${#BACKUP_DIRS[@]}" >> "$LOG_FILE"
echo "计划保留目录数: ${#KEEP_DIRS[@]}" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 函数: 检查目录是否应该保留
should_keep_dir() {
    local dir="$1"
    for keep_dir in "${KEEP_DIRS[@]}"; do
        if [[ "$dir" == "$keep_dir" ]]; then
            return 0
        fi
    done
    return 1
}

# 函数: 清理文件中的敏感信息
clean_sensitive_info() {
    local file="$1"
    local backup_file="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # 创建备份
    cp "$file" "$backup_file"
    
    # 替换敏感信息
    sed -i '' 's/ripple scan offer arctic[^"]*/[REDACTED_MNEMONIC]/g' "$file"
    sed -i '' 's/8b329227e0d3afa181c73469b79a140b6793a1868b8f7370e8ca7eace2f9e56d/[REDACTED_PRIVATE_KEY]/g' "$file"
    sed -i '' 's/TSqQHRsBLSAyu18pcrN6dcwDrjwegcNnjr/[REDACTED_WALLET_ADDRESS]/g' "$file"
    
    echo "   ✅ 已清理: $file" >> "$LOG_FILE"
}

# 第一阶段: 删除不需要的备份目录
echo "🗑️  第一阶段: 删除过期备份目录"
echo "🗑️  第一阶段: 删除过期备份目录" >> "$LOG_FILE"

for dir in "${BACKUP_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        if should_keep_dir "$dir"; then
            echo "   ⏭️  保留: $dir"
            echo "   ⏭️  保留: $dir" >> "$LOG_FILE"
        else
            echo "   🗑️  删除: $dir"
            echo "   🗑️  删除: $dir" >> "$LOG_FILE"
            # 安全删除 (先移动到临时目录)
            temp_dir="/tmp/backup_cleanup_$(basename "$dir")_$(date +%Y%m%d_%H%M%S)"
            mv "$dir" "$temp_dir"
            echo "   📦 已移动到临时目录: $temp_dir" >> "$LOG_FILE"
        fi
    else
        echo "   ❌ 目录不存在: $dir" >> "$LOG_FILE"
    fi
done

# 第二阶段: 清理保留目录中的敏感信息
echo ""
echo "🧹 第二阶段: 清理保留目录中的敏感信息"
echo "🧹 第二阶段: 清理保留目录中的敏感信息" >> "$LOG_FILE"

for keep_dir in "${KEEP_DIRS[@]}"; do
    if [[ -d "$keep_dir" ]]; then
        echo "   🔍 处理目录: $keep_dir"
        echo "   🔍 处理目录: $keep_dir" >> "$LOG_FILE"
        
        # 查找并清理 .env 文件
        find "$keep_dir" -name "*.env*" -type f | while read env_file; do
            if grep -q "MNEMONIC\|mnemonic\|ripple scan" "$env_file" 2>/dev/null; then
                clean_sensitive_info "$env_file"
            fi
        done
        
        # 查找并清理 .md 文件
        find "$keep_dir" -name "*.md" -type f | while read md_file; do
            if grep -q "ripple scan\|8b329227e0d3afa\|TSqQHRsBLSAyu18pcrN6dcwDrjwegcNnjr" "$md_file" 2>/dev/null; then
                clean_sensitive_info "$md_file"
            fi
        done
        
    else
        echo "   ❌ 保留目录不存在: $keep_dir" >> "$LOG_FILE"
    fi
done

# 第三阶段: 清理当前工作目录中的敏感文档
echo ""
echo "📄 第三阶段: 清理当前目录中的敏感文档"
echo "📄 第三阶段: 清理当前目录中的敏感文档" >> "$LOG_FILE"

CURRENT_SENSITIVE_FILES=(
    "/Users/mason1236/0930/主钱包密钥信息.md"
    "/Users/mason1236/0930/助记词和私钥知情人员分析报告.md"
)

for file in "${CURRENT_SENSITIVE_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        # 移动到安全目录而不是删除
        secure_dir="/Users/mason1236/0930/secure_backup"
        mkdir -p "$secure_dir"
        mv "$file" "$secure_dir/"
        echo "   🔒 已移动到安全目录: $file" >> "$LOG_FILE"
    fi
done

# 生成清理报告
echo ""
echo "📊 清理完成统计:" >> "$LOG_FILE"
echo "处理时间: $(date)" >> "$LOG_FILE"
echo "临时文件位置: /tmp/backup_cleanup_*" >> "$LOG_FILE"
echo "安全文件位置: /Users/mason1236/0930/secure_backup/" >> "$LOG_FILE"

echo "✅ 备份清理完成!"
echo "📄 详细日志: $LOG_FILE"
echo ""
echo "⚠️  重要提醒:"
echo "1. 删除的备份已移动到 /tmp/ 目录"
echo "2. 敏感文档已移动到 secure_backup/ 目录"
echo "3. 请验证系统功能正常后再永久删除临时文件"