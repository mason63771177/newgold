# Context7 合规性文档

本文档说明了H5游戏化金融产品后端系统如何遵循Context7规范。

## Context7 规范概述

Context7是一个用于代码文档和示例管理的MCP服务器规范，旨在提供高质量的代码检索和文档生成能力。

## 项目合规性检查清单

### ✅ 项目结构规范化
- [x] 创建标准化的项目目录结构
- [x] 建立清晰的文档层次结构
- [x] 分离代码示例和最佳实践

### ✅ 文档标准化
- [x] 完整的README.md文档
- [x] API文档规范化
- [x] 最佳实践文档
- [x] 变更日志维护

### ✅ 代码注释规范
- [x] JSDoc标准注释格式
- [x] 函数级别的详细注释
- [x] 参数和返回值说明
- [x] 使用示例提供

### ✅ 配置文件标准化
- [x] context7.json配置文件
- [x] 项目元数据定义
- [x] 依赖关系声明
- [x] 架构模式说明

### ✅ 示例代码提供
- [x] API使用示例
- [x] 完整的客户端示例
- [x] 错误处理示例
- [x] 最佳实践代码

## Context7 配置详情

### 项目信息
```json
{
  "name": "h5-gamified-financial-backend",
  "version": "1.0.0",
  "description": "H5游戏化金融产品后端系统",
  "type": "backend-api",
  "framework": "express",
  "language": "javascript",
  "context7_version": "1.0.0"
}
```

### 架构模式
- **MVC模式**: 模型-视图-控制器分离
- **RESTful API**: 标准REST接口设计
- **中间件模式**: 请求处理链
- **服务层模式**: 业务逻辑封装

### 代码质量标准
- **JSDoc注释覆盖率**: 100%
- **函数复杂度**: 保持在合理范围内
- **错误处理**: 统一的错误处理机制
- **安全性**: 输入验证和安全防护

## 文档结构

```
backend/
├── context7.json                 # Context7配置文件
├── README.md                     # 项目主文档
├── CHANGELOG.md                  # 变更日志
├── docs/                         # 文档目录
│   ├── api/                      # API文档
│   │   └── README.md
│   ├── best-practices/           # 最佳实践
│   │   └── README.md
│   └── CONTEXT7_COMPLIANCE.md    # 本文档
├── examples/                     # 代码示例
│   └── api-usage-examples.js
└── [其他项目文件...]
```

## 代码示例标准

### JSDoc注释格式
```javascript
/**
 * 获取用户信息
 * @description 根据用户ID获取用户的详细信息，包括基本信息和状态
 * @param {Object} req - Express请求对象
 * @param {string} req.user.id - 用户ID（从JWT token中获取）
 * @param {Object} res - Express响应对象
 * @returns {Promise<Object>} 返回用户信息对象
 * @example
 * // GET /api/user/info
 * // Authorization: Bearer <token>
 * // Response: { success: true, data: { id, username, status, ... } }
 */
```

### API响应格式
```javascript
// 成功响应
{
  "success": true,
  "data": { /* 数据内容 */ },
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "error": "错误类型",
  "message": "错误描述",
  "code": "错误代码"
}
```

## 最佳实践遵循

### 1. 代码组织
- 按功能模块组织代码
- 保持文件和函数的单一职责
- 使用清晰的命名约定

### 2. 错误处理
- 统一的错误处理中间件
- 详细的错误日志记录
- 用户友好的错误消息

### 3. 安全性
- 输入验证和清理
- SQL注入防护
- JWT token安全管理

### 4. 性能优化
- 数据库查询优化
- 缓存策略实施
- 异步处理模式

## 维护和更新

### 文档更新流程
1. 代码变更时同步更新文档
2. 定期审查文档的准确性
3. 保持示例代码的可运行性

### 版本管理
- 遵循语义化版本规范
- 维护详细的变更日志
- 提供迁移指南

### 质量保证
- 代码审查包含文档检查
- 自动化测试覆盖示例代码
- 定期进行合规性审查

## 工具和集成

### 推荐工具
- **JSDoc**: 自动生成API文档
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Swagger**: API文档生成

### CI/CD集成
- 文档生成自动化
- 代码质量检查
- 示例代码测试

## 联系和支持

如有关于Context7合规性的问题，请联系：
- 技术负责人：[联系信息]
- 文档维护：[联系信息]
- 项目仓库：[仓库地址]

---

**最后更新**: 2024年1月
**文档版本**: 1.0.0
**Context7版本**: 1.0.0