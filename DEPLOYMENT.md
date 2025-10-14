# 🚀 GitHub Pages 部署指南

本指南将帮助您将裂金7日H5应用部署到GitHub Pages，让全世界都能访问您的应用。

## 📋 部署前准备

### 1. 创建GitHub账号
如果您还没有GitHub账号，请访问 [github.com](https://github.com) 注册。

### 2. 安装Git
确保您的电脑已安装Git。可以通过以下命令检查：
```bash
git --version
```

## 🎯 快速部署（推荐）

### 方法一：使用部署脚本

1. **创建GitHub仓库**
   - 登录GitHub，点击右上角的 "+" 号
   - 选择 "New repository"
   - 仓库名建议使用：`lijin7-h5` 或 `0923h5`
   - 设置为 Public（公开）
   - 不要初始化README、.gitignore或license
   - 点击 "Create repository"

2. **添加远程仓库**
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   ```
   > 将 `your-username` 和 `your-repo-name` 替换为您的实际信息

3. **运行部署脚本**
   ```bash
   ./deploy.sh
   ```

4. **启用GitHub Pages**
   - 进入您的GitHub仓库页面
   - 点击 "Settings" 标签
   - 在左侧菜单中找到 "Pages"
   - 在 "Source" 下选择 "GitHub Actions"
   - 等待几分钟，您的网站就会上线！

### 方法二：手动部署

1. **推送代码到GitHub**
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

2. **配置GitHub Pages**
   - 进入仓库设置页面
   - 找到 "Pages" 选项
   - 选择 "GitHub Actions" 作为源
   - 系统会自动使用我们提供的工作流配置

## 🌐 访问您的网站

部署成功后，您的网站地址将是：
```
https://your-username.github.io/your-repo-name/
```

### 当前项目访问地址：
- **主页**：`https://mason63771177.github.io/newgold/`
- **登录页面**：`https://mason63771177.github.io/newgold/login.html`
- **钱包页面**：`https://mason63771177.github.io/newgold/wallet.html`
- **任务页面**：`https://mason63771177.github.io/newgold/tasks.html`
- **团队页面**：`https://mason63771177.github.io/newgold/team.html`

### 示例：
- 用户名：`mason1236`
- 仓库名：`lijin7-h5`
- 网站地址：`https://mason1236.github.io/lijin7-h5/`

## 🔧 高级配置

### 自定义域名

如果您有自己的域名，可以配置自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入您的域名，如：`www.yourdomain.com`
3. 在您的域名DNS设置中添加CNAME记录指向 `your-username.github.io`

### 更新网站

当您修改代码后，只需要：
```bash
git add .
git commit -m "Update: 描述您的更改"
git push origin main
```

GitHub Actions会自动重新部署您的网站。

## 🛠 故障排除

### 常见问题

**Q: 推送时提示权限错误**
A: 确保您有仓库的写入权限，或者使用Personal Access Token进行认证。

**Q: 网站显示404错误**
A: 检查以下几点：
- GitHub Pages是否已启用
- 是否选择了正确的分支（main）
- 等待几分钟让GitHub构建完成

**Q: 样式或图片无法加载**
A: 确保所有资源文件都已提交到仓库，并且路径正确。

**Q: 主题切换功能不工作**
A: 检查浏览器控制台是否有JavaScript错误，确保所有JS文件都已正确加载。

### 检查部署状态

1. 进入您的GitHub仓库
2. 点击 "Actions" 标签
3. 查看最新的工作流运行状态
4. 如果有错误，点击查看详细日志

## 📱 移动端优化

我们的H5应用已经针对移动端进行了优化：
- 响应式设计
- 触摸友好的交互
- 适配不同屏幕尺寸
- PWA特性支持

## 🔒 安全注意事项

- 不要在代码中包含敏感信息（API密钥、密码等）
- 使用环境变量管理配置
- 定期更新依赖项

## 📊 性能监控

部署后，您可以使用以下工具监控网站性能：
- Google Analytics（网站分析）
- Google PageSpeed Insights（性能分析）
- GitHub Insights（仓库统计）

## 🎉 部署完成！

恭喜！您的裂金7日H5应用现在已经在线上运行了。您可以：

- 分享链接给朋友体验
- 在社交媒体上展示您的作品
- 继续开发新功能
- 收集用户反馈进行改进

---

如果您在部署过程中遇到任何问题，请查看GitHub的官方文档或在仓库中提交Issue。