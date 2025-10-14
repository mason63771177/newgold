# 通用测试规范 Prompt

## 核心原则
**严格按步骤执行，失败立即停止，禁止盲目继续**

## 测试执行规范

### 1. 环境检查优先
- 首先检查所有服务的运行状态和配置
- 确认环境变量（如 NODE_ENV）是否正确
- 验证 CORS、端口、数据库连接等基础配置
- **只有环境完全正确才开始测试**

### 2. 步骤依赖性原则
- 每个测试步骤都有明确的前置条件
- **当前步骤失败 → 立即停止，不执行后续步骤**
- **当前步骤成功 → 才能进入下一步**
- 记录每步的成功/失败状态

### 3. 错误处理机制
```javascript
// 示例：正确的测试流程控制
async function runTest() {
    try {
        const step1Result = await testStep1();
        if (!step1Result.success) {
            console.log("❌ 步骤1失败，停止测试");
            return { success: false, failedAt: "step1" };
        }
        
        const step2Result = await testStep2();
        if (!step2Result.success) {
            console.log("❌ 步骤2失败，停止测试");
            return { success: false, failedAt: "step2" };
        }
        
        // 只有前面都成功才继续...
    } catch (error) {
        console.log(`❌ 测试异常：${error.message}`);
        return { success: false, error };
    }
}
```

### 4. 常见错误模式（禁止）
- ❌ **盲目继续**：注册失败后还去测试登录
- ❌ **假设成功**：没验证结果就认为操作成功
- ❌ **忽略环境**：不检查 NODE_ENV、CORS 等配置
- ❌ **跳过验证**：不等待异步操作完成就进入下一步

### 5. 正确的测试模式（必须）
- ✅ **逐步验证**：每步都检查实际结果
- ✅ **失败即停**：任何步骤失败立即终止
- ✅ **环境优先**：先解决环境问题再测试功能
- ✅ **真实反馈**：如实报告每步的成功/失败状态

## 调试流程

### 问题定位顺序
1. **环境配置**：检查 .env、NODE_ENV、端口配置
2. **服务状态**：确认所有必要服务正在运行
3. **网络连接**：验证 CORS、API 可达性
4. **数据流向**：跟踪请求/响应的完整路径
5. **错误日志**：查看服务端和客户端的具体错误

### 修复验证
- 修复问题后，必须重新验证整个流程
- 不能假设"应该没问题了"
- 用实际测试确认修复效果

## 通用测试模板

```javascript
class UniversalTester {
    async runFullTest() {
        const results = {
            environment: false,
            step1: false,
            step2: false,
            step3: false
        };
        
        // 1. 环境检查
        console.log("🔍 检查测试环境...");
        if (!await this.checkEnvironment()) {
            console.log("❌ 环境检查失败，停止测试");
            return results;
        }
        results.environment = true;
        
        // 2. 步骤1
        console.log("🧪 执行步骤1...");
        if (!await this.executeStep1()) {
            console.log("❌ 步骤1失败，停止测试");
            return results;
        }
        results.step1 = true;
        
        // 3. 步骤2（只有步骤1成功才执行）
        console.log("🧪 执行步骤2...");
        if (!await this.executeStep2()) {
            console.log("❌ 步骤2失败，停止测试");
            return results;
        }
        results.step2 = true;
        
        // 继续后续步骤...
        return results;
    }
}
```

## 关键提醒
- **测试不是为了证明功能正常，而是为了发现问题**
- **失败是有价值的信息，不要掩盖或跳过**
- **每个步骤都要有明确的成功/失败判断标准**
- **环境问题优先解决，不要在错误环境下测试功能**

---
*适用于任何项目的测试场景，确保测试的可靠性和有效性*