/**
 * CSRF攻击防护测试套件
 * 测试跨站请求伪造攻击防护机制
 */

const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class CSRFProtectionTest {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.frontendURL = 'http://localhost:3000';
    this.testResults = {
      tokenValidation: [],
      referrerCheck: [],
      sameOriginPolicy: [],
      stateChangingOperations: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
  }

  /**
   * 获取有效的认证token
   */
  async getValidAuthToken() {
    try {
      // 尝试登录获取token
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      }, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.data && response.data.data && response.data.data.token) {
        return response.data.data.token;
      }
      
      // 如果登录失败，使用mock token
      return 'mock-token-1';
    } catch (error) {
      return 'mock-token-1';
    }
  }

  /**
   * 测试CSRF token验证
   */
  async testCSRFTokenValidation() {
    console.log('🔍 测试CSRF token验证...');
    const authToken = await this.getValidAuthToken();
    
    const stateChangingEndpoints = [
      { method: 'POST', path: '/user/activate', data: {} },
      { method: 'POST', path: '/wallet/deposit', data: { amount: 100 } },
      { method: 'POST', path: '/wallet/withdraw', data: { amount: 50, address: 'test-address' } },
      { method: 'PUT', path: '/user/profile', data: { email: 'newemail@example.com' } },
      { method: 'DELETE', path: '/user/account', data: {} }
    ];

    for (const endpoint of stateChangingEndpoints) {
      try {
        const testCase = {
          type: 'CSRF Token Validation',
          target: `${endpoint.method} ${endpoint.path}`,
          timestamp: new Date().toISOString()
        };

        // 测试1: 不带CSRF token的请求
        const withoutTokenResponse = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          data: endpoint.data,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000,
          validateStatus: () => true
        });

        // 测试2: 带有无效CSRF token的请求
        const invalidTokenResponse = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          data: endpoint.data,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'invalid-csrf-token-12345'
          },
          timeout: 10000,
          validateStatus: () => true
        });

        // 测试3: 带有空CSRF token的请求
        const emptyTokenResponse = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.path}`,
          data: endpoint.data,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'X-CSRF-Token': ''
          },
          timeout: 10000,
          validateStatus: () => true
        });

        // 分析CSRF防护
        const isProtected = this.analyzeCSRFProtection(
          withoutTokenResponse, invalidTokenResponse, emptyTokenResponse
        );

        testCase.vulnerable = !isProtected.protected;
        testCase.withoutTokenStatus = withoutTokenResponse.status;
        testCase.invalidTokenStatus = invalidTokenResponse.status;
        testCase.emptyTokenStatus = emptyTokenResponse.status;
        testCase.protectionAnalysis = isProtected;
        testCase.severity = testCase.vulnerable ? 'HIGH' : 'SAFE';
        testCase.description = testCase.vulnerable ? 
          'CSRF漏洞：状态改变操作缺乏CSRF防护' : 
          'CSRF防护正常：正确验证了CSRF token';

        this.testResults.tokenValidation.push(testCase);
        this.testResults.summary.total++;
        
        if (testCase.vulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        this.testResults.tokenValidation.push({
          type: 'CSRF Token Validation',
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
   * 测试Referer头检查
   */
  async testReferrerCheck() {
    console.log('🔍 测试Referer头检查...');
    const authToken = await this.getValidAuthToken();
    
    const maliciousReferrers = [
      'http://evil.com',
      'https://attacker.example.com',
      'http://localhost:8080',
      'https://phishing-site.com',
      '',
      null
    ];

    for (const referrer of maliciousReferrers) {
      try {
        const testCase = {
          type: 'Referrer Check',
          referrer: referrer || 'null',
          target: 'POST /user/activate',
          timestamp: new Date().toISOString()
        };

        const headers = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        };

        if (referrer !== null) {
          headers['Referer'] = referrer;
        }

        const response = await axios.post(`${this.baseURL}/user/activate`, {}, {
          headers: headers,
          timeout: 10000,
          validateStatus: () => true
        });

        // 如果恶意referrer的请求成功，说明缺乏referrer检查
        const isVulnerable = response.status === 200 || response.status === 201;

        testCase.vulnerable = isVulnerable;
        testCase.statusCode = response.status;
        testCase.responseMessage = response.data?.message || '';
        testCase.severity = isVulnerable ? 'MEDIUM' : 'SAFE';
        testCase.description = isVulnerable ? 
          'Referrer检查缺失：恶意来源的请求被接受' : 
          'Referrer检查正常：拒绝了恶意来源的请求';

        this.testResults.referrerCheck.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable) {
          this.testResults.summary.failed++;
          if (referrer && referrer.includes('evil')) {
            this.testResults.summary.critical++;
          }
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        this.testResults.referrerCheck.push({
          type: 'Referrer Check',
          referrer: referrer || 'null',
          target: 'POST /user/activate',
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
   * 测试同源策略
   */
  async testSameOriginPolicy() {
    console.log('🔍 测试同源策略...');
    
    const crossOriginRequests = [
      { origin: 'http://evil.com', description: '恶意域名' },
      { origin: 'https://attacker.example.com', description: '攻击者域名' },
      { origin: 'http://localhost:8080', description: '不同端口' },
      { origin: 'https://localhost:3000', description: '不同协议' },
      { origin: 'http://subdomain.localhost:3000', description: '子域名' }
    ];

    for (const request of crossOriginRequests) {
      try {
        const testCase = {
          type: 'Same Origin Policy',
          origin: request.origin,
          description: request.description,
          target: 'CORS preflight check',
          timestamp: new Date().toISOString()
        };

        // 发送OPTIONS预检请求
        const preflightResponse = await axios.options(`${this.baseURL}/user/activate`, {
          headers: {
            'Origin': request.origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type,Authorization'
          },
          timeout: 10000,
          validateStatus: () => true
        });

        // 检查CORS头
        const corsHeaders = {
          'access-control-allow-origin': preflightResponse.headers['access-control-allow-origin'],
          'access-control-allow-methods': preflightResponse.headers['access-control-allow-methods'],
          'access-control-allow-headers': preflightResponse.headers['access-control-allow-headers'],
          'access-control-allow-credentials': preflightResponse.headers['access-control-allow-credentials']
        };

        // 分析CORS配置
        const isVulnerable = this.analyzeCORSConfiguration(corsHeaders, request.origin);

        testCase.vulnerable = isVulnerable.vulnerable;
        testCase.statusCode = preflightResponse.status;
        testCase.corsHeaders = corsHeaders;
        testCase.analysis = isVulnerable.analysis;
        testCase.severity = isVulnerable.vulnerable ? 'MEDIUM' : 'SAFE';
        testCase.description = isVulnerable.vulnerable ? 
          'CORS配置过于宽松：允许不安全的跨域请求' : 
          'CORS配置安全：正确限制了跨域访问';

        this.testResults.sameOriginPolicy.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable.vulnerable) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        this.testResults.sameOriginPolicy.push({
          type: 'Same Origin Policy',
          origin: request.origin,
          description: request.description,
          target: 'CORS preflight check',
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
   * 创建恶意CSRF攻击页面并测试
   */
  async testCSRFAttackSimulation() {
    console.log('🔍 模拟CSRF攻击...');
    const authToken = await this.getValidAuthToken();
    
    // 创建恶意HTML页面
    const maliciousHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>恶意CSRF攻击页面</title>
</head>
<body>
    <h1>看起来无害的页面</h1>
    <p>这是一个看起来正常的页面，但实际上包含了CSRF攻击代码。</p>
    
    <!-- 隐藏的表单攻击 -->
    <form id="csrfForm" action="${this.baseURL}/user/activate" method="POST" style="display:none;">
        <input type="hidden" name="action" value="activate">
    </form>
    
    <!-- JavaScript攻击 -->
    <script>
        // 尝试通过fetch发起CSRF攻击
        fetch('${this.baseURL}/user/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ${authToken}'
            },
            body: JSON.stringify({})
        }).then(response => {
            console.log('CSRF攻击响应:', response.status);
            document.getElementById('result').innerHTML = 
                'CSRF攻击' + (response.ok ? '成功' : '失败') + '，状态码: ' + response.status;
        }).catch(error => {
            console.log('CSRF攻击失败:', error);
            document.getElementById('result').innerHTML = 'CSRF攻击被阻止: ' + error.message;
        });
        
        // 尝试通过XMLHttpRequest发起攻击
        setTimeout(() => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '${this.baseURL}/wallet/deposit');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', 'Bearer ${authToken}');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    document.getElementById('xhr-result').innerHTML = 
                        'XHR CSRF攻击状态: ' + xhr.status;
                }
            };
            xhr.send(JSON.stringify({ amount: 1000 }));
        }, 1000);
        
        // 自动提交表单攻击
        setTimeout(() => {
            document.getElementById('csrfForm').submit();
        }, 2000);
    </script>
    
    <div id="result">等待CSRF攻击结果...</div>
    <div id="xhr-result">等待XHR攻击结果...</div>
</body>
</html>`;

    let browser;
    try {
      // 保存恶意HTML文件
      const maliciousFilePath = path.join(__dirname, 'csrf-attack.html');
      await fs.writeFile(maliciousFilePath, maliciousHTML);

      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });
      
      const page = await browser.newPage();
      
      // 监听网络请求
      const networkRequests = [];
      page.on('request', request => {
        if (request.url().includes(this.baseURL)) {
          networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers()
          });
        }
      });

      // 监听响应
      const networkResponses = [];
      page.on('response', response => {
        if (response.url().includes(this.baseURL)) {
          networkResponses.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers()
          });
        }
      });

      // 访问恶意页面
      await page.goto(`file://${maliciousFilePath}`, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      // 等待攻击执行
      await page.waitForTimeout(5000);

      // 获取页面结果
      const results = await page.evaluate(() => {
        return {
          fetchResult: document.getElementById('result')?.innerHTML || '',
          xhrResult: document.getElementById('xhr-result')?.innerHTML || ''
        };
      });

      const testCase = {
        type: 'CSRF Attack Simulation',
        target: 'Multiple endpoints',
        timestamp: new Date().toISOString(),
        networkRequests: networkRequests,
        networkResponses: networkResponses,
        pageResults: results
      };

      // 分析攻击结果
      const successfulAttacks = networkResponses.filter(r => r.status >= 200 && r.status < 300);
      const isVulnerable = successfulAttacks.length > 0;

      testCase.vulnerable = isVulnerable;
      testCase.successfulAttacks = successfulAttacks.length;
      testCase.totalAttempts = networkRequests.length;
      testCase.severity = isVulnerable ? 'CRITICAL' : 'SAFE';
      testCase.description = isVulnerable ? 
        `CSRF攻击成功：${successfulAttacks.length}个攻击请求成功执行` : 
        'CSRF防护有效：所有攻击请求被阻止';

      this.testResults.stateChangingOperations.push(testCase);
      this.testResults.summary.total++;
      
      if (isVulnerable) {
        this.testResults.summary.failed++;
        this.testResults.summary.critical++;
      } else {
        this.testResults.summary.passed++;
      }

      // 清理临时文件
      await fs.unlink(maliciousFilePath).catch(() => {});

    } catch (error) {
      this.testResults.stateChangingOperations.push({
        type: 'CSRF Attack Simulation',
        target: 'Multiple endpoints',
        vulnerable: false,
        error: error.message,
        severity: 'ERROR',
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.total++;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 分析CSRF防护
   */
  analyzeCSRFProtection(withoutToken, invalidToken, emptyToken) {
    const analysis = {
      protected: true,
      reasons: []
    };

    // 检查无token请求
    if (withoutToken.status >= 200 && withoutToken.status < 300) {
      analysis.protected = false;
      analysis.reasons.push('接受了没有CSRF token的请求');
    }

    // 检查无效token请求
    if (invalidToken.status >= 200 && invalidToken.status < 300) {
      analysis.protected = false;
      analysis.reasons.push('接受了无效CSRF token的请求');
    }

    // 检查空token请求
    if (emptyToken.status >= 200 && emptyToken.status < 300) {
      analysis.protected = false;
      analysis.reasons.push('接受了空CSRF token的请求');
    }

    // 检查错误消息
    const responses = [withoutToken, invalidToken, emptyToken];
    for (const response of responses) {
      if (response.data && typeof response.data === 'object') {
        const message = response.data.message || '';
        if (!message.toLowerCase().includes('csrf') && 
            !message.toLowerCase().includes('token') &&
            !message.toLowerCase().includes('forbidden')) {
          if (response.status >= 400) {
            analysis.reasons.push('错误消息未明确指出CSRF问题');
          }
        }
      }
    }

    if (analysis.reasons.length === 0 && analysis.protected) {
      analysis.reasons.push('正确拒绝了所有无效的CSRF请求');
    }

    return analysis;
  }

  /**
   * 分析CORS配置
   */
  analyzeCORSConfiguration(corsHeaders, origin) {
    const analysis = {
      vulnerable: false,
      analysis: []
    };

    const allowOrigin = corsHeaders['access-control-allow-origin'];
    const allowCredentials = corsHeaders['access-control-allow-credentials'];

    // 检查是否允许所有来源
    if (allowOrigin === '*') {
      analysis.vulnerable = true;
      analysis.analysis.push('允许所有来源访问 (Access-Control-Allow-Origin: *)');
    }

    // 检查是否允许恶意来源
    if (allowOrigin === origin && (origin.includes('evil') || origin.includes('attacker'))) {
      analysis.vulnerable = true;
      analysis.analysis.push(`明确允许恶意来源: ${origin}`);
    }

    // 检查凭据配置
    if (allowCredentials === 'true' && allowOrigin === '*') {
      analysis.vulnerable = true;
      analysis.analysis.push('危险配置：允许所有来源携带凭据');
    }

    // 检查方法配置
    const allowMethods = corsHeaders['access-control-allow-methods'];
    if (allowMethods && allowMethods.includes('*')) {
      analysis.vulnerable = true;
      analysis.analysis.push('允许所有HTTP方法');
    }

    if (analysis.analysis.length === 0) {
      analysis.analysis.push('CORS配置安全');
    }

    return analysis;
  }

  /**
   * 运行所有CSRF测试
   */
  async runAllTests() {
    console.log('🚀 开始CSRF防护测试...');
    const startTime = Date.now();

    await this.testCSRFTokenValidation();
    await this.testReferrerCheck();
    await this.testSameOriginPolicy();
    await this.testCSRFAttackSimulation();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 计算测试结果统计
    this.testResults.summary.duration = duration;
    this.testResults.summary.passRate = this.testResults.summary.total > 0 ? 
      (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(2) : 0;

    console.log('✅ CSRF防护测试完成');
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
      title: 'CSRF攻击防护测试报告',
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      details: {
        tokenValidation: this.testResults.tokenValidation,
        referrerCheck: this.testResults.referrerCheck,
        sameOriginPolicy: this.testResults.sameOriginPolicy,
        stateChangingOperations: this.testResults.stateChangingOperations
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
        category: 'CSRF防护',
        title: '实施CSRF token验证',
        description: '为所有状态改变操作实施CSRF token验证机制',
        actions: [
          '生成并验证CSRF token',
          '在表单中包含隐藏的CSRF token字段',
          '在AJAX请求中包含CSRF token头部',
          '验证token的有效性和时效性',
          '使用双重提交Cookie模式'
        ]
      });

      recommendations.push({
        priority: 'HIGH',
        category: 'CORS配置',
        title: '安全的CORS配置',
        description: '正确配置跨域资源共享策略',
        actions: [
          '避免使用通配符 (*) 作为允许来源',
          '明确指定允许的域名',
          '谨慎使用 Access-Control-Allow-Credentials',
          '限制允许的HTTP方法',
          '定期审查CORS配置'
        ]
      });
    }

    recommendations.push({
      priority: 'HIGH',
      category: 'Referrer检查',
      title: '实施Referrer验证',
      description: '检查请求来源的合法性',
      actions: [
        '验证Referer头部',
        '检查Origin头部',
        '实施同源策略检查',
        '记录可疑的跨域请求'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '用户交互',
      title: '增强用户确认机制',
      description: '对敏感操作增加用户确认步骤',
      actions: [
        '重要操作需要二次确认',
        '敏感操作需要重新输入密码',
        '使用验证码验证',
        '实施操作冷却期'
      ]
    });

    return recommendations;
  }
}

module.exports = CSRFProtectionTest;

// 如果直接运行此文件
if (require.main === module) {
  const test = new CSRFProtectionTest();
  test.runAllTests().then(results => {
    console.log('\n📋 测试报告:');
    console.log(JSON.stringify(test.generateReport(), null, 2));
  }).catch(error => {
    console.error('测试执行失败:', error);
  });
}