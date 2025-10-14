#!/bin/bash

# H5项目全面测试执行脚本
# 依次执行所有类型的测试并生成报告

echo "🚀 开始执行H5项目全面测试..."
echo "=================================="

# 创建报告目录
mkdir -p ../报告

# 记录开始时间
START_TIME=$(date +%s)

# 1. 代码质量检查
echo "📊 执行代码质量检查..."
cd ../代码质量报告
if [ -f "run-quality-check.sh" ]; then
    bash run-quality-check.sh
    echo "✅ 代码质量检查完成"
else
    echo "⚠️ 代码质量检查脚本不存在"
fi

# 2. 单元测试
echo "🧪 执行单元测试..."
cd ../单元测试
if [ -f "package.json" ]; then
    npm install
    npm run test:ci
    echo "✅ 单元测试完成"
else
    echo "⚠️ 单元测试配置不存在"
fi

# 3. 集成测试
echo "🔗 执行集成测试..."
cd ../集成测试
if [ -f "run-integration-tests.sh" ]; then
    bash run-integration-tests.sh
    echo "✅ 集成测试完成"
else
    echo "⚠️ 集成测试脚本不存在"
fi

# 4. UI测试
echo "🖥️ 执行UI测试..."
cd ../UI测试
if [ -f "package.json" ]; then
    npm install
    npx playwright install
    npm run test
    echo "✅ UI测试完成"
else
    echo "⚠️ UI测试配置不存在"
fi

# 5. 性能测试
echo "⚡执行性能测试..."
cd ../性能报告
if [ -f "run-performance-tests.sh" ]; then
    bash run-performance-tests.sh
    echo "✅ 性能测试完成"
else
    echo "⚠️ 性能测试脚本不存在"
fi

# 6. 安全测试
echo "🔒 执行安全测试..."
cd ../安全报告
if [ -f "run-security-tests.sh" ]; then
    bash run-security-tests.sh
    echo "✅ 安全测试完成"
else
    echo "⚠️ 安全测试脚本不存在"
fi

# 计算总耗时
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=================================="
echo "🎉 所有测试执行完成！"
echo "⏱️ 总耗时: ${DURATION}秒"
echo "📋 测试报告已生成在 ../报告/ 目录下"
echo "📄 查看综合报告: ../测试报告.md"

# 生成测试摘要
cd ..
echo "# 测试执行摘要" > 报告/test-summary.md
echo "" >> 报告/test-summary.md
echo "- 执行时间: $(date)" >> 报告/test-summary.md
echo "- 总耗时: ${DURATION}秒" >> 报告/test-summary.md
echo "- 测试类型: 代码质量、单元测试、集成测试、UI测试、性能测试、安全测试" >> 报告/test-summary.md
echo "" >> 报告/test-summary.md
echo "详细报告请查看各子目录的测试结果文件。" >> 报告/test-summary.md