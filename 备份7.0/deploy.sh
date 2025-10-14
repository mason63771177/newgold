#!/bin/bash

# GitHub Pages 部署脚本
# 使用方法：./deploy.sh

echo "🚀 开始部署到 GitHub Pages..."

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 发现未提交的更改，正在提交..."
    git add .
    echo "请输入提交信息 (直接回车使用默认信息):"
    read commit_message
    if [ -z "$commit_message" ]; then
        commit_message="Update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    git commit -m "$commit_message"
fi

# 推送到远程仓库
echo "📤 推送到远程仓库..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo "🌐 您的网站将在几分钟内在以下地址可用："
    echo "   https://$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\([^\/]*\)\/\([^.]*\).*/\1.github.io\/\2/')"
    echo ""
    echo "📋 如果这是首次部署，请确保："
    echo "   1. 在 GitHub 仓库设置中启用 Pages"
    echo "   2. 选择 'main' 分支作为源"
    echo "   3. 等待几分钟让 GitHub 构建您的网站"
else
    echo "❌ 推送失败，请检查："
    echo "   1. 是否已添加远程仓库：git remote add origin <your-repo-url>"
    echo "   2. 是否有推送权限"
    echo "   3. 网络连接是否正常"
fi

echo ""
echo "💡 提示：如果需要添加远程仓库，请运行："
echo "   git remote add origin https://github.com/your-username/your-repo-name.git"
echo "   然后重新运行此脚本"