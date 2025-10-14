#!/bin/bash

# 助记词安全审计脚本
# 扫描系统中所有包含助记词的文件

echo "🔍 开始助记词安全审计..."
echo "扫描时间: $(date)"
echo "=========================================="

# 定义要搜索的助记词关键词
MNEMONIC_KEYWORDS=(
    "ripple scan offer arctic"
    "course match choose salon"
    "abandon abandon abandon"
    "update kid shop wheel"
    "bachelor material excess"
    "control consider shine"
    "MASTER_WALLET_MNEMONIC"
    "TATUM_MASTER_WALLET_MNEMONIC"
    "mnemonic"
    "private_key"
    "8b329227e0d3afa181c73469b79a140b6793a1868b8f7370e8ca7eace2f9e56d"
)

# 输出文件
OUTPUT_FILE="/Users/mason1236/0930/security-audit-results.txt"
echo "审计结果将保存到: $OUTPUT_FILE"
echo "" > "$OUTPUT_FILE"

echo "🔍 助记词安全审计报告" >> "$OUTPUT_FILE"
echo "扫描时间: $(date)" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 统计变量
total_files=0
risky_files=0

# 扫描函数
scan_for_keywords() {
    local search_path="$1"
    local file_pattern="$2"
    local description="$3"
    
    echo "📁 扫描 $description..."
    echo "📁 扫描 $description..." >> "$OUTPUT_FILE"
    echo "路径: $search_path" >> "$OUTPUT_FILE"
    echo "文件模式: $file_pattern" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # 查找文件
    if [ "$file_pattern" = "all" ]; then
        files=$(find "$search_path" -type f 2>/dev/null)
    else
        files=$(find "$search_path" -type f -name "$file_pattern" 2>/dev/null)
    fi
    
    local section_risky=0
    
    for file in $files; do
        # 跳过二进制文件和大文件
        if file "$file" | grep -q "binary\|executable"; then
            continue
        fi
        
        # 跳过过大的文件 (>1MB)
        if [ $(stat -f%z "$file" 2>/dev/null || echo 0) -gt 1048576 ]; then
            continue
        fi
        
        total_files=$((total_files + 1))
        
        # 检查每个关键词
        for keyword in "${MNEMONIC_KEYWORDS[@]}"; do
            if grep -l "$keyword" "$file" 2>/dev/null; then
                echo "⚠️  发现敏感信息: $file" >> "$OUTPUT_FILE"
                echo "   关键词: $keyword" >> "$OUTPUT_FILE"
                
                # 显示上下文（隐藏敏感部分）
                context=$(grep -n "$keyword" "$file" 2>/dev/null | head -3)
                if [ ! -z "$context" ]; then
                    echo "   上下文:" >> "$OUTPUT_FILE"
                    echo "$context" | sed 's/ripple scan offer arctic/[REDACTED_MNEMONIC]/g' | sed 's/8b329227e0d3afa181c73469b79a140b6793a1868b8f7370e8ca7eace2f9e56d/[REDACTED_PRIVATE_KEY]/g' >> "$OUTPUT_FILE"
                fi
                echo "" >> "$OUTPUT_FILE"
                
                section_risky=$((section_risky + 1))
                risky_files=$((risky_files + 1))
                break
            fi
        done
    done
    
    echo "本节发现风险文件: $section_risky" >> "$OUTPUT_FILE"
    echo "=========================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

# 开始扫描不同类型的文件
echo "开始全面扫描..."

# 1. 环境配置文件
scan_for_keywords "/Users/mason1236/0930" "*.env*" "环境配置文件"

# 2. Markdown文档
scan_for_keywords "/Users/mason1236/0930" "*.md" "Markdown文档"

# 3. JavaScript文件
scan_for_keywords "/Users/mason1236/0930" "*.js" "JavaScript文件"

# 4. 配置文件
scan_for_keywords "/Users/mason1236/0930" "*.json" "JSON配置文件"
scan_for_keywords "/Users/mason1236/0930" "*.txt" "文本文件"

# 5. SQL文件
scan_for_keywords "/Users/mason1236/0930" "*.sql" "SQL文件"

# 6. 备份目录特别扫描
for backup_dir in /Users/mason1236/0930/备份*; do
    if [ -d "$backup_dir" ]; then
        scan_for_keywords "$backup_dir" "all" "备份目录: $(basename $backup_dir)"
    fi
done

# 生成总结报告
echo "" >> "$OUTPUT_FILE"
echo "📊 审计总结" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"
echo "扫描文件总数: $total_files" >> "$OUTPUT_FILE"
echo "发现风险文件: $risky_files" >> "$OUTPUT_FILE"
echo "风险等级: $(if [ $risky_files -gt 50 ]; then echo "极高"; elif [ $risky_files -gt 20 ]; then echo "高"; elif [ $risky_files -gt 5 ]; then echo "中"; else echo "低"; fi)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 生成建议
echo "🔧 安全建议" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"
echo "1. 立即清理备份目录中的敏感信息" >> "$OUTPUT_FILE"
echo "2. 实施助记词加密存储" >> "$OUTPUT_FILE"
echo "3. 建立集中的密钥管理系统" >> "$OUTPUT_FILE"
echo "4. 定期进行安全审计" >> "$OUTPUT_FILE"
echo "5. 实施访问控制和审计日志" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "✅ 审计完成！"
echo "📄 详细报告已保存到: $OUTPUT_FILE"
echo "🚨 发现 $risky_files 个包含敏感信息的文件"

# 显示简要结果
echo ""
echo "🔍 快速预览前10个风险文件:"
grep "⚠️  发现敏感信息:" "$OUTPUT_FILE" | head -10