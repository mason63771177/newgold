/**
 * 会话劫持和身份验证绕过测试套件
 * 测试会话管理和身份验证机制的安全性
 */

const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;

class SessionHijackTest {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.testResults = {
      sessionFixation: [],
      sessionHijacking: [],
      tokenValidation: [],
      authBypass: [],
      sessionTimeout: [],
      concurrentSessions: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
  }

  /**
   * 生成测试用户凭据
   */
  generateTestCredentials() {
    return {
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      inviteCode: 'TEST123'
    };
  }

  /**
   * 注册测试用户
   */
  async registerTestUser(credentials) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/register`, credentials, {
        timeout: 10000,
        validateStatus: () => true
      });
      return response;
    } catch (error) {
      return { status: 500, data: { error: error.message } };
    }
  }

  /**
   * 用户登录获取token
   */
  async loginUser(credentials) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      }, {
        timeout: 10000,
        validateStatus: () => true
      });
      return response;
    } catch (error) {
      return { status: 500, data: { error: error.message } };
    }
  }

  /**
   * 测试会话固定攻击
   */
  async testSessionFixation() {
    console.log('🔍 测试会话固定攻击...');
    
    const credentials = this.generateTestCredentials();
    
    try {
      // 注册用户
      await this.registerTestUser(credentials);
      
      // 第一次登录获取token
      const firstLogin = await this.loginUser(credentials);
      if (!firstLogin.data?.data?.token) {
        throw new Error('无法获取登录token');
      }
      
      const firstToken = firstLogin.data.data.token;
      
      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 第二次登录获取token
      const secondLogin = await this.loginUser(credentials);
      if (!secondLogin.data?.data?.token) {
        throw new Error('无法获取第二次登录token');
      }
      
      const secondToken = secondLogin.data.data.token;
      
      // 检查token是否相同（会话固定漏洞）
      const isVulnerable = firstToken === secondToken;
      
      const testCase = {
        type: 'Session Fixation',
        target: 'Login endpoint',
        timestamp: new Date().toISOString(),
        firstToken: firstToken.substring(0, 20) + '...',
        secondToken: secondToken.substring(0, 20) + '...',
        tokensIdentical: isVulnerable,
        vulnerable: isVulnerable,
        severity: isVulnerable ? 'HIGH' : 'SAFE',
        description: isVulnerable ? 
          '会话固定漏洞：多次登录使用相同token' : 
          '会话管理安全：每次登录生成新token'
      };
      
      // 测试旧token是否仍然有效
      if (!isVulnerable) {
        const oldTokenTest = await axios.get(`${this.baseURL}/user/profile`, {
          headers: { 'Authorization': `Bearer ${firstToken}` },
          timeout: 5000,
          validateStatus: () => true
        });
        
        testCase.oldTokenValid = oldTokenTest.status === 200;
        if (testCase.oldTokenValid) {
          testCase.vulnerable = true;
          testCase.severity = 'HIGH';
          testCase.description = '会话管理漏洞：旧token在新登录后仍然有效';
        }
      }
      
      this.testResults.sessionFixation.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
        this.testResults.summary.critical++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      this.testResults.sessionFixation.push({
        type: 'Session Fixation',
        target: 'Login endpoint',
        vulnerable: false,
        error: error.message,
        severity: 'ERROR',
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试会话劫持
   */
  async testSessionHijacking() {
    console.log('🔍 测试会话劫持...');
    
    const credentials = this.generateTestCredentials();
    
    try {
      // 注册并登录用户
      await this.registerTestUser(credentials);
      const loginResponse = await this.loginUser(credentials);
      
      if (!loginResponse.data?.data?.token) {
        throw new Error('无法获取登录token');
      }
      
      const originalToken = loginResponse.data.data.token;
      
      // 测试1: Token篡改
      const tamperedTokens = [
        this.tamperToken(originalToken, 'signature'),
        this.tamperToken(originalToken, 'payload'),
        this.tamperToken(originalToken, 'header'),
        originalToken.slice(0, -5) + 'XXXXX', // 修改末尾
        originalToken.replace(/[a-zA-Z]/g, 'X').substring(0, originalToken.length) // 替换字符
      ];
      
      for (let i = 0; i < tamperedTokens.length; i++) {
        const tamperedToken = tamperedTokens[i];
        
        const testCase = {
          type: 'Token Tampering',
          target: 'User profile endpoint',
          timestamp: new Date().toISOString(),
          tamperMethod: ['signature', 'payload', 'header', 'suffix', 'characters'][i],
          originalToken: originalToken.substring(0, 20) + '...',
          tamperedToken: tamperedToken.substring(0, 20) + '...'
        };
        
        const response = await axios.get(`${this.baseURL}/user/profile`, {
          headers: { 'Authorization': `Bearer ${tamperedToken}` },
          timeout: 5000,
          validateStatus: () => true
        });
        
        const isVulnerable = response.status === 200;
        
        testCase.vulnerable = isVulnerable;
        testCase.statusCode = response.status;
        testCase.responseMessage = response.data?.message || '';
        testCase.severity = isVulnerable ? 'CRITICAL' : 'SAFE';
        testCase.description = isVulnerable ? 
          `Token验证漏洞：篡改的token被接受（${testCase.tamperMethod}）` : 
          `Token验证安全：正确拒绝了篡改的token（${testCase.tamperMethod}）`;
        
        this.testResults.sessionHijacking.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }
      }
      
      // 测试2: 过期token
      await this.testExpiredToken(originalToken);
      
      // 测试3: 伪造token
      await this.testForgedToken();
      
    } catch (error) {
      this.testResults.sessionHijacking.push({
        type: 'Session Hijacking',
        target: 'Multiple endpoints',
        vulnerable: false,
        error: error.message,
        severity: 'ERROR',
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试过期token
   */
  async testExpiredToken(originalToken) {
    try {
      // 创建一个过期的token
      const expiredToken = this.createExpiredToken();
      
      const testCase = {
        type: 'Expired Token',
        target: 'User profile endpoint',
        timestamp: new Date().toISOString(),
        expiredToken: expiredToken.substring(0, 20) + '...'
      };
      
      const response = await axios.get(`${this.baseURL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${expiredToken}` },
        timeout: 5000,
        validateStatus: () => true
      });
      
      const isVulnerable = response.status === 200;
      
      testCase.vulnerable = isVulnerable;
      testCase.statusCode = response.status;
      testCase.responseMessage = response.data?.message || '';
      testCase.severity = isVulnerable ? 'HIGH' : 'SAFE';
      testCase.description = isVulnerable ? 
        'Token过期验证漏洞：过期token仍被接受' : 
        'Token过期验证安全：正确拒绝了过期token';
      
      this.testResults.tokenValidation.push(testCase);
      this.testResults.summary.total++;
      
      if (isVulnerable) {
        this.testResults.summary.failed++;
        this.testResults.summary.critical++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      this.testResults.tokenValidation.push({
        type: 'Expired Token',
        target: 'User profile endpoint',
        vulnerable: false,
        error: error.message,
        severity: 'ERROR',
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试伪造token
   */
  async testForgedToken() {
    const forgedTokens = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6OTk5OTk5OTk5OX0.fake-signature',
      'Bearer fake-token-12345',
      'admin-token-bypass',
      'null',
      '',
      'undefined'
    ];
    
    for (const forgedToken of forgedTokens) {
      try {
        const testCase = {
          type: 'Forged Token',
          target: 'User profile endpoint',
          timestamp: new Date().toISOString(),
          forgedToken: forgedToken.substring(0, 30) + '...'
        };
        
        const response = await axios.get(`${this.baseURL}/user/profile`, {
          headers: { 'Authorization': `Bearer ${forgedToken}` },
          timeout: 5000,
          validateStatus: () => true
        });
        
        const isVulnerable = response.status === 200;
        
        testCase.vulnerable = isVulnerable;
        testCase.statusCode = response.status;
        testCase.responseMessage = response.data?.message || '';
        testCase.severity = isVulnerable ? 'CRITICAL' : 'SAFE';
        testCase.description = isVulnerable ? 
          '身份验证绕过漏洞：伪造token被接受' : 
          '身份验证安全：正确拒绝了伪造token';
        
        this.testResults.authBypass.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.authBypass.push({
          type: 'Forged Token',
          target: 'User profile endpoint',
          vulnerable: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试会话超时
   */
  async testSessionTimeout() {
    console.log('🔍 测试会话超时机制...');
    
    const credentials = this.generateTestCredentials();
    
    try {
      // 注册并登录用户
      await this.registerTestUser(credentials);
      const loginResponse = await this.loginUser(credentials);
      
      if (!loginResponse.data?.data?.token) {
        throw new Error('无法获取登录token');
      }
      
      const token = loginResponse.data.data.token;
      
      // 立即测试token有效性
      const immediateTest = await axios.get(`${this.baseURL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000,
        validateStatus: () => true
      });
      
      // 等待一段时间后再次测试
      console.log('等待会话超时测试...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const delayedTest = await axios.get(`${this.baseURL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000,
        validateStatus: () => true
      });
      
      const testCase = {
        type: 'Session Timeout',
        target: 'User profile endpoint',
        timestamp: new Date().toISOString(),
        immediateStatus: immediateTest.status,
        delayedStatus: delayedTest.status,
        timeoutDelay: 5000
      };
      
      // 分析会话超时行为
      const hasProperTimeout = this.analyzeSessionTimeout(immediateTest, delayedTest);
      
      testCase.vulnerable = !hasProperTimeout.hasTimeout;
      testCase.analysis = hasProperTimeout.analysis;
      testCase.severity = testCase.vulnerable ? 'MEDIUM' : 'SAFE';
      testCase.description = testCase.vulnerable ? 
        '会话超时配置问题：会话可能永不过期或超时时间过长' : 
        '会话超时配置合理：会话在适当时间后过期';
      
      this.testResults.sessionTimeout.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      this.testResults.sessionTimeout.push({
        type: 'Session Timeout',
        target: 'User profile endpoint',
        vulnerable: false,
        error: error.message,
        severity: 'ERROR',
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试并发会话
   */
  async testConcurrentSessions() {
    console.log('🔍 测试并发会话管理...');
    
    const credentials = this.generateTestCredentials();
    
    try {
      // 注册用户
      await this.registerTestUser(credentials);
      
      // 创建多个并发登录
      const loginPromises = [];
      for (let i = 0; i < 3; i++) {
        loginPromises.push(this.loginUser(credentials));
      }
      
      const loginResponses = await Promise.all(loginPromises);
      const tokens = loginResponses
        .filter(response => response.data?.data?.token)
        .map(response => response.data.data.token);
      
      if (tokens.length < 2) {
        throw new Error('无法创建足够的并发会话');
      }
      
      // 测试所有token是否都有效
      const validationPromises = tokens.map(token => 
        axios.get(`${this.baseURL}/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000,
          validateStatus: () => true
        })
      );
      
      const validationResponses = await Promise.all(validationPromises);
      const validTokens = validationResponses.filter(response => response.status === 200);
      
      const testCase = {
        type: 'Concurrent Sessions',
        target: 'Multiple login sessions',
        timestamp: new Date().toISOString(),
        totalTokens: tokens.length,
        validTokens: validTokens.length,
        uniqueTokens: new Set(tokens).size
      };
      
      // 分析并发会话管理
      const analysis = this.analyzeConcurrentSessions(tokens, validTokens.length);
      
      testCase.vulnerable = analysis.vulnerable;
      testCase.analysis = analysis.analysis;
      testCase.severity = analysis.vulnerable ? 'MEDIUM' : 'SAFE';
      testCase.description = analysis.vulnerable ? 
        '并发会话管理问题：允许过多并发会话或缺乏会话限制' : 
        '并发会话管理合理：适当限制了并发会话数量';
      
      this.testResults.concurrentSessions.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      this.testResults.concurrentSessions.push({
        type: 'Concurrent Sessions',
        target: 'Multiple login sessions',
        vulnerable: false,
        error: error.message,
        severity: 'ERROR',
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.total++;
    }
  }

  /**
   * 篡改JWT token
   */
  tamperToken(token, tamperType) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return token + 'TAMPERED';
      
      switch (tamperType) {
        case 'signature':
          return parts[0] + '.' + parts[1] + '.TAMPERED_SIGNATURE';
        case 'payload':
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          payload.userId = 999999; // 尝试提权
          payload.role = 'admin';
          const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
          return parts[0] + '.' + tamperedPayload + '.' + parts[2];
        case 'header':
          const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
          header.alg = 'none'; // 尝试绕过签名验证
          const tamperedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
          return tamperedHeader + '.' + parts[1] + '.' + parts[2];
        default:
          return token + 'TAMPERED';
      }
    } catch (error) {
      return token + 'TAMPERED';
    }
  }

  /**
   * 创建过期token
   */
  createExpiredToken() {
    try {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        userId: 1,
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1小时前
        exp: Math.floor(Date.now() / 1000) - 1800  // 30分钟前过期
      };
      
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      return `${encodedHeader}.${encodedPayload}.expired-signature`;
    } catch (error) {
      return 'expired-token-fallback';
    }
  }

  /**
   * 分析会话超时
   */
  analyzeSessionTimeout(immediateTest, delayedTest) {
    const analysis = {
      hasTimeout: false,
      analysis: []
    };
    
    // 如果立即测试失败，可能是其他问题
    if (immediateTest.status !== 200) {
      analysis.analysis.push('立即测试失败，可能存在其他认证问题');
      return analysis;
    }
    
    // 如果延迟测试也成功，说明没有超时或超时时间很长
    if (delayedTest.status === 200) {
      analysis.analysis.push('5秒后token仍然有效，可能缺乏适当的会话超时');
    } else {
      analysis.hasTimeout = true;
      analysis.analysis.push('会话在5秒内过期，超时机制正常');
    }
    
    return analysis;
  }

  /**
   * 分析并发会话
   */
  analyzeConcurrentSessions(tokens, validCount) {
    const analysis = {
      vulnerable: false,
      analysis: []
    };
    
    // 检查是否所有token都不同
    const uniqueTokens = new Set(tokens).size;
    if (uniqueTokens < tokens.length) {
      analysis.vulnerable = true;
      analysis.analysis.push('发现重复token，可能存在会话固定问题');
    }
    
    // 检查是否允许过多并发会话
    if (validCount >= 3) {
      analysis.vulnerable = true;
      analysis.analysis.push('允许过多并发会话，可能增加安全风险');
    }
    
    if (!analysis.vulnerable) {
      analysis.analysis.push('并发会话管理正常');
    }
    
    return analysis;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始会话劫持和身份验证绕过测试...');
    const startTime = Date.now();

    await this.testSessionFixation();
    await this.testSessionHijacking();
    await this.testSessionTimeout();
    await this.testConcurrentSessions();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 计算测试结果统计
    this.testResults.summary.duration = duration;
    this.testResults.summary.passRate = this.testResults.summary.total > 0 ? 
      (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(2) : 0;

    console.log('✅ 会话劫持和身份验证绕过测试完成');
    console.log(`📊 测试统计: 总计${this.testResults.summary.total}个测试，通过${this.testResults.summary.passed}个，失败${this.testResults.summary.failed}个`);
    console.log(`⚠️  发现${this.testResults.summary.critical}个严重安全问题`);
    console.log(`⏱️  测试耗时: ${duration}ms`);

    return this.testResults;
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    const report = {
      title: '会话劫持和身份验证绕过测试报告',
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      details: {
        sessionFixation: this.testResults.sessionFixation,
        sessionHijacking: this.testResults.sessionHijacking,
        tokenValidation: this.testResults.tokenValidation,
        authBypass: this.testResults.authBypass,
        sessionTimeout: this.testResults.sessionTimeout,
        concurrentSessions: this.testResults.concurrentSessions
      },
      recommendations: this.getSecurityRecommendations()
    };

    return report;
  }

  /**
   * 获取安全建议
   */
  getSecurityRecommendations() {
    const recommendations = [];

    if (this.testResults.summary.critical > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: '会话管理',
        title: '加强会话安全机制',
        description: '实施安全的会话管理和token验证',
        actions: [
          '每次登录生成新的会话token',
          '实施强签名验证，防止token篡改',
          '设置合理的token过期时间',
          '实施token黑名单机制',
          '验证token的完整性和有效性'
        ]
      });

      recommendations.push({
        priority: 'HIGH',
        category: '身份验证',
        title: '防止身份验证绕过',
        description: '加强身份验证机制，防止绕过攻击',
        actions: [
          '严格验证JWT签名',
          '检查token的过期时间',
          '验证token的发行者和受众',
          '实施多因素认证',
          '记录和监控异常认证尝试'
        ]
      });
    }

    recommendations.push({
      priority: 'HIGH',
      category: '会话超时',
      title: '配置适当的会话超时',
      description: '设置合理的会话超时策略',
      actions: [
        '设置适当的会话超时时间',
        '实施滑动会话过期',
        '在用户不活跃时自动注销',
        '提供会话延长机制',
        '清理过期会话数据'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '并发会话',
      title: '管理并发会话',
      description: '限制和管理用户的并发会话',
      actions: [
        '限制每个用户的最大并发会话数',
        '提供会话管理界面',
        '允许用户查看和终止活跃会话',
        '检测异常的并发登录',
        '实施设备绑定机制'
      ]
    });

    return recommendations;
  }
}

module.exports = SessionHijackTest;

// 如果直接运行此文件
if (require.main === module) {
  const test = new SessionHijackTest();
  test.runAllTests().then(results => {
    console.log('\n📋 测试报告:');
    console.log(JSON.stringify(test.generateReport(), null, 2));
  }).catch(error => {
    console.error('测试执行失败:', error);
  });
}