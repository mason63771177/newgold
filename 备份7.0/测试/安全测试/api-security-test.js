/**
 * API安全测试套件
 * 测试权限控制、参数篡改、越权访问等API安全问题
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;

class APISecurityTest {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.testResults = {
      authorizationBypass: [],
      parameterTampering: [],
      privilegeEscalation: [],
      dataExposure: [],
      rateLimit: [],
      inputValidation: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
    
    // API端点配置
    this.apiEndpoints = [
      { method: 'GET', path: '/user/profile', requiresAuth: true, sensitive: true },
      { method: 'PUT', path: '/user/profile', requiresAuth: true, sensitive: true },
      { method: 'POST', path: '/user/activate', requiresAuth: true, sensitive: false },
      { method: 'GET', path: '/wallet/balance', requiresAuth: true, sensitive: true },
      { method: 'POST', path: '/wallet/deposit', requiresAuth: true, sensitive: true },
      { method: 'POST', path: '/wallet/withdraw', requiresAuth: true, sensitive: true },
      { method: 'GET', path: '/tasks', requiresAuth: true, sensitive: false },
      { method: 'POST', path: '/tasks/complete', requiresAuth: true, sensitive: false },
      { method: 'GET', path: '/admin/users', requiresAuth: true, sensitive: true, adminOnly: true },
      { method: 'DELETE', path: '/admin/users/1', requiresAuth: true, sensitive: true, adminOnly: true }
    ];
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
   * 测试授权绕过
   */
  async testAuthorizationBypass() {
    console.log('🔍 测试授权绕过攻击...');
    
    for (const endpoint of this.apiEndpoints) {
      if (!endpoint.requiresAuth) continue;
      
      try {
        const testCase = {
          type: 'Authorization Bypass',
          target: `${endpoint.method} ${endpoint.path}`,
          timestamp: new Date().toISOString()
        };
        
        // 测试1: 无Authorization头
        const noAuthResponse = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          data: endpoint.method !== 'GET' ? {} : undefined,
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 测试2: 空Authorization头
        const emptyAuthResponse = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          headers: { 'Authorization': '' },
          data: endpoint.method !== 'GET' ? {} : undefined,
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 测试3: 无效Authorization头
        const invalidAuthResponse = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          headers: { 'Authorization': 'Bearer invalid-token-12345' },
          data: endpoint.method !== 'GET' ? {} : undefined,
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 分析授权绕过
        const bypassAnalysis = this.analyzeAuthorizationBypass(
          noAuthResponse, emptyAuthResponse, invalidAuthResponse
        );
        
        testCase.vulnerable = bypassAnalysis.vulnerable;
        testCase.noAuthStatus = noAuthResponse.status;
        testCase.emptyAuthStatus = emptyAuthResponse.status;
        testCase.invalidAuthStatus = invalidAuthResponse.status;
        testCase.analysis = bypassAnalysis.analysis;
        testCase.severity = bypassAnalysis.vulnerable ? 'CRITICAL' : 'SAFE';
        testCase.description = bypassAnalysis.vulnerable ? 
          '授权绕过漏洞：未经授权的请求被接受' : 
          '授权验证正常：正确拒绝了未授权请求';
        
        this.testResults.authorizationBypass.push(testCase);
        this.testResults.summary.total++;
        
        if (testCase.vulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.authorizationBypass.push({
          type: 'Authorization Bypass',
          target: `${endpoint.method} ${endpoint.path}`,
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
   * 测试参数篡改
   */
  async testParameterTampering() {
    console.log('🔍 测试参数篡改攻击...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    
    if (!loginResponse.data?.data?.token) {
      console.log('无法获取认证token，跳过参数篡改测试');
      return;
    }
    
    const token = loginResponse.data.data.token;
    
    // 测试不同类型的参数篡改
    const tamperingTests = [
      {
        endpoint: { method: 'POST', path: '/wallet/deposit' },
        originalData: { amount: 100 },
        tamperedData: { amount: -100 }, // 负数金额
        description: '负数金额注入'
      },
      {
        endpoint: { method: 'POST', path: '/wallet/deposit' },
        originalData: { amount: 100 },
        tamperedData: { amount: 999999999 }, // 超大金额
        description: '超大金额注入'
      },
      {
        endpoint: { method: 'POST', path: '/wallet/withdraw' },
        originalData: { amount: 50, address: 'user-address' },
        tamperedData: { amount: 50, address: 'admin-address', userId: 1 }, // 添加额外参数
        description: '额外参数注入'
      },
      {
        endpoint: { method: 'PUT', path: '/user/profile' },
        originalData: { email: 'new@example.com' },
        tamperedData: { email: 'new@example.com', role: 'admin', isActive: true }, // 权限提升
        description: '权限提升参数'
      },
      {
        endpoint: { method: 'POST', path: '/tasks/complete' },
        originalData: { taskId: 1 },
        tamperedData: { taskId: 1, reward: 1000, userId: 999 }, // 篡改奖励和用户ID
        description: '奖励和用户ID篡改'
      }
    ];
    
    for (const test of tamperingTests) {
      try {
        const testCase = {
          type: 'Parameter Tampering',
          target: `${test.endpoint.method} ${test.endpoint.path}`,
          description: test.description,
          timestamp: new Date().toISOString()
        };
        
        // 发送正常请求
        const normalResponse = await axios({
          method: test.endpoint.method.toLowerCase(),
          url: `${this.baseURL}${test.endpoint.path}`,
          headers: { 'Authorization': `Bearer ${token}` },
          data: test.originalData,
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 发送篡改请求
        const tamperedResponse = await axios({
          method: test.endpoint.method.toLowerCase(),
          url: `${this.baseURL}${test.endpoint.path}`,
          headers: { 'Authorization': `Bearer ${token}` },
          data: test.tamperedData,
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 分析参数篡改结果
        const tamperingAnalysis = this.analyzeParameterTampering(
          normalResponse, tamperedResponse, test
        );
        
        testCase.vulnerable = tamperingAnalysis.vulnerable;
        testCase.normalStatus = normalResponse.status;
        testCase.tamperedStatus = tamperedResponse.status;
        testCase.analysis = tamperingAnalysis.analysis;
        testCase.originalData = test.originalData;
        testCase.tamperedData = test.tamperedData;
        testCase.severity = tamperingAnalysis.vulnerable ? 'HIGH' : 'SAFE';
        testCase.description = tamperingAnalysis.vulnerable ? 
          `参数篡改漏洞：${test.description}成功` : 
          `参数验证正常：${test.description}被阻止`;
        
        this.testResults.parameterTampering.push(testCase);
        this.testResults.summary.total++;
        
        if (testCase.vulnerable) {
          this.testResults.summary.failed++;
          if (test.description.includes('权限') || test.description.includes('用户ID')) {
            this.testResults.summary.critical++;
          }
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.parameterTampering.push({
          type: 'Parameter Tampering',
          target: `${test.endpoint.method} ${test.endpoint.path}`,
          description: test.description,
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
   * 测试权限提升
   */
  async testPrivilegeEscalation() {
    console.log('🔍 测试权限提升攻击...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    
    if (!loginResponse.data?.data?.token) {
      console.log('无法获取认证token，跳过权限提升测试');
      return;
    }
    
    const token = loginResponse.data.data.token;
    
    // 测试访问管理员端点
    const adminEndpoints = this.apiEndpoints.filter(ep => ep.adminOnly);
    
    for (const endpoint of adminEndpoints) {
      try {
        const testCase = {
          type: 'Privilege Escalation',
          target: `${endpoint.method} ${endpoint.path}`,
          timestamp: new Date().toISOString()
        };
        
        // 使用普通用户token访问管理员端点
        const response = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          headers: { 'Authorization': `Bearer ${token}` },
          data: endpoint.method !== 'GET' ? {} : undefined,
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 分析权限提升结果
        const isVulnerable = response.status >= 200 && response.status < 300;
        
        testCase.vulnerable = isVulnerable;
        testCase.statusCode = response.status;
        testCase.responseMessage = response.data?.message || '';
        testCase.severity = isVulnerable ? 'CRITICAL' : 'SAFE';
        testCase.description = isVulnerable ? 
          '权限提升漏洞：普通用户可访问管理员功能' : 
          '权限控制正常：正确拒绝了权限提升尝试';
        
        this.testResults.privilegeEscalation.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.privilegeEscalation.push({
          type: 'Privilege Escalation',
          target: `${endpoint.method} ${endpoint.path}`,
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
   * 测试数据暴露
   */
  async testDataExposure() {
    console.log('🔍 测试数据暴露漏洞...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    
    if (!loginResponse.data?.data?.token) {
      console.log('无法获取认证token，跳过数据暴露测试');
      return;
    }
    
    const token = loginResponse.data.data.token;
    
    // 测试敏感数据端点
    const sensitiveEndpoints = this.apiEndpoints.filter(ep => ep.sensitive);
    
    for (const endpoint of sensitiveEndpoints) {
      try {
        const testCase = {
          type: 'Data Exposure',
          target: `${endpoint.method} ${endpoint.path}`,
          timestamp: new Date().toISOString()
        };
        
        const response = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          headers: { 'Authorization': `Bearer ${token}` },
          data: endpoint.method !== 'GET' ? {} : undefined,
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 分析响应中的敏感数据
        const exposureAnalysis = this.analyzeDataExposure(response);
        
        testCase.vulnerable = exposureAnalysis.vulnerable;
        testCase.statusCode = response.status;
        testCase.exposedData = exposureAnalysis.exposedData;
        testCase.analysis = exposureAnalysis.analysis;
        testCase.severity = exposureAnalysis.vulnerable ? 'MEDIUM' : 'SAFE';
        testCase.description = exposureAnalysis.vulnerable ? 
          '数据暴露风险：响应包含敏感信息' : 
          '数据保护良好：未发现敏感信息暴露';
        
        this.testResults.dataExposure.push(testCase);
        this.testResults.summary.total++;
        
        if (testCase.vulnerable) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.dataExposure.push({
          type: 'Data Exposure',
          target: `${endpoint.method} ${endpoint.path}`,
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
   * 测试速率限制
   */
  async testRateLimit() {
    console.log('🔍 测试API速率限制...');
    
    const testEndpoints = [
      { method: 'POST', path: '/auth/login', data: { email: 'test@example.com', password: 'wrong' } },
      { method: 'POST', path: '/auth/register', data: { email: 'spam@example.com', password: 'test123' } }
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const testCase = {
          type: 'Rate Limit',
          target: `${endpoint.method} ${endpoint.path}`,
          timestamp: new Date().toISOString()
        };
        
        const requests = [];
        const requestCount = 20; // 发送20个快速请求
        
        // 快速发送多个请求
        for (let i = 0; i < requestCount; i++) {
          requests.push(
            axios({
              method: endpoint.method.toLowerCase(),
              url: `${this.baseURL}${endpoint.path}`,
              data: { ...endpoint.data, email: `test${i}@example.com` },
              timeout: 5000,
              validateStatus: () => true
            })
          );
        }
        
        const startTime = Date.now();
        const responses = await Promise.all(requests);
        const endTime = Date.now();
        
        // 分析速率限制
        const rateLimitAnalysis = this.analyzeRateLimit(responses, endTime - startTime);
        
        testCase.vulnerable = rateLimitAnalysis.vulnerable;
        testCase.totalRequests = requestCount;
        testCase.successfulRequests = rateLimitAnalysis.successfulRequests;
        testCase.blockedRequests = rateLimitAnalysis.blockedRequests;
        testCase.duration = endTime - startTime;
        testCase.analysis = rateLimitAnalysis.analysis;
        testCase.severity = rateLimitAnalysis.vulnerable ? 'MEDIUM' : 'SAFE';
        testCase.description = rateLimitAnalysis.vulnerable ? 
          '速率限制缺失：允许过多并发请求' : 
          '速率限制正常：正确限制了请求频率';
        
        this.testResults.rateLimit.push(testCase);
        this.testResults.summary.total++;
        
        if (testCase.vulnerable) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.rateLimit.push({
          type: 'Rate Limit',
          target: `${endpoint.method} ${endpoint.path}`,
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
   * 测试输入验证
   */
  async testInputValidation() {
    console.log('🔍 测试输入验证...');
    
    const maliciousInputs = [
      { type: 'SQL注入', value: "'; DROP TABLE users; --" },
      { type: 'XSS', value: '<script>alert("XSS")</script>' },
      { type: '命令注入', value: '; cat /etc/passwd' },
      { type: '路径遍历', value: '../../../etc/passwd' },
      { type: '超长字符串', value: 'A'.repeat(10000) },
      { type: 'NULL字节', value: 'test\x00.txt' },
      { type: 'Unicode绕过', value: 'admin\u202euser' }
    ];
    
    const inputEndpoints = [
      { method: 'POST', path: '/auth/register', field: 'email' },
      { method: 'POST', path: '/auth/login', field: 'email' },
      { method: 'PUT', path: '/user/profile', field: 'email', requiresAuth: true }
    ];
    
    for (const endpoint of inputEndpoints) {
      for (const input of maliciousInputs) {
        try {
          const testCase = {
            type: 'Input Validation',
            target: `${endpoint.method} ${endpoint.path}`,
            inputType: input.type,
            timestamp: new Date().toISOString()
          };
          
          const data = {};
          data[endpoint.field] = input.value;
          if (endpoint.path.includes('register')) {
            data.password = 'test123';
            data.inviteCode = 'TEST';
          } else if (endpoint.path.includes('login')) {
            data.password = 'test123';
          }
          
          const headers = {};
          if (endpoint.requiresAuth) {
            // 使用mock token进行测试
            headers['Authorization'] = 'Bearer mock-token-1';
          }
          
          const response = await axios({
            method: endpoint.method.toLowerCase(),
            url: `${this.baseURL}${endpoint.path}`,
            headers: headers,
            data: data,
            timeout: 10000,
            validateStatus: () => true
          });
          
          // 分析输入验证结果
          const validationAnalysis = this.analyzeInputValidation(response, input);
          
          testCase.vulnerable = validationAnalysis.vulnerable;
          testCase.statusCode = response.status;
          testCase.responseMessage = response.data?.message || '';
          testCase.analysis = validationAnalysis.analysis;
          testCase.severity = validationAnalysis.vulnerable ? 'HIGH' : 'SAFE';
          testCase.description = validationAnalysis.vulnerable ? 
            `输入验证漏洞：${input.type}未被正确过滤` : 
            `输入验证正常：${input.type}被正确拒绝`;
          
          this.testResults.inputValidation.push(testCase);
          this.testResults.summary.total++;
          
          if (testCase.vulnerable) {
            this.testResults.summary.failed++;
            if (input.type.includes('SQL') || input.type.includes('命令')) {
              this.testResults.summary.critical++;
            }
          } else {
            this.testResults.summary.passed++;
          }
          
        } catch (error) {
          this.testResults.inputValidation.push({
            type: 'Input Validation',
            target: `${endpoint.method} ${endpoint.path}`,
            inputType: input.type,
            vulnerable: false,
            error: error.message,
            severity: 'ERROR',
            timestamp: new Date().toISOString()
          });
          this.testResults.summary.total++;
        }
      }
    }
  }

  /**
   * 分析授权绕过
   */
  analyzeAuthorizationBypass(noAuth, emptyAuth, invalidAuth) {
    const analysis = {
      vulnerable: false,
      analysis: []
    };
    
    // 检查无授权请求
    if (noAuth.status >= 200 && noAuth.status < 300) {
      analysis.vulnerable = true;
      analysis.analysis.push('接受了无Authorization头的请求');
    }
    
    // 检查空授权请求
    if (emptyAuth.status >= 200 && emptyAuth.status < 300) {
      analysis.vulnerable = true;
      analysis.analysis.push('接受了空Authorization头的请求');
    }
    
    // 检查无效授权请求
    if (invalidAuth.status >= 200 && invalidAuth.status < 300) {
      analysis.vulnerable = true;
      analysis.analysis.push('接受了无效token的请求');
    }
    
    if (!analysis.vulnerable) {
      analysis.analysis.push('正确拒绝了所有未授权请求');
    }
    
    return analysis;
  }

  /**
   * 分析参数篡改
   */
  analyzeParameterTampering(normal, tampered, test) {
    const analysis = {
      vulnerable: false,
      analysis: []
    };
    
    // 如果篡改请求成功，可能存在参数验证问题
    if (tampered.status >= 200 && tampered.status < 300) {
      analysis.vulnerable = true;
      analysis.analysis.push(`篡改请求成功：${test.description}`);
    }
    
    // 检查响应差异
    if (normal.status !== tampered.status) {
      analysis.analysis.push(`状态码差异：正常${normal.status} vs 篡改${tampered.status}`);
    }
    
    // 检查响应内容
    if (tampered.data && typeof tampered.data === 'object') {
      const responseStr = JSON.stringify(tampered.data);
      if (responseStr.includes('admin') || responseStr.includes('privilege')) {
        analysis.vulnerable = true;
        analysis.analysis.push('响应包含权限相关信息');
      }
    }
    
    if (!analysis.vulnerable) {
      analysis.analysis.push('参数验证正常，篡改被阻止');
    }
    
    return analysis;
  }

  /**
   * 分析数据暴露
   */
  analyzeDataExposure(response) {
    const analysis = {
      vulnerable: false,
      exposedData: [],
      analysis: []
    };
    
    if (response.data && typeof response.data === 'object') {
      const responseStr = JSON.stringify(response.data).toLowerCase();
      
      // 检查敏感字段
      const sensitiveFields = [
        'password', 'token', 'secret', 'key', 'hash',
        'salt', 'private', 'internal', 'debug'
      ];
      
      for (const field of sensitiveFields) {
        if (responseStr.includes(field)) {
          analysis.vulnerable = true;
          analysis.exposedData.push(field);
        }
      }
      
      // 检查详细错误信息
      if (responseStr.includes('stack') || responseStr.includes('trace')) {
        analysis.vulnerable = true;
        analysis.exposedData.push('stack trace');
      }
      
      if (analysis.vulnerable) {
        analysis.analysis.push(`发现敏感数据：${analysis.exposedData.join(', ')}`);
      } else {
        analysis.analysis.push('未发现敏感数据暴露');
      }
    }
    
    return analysis;
  }

  /**
   * 分析速率限制
   */
  analyzeRateLimit(responses, duration) {
    const analysis = {
      vulnerable: false,
      successfulRequests: 0,
      blockedRequests: 0,
      analysis: []
    };
    
    // 统计成功和被阻止的请求
    for (const response of responses) {
      if (response.status >= 200 && response.status < 300) {
        analysis.successfulRequests++;
      } else if (response.status === 429) {
        analysis.blockedRequests++;
      }
    }
    
    // 如果大部分请求都成功，可能缺乏速率限制
    const successRate = analysis.successfulRequests / responses.length;
    if (successRate > 0.8) {
      analysis.vulnerable = true;
      analysis.analysis.push(`${(successRate * 100).toFixed(1)}%的请求成功，可能缺乏速率限制`);
    }
    
    // 检查请求处理速度
    const avgResponseTime = duration / responses.length;
    if (avgResponseTime < 50 && analysis.successfulRequests > 15) {
      analysis.vulnerable = true;
      analysis.analysis.push('请求处理过快，未实施适当的速率控制');
    }
    
    if (!analysis.vulnerable) {
      analysis.analysis.push('速率限制配置合理');
    }
    
    return analysis;
  }

  /**
   * 分析输入验证
   */
  analyzeInputValidation(response, input) {
    const analysis = {
      vulnerable: false,
      analysis: []
    };
    
    // 如果恶意输入被接受（状态码200），可能存在验证问题
    if (response.status >= 200 && response.status < 300) {
      analysis.vulnerable = true;
      analysis.analysis.push(`恶意输入被接受：${input.type}`);
    }
    
    // 检查错误消息是否暴露了系统信息
    if (response.data && typeof response.data === 'object') {
      const responseStr = JSON.stringify(response.data).toLowerCase();
      if (responseStr.includes('sql') || responseStr.includes('database') || 
          responseStr.includes('mysql') || responseStr.includes('error')) {
        analysis.vulnerable = true;
        analysis.analysis.push('错误消息暴露了系统信息');
      }
    }
    
    // 检查是否返回了详细的验证错误
    if (response.status === 400 && response.data?.message) {
      analysis.analysis.push('输入验证正常，返回了适当的错误信息');
    }
    
    if (!analysis.vulnerable && response.status >= 400) {
      analysis.analysis.push('输入验证正常，恶意输入被拒绝');
    }
    
    return analysis;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始API安全测试...');
    const startTime = Date.now();

    await this.testAuthorizationBypass();
    await this.testParameterTampering();
    await this.testPrivilegeEscalation();
    await this.testDataExposure();
    await this.testRateLimit();
    await this.testInputValidation();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 计算测试结果统计
    this.testResults.summary.duration = duration;
    this.testResults.summary.passRate = this.testResults.summary.total > 0 ? 
      (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(2) : 0;

    console.log('✅ API安全测试完成');
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
      title: 'API安全测试报告',
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      details: {
        authorizationBypass: this.testResults.authorizationBypass,
        parameterTampering: this.testResults.parameterTampering,
        privilegeEscalation: this.testResults.privilegeEscalation,
        dataExposure: this.testResults.dataExposure,
        rateLimit: this.testResults.rateLimit,
        inputValidation: this.testResults.inputValidation
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
        category: 'API授权',
        title: '加强API授权验证',
        description: '实施严格的API授权和身份验证机制',
        actions: [
          '验证所有API请求的Authorization头',
          '实施JWT token验证',
          '检查token的有效性和过期时间',
          '实施基于角色的访问控制(RBAC)',
          '记录和监控未授权访问尝试'
        ]
      });

      recommendations.push({
        priority: 'HIGH',
        category: '参数验证',
        title: '实施严格的参数验证',
        description: '验证和清理所有输入参数',
        actions: [
          '验证参数类型和格式',
          '实施参数白名单验证',
          '检查参数值的合理范围',
          '防止参数污染攻击',
          '使用参数验证中间件'
        ]
      });
    }

    recommendations.push({
      priority: 'HIGH',
      category: '权限控制',
      title: '防止权限提升',
      description: '实施细粒度的权限控制机制',
      actions: [
        '验证用户权限级别',
        '实施最小权限原则',
        '分离管理员和普通用户接口',
        '定期审查权限配置',
        '实施权限变更日志'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '数据保护',
      title: '防止敏感数据暴露',
      description: '保护API响应中的敏感信息',
      actions: [
        '过滤响应中的敏感字段',
        '实施数据脱敏',
        '避免在错误消息中暴露系统信息',
        '使用统一的错误处理机制',
        '定期审查API响应内容'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '速率限制',
      title: '实施API速率限制',
      description: '防止API滥用和DDoS攻击',
      actions: [
        '为不同端点设置适当的速率限制',
        '实施基于IP和用户的限制',
        '使用滑动窗口算法',
        '提供速率限制状态信息',
        '监控和调整限制策略'
      ]
    });

    return recommendations;
  }
}

module.exports = APISecurityTest;

// 如果直接运行此文件
if (require.main === module) {
  const test = new APISecurityTest();
  test.runAllTests().then(results => {
    console.log('\n📋 测试报告:');
    console.log(JSON.stringify(test.generateReport(), null, 2));
  }).catch(error => {
    console.error('测试执行失败:', error);
  });
}