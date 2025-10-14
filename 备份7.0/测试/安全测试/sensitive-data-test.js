/**
 * 敏感信息泄露检测测试套件
 * 检测API响应、错误消息、日志等是否泄露敏感信息
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;

class SensitiveDataTest {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.testResults = {
      errorMessageLeakage: [],
      apiResponseLeakage: [],
      debugInfoLeakage: [],
      systemInfoLeakage: [],
      credentialLeakage: [],
      databaseLeakage: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
    
    // 敏感信息模式
    this.sensitivePatterns = {
      passwords: [
        /password["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /pwd["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /pass["\s]*[:=]["\s]*[^"\s,}]+/gi
      ],
      tokens: [
        /token["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /jwt["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /bearer["\s]+[a-zA-Z0-9\-_.]+/gi,
        /authorization["\s]*[:=]["\s]*[^"\s,}]+/gi
      ],
      keys: [
        /api[_-]?key["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /secret[_-]?key["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /private[_-]?key["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /access[_-]?key["\s]*[:=]["\s]*[^"\s,}]+/gi
      ],
      database: [
        /database["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /db[_-]?host["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /db[_-]?user["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /connection[_-]?string["\s]*[:=]["\s]*[^"\s,}]+/gi,
        /mongodb:\/\/[^"\s,}]+/gi,
        /mysql:\/\/[^"\s,}]+/gi
      ],
      system: [
        /\/etc\/passwd/gi,
        /\/etc\/shadow/gi,
        /c:\\windows\\system32/gi,
        /stack\s+trace/gi,
        /exception\s+in\s+thread/gi,
        /internal\s+server\s+error/gi
      ],
      emails: [
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      ],
      ips: [
        /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
      ],
      paths: [
        /[a-zA-Z]:\\[^"\s,}]+/gi,
        /\/[a-zA-Z0-9_\-./]+/gi
      ]
    };
    
    // 测试端点
    this.testEndpoints = [
      { method: 'GET', path: '/user/profile', requiresAuth: true },
      { method: 'POST', path: '/auth/login', requiresAuth: false },
      { method: 'POST', path: '/auth/register', requiresAuth: false },
      { method: 'GET', path: '/wallet/balance', requiresAuth: true },
      { method: 'POST', path: '/wallet/deposit', requiresAuth: true },
      { method: 'GET', path: '/tasks', requiresAuth: true },
      { method: 'GET', path: '/admin/users', requiresAuth: true },
      { method: 'GET', path: '/nonexistent', requiresAuth: false } // 测试404错误
    ];
  }

  /**
   * 生成测试用户凭据
   */
  generateTestCredentials() {
    return {
      email: `sensitivetest_${Date.now()}@example.com`,
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
   * 测试错误消息泄露
   */
  async testErrorMessageLeakage() {
    console.log('🔍 测试错误消息敏感信息泄露...');
    
    const errorTestCases = [
      {
        name: '无效登录凭据',
        request: {
          method: 'POST',
          path: '/auth/login',
          data: { email: 'nonexistent@example.com', password: 'wrongpassword' }
        }
      },
      {
        name: '无效注册数据',
        request: {
          method: 'POST',
          path: '/auth/register',
          data: { email: 'invalid-email', password: '123', inviteCode: 'INVALID' }
        }
      },
      {
        name: '无效token访问',
        request: {
          method: 'GET',
          path: '/user/profile',
          headers: { 'Authorization': 'Bearer invalid-token-12345' }
        }
      },
      {
        name: 'SQL注入尝试',
        request: {
          method: 'POST',
          path: '/auth/login',
          data: { email: "admin'; DROP TABLE users; --", password: 'test' }
        }
      },
      {
        name: '不存在的端点',
        request: {
          method: 'GET',
          path: '/nonexistent/endpoint'
        }
      },
      {
        name: '服务器错误触发',
        request: {
          method: 'POST',
          path: '/wallet/deposit',
          data: { amount: 'invalid_amount' },
          headers: { 'Authorization': 'Bearer mock-token-1' }
        }
      }
    ];
    
    for (const testCase of errorTestCases) {
      try {
        const result = {
          type: 'Error Message Leakage',
          testCase: testCase.name,
          timestamp: new Date().toISOString()
        };
        
        const response = await axios({
          method: testCase.request.method.toLowerCase(),
          url: `${this.baseURL}${testCase.request.path}`,
          data: testCase.request.data,
          headers: testCase.request.headers || {},
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 分析错误响应中的敏感信息
        const leakageAnalysis = this.analyzeSensitiveData(response.data, response.headers);
        
        result.statusCode = response.status;
        result.responseData = response.data;
        result.leakageFound = leakageAnalysis.found;
        result.sensitiveData = leakageAnalysis.sensitiveData;
        result.analysis = leakageAnalysis.analysis;
        result.severity = leakageAnalysis.found ? this.calculateSeverity(leakageAnalysis.sensitiveData) : 'SAFE';
        result.description = leakageAnalysis.found ? 
          `错误消息泄露敏感信息：${leakageAnalysis.analysis.join(', ')}` : 
          '错误消息安全：未发现敏感信息泄露';
        
        this.testResults.errorMessageLeakage.push(result);
        this.testResults.summary.total++;
        
        if (result.leakageFound) {
          this.testResults.summary.failed++;
          if (result.severity === 'CRITICAL') {
            this.testResults.summary.critical++;
          }
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.errorMessageLeakage.push({
          type: 'Error Message Leakage',
          testCase: testCase.name,
          leakageFound: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试API响应泄露
   */
  async testAPIResponseLeakage() {
    console.log('🔍 测试API响应敏感信息泄露...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    
    const token = loginResponse.data?.data?.token || 'mock-token-1';
    
    for (const endpoint of this.testEndpoints) {
      try {
        const result = {
          type: 'API Response Leakage',
          target: `${endpoint.method} ${endpoint.path}`,
          timestamp: new Date().toISOString()
        };
        
        const headers = {};
        if (endpoint.requiresAuth) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          headers: headers,
          data: endpoint.method !== 'GET' ? {} : undefined,
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 分析API响应中的敏感信息
        const leakageAnalysis = this.analyzeSensitiveData(response.data, response.headers);
        
        result.statusCode = response.status;
        result.responseSize = JSON.stringify(response.data || {}).length;
        result.leakageFound = leakageAnalysis.found;
        result.sensitiveData = leakageAnalysis.sensitiveData;
        result.analysis = leakageAnalysis.analysis;
        result.severity = leakageAnalysis.found ? this.calculateSeverity(leakageAnalysis.sensitiveData) : 'SAFE';
        result.description = leakageAnalysis.found ? 
          `API响应泄露敏感信息：${leakageAnalysis.analysis.join(', ')}` : 
          'API响应安全：未发现敏感信息泄露';
        
        this.testResults.apiResponseLeakage.push(result);
        this.testResults.summary.total++;
        
        if (result.leakageFound) {
          this.testResults.summary.failed++;
          if (result.severity === 'CRITICAL') {
            this.testResults.summary.critical++;
          }
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.apiResponseLeakage.push({
          type: 'API Response Leakage',
          target: `${endpoint.method} ${endpoint.path}`,
          leakageFound: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试调试信息泄露
   */
  async testDebugInfoLeakage() {
    console.log('🔍 测试调试信息泄露...');
    
    const debugTestCases = [
      {
        name: '带调试参数的请求',
        request: {
          method: 'GET',
          path: '/user/profile?debug=true&verbose=1&trace=on',
          headers: { 'Authorization': 'Bearer mock-token-1' }
        }
      },
      {
        name: '开发模式检测',
        request: {
          method: 'GET',
          path: '/user/profile',
          headers: { 
            'Authorization': 'Bearer mock-token-1',
            'X-Debug': 'true',
            'X-Environment': 'development'
          }
        }
      },
      {
        name: '异常触发调试信息',
        request: {
          method: 'POST',
          path: '/wallet/deposit',
          data: { amount: null, currency: undefined },
          headers: { 'Authorization': 'Bearer mock-token-1' }
        }
      },
      {
        name: '堆栈跟踪触发',
        request: {
          method: 'GET',
          path: '/user/profile',
          headers: { 'Authorization': 'Bearer ' + 'x'.repeat(1000) } // 超长token
        }
      }
    ];
    
    for (const testCase of debugTestCases) {
      try {
        const result = {
          type: 'Debug Info Leakage',
          testCase: testCase.name,
          timestamp: new Date().toISOString()
        };
        
        const response = await axios({
          method: testCase.request.method.toLowerCase(),
          url: `${this.baseURL}${testCase.request.path}`,
          data: testCase.request.data,
          headers: testCase.request.headers || {},
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 检查调试信息特征
        const debugAnalysis = this.analyzeDebugInfo(response.data, response.headers);
        
        result.statusCode = response.status;
        result.debugInfoFound = debugAnalysis.found;
        result.debugFeatures = debugAnalysis.features;
        result.analysis = debugAnalysis.analysis;
        result.severity = debugAnalysis.found ? 'MEDIUM' : 'SAFE';
        result.description = debugAnalysis.found ? 
          `发现调试信息泄露：${debugAnalysis.analysis.join(', ')}` : 
          '未发现调试信息泄露';
        
        this.testResults.debugInfoLeakage.push(result);
        this.testResults.summary.total++;
        
        if (result.debugInfoFound) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.debugInfoLeakage.push({
          type: 'Debug Info Leakage',
          testCase: testCase.name,
          debugInfoFound: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试系统信息泄露
   */
  async testSystemInfoLeakage() {
    console.log('🔍 测试系统信息泄露...');
    
    const systemTestCases = [
      {
        name: '服务器信息探测',
        request: {
          method: 'GET',
          path: '/user/profile',
          headers: { 'Authorization': 'Bearer mock-token-1' }
        }
      },
      {
        name: '版本信息探测',
        request: {
          method: 'OPTIONS',
          path: '/'
        }
      },
      {
        name: '错误页面信息',
        request: {
          method: 'GET',
          path: '/nonexistent/path/that/does/not/exist'
        }
      }
    ];
    
    for (const testCase of systemTestCases) {
      try {
        const result = {
          type: 'System Info Leakage',
          testCase: testCase.name,
          timestamp: new Date().toISOString()
        };
        
        const response = await axios({
          method: testCase.request.method.toLowerCase(),
          url: `${this.baseURL}${testCase.request.path}`,
          headers: testCase.request.headers || {},
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 分析系统信息泄露
        const systemAnalysis = this.analyzeSystemInfo(response.data, response.headers);
        
        result.statusCode = response.status;
        result.headers = response.headers;
        result.systemInfoFound = systemAnalysis.found;
        result.systemInfo = systemAnalysis.info;
        result.analysis = systemAnalysis.analysis;
        result.severity = systemAnalysis.found ? 'LOW' : 'SAFE';
        result.description = systemAnalysis.found ? 
          `发现系统信息泄露：${systemAnalysis.analysis.join(', ')}` : 
          '未发现系统信息泄露';
        
        this.testResults.systemInfoLeakage.push(result);
        this.testResults.summary.total++;
        
        if (result.systemInfoFound) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.systemInfoLeakage.push({
          type: 'System Info Leakage',
          testCase: testCase.name,
          systemInfoFound: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试凭据泄露
   */
  async testCredentialLeakage() {
    console.log('🔍 测试凭据信息泄露...');
    
    const credentials = this.generateTestCredentials();
    const registerResponse = await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    
    const credentialTests = [
      {
        name: '注册响应凭据检查',
        response: registerResponse
      },
      {
        name: '登录响应凭据检查',
        response: loginResponse
      }
    ];
    
    // 添加其他API响应检查
    if (loginResponse.data?.data?.token) {
      const token = loginResponse.data.data.token;
      
      try {
        const profileResponse = await axios.get(`${this.baseURL}/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000,
          validateStatus: () => true
        });
        
        credentialTests.push({
          name: '用户资料响应凭据检查',
          response: profileResponse
        });
      } catch (error) {
        // 忽略错误，继续其他测试
      }
    }
    
    for (const test of credentialTests) {
      try {
        const result = {
          type: 'Credential Leakage',
          testCase: test.name,
          timestamp: new Date().toISOString()
        };
        
        // 分析凭据泄露
        const credentialAnalysis = this.analyzeCredentialLeakage(test.response.data);
        
        result.statusCode = test.response.status;
        result.credentialFound = credentialAnalysis.found;
        result.credentials = credentialAnalysis.credentials;
        result.analysis = credentialAnalysis.analysis;
        result.severity = credentialAnalysis.found ? 'CRITICAL' : 'SAFE';
        result.description = credentialAnalysis.found ? 
          `发现凭据泄露：${credentialAnalysis.analysis.join(', ')}` : 
          '未发现凭据泄露';
        
        this.testResults.credentialLeakage.push(result);
        this.testResults.summary.total++;
        
        if (result.credentialFound) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.credentialLeakage.push({
          type: 'Credential Leakage',
          testCase: test.name,
          credentialFound: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试数据库信息泄露
   */
  async testDatabaseLeakage() {
    console.log('🔍 测试数据库信息泄露...');
    
    const dbTestCases = [
      {
        name: 'SQL错误信息检测',
        request: {
          method: 'POST',
          path: '/auth/login',
          data: { email: "test'; SELECT * FROM users; --", password: 'test' }
        }
      },
      {
        name: '数据库连接错误',
        request: {
          method: 'GET',
          path: '/user/profile',
          headers: { 'Authorization': 'Bearer mock-token-1' }
        }
      },
      {
        name: '数据库查询错误',
        request: {
          method: 'POST',
          path: '/wallet/deposit',
          data: { amount: "'; DROP TABLE wallet; --" },
          headers: { 'Authorization': 'Bearer mock-token-1' }
        }
      }
    ];
    
    for (const testCase of dbTestCases) {
      try {
        const result = {
          type: 'Database Leakage',
          testCase: testCase.name,
          timestamp: new Date().toISOString()
        };
        
        const response = await axios({
          method: testCase.request.method.toLowerCase(),
          url: `${this.baseURL}${testCase.request.path}`,
          data: testCase.request.data,
          headers: testCase.request.headers || {},
          timeout: 10000,
          validateStatus: () => true
        });
        
        // 分析数据库信息泄露
        const dbAnalysis = this.analyzeDatabaseLeakage(response.data);
        
        result.statusCode = response.status;
        result.databaseInfoFound = dbAnalysis.found;
        result.databaseInfo = dbAnalysis.info;
        result.analysis = dbAnalysis.analysis;
        result.severity = dbAnalysis.found ? 'HIGH' : 'SAFE';
        result.description = dbAnalysis.found ? 
          `发现数据库信息泄露：${dbAnalysis.analysis.join(', ')}` : 
          '未发现数据库信息泄露';
        
        this.testResults.databaseLeakage.push(result);
        this.testResults.summary.total++;
        
        if (result.databaseInfoFound) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }
        
      } catch (error) {
        this.testResults.databaseLeakage.push({
          type: 'Database Leakage',
          testCase: testCase.name,
          databaseInfoFound: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 分析敏感数据
   */
  analyzeSensitiveData(data, headers = {}) {
    const analysis = {
      found: false,
      sensitiveData: [],
      analysis: []
    };
    
    if (!data) return analysis;
    
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const headersStr = JSON.stringify(headers);
    const fullContent = dataStr + ' ' + headersStr;
    
    // 检查各种敏感信息模式
    for (const [category, patterns] of Object.entries(this.sensitivePatterns)) {
      for (const pattern of patterns) {
        const matches = fullContent.match(pattern);
        if (matches && matches.length > 0) {
          analysis.found = true;
          analysis.sensitiveData.push({
            category: category,
            matches: matches.slice(0, 3), // 只保留前3个匹配
            count: matches.length
          });
          analysis.analysis.push(`发现${category}信息泄露(${matches.length}处)`);
        }
      }
    }
    
    return analysis;
  }

  /**
   * 分析调试信息
   */
  analyzeDebugInfo(data, headers = {}) {
    const analysis = {
      found: false,
      features: [],
      analysis: []
    };
    
    if (!data) return analysis;
    
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const headersStr = JSON.stringify(headers);
    const fullContent = (dataStr + ' ' + headersStr).toLowerCase();
    
    // 检查调试信息特征
    const debugFeatures = [
      { name: 'stack_trace', patterns: ['stack trace', 'stacktrace', 'at \\w+\\.\\w+'] },
      { name: 'debug_mode', patterns: ['debug', 'development', 'dev mode'] },
      { name: 'verbose_errors', patterns: ['exception', 'error details', 'full error'] },
      { name: 'internal_paths', patterns: ['/src/', '/app/', '/home/', 'c:\\\\'] },
      { name: 'environment_vars', patterns: ['env:', 'environment:', 'config:'] },
      { name: 'memory_info', patterns: ['memory usage', 'heap', 'gc info'] }
    ];
    
    for (const feature of debugFeatures) {
      for (const pattern of feature.patterns) {
        if (new RegExp(pattern, 'i').test(fullContent)) {
          analysis.found = true;
          analysis.features.push(feature.name);
          analysis.analysis.push(`发现${feature.name}调试信息`);
          break;
        }
      }
    }
    
    return analysis;
  }

  /**
   * 分析系统信息
   */
  analyzeSystemInfo(data, headers = {}) {
    const analysis = {
      found: false,
      info: [],
      analysis: []
    };
    
    // 检查响应头中的系统信息
    const systemHeaders = ['server', 'x-powered-by', 'x-aspnet-version', 'x-runtime'];
    for (const header of systemHeaders) {
      if (headers[header]) {
        analysis.found = true;
        analysis.info.push({ type: 'header', name: header, value: headers[header] });
        analysis.analysis.push(`响应头泄露${header}信息`);
      }
    }
    
    // 检查响应体中的系统信息
    if (data) {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      const systemPatterns = [
        { name: 'node_version', pattern: /node\.js v[\d.]+/i },
        { name: 'express_version', pattern: /express[\s\/]v?[\d.]+/i },
        { name: 'os_info', pattern: /(windows|linux|darwin|ubuntu)[\s\d.]*/i },
        { name: 'server_path', pattern: /[a-z]:\\[^"'\s]+|\/[a-z][^"'\s]*/i }
      ];
      
      for (const pattern of systemPatterns) {
        const match = dataStr.match(pattern.pattern);
        if (match) {
          analysis.found = true;
          analysis.info.push({ type: 'content', name: pattern.name, value: match[0] });
          analysis.analysis.push(`响应内容泄露${pattern.name}信息`);
        }
      }
    }
    
    return analysis;
  }

  /**
   * 分析凭据泄露
   */
  analyzeCredentialLeakage(data) {
    const analysis = {
      found: false,
      credentials: [],
      analysis: []
    };
    
    if (!data) return analysis;
    
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // 检查明文密码
    const passwordPatterns = [
      /["']password["']\s*:\s*["'][^"']+["']/gi,
      /["']pwd["']\s*:\s*["'][^"']+["']/gi,
      /["']pass["']\s*:\s*["'][^"']+["']/gi
    ];
    
    for (const pattern of passwordPatterns) {
      const matches = dataStr.match(pattern);
      if (matches) {
        analysis.found = true;
        analysis.credentials.push({ type: 'password', matches: matches });
        analysis.analysis.push('发现明文密码');
      }
    }
    
    // 检查token泄露
    const tokenPatterns = [
      /["']token["']\s*:\s*["'][^"']{20,}["']/gi,
      /["']jwt["']\s*:\s*["'][^"']{20,}["']/gi,
      /["']access_token["']\s*:\s*["'][^"']{20,}["']/gi
    ];
    
    for (const pattern of tokenPatterns) {
      const matches = dataStr.match(pattern);
      if (matches) {
        analysis.found = true;
        analysis.credentials.push({ type: 'token', matches: matches });
        analysis.analysis.push('发现token泄露');
      }
    }
    
    // 检查API密钥
    const keyPatterns = [
      /["']api_key["']\s*:\s*["'][^"']+["']/gi,
      /["']secret_key["']\s*:\s*["'][^"']+["']/gi,
      /["']private_key["']\s*:\s*["'][^"']+["']/gi
    ];
    
    for (const pattern of keyPatterns) {
      const matches = dataStr.match(pattern);
      if (matches) {
        analysis.found = true;
        analysis.credentials.push({ type: 'api_key', matches: matches });
        analysis.analysis.push('发现API密钥泄露');
      }
    }
    
    return analysis;
  }

  /**
   * 分析数据库信息泄露
   */
  analyzeDatabaseLeakage(data) {
    const analysis = {
      found: false,
      info: [],
      analysis: []
    };
    
    if (!data) return analysis;
    
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // 检查数据库错误信息
    const dbErrorPatterns = [
      { name: 'mysql_error', pattern: /mysql.*error|you have an error in your sql syntax/i },
      { name: 'postgres_error', pattern: /postgresql.*error|syntax error at or near/i },
      { name: 'mongodb_error', pattern: /mongodb.*error|mongo.*exception/i },
      { name: 'sql_syntax', pattern: /sql syntax.*error|invalid sql/i },
      { name: 'table_info', pattern: /table.*doesn't exist|unknown column/i },
      { name: 'connection_info', pattern: /connection.*refused|can't connect to.*server/i }
    ];
    
    for (const pattern of dbErrorPatterns) {
      if (pattern.pattern.test(dataStr)) {
        analysis.found = true;
        analysis.info.push(pattern.name);
        analysis.analysis.push(`发现${pattern.name}信息`);
      }
    }
    
    // 检查数据库连接字符串
    const connectionPatterns = [
      /mongodb:\/\/[^"'\s]+/gi,
      /mysql:\/\/[^"'\s]+/gi,
      /postgresql:\/\/[^"'\s]+/gi,
      /jdbc:[^"'\s]+/gi
    ];
    
    for (const pattern of connectionPatterns) {
      const matches = dataStr.match(pattern);
      if (matches) {
        analysis.found = true;
        analysis.info.push('connection_string');
        analysis.analysis.push('发现数据库连接字符串');
      }
    }
    
    return analysis;
  }

  /**
   * 计算严重程度
   */
  calculateSeverity(sensitiveData) {
    const criticalTypes = ['passwords', 'tokens', 'keys'];
    const highTypes = ['database', 'system'];
    
    for (const data of sensitiveData) {
      if (criticalTypes.includes(data.category)) {
        return 'CRITICAL';
      }
    }
    
    for (const data of sensitiveData) {
      if (highTypes.includes(data.category)) {
        return 'HIGH';
      }
    }
    
    return 'MEDIUM';
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始敏感信息泄露检测测试...');
    const startTime = Date.now();

    await this.testErrorMessageLeakage();
    await this.testAPIResponseLeakage();
    await this.testDebugInfoLeakage();
    await this.testSystemInfoLeakage();
    await this.testCredentialLeakage();
    await this.testDatabaseLeakage();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 计算测试结果统计
    this.testResults.summary.duration = duration;
    this.testResults.summary.passRate = this.testResults.summary.total > 0 ? 
      (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(2) : 0;

    console.log('✅ 敏感信息泄露检测测试完成');
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
      title: '敏感信息泄露检测测试报告',
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      details: {
        errorMessageLeakage: this.testResults.errorMessageLeakage,
        apiResponseLeakage: this.testResults.apiResponseLeakage,
        debugInfoLeakage: this.testResults.debugInfoLeakage,
        systemInfoLeakage: this.testResults.systemInfoLeakage,
        credentialLeakage: this.testResults.credentialLeakage,
        databaseLeakage: this.testResults.databaseLeakage
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

    recommendations.push({
      priority: 'CRITICAL',
      category: '错误处理',
      title: '实施安全的错误处理机制',
      description: '防止错误消息泄露敏感信息',
      actions: [
        '使用统一的错误处理中间件',
        '返回通用的错误消息给客户端',
        '将详细错误信息记录到安全日志',
        '避免在错误消息中包含系统路径',
        '过滤掉数据库错误的详细信息'
      ]
    });

    recommendations.push({
      priority: 'CRITICAL',
      category: '响应过滤',
      title: '实施响应数据过滤',
      description: '确保API响应不包含敏感信息',
      actions: [
        '实施响应数据白名单机制',
        '过滤掉密码、token等敏感字段',
        '使用数据传输对象(DTO)控制响应结构',
        '实施字段级别的访问控制',
        '定期审查API响应内容'
      ]
    });

    recommendations.push({
      priority: 'HIGH',
      category: '调试信息',
      title: '禁用生产环境调试信息',
      description: '防止调试信息在生产环境泄露',
      actions: [
        '在生产环境禁用调试模式',
        '移除或保护调试端点',
        '过滤堆栈跟踪信息',
        '使用环境变量控制调试级别',
        '实施调试信息访问控制'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '系统信息',
      title: '隐藏系统信息',
      description: '防止系统信息泄露给攻击者',
      actions: [
        '移除或自定义Server响应头',
        '隐藏技术栈版本信息',
        '使用通用的404错误页面',
        '避免在响应中包含系统路径',
        '实施信息泄露检测机制'
      ]
    });

    recommendations.push({
      priority: 'HIGH',
      category: '凭据保护',
      title: '加强凭据保护',
      description: '确保凭据信息不会泄露',
      actions: [
        '永远不要在响应中返回密码',
        '使用短期token并定期轮换',
        '实施token作用域限制',
        '加密存储敏感凭据',
        '实施凭据泄露监控'
      ]
    });

    return recommendations;
  }
}

module.exports = SensitiveDataTest;

// 如果直接运行此文件
if (require.main === module) {
  const test = new SensitiveDataTest();
  test.runAllTests().then(results => {
    console.log('\n📋 测试报告:');
    console.log(JSON.stringify(test.generateReport(), null, 2));
  }).catch(error => {
    console.error('测试执行失败:', error);
  });
}