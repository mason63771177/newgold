/**
 * 安全测试执行脚本
 * 批量运行所有安全测试并生成汇总报告
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class SecurityTestRunner {
  constructor() {
    this.testResults = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalIssues: 0,
        startTime: null,
        endTime: null,
        duration: 0
      },
      testModules: [],
      detailedResults: {}
    };
    
    // 安全测试模块配置
    this.testModules = [
      {
        name: 'XSS防护测试',
        file: '../安全测试/xss-protection-test.js',
        description: '跨站脚本攻击防护测试',
        priority: 'CRITICAL'
      },
      {
        name: 'SQL注入防护测试',
        file: '../安全测试/sql-injection-test.js',
        description: 'SQL注入攻击防护测试',
        priority: 'CRITICAL'
      },
      {
        name: 'CSRF防护测试',
        file: '../安全测试/csrf-protection-test.js',
        description: '跨站请求伪造防护测试',
        priority: 'HIGH'
      },
      {
        name: '会话劫持测试',
        file: '../安全测试/session-hijack-test.js',
        description: '会话劫持和认证绕过测试',
        priority: 'HIGH'
      },
      {
        name: 'API安全测试',
        file: '../安全测试/api-security-test.js',
        description: 'API权限和参数安全测试',
        priority: 'HIGH'
      },
      {
        name: '暴力破解防护测试',
        file: '../安全测试/brute-force-test.js',
        description: '暴力破解攻击防护测试',
        priority: 'MEDIUM'
      },
      {
        name: '敏感信息泄露测试',
        file: '../安全测试/sensitive-data-test.js',
        description: '敏感信息泄露检测测试',
        priority: 'HIGH'
      },
      {
        name: '文件上传安全测试',
        file: '../安全测试/file-upload-test.js',
        description: '文件上传安全漏洞测试',
        priority: 'CRITICAL'
      }
    ];
  }

  /**
   * 检查测试环境
   */
  async checkTestEnvironment() {
    console.log('🔍 检查测试环境...');
    
    const checks = [
      {
        name: '后端服务',
        url: 'http://localhost:3001/api/health',
        required: true
      },
      {
        name: '前端服务',
        url: 'http://localhost:3001',
        required: false
      }
    ];
    
    const axios = require('axios');
    const environmentStatus = {
      ready: true,
      services: []
    };
    
    for (const check of checks) {
      try {
        const response = await axios.get(check.url, { timeout: 5000 });
        environmentStatus.services.push({
          name: check.name,
          status: 'RUNNING',
          url: check.url,
          statusCode: response.status
        });
        console.log(`✅ ${check.name}: 运行正常`);
      } catch (error) {
        environmentStatus.services.push({
          name: check.name,
          status: 'DOWN',
          url: check.url,
          error: error.message
        });
        
        if (check.required) {
          environmentStatus.ready = false;
          console.log(`❌ ${check.name}: 服务不可用 - ${error.message}`);
        } else {
          console.log(`⚠️  ${check.name}: 服务不可用 - ${error.message}`);
        }
      }
    }
    
    return environmentStatus;
  }

  /**
   * 运行单个测试模块
   */
  async runTestModule(testModule) {
    return new Promise((resolve) => {
      console.log(`🚀 开始执行: ${testModule.name}`);
      
      const testResult = {
        name: testModule.name,
        file: testModule.file,
        description: testModule.description,
        priority: testModule.priority,
        startTime: new Date().toISOString(),
        status: 'RUNNING',
        output: '',
        error: '',
        summary: null
      };
      
      const testProcess = spawn('node', [testModule.file], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        testResult.output += output;
        console.log(`[${testModule.name}] ${output.trim()}`);
      });
      
      testProcess.stderr.on('data', (data) => {
        const error = data.toString();
        testResult.error += error;
        console.error(`[${testModule.name}] ERROR: ${error.trim()}`);
      });
      
      testProcess.on('close', (code) => {
        testResult.endTime = new Date().toISOString();
        testResult.exitCode = code;
        testResult.status = code === 0 ? 'COMPLETED' : 'FAILED';
        
        // 尝试解析测试结果
        try {
          const outputLines = testResult.output.split('\n');
          const jsonLine = outputLines.find(line => line.trim().startsWith('{'));
          if (jsonLine) {
            testResult.summary = JSON.parse(jsonLine);
          }
        } catch (error) {
          console.warn(`⚠️  无法解析 ${testModule.name} 的测试结果`);
        }
        
        if (code === 0) {
          console.log(`✅ ${testModule.name}: 测试完成`);
        } else {
          console.log(`❌ ${testModule.name}: 测试失败 (退出码: ${code})`);
        }
        
        resolve(testResult);
      });
      
      // 设置超时
      setTimeout(() => {
        if (testResult.status === 'RUNNING') {
          testProcess.kill('SIGTERM');
          testResult.status = 'TIMEOUT';
          testResult.error += '\n测试超时';
          console.log(`⏰ ${testModule.name}: 测试超时`);
          resolve(testResult);
        }
      }, 300000); // 5分钟超时
    });
  }

  /**
   * 运行所有安全测试
   */
  async runAllTests() {
    console.log('🛡️  开始执行安全测试套件...');
    console.log(`📋 计划执行 ${this.testModules.length} 个测试模块\n`);
    
    this.testResults.summary.startTime = new Date().toISOString();
    
    // 检查测试环境
    const environmentStatus = await this.checkTestEnvironment();
    if (!environmentStatus.ready) {
      console.error('❌ 测试环境未就绪，请检查服务状态');
      return this.testResults;
    }
    
    console.log('\n🔄 开始执行测试模块...\n');
    
    // 按优先级排序测试模块
    const sortedModules = this.testModules.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // 执行测试模块
    for (const testModule of sortedModules) {
      const result = await this.runTestModule(testModule);
      this.testResults.testModules.push(result);
      
      // 更新统计信息
      this.testResults.summary.totalTests++;
      if (result.status === 'COMPLETED') {
        this.testResults.summary.passedTests++;
      } else {
        this.testResults.summary.failedTests++;
      }
      
      // 统计严重问题
      if (result.summary && result.summary.summary) {
        this.testResults.summary.criticalIssues += result.summary.summary.critical || 0;
      }
      
      // 保存详细结果
      this.testResults.detailedResults[testModule.name] = result;
      
      console.log(''); // 添加空行分隔
    }
    
    this.testResults.summary.endTime = new Date().toISOString();
    this.testResults.summary.duration = new Date(this.testResults.summary.endTime) - 
                                        new Date(this.testResults.summary.startTime);
    
    console.log('✅ 所有安全测试执行完成\n');
    this.printSummary();
    
    return this.testResults;
  }

  /**
   * 打印测试摘要
   */
  printSummary() {
    console.log('📊 测试结果摘要:');
    console.log('=' .repeat(50));
    console.log(`总测试模块: ${this.testResults.summary.totalTests}`);
    console.log(`成功完成: ${this.testResults.summary.passedTests}`);
    console.log(`执行失败: ${this.testResults.summary.failedTests}`);
    console.log(`严重问题: ${this.testResults.summary.criticalIssues}`);
    console.log(`测试耗时: ${Math.round(this.testResults.summary.duration / 1000)}秒`);
    console.log('=' .repeat(50));
    
    // 按优先级显示测试结果
    const criticalTests = this.testResults.testModules.filter(t => t.priority === 'CRITICAL');
    const highTests = this.testResults.testModules.filter(t => t.priority === 'HIGH');
    const mediumTests = this.testResults.testModules.filter(t => t.priority === 'MEDIUM');
    
    if (criticalTests.length > 0) {
      console.log('\n🔴 严重级别测试:');
      criticalTests.forEach(test => {
        const status = test.status === 'COMPLETED' ? '✅' : '❌';
        console.log(`  ${status} ${test.name}: ${test.status}`);
      });
    }
    
    if (highTests.length > 0) {
      console.log('\n🟡 高级别测试:');
      highTests.forEach(test => {
        const status = test.status === 'COMPLETED' ? '✅' : '❌';
        console.log(`  ${status} ${test.name}: ${test.status}`);
      });
    }
    
    if (mediumTests.length > 0) {
      console.log('\n🟢 中等级别测试:');
      mediumTests.forEach(test => {
        const status = test.status === 'COMPLETED' ? '✅' : '❌';
        console.log(`  ${status} ${test.name}: ${test.status}`);
      });
    }
  }

  /**
   * 生成HTML测试报告
   */
  async generateHTMLReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>H5项目安全测试报告</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; font-size: 2em; }
        .summary-card p { margin: 0; opacity: 0.9; }
        .test-module { border: 1px solid #ddd; margin: 15px 0; border-radius: 8px; overflow: hidden; }
        .test-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .test-content { padding: 15px; }
        .status-completed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .status-timeout { color: #ffc107; font-weight: bold; }
        .priority-critical { border-left: 5px solid #dc3545; }
        .priority-high { border-left: 5px solid #fd7e14; }
        .priority-medium { border-left: 5px solid #ffc107; }
        .priority-low { border-left: 5px solid #28a745; }
        .output-section { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .output-section pre { margin: 0; white-space: pre-wrap; font-size: 12px; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        .recommendations { background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .recommendations h3 { color: #0056b3; margin-top: 0; }
        .recommendations ul { padding-left: 20px; }
        .recommendations li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ H5项目安全测试报告</h1>
        
        <div class="summary">
            <div class="summary-card">
                <h3>${this.testResults.summary.totalTests}</h3>
                <p>总测试模块</p>
            </div>
            <div class="summary-card">
                <h3>${this.testResults.summary.passedTests}</h3>
                <p>成功完成</p>
            </div>
            <div class="summary-card">
                <h3>${this.testResults.summary.failedTests}</h3>
                <p>执行失败</p>
            </div>
            <div class="summary-card">
                <h3>${this.testResults.summary.criticalIssues}</h3>
                <p>严重问题</p>
            </div>
        </div>
        
        <div class="test-info">
            <p><strong>测试开始时间:</strong> <span class="timestamp">${this.testResults.summary.startTime}</span></p>
            <p><strong>测试结束时间:</strong> <span class="timestamp">${this.testResults.summary.endTime}</span></p>
            <p><strong>测试耗时:</strong> ${Math.round(this.testResults.summary.duration / 1000)}秒</p>
        </div>
        
        <h2>📋 测试模块详情</h2>
        
        ${this.testResults.testModules.map(test => `
        <div class="test-module priority-${test.priority.toLowerCase()}">
            <div class="test-header">
                <h3>${test.name} 
                    <span class="status-${test.status.toLowerCase()}">[${test.status}]</span>
                    <span style="float: right; font-size: 0.8em; color: #6c757d;">${test.priority}</span>
                </h3>
                <p>${test.description}</p>
            </div>
            <div class="test-content">
                <p><strong>测试文件:</strong> ${test.file}</p>
                <p><strong>开始时间:</strong> <span class="timestamp">${test.startTime}</span></p>
                <p><strong>结束时间:</strong> <span class="timestamp">${test.endTime || '未完成'}</span></p>
                <p><strong>退出码:</strong> ${test.exitCode !== undefined ? test.exitCode : 'N/A'}</p>
                
                ${test.summary ? `
                <div class="output-section">
                    <h4>测试摘要:</h4>
                    <pre>${JSON.stringify(test.summary.summary || test.summary, null, 2)}</pre>
                </div>
                ` : ''}
                
                ${test.output ? `
                <div class="output-section">
                    <h4>测试输出:</h4>
                    <pre>${test.output.substring(0, 1000)}${test.output.length > 1000 ? '...(截断)' : ''}</pre>
                </div>
                ` : ''}
                
                ${test.error ? `
                <div class="output-section" style="background: #fff5f5; border: 1px solid #fed7d7;">
                    <h4>错误信息:</h4>
                    <pre style="color: #e53e3e;">${test.error}</pre>
                </div>
                ` : ''}
            </div>
        </div>
        `).join('')}
        
        <div class="recommendations">
            <h3>🔧 安全加固建议</h3>
            <ul>
                <li><strong>立即处理严重级别问题:</strong> 优先修复所有CRITICAL级别的安全漏洞</li>
                <li><strong>实施安全编码规范:</strong> 建立代码审查流程，确保安全编码实践</li>
                <li><strong>定期安全测试:</strong> 建议每月执行一次完整的安全测试</li>
                <li><strong>安全监控:</strong> 部署实时安全监控和告警系统</li>
                <li><strong>团队培训:</strong> 定期进行安全意识和技能培训</li>
                <li><strong>漏洞管理:</strong> 建立漏洞跟踪和修复流程</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #6c757d; font-size: 0.9em;">
            <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
            <p>H5项目安全测试智能体 v1.0</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const reportPath = path.join(__dirname, '../安全测试报告.html');
    await fs.writeFile(reportPath, htmlTemplate, 'utf8');
    console.log(`📄 HTML报告已生成: ${reportPath}`);
    
    return reportPath;
  }

  /**
   * 保存JSON测试结果
   */
  async saveJSONResults() {
    const jsonPath = path.join(__dirname, '../安全测试结果.json');
    await fs.writeFile(jsonPath, JSON.stringify(this.testResults, null, 2), 'utf8');
    console.log(`💾 JSON结果已保存: ${jsonPath}`);
    return jsonPath;
  }

  /**
   * 主执行函数
   */
  async run() {
    try {
      console.log('🛡️  H5项目安全测试执行器启动\n');
      
      // 执行所有测试
      await this.runAllTests();
      
      // 生成报告
      console.log('\n📄 生成测试报告...');
      await this.generateHTMLReport();
      await this.saveJSONResults();
      
      console.log('\n🎉 安全测试执行完成！');
      
      // 返回测试结果
      return this.testResults;
      
    } catch (error) {
      console.error('❌ 测试执行失败:', error);
      throw error;
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const runner = new SecurityTestRunner();
  runner.run().catch(error => {
    console.error('测试执行器启动失败:', error);
    process.exit(1);
  });
}

module.exports = SecurityTestRunner;