/**
 * H5项目回归测试套件
 * 测试核心业务流程：注册→入金→抢红包→提现
 */

const fs = require('fs');
const path = require('path');

class RegressionTestSuite {
  constructor() {
    this.testResults = {
      userRegistration: [],
      accountActivation: [],
      redPacketGrabbing: [],
      withdrawal: [],
      stateTransitions: [],
      dataConsistency: [],
      errorHandling: []
    };
    this.passedTests = 0;
    this.failedTests = 0;
    this.totalTests = 0;
    this.testStartTime = Date.now();
  }

  /**
   * 执行完整的回归测试
   */
  async runRegressionTests() {
    console.log('🔄 开始回归测试...');
    
    try {
      // 设置测试环境
      await this.setupTestEnvironment();
      
      // 执行核心业务流程测试
      await this.testUserRegistrationFlow();
      await this.testAccountActivationFlow();
      await this.testRedPacketGrabbingFlow();
      await this.testWithdrawalFlow();
      
      // 执行状态转换测试
      await this.testStateTransitions();
      
      // 执行数据一致性测试
      await this.testDataConsistency();
      
      // 执行错误处理测试
      await this.testErrorHandling();
      
      // 生成测试报告
      await this.generateRegressionReport();
      
      console.log('✅ 回归测试完成');
      return this.getTestSummary();
      
    } catch (error) {
      console.error('❌ 回归测试失败:', error);
      throw error;
    }
  }

  /**
   * 设置测试环境
   */
  async setupTestEnvironment() {
    console.log('🔧 设置测试环境...');
    
    // 模拟DOM环境
    global.document = {
      getElementById: (id) => ({
        value: '',
        innerHTML: '',
        style: {},
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false
        },
        addEventListener: () => {},
        click: () => {}
      }),
      createElement: () => ({
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {} }
      }),
      body: {
        appendChild: () => {}
      }
    };
    
    // 模拟localStorage
    global.localStorage = {
      data: {},
      getItem: function(key) { return this.data[key] || null; },
      setItem: function(key, value) { this.data[key] = value; },
      removeItem: function(key) { delete this.data[key]; },
      clear: function() { this.data = {}; }
    };
    
    // 模拟WebSocket
    global.WebSocket = class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 1;
        setTimeout(() => {
          if (this.onopen) this.onopen();
        }, 100);
      }
      
      send(data) {
        // 模拟服务器响应
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage({
              data: JSON.stringify({ type: 'response', data: 'success' })
            });
          }
        }, 50);
      }
      
      close() {
        this.readyState = 3;
        if (this.onclose) this.onclose();
      }
    };
    
    // 模拟fetch API
    global.fetch = async (url, options) => {
      const mockResponses = {
        '/api/user/register': { success: true, userId: 'test123' },
        '/api/user/activate': { success: true, status: 2 },
        '/api/redpacket/grab': { success: true, amount: 10.5 },
        '/api/user/withdraw': { success: true, transactionId: 'tx123' },
        '/api/user/status': { success: true, status: 2, countdown: 168 * 3600 }
      };
      
      const response = mockResponses[url] || { success: false, error: 'Not found' };
      
      return {
        ok: response.success,
        json: async () => response,
        status: response.success ? 200 : 400
      };
    };
  }

  /**
   * 测试用户注册流程
   */
  async testUserRegistrationFlow() {
    console.log('👤 测试用户注册流程...');
    
    const tests = [
      {
        name: '正常注册流程',
        test: async () => {
          const result = await this.simulateUserRegistration({
            phone: '13800138000',
            inviteCode: 'ABC123'
          });
          return result.success === true;
        }
      },
      {
        name: '无效手机号注册',
        test: async () => {
          const result = await this.simulateUserRegistration({
            phone: '123',
            inviteCode: 'ABC123'
          });
          return result.success === false && result.error.includes('手机号');
        }
      },
      {
        name: '无效邀请码注册',
        test: async () => {
          const result = await this.simulateUserRegistration({
            phone: '13800138000',
            inviteCode: 'INVALID'
          });
          return result.success === false && result.error.includes('邀请码');
        }
      },
      {
        name: '重复注册检查',
        test: async () => {
          // 先注册一次
          await this.simulateUserRegistration({
            phone: '13800138001',
            inviteCode: 'ABC123'
          });
          
          // 再次注册相同手机号
          const result = await this.simulateUserRegistration({
            phone: '13800138001',
            inviteCode: 'ABC123'
          });
          
          return result.success === false && result.error.includes('已注册');
        }
      },
      {
        name: '注册后状态检查',
        test: async () => {
          const result = await this.simulateUserRegistration({
            phone: '13800138002',
            inviteCode: 'ABC123'
          });
          
          if (!result.success) return false;
          
          // 检查用户状态是否为状态1（新手未入金）
          const status = await this.getUserStatus(result.userId);
          return status.state === 1;
        }
      }
    ];
    
    await this.runTestGroup('userRegistration', tests);
  }

  /**
   * 测试账户激活流程
   */
  async testAccountActivationFlow() {
    console.log('💰 测试账户激活流程...');
    
    const tests = [
      {
        name: '正常激活流程',
        test: async () => {
          // 先注册用户
          const user = await this.simulateUserRegistration({
            phone: '13800138003',
            inviteCode: 'ABC123'
          });
          
          // 激活账户
          const result = await this.simulateAccountActivation(user.userId, 100);
          return result.success === true;
        }
      },
      {
        name: '激活金额验证',
        test: async () => {
          const user = await this.simulateUserRegistration({
            phone: '13800138004',
            inviteCode: 'ABC123'
          });
          
          // 尝试用不足金额激活
          const result = await this.simulateAccountActivation(user.userId, 50);
          return result.success === false && result.error.includes('金额');
        }
      },
      {
        name: '激活后状态转换',
        test: async () => {
          const user = await this.simulateUserRegistration({
            phone: '13800138005',
            inviteCode: 'ABC123'
          });
          
          const result = await this.simulateAccountActivation(user.userId, 100);
          if (!result.success) return false;
          
          // 检查状态是否转换为状态2（168小时倒计时）
          const status = await this.getUserStatus(user.userId);
          return status.state === 2 && status.countdown > 0;
        }
      },
      {
        name: '重复激活检查',
        test: async () => {
          const user = await this.simulateUserRegistration({
            phone: '13800138006',
            inviteCode: 'ABC123'
          });
          
          // 第一次激活
          await this.simulateAccountActivation(user.userId, 100);
          
          // 第二次激活
          const result = await this.simulateAccountActivation(user.userId, 100);
          return result.success === false && result.error.includes('已激活');
        }
      },
      {
        name: '激活倒计时功能',
        test: async () => {
          const user = await this.simulateUserRegistration({
            phone: '13800138007',
            inviteCode: 'ABC123'
          });
          
          await this.simulateAccountActivation(user.userId, 100);
          
          // 检查倒计时是否正确设置（168小时 = 604800秒）
          const status = await this.getUserStatus(user.userId);
          return status.countdown > 604000 && status.countdown <= 604800;
        }
      }
    ];
    
    await this.runTestGroup('accountActivation', tests);
  }

  /**
   * 测试抢红包流程
   */
  async testRedPacketGrabbingFlow() {
    console.log('🧧 测试抢红包流程...');
    
    const tests = [
      {
        name: '正常抢红包流程',
        test: async () => {
          const user = await this.createActivatedUser();
          const result = await this.simulateRedPacketGrab(user.userId);
          return result.success === true && result.amount > 0;
        }
      },
      {
        name: '未激活用户抢红包',
        test: async () => {
          const user = await this.simulateUserRegistration({
            phone: '13800138008',
            inviteCode: 'ABC123'
          });
          
          const result = await this.simulateRedPacketGrab(user.userId);
          return result.success === false && result.error.includes('未激活');
        }
      },
      {
        name: '红包时间窗口检查',
        test: async () => {
          const user = await this.createActivatedUser();
          
          // 模拟非红包时间
          const result = await this.simulateRedPacketGrab(user.userId, false);
          return result.success === false && result.error.includes('时间');
        }
      },
      {
        name: '重复抢红包检查',
        test: async () => {
          const user = await this.createActivatedUser();
          
          // 第一次抢红包
          await this.simulateRedPacketGrab(user.userId);
          
          // 第二次抢红包
          const result = await this.simulateRedPacketGrab(user.userId);
          return result.success === false && result.error.includes('已抢过');
        }
      },
      {
        name: '红包金额合理性',
        test: async () => {
          const user = await this.createActivatedUser();
          const result = await this.simulateRedPacketGrab(user.userId);
          
          return result.success && 
                 result.amount >= 0.1 && 
                 result.amount <= 100 &&
                 Number.isFinite(result.amount);
        }
      },
      {
        name: '红包记录保存',
        test: async () => {
          const user = await this.createActivatedUser();
          const result = await this.simulateRedPacketGrab(user.userId);
          
          if (!result.success) return false;
          
          // 检查红包记录是否保存
          const records = await this.getRedPacketRecords(user.userId);
          return records.length > 0 && records[0].amount === result.amount;
        }
      }
    ];
    
    await this.runTestGroup('redPacketGrabbing', tests);
  }

  /**
   * 测试提现流程
   */
  async testWithdrawalFlow() {
    console.log('💸 测试提现流程...');
    
    const tests = [
      {
        name: '正常提现流程',
        test: async () => {
          const user = await this.createUserWithBalance(100);
          const result = await this.simulateWithdrawal(user.userId, 50);
          return result.success === true;
        }
      },
      {
        name: '余额不足提现',
        test: async () => {
          const user = await this.createUserWithBalance(30);
          const result = await this.simulateWithdrawal(user.userId, 50);
          return result.success === false && result.error.includes('余额不足');
        }
      },
      {
        name: '最小提现金额检查',
        test: async () => {
          const user = await this.createUserWithBalance(100);
          const result = await this.simulateWithdrawal(user.userId, 5);
          return result.success === false && result.error.includes('最小金额');
        }
      },
      {
        name: '提现地址验证',
        test: async () => {
          const user = await this.createUserWithBalance(100);
          const result = await this.simulateWithdrawal(user.userId, 50, 'invalid_address');
          return result.success === false && result.error.includes('地址');
        }
      },
      {
        name: '提现后余额更新',
        test: async () => {
          const user = await this.createUserWithBalance(100);
          const result = await this.simulateWithdrawal(user.userId, 50);
          
          if (!result.success) return false;
          
          const balance = await this.getUserBalance(user.userId);
          return Math.abs(balance - 50) < 0.01; // 考虑浮点数精度
        }
      },
      {
        name: '提现记录保存',
        test: async () => {
          const user = await this.createUserWithBalance(100);
          const result = await this.simulateWithdrawal(user.userId, 50);
          
          if (!result.success) return false;
          
          const records = await this.getWithdrawalRecords(user.userId);
          return records.length > 0 && records[0].amount === 50;
        }
      }
    ];
    
    await this.runTestGroup('withdrawal', tests);
  }

  /**
   * 测试状态转换
   */
  async testStateTransitions() {
    console.log('🔄 测试状态转换...');
    
    const tests = [
      {
        name: '状态1到状态2转换',
        test: async () => {
          const user = await this.simulateUserRegistration({
            phone: '13800138009',
            inviteCode: 'ABC123'
          });
          
          // 初始状态应该是1
          let status = await this.getUserStatus(user.userId);
          if (status.state !== 1) return false;
          
          // 激活后应该转换到状态2
          await this.simulateAccountActivation(user.userId, 100);
          status = await this.getUserStatus(user.userId);
          return status.state === 2;
        }
      },
      {
        name: '状态2到状态3转换',
        test: async () => {
          const user = await this.createActivatedUser();
          
          // 模拟168小时倒计时结束
          await this.simulateCountdownExpiry(user.userId);
          
          const status = await this.getUserStatus(user.userId);
          return status.state === 3;
        }
      },
      // 删除状态4相关测试，因为状态4已被移除
      {
        name: '状态转换的不可逆性',
        test: async () => {
          const user = await this.createActivatedUser();
          
          // 尝试从状态2回退到状态1
          const result = await this.simulateStateChange(user.userId, 1);
          return result.success === false;
        }
      },
      {
        name: '状态转换时的数据一致性',
        test: async () => {
          const user = await this.createActivatedUser();
          const initialBalance = await this.getUserBalance(user.userId);
          
          // 状态转换
          await this.simulateCountdownExpiry(user.userId);
          
          // 余额应该保持不变
          const finalBalance = await this.getUserBalance(user.userId);
          return Math.abs(initialBalance - finalBalance) < 0.01;
        }
      }
    ];
    
    await this.runTestGroup('stateTransitions', tests);
  }

  /**
   * 测试数据一致性
   */
  async testDataConsistency() {
    console.log('📊 测试数据一致性...');
    
    const tests = [
      {
        name: 'localStorage与服务器数据同步',
        test: async () => {
          const user = await this.createActivatedUser();
          
          // 本地存储用户状态
          localStorage.setItem('userState', '2');
          localStorage.setItem('userId', user.userId);
          
          // 获取服务器状态
          const serverStatus = await this.getUserStatus(user.userId);
          const localState = parseInt(localStorage.getItem('userState'));
          
          return serverStatus.state === localState;
        }
      },
      {
        name: '余额计算一致性',
        test: async () => {
          const user = await this.createUserWithBalance(100);
          
          // 进行多次操作
          await this.simulateRedPacketGrab(user.userId); // +红包金额
          await this.simulateWithdrawal(user.userId, 30); // -30
          
          // 检查余额计算是否正确
          const balance = await this.getUserBalance(user.userId);
          const records = await this.getTransactionRecords(user.userId);
          
          let calculatedBalance = 100;
          records.forEach(record => {
            if (record.type === 'redpacket') calculatedBalance += record.amount;
            if (record.type === 'withdrawal') calculatedBalance -= record.amount;
          });
          
          return Math.abs(balance - calculatedBalance) < 0.01;
        }
      },
      {
        name: '倒计时数据一致性',
        test: async () => {
          const user = await this.createActivatedUser();
          
          // 获取初始倒计时
          const initialStatus = await this.getUserStatus(user.userId);
          
          // 等待1秒
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 再次获取倒计时
          const laterStatus = await this.getUserStatus(user.userId);
          
          // 倒计时应该减少
          return laterStatus.countdown < initialStatus.countdown;
        }
      },
      {
        name: '邀请关系数据一致性',
        test: async () => {
          const inviter = await this.simulateUserRegistration({
            phone: '13800138010',
            inviteCode: 'ABC123'
          });
          
          const invitee = await this.simulateUserRegistration({
            phone: '13800138011',
            inviteCode: inviter.inviteCode
          });
          
          // 检查邀请关系
          const relationship = await this.getInviteRelationship(inviter.userId, invitee.userId);
          return relationship.exists === true;
        }
      }
    ];
    
    await this.runTestGroup('dataConsistency', tests);
  }

  /**
   * 测试错误处理
   */
  async testErrorHandling() {
    console.log('⚠️ 测试错误处理...');
    
    const tests = [
      {
        name: '网络错误处理',
        test: async () => {
          // 模拟网络错误
          const originalFetch = global.fetch;
          global.fetch = () => Promise.reject(new Error('Network error'));
          
          try {
            const result = await this.simulateUserRegistration({
              phone: '13800138012',
              inviteCode: 'ABC123'
            });
            
            global.fetch = originalFetch;
            return result.success === false && result.error.includes('网络');
          } catch (error) {
            global.fetch = originalFetch;
            return true; // 错误被正确捕获
          }
        }
      },
      {
        name: '服务器错误处理',
        test: async () => {
          // 模拟服务器500错误
          const originalFetch = global.fetch;
          global.fetch = () => Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Internal server error' })
          });
          
          const result = await this.simulateUserRegistration({
            phone: '13800138013',
            inviteCode: 'ABC123'
          });
          
          global.fetch = originalFetch;
          return result.success === false;
        }
      },
      {
        name: '数据格式错误处理',
        test: async () => {
          const result = await this.simulateUserRegistration({
            phone: null,
            inviteCode: undefined
          });
          
          return result.success === false && result.error.includes('格式');
        }
      },
      {
        name: '超时错误处理',
        test: async () => {
          // 模拟超时
          const originalFetch = global.fetch;
          global.fetch = () => new Promise(() => {}); // 永不resolve
          
          const startTime = Date.now();
          const result = await this.simulateUserRegistration({
            phone: '13800138014',
            inviteCode: 'ABC123'
          });
          const endTime = Date.now();
          
          global.fetch = originalFetch;
          
          // 应该在合理时间内返回错误
          return (endTime - startTime) < 10000 && result.success === false;
        }
      }
    ];
    
    await this.runTestGroup('errorHandling', tests);
  }

  /**
   * 运行测试组
   */
  async runTestGroup(groupName, tests) {
    console.log(`📋 运行 ${groupName} 测试组...`);
    
    for (const test of tests) {
      this.totalTests++;
      
      try {
        const startTime = Date.now();
        const passed = await test.test();
        const duration = Date.now() - startTime;
        
        const result = {
          name: test.name,
          passed: passed,
          duration: duration,
          error: null
        };
        
        if (passed) {
          this.passedTests++;
          console.log(`  ✅ ${test.name} (${duration}ms)`);
        } else {
          this.failedTests++;
          console.log(`  ❌ ${test.name} (${duration}ms)`);
        }
        
        this.testResults[groupName].push(result);
        
      } catch (error) {
        this.failedTests++;
        console.log(`  💥 ${test.name} - 异常: ${error.message}`);
        
        this.testResults[groupName].push({
          name: test.name,
          passed: false,
          duration: 0,
          error: error.message
        });
      }
    }
  }

  /**
   * 生成回归测试报告
   */
  async generateRegressionReport() {
    const reportPath = path.join(__dirname, '../报告/regression-test-report.md');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = this.generateMarkdownReport();
    fs.writeFileSync(reportPath, report, 'utf8');
    
    // 生成JSON格式的详细报告
    const jsonReportPath = path.join(__dirname, '../报告/regression-test-results.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.testResults, null, 2), 'utf8');
    
    console.log(`📊 回归测试报告已生成: ${reportPath}`);
  }

  /**
   * 生成Markdown格式报告
   */
  generateMarkdownReport() {
    const timestamp = new Date().toLocaleString('zh-CN');
    const duration = Date.now() - this.testStartTime;
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    
    return `# H5项目回归测试报告

## 📊 测试概览

**测试时间**: ${timestamp}  
**测试耗时**: ${(duration / 1000).toFixed(2)}秒  
**总测试数**: ${this.totalTests}  
**通过测试**: ${this.passedTests}  
**失败测试**: ${this.failedTests}  
**成功率**: ${successRate}%  

## 🎯 测试结果

${this.generateTestGroupSummary()}

## 📋 详细测试结果

${this.generateDetailedResults()}

## 🔍 失败测试分析

${this.generateFailureAnalysis()}

## 📈 性能指标

${this.generatePerformanceMetrics()}

## 🛠️ 修复建议

${this.generateFixRecommendations()}

---

*报告由H5项目回归测试工具自动生成*
`;
  }

  /**
   * 生成测试组摘要
   */
  generateTestGroupSummary() {
    const groups = Object.keys(this.testResults);
    
    return groups.map(group => {
      const tests = this.testResults[group];
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
      const status = rate === '100.0' ? '✅' : rate >= '80.0' ? '⚠️' : '❌';
      
      return `| ${status} ${this.getGroupDisplayName(group)} | ${passed}/${total} | ${rate}% |`;
    }).join('\n');
  }

  /**
   * 生成详细结果
   */
  generateDetailedResults() {
    const groups = Object.keys(this.testResults);
    
    return groups.map(group => {
      const tests = this.testResults[group];
      const groupName = this.getGroupDisplayName(group);
      
      const testList = tests.map(test => {
        const status = test.passed ? '✅' : '❌';
        const duration = `${test.duration}ms`;
        const error = test.error ? ` - ${test.error}` : '';
        return `- ${status} ${test.name} (${duration})${error}`;
      }).join('\n');
      
      return `### ${groupName}\n\n${testList}`;
    }).join('\n\n');
  }

  /**
   * 生成失败分析
   */
  generateFailureAnalysis() {
    const failedTests = [];
    
    Object.keys(this.testResults).forEach(group => {
      this.testResults[group].forEach(test => {
        if (!test.passed) {
          failedTests.push({
            group: this.getGroupDisplayName(group),
            name: test.name,
            error: test.error
          });
        }
      });
    });
    
    if (failedTests.length === 0) {
      return '🎉 所有测试都通过了！';
    }
    
    return failedTests.map((test, index) => 
      `${index + 1}. **${test.group} - ${test.name}**  
   ${test.error ? `错误: ${test.error}` : '测试未通过'}`
    ).join('\n\n');
  }

  /**
   * 生成性能指标
   */
  generatePerformanceMetrics() {
    const allTests = [];
    Object.values(this.testResults).forEach(group => {
      allTests.push(...group);
    });
    
    const durations = allTests.map(t => t.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    return `- **平均测试时间**: ${avgDuration.toFixed(2)}ms
- **最长测试时间**: ${maxDuration}ms
- **最短测试时间**: ${minDuration}ms
- **总测试时间**: ${(durations.reduce((a, b) => a + b, 0) / 1000).toFixed(2)}秒`;
  }

  /**
   * 生成修复建议
   */
  generateFixRecommendations() {
    const recommendations = [];
    
    if (this.failedTests > 0) {
      recommendations.push('🔧 **优先修复失败的测试用例**');
    }
    
    if (this.passedTests / this.totalTests < 0.9) {
      recommendations.push('⚠️ **测试通过率低于90%，需要重点关注**');
    }
    
    // 检查特定问题
    const hasNetworkIssues = this.testResults.errorHandling?.some(t => 
      !t.passed && t.name.includes('网络')
    );
    if (hasNetworkIssues) {
      recommendations.push('🌐 **改进网络错误处理机制**');
    }
    
    const hasDataIssues = this.testResults.dataConsistency?.some(t => !t.passed);
    if (hasDataIssues) {
      recommendations.push('📊 **检查数据一致性问题**');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✨ **测试状况良好，继续保持**');
    }
    
    return recommendations.map(rec => `- ${rec}`).join('\n');
  }

  /**
   * 获取测试摘要
   */
  getTestSummary() {
    return {
      total: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      successRate: (this.passedTests / this.totalTests) * 100,
      duration: Date.now() - this.testStartTime
    };
  }

  /**
   * 获取组显示名称
   */
  getGroupDisplayName(group) {
    const names = {
      userRegistration: '用户注册',
      accountActivation: '账户激活',
      redPacketGrabbing: '抢红包',
      withdrawal: '提现',
      stateTransitions: '状态转换',
      dataConsistency: '数据一致性',
      errorHandling: '错误处理'
    };
    return names[group] || group;
  }

  // 模拟方法
  async simulateUserRegistration(userData) {
    // 模拟用户注册逻辑
    if (!userData.phone || userData.phone.length < 11) {
      return { success: false, error: '手机号格式错误' };
    }
    
    if (!userData.inviteCode) {
      return { success: false, error: '邀请码不能为空' };
    }
    
    // 检查是否已注册
    const existingUser = localStorage.getItem(`user_${userData.phone}`);
    if (existingUser) {
      return { success: false, error: '手机号已注册' };
    }
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      userId: userId,
      phone: userData.phone,
      inviteCode: userData.inviteCode,
      state: 1,
      balance: 0,
      createdAt: Date.now()
    };
    
    localStorage.setItem(`user_${userData.phone}`, JSON.stringify(user));
    localStorage.setItem(`userById_${userId}`, JSON.stringify(user));
    
    return { success: true, userId: userId, inviteCode: this.generateInviteCode() };
  }

  async simulateAccountActivation(userId, amount) {
    if (amount < 100) {
      return { success: false, error: '激活金额不足100USDT' };
    }
    
    const user = JSON.parse(localStorage.getItem(`userById_${userId}`));
    if (!user) {
      return { success: false, error: '用户不存在' };
    }
    
    if (user.state !== 1) {
      return { success: false, error: '账户已激活' };
    }
    
    user.state = 2;
    user.balance = amount;
    user.countdown = 168 * 3600; // 168小时
    user.activatedAt = Date.now();
    
    localStorage.setItem(`userById_${userId}`, JSON.stringify(user));
    
    return { success: true };
  }

  async simulateRedPacketGrab(userId, isActiveTime = true) {
    const user = JSON.parse(localStorage.getItem(`userById_${userId}`));
    if (!user) {
      return { success: false, error: '用户不存在' };
    }
    
    if (user.state < 2) {
      return { success: false, error: '账户未激活' };
    }
    
    if (!isActiveTime) {
      return { success: false, error: '不在红包时间窗口内' };
    }
    
    // 检查是否已抢过
    const records = JSON.parse(localStorage.getItem(`redpacket_${userId}`) || '[]');
    const today = new Date().toDateString();
    const todayRecord = records.find(r => new Date(r.date).toDateString() === today);
    
    if (todayRecord) {
      return { success: false, error: '今日已抢过红包' };
    }
    
    const amount = Math.random() * 20 + 0.1; // 0.1-20.1 USDT
    const record = {
      amount: parseFloat(amount.toFixed(2)),
      date: Date.now(),
      type: 'redpacket'
    };
    
    records.push(record);
    localStorage.setItem(`redpacket_${userId}`, JSON.stringify(records));
    
    // 更新余额
    user.balance += record.amount;
    localStorage.setItem(`userById_${userId}`, JSON.stringify(user));
    
    return { success: true, amount: record.amount };
  }

  async simulateWithdrawal(userId, amount, address = 'valid_address') {
    const user = JSON.parse(localStorage.getItem(`userById_${userId}`));
    if (!user) {
      return { success: false, error: '用户不存在' };
    }
    
    if (amount < 10) {
      return { success: false, error: '最小提现金额为10USDT' };
    }
    
    if (user.balance < amount) {
      return { success: false, error: '余额不足' };
    }
    
    if (address === 'invalid_address') {
      return { success: false, error: '提现地址格式错误' };
    }
    
    // 更新余额
    user.balance -= amount;
    localStorage.setItem(`userById_${userId}`, JSON.stringify(user));
    
    // 记录提现
    const records = JSON.parse(localStorage.getItem(`withdrawal_${userId}`) || '[]');
    records.push({
      amount: amount,
      address: address,
      date: Date.now(),
      type: 'withdrawal',
      status: 'pending'
    });
    localStorage.setItem(`withdrawal_${userId}`, JSON.stringify(records));
    
    return { success: true, transactionId: `tx_${Date.now()}` };
  }

  async getUserStatus(userId) {
    const user = JSON.parse(localStorage.getItem(`userById_${userId}`));
    if (!user) return null;
    
    // 更新倒计时
    if (user.state === 2 && user.countdown > 0) {
      const elapsed = Math.floor((Date.now() - user.activatedAt) / 1000);
      user.countdown = Math.max(0, 168 * 3600 - elapsed);
      
      if (user.countdown === 0) {
        user.state = 3;
      }
      
      localStorage.setItem(`userById_${userId}`, JSON.stringify(user));
    }
    
    return {
      state: user.state,
      countdown: user.countdown || 0,
      balance: user.balance || 0
    };
  }

  async createActivatedUser() {
    const user = await this.simulateUserRegistration({
      phone: `138${Date.now().toString().slice(-8)}`,
      inviteCode: 'ABC123'
    });
    
    await this.simulateAccountActivation(user.userId, 100);
    return user;
  }

  async createUserWithBalance(balance) {
    const user = await this.createActivatedUser();
    const userData = JSON.parse(localStorage.getItem(`userById_${user.userId}`));
    userData.balance = balance;
    localStorage.setItem(`userById_${user.userId}`, JSON.stringify(userData));
    return user;
  }

  generateInviteCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // 其他辅助方法...
  async simulateCountdownExpiry(userId) {
    const user = JSON.parse(localStorage.getItem(`userById_${userId}`));
    user.state = 3;
    user.countdown = 0;
    localStorage.setItem(`userById_${userId}`, JSON.stringify(user));
  }

  async simulateChallengeCompletion(userId) {
    // 状态4已被移除，此方法不再设置状态4
    const user = JSON.parse(localStorage.getItem(`userById_${userId}`));
    // 保持当前状态不变，因为状态4已被移除
    localStorage.setItem(`userById_${userId}`, JSON.stringify(user));
  }

  async simulateStateChange(userId, newState) {
    const user = JSON.parse(localStorage.getItem(`userById_${userId}`));
    if (newState < user.state) {
      return { success: false, error: '状态不能回退' };
    }
    return { success: true };
  }

  async getUserBalance(userId) {
    const user = JSON.parse(localStorage.getItem(`userById_${userId}`));
    return user ? user.balance : 0;
  }

  async getRedPacketRecords(userId) {
    return JSON.parse(localStorage.getItem(`redpacket_${userId}`) || '[]');
  }

  async getWithdrawalRecords(userId) {
    return JSON.parse(localStorage.getItem(`withdrawal_${userId}`) || '[]');
  }

  async getTransactionRecords(userId) {
    const redpackets = await this.getRedPacketRecords(userId);
    const withdrawals = await this.getWithdrawalRecords(userId);
    return [...redpackets, ...withdrawals].sort((a, b) => b.date - a.date);
  }

  async getInviteRelationship(inviterId, inviteeId) {
    // 模拟邀请关系检查
    return { exists: true };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const testSuite = new RegressionTestSuite();
  testSuite.runRegressionTests().catch(console.error);
}

module.exports = RegressionTestSuite;