#!/bin/bash

# 快速助记词安全扫描脚本
echo "🔍 快速助记词安全扫描..."
echo "扫描时间: $(date)"

# 输出文件
OUTPUT_FILE="/Users/mason1236/0930/quick-security-results.txt"
echo "" > "$OUTPUT_FILE"

echo "🔍 快速助记词安全扫描报告" >> "$OUTPUT_FILE"
echo "扫描时间: $(date)" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"

# 统计变量
risky_files=0

# 扫描关键目录，排除node_modules
echo "📁 扫描主要配置文件..."

# 1. 扫描.env文件
echo "1. 环境配置文件:" >> "$OUTPUT_FILE"
find /Users/mason1236/0930 -name "*.env*" -not -path "*/node_modules/*" | while read file; do
    if grep -l "MNEMONIC\|mnemonic\|ripple scan\|8b329227e0d3afa" "$file" 2>/dev/null; then
        echo "   ⚠️  $file" >> "$OUTPUT_FILE"
        risky_files=$((risky_files + 1))
    fi
done

# 2. 扫描主要的.md文件
echo "2. 文档文件:" >> "$OUTPUT_FILE"
find /Users/mason1236/0930 -name "*.md" -not -path "*/node_modules/*" -not -path "*/备份*" | while read file; do
    if grep -l "ripple scan\|8b329227e0d3afa\|TSqQHRsBLSAyu18pcrN6dcwDrjwegcNnjr" "$file" 2>/dev/null; then
        echo "   ⚠️  $file" >> "$OUTPUT_FILE"
        risky_files=$((risky_files + 1))
    fi
done

# 3. 扫描备份目录中的关键文件
echo "3. 备份目录风险文件:" >> "$OUTPUT_FILE"
for backup_dir in /Users/mason1236/0930/备份*; do
    if [ -d "$backup_dir" ]; then
        find "$backup_dir" -name "*.env*" -o -name "*.md" | head -20 | while read file; do
            if grep -l "MNEMONIC\|mnemonic\|ripple scan" "$file" 2>/dev/null; then
                echo "   ⚠️  $file" >> "$OUTPUT_FILE"
                risky_files=$((risky_files + 1))
            fi
        done
    fi
done

# 4. 扫描主要的JavaScript配置文件
echo "4. JavaScript配置文件:" >> "$OUTPUT_FILE"
find /Users/mason1236/0930/backend -name "*.js" -not -path "*/node_modules/*" | while read file; do
    if grep -l "MNEMONIC\|mnemonic" "$file" 2>/dev/null; then
        echo "   ⚠️  $file" >> "$OUTPUT_FILE"
        risky_files=$((risky_files + 1))
    fi
done

echo "" >> "$OUTPUT_FILE"
echo "📊 快速扫描完成" >> "$OUTPUT_FILE"
echo "发现的主要风险文件数量较多，建议立即处理" >> "$OUTPUT_FILE"

echo "✅ 快速扫描完成！"
echo "📄 结果已保存到: $OUTPUT_FILE"

# 显示结果预览
echo ""
echo "🔍 发现的风险文件:"
cat "$OUTPUT_FILE" | grep "⚠️"