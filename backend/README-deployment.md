# 后端部署指南

## Vercel 部署步骤

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 在项目根目录运行部署
```bash
vercel
```

4. 配置环境变量
在 Vercel 控制台中配置以下环境变量：
- NODE_ENV=production
- JWT_SECRET=your-secret-key
- DB_HOST=your-database-host
- DB_USER=your-database-user
- DB_PASSWORD=your-database-password
- DB_NAME=gold7_game
- REDIS_HOST=your-redis-host
- REDIS_PASSWORD=your-redis-password

## Railway 部署步骤

1. 安装 Railway CLI
```bash
npm install -g @railway/cli
```

2. 登录 Railway
```bash
railway login
```

3. 初始化项目
```bash
railway init
```

4. 部署
```bash
railway up
```

## 数据库配置

建议使用以下服务：
- MySQL: PlanetScale, Railway MySQL
- Redis: Upstash Redis, Railway Redis

## 注意事项

1. 确保所有环境变量都已正确配置
2. 数据库需要初始化表结构
3. 确保防火墙允许外部访问
4. 配置正确的CORS域名