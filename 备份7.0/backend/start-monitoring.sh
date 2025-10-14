#!/bin/bash

# 监控仪表板快速启动脚本

echo "🚀 启动裂金7日监控仪表板"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查服务器是否运行
echo "🔍 检查服务器状态..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 服务器正在运行"
else
    echo "⚠️  服务器未运行，请先启动服务器: node server.js"
    echo "继续启动监控仪表板..."
fi

# 启动监控仪表板
echo "📊 启动监控仪表板..."
echo "提示: 按 Ctrl+C 退出监控仪表板"
echo ""

cd scripts
node launch-dashboard.js "$@"