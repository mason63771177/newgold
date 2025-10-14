/**
 * 暴力破解防护测试套件
 * 测试登录暴力破解、密码爆破、账户锁定等安全防护机制
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;

class BruteForceTest {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.testResults = {
      loginBruteForce: [],
      passwordBruteForce: [],
      accountLockout: [],
      rateLimiting: [],
      captchaBypass: [],
      sessionBruteForce: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
    
    // 常用弱密码字典
    this.commonPasswords = [
      '123456', 'password', '123456789', '12345678', '12345',
      '1234567', '1234567890', 'qwerty', 'abc123', 'Password',
      'password123', 'admin', 'root', '123123', 'test',
      'user', 'login', 'welcome', '000000', '111111'
    ];
    
    // 常用用户名字典
    this.commonUsernames = [
      'admin', 'administrator', 'root', 'user', 'test',
      'guest', 'demo', 'sa', 'operator', 'manager',
      'support', 'service', 'system', 'public', 'anonymous'
    ];
  }

  /**
   * 生成测试用户凭据
   */
  generateTestCredentials() {
    return {
      email: `brutetest_${Date.now()}@example.com`,
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
   * 测试登录暴力破解防护
   */
  async testLoginBruteForce() {
    console.log('🔍 测试登录暴力破解防护...');
    
    // 注册一个测试用户
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    
    const testCase = {
      type: 'Login Brute Force',
      target: 'POST /auth/login',
      timestamp: new Date().toISOString()
    };
    
    try {
      const attempts = [];
      const maxAttempts = 15; // 尝试15次错误登录
      const startTime = Date.now();
      
      // 使用正确的用户名但错误的密码进行暴力破解
      for (let i = 0; i < maxAttempts; i++) {
        const wrongPassword = `wrong_password_${i}`;
        
        const response = await axios.post(`${this.baseURL}/auth/login`, {
          email: credentials.email,
          password: wrongPassword
        }, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        attempts.push({
          attempt: i + 1,
          password: wrongPassword,
          status: response.status,
          message: response.data?.message || '',
          timestamp: Date.now() - startTime
        });
        
        // 如果被阻止，记录并停止
        if (response.status === 429 || response.status === 423) {
          console.log(`第${i + 1}次尝试被阻止，状态码: ${response.status}`);
          break;
        }
        
        // 短暂延迟避免过快请求
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const endTime = Date.now();
      
      // 分析暴力破解防护效果
      const analysis = this.analyzeBruteForceProtection(attempts, endTime - startTime);
      
      testCase.attempts = attempts;
      testCase.totalAttempts = attempts.length;
      testCase.blockedAttempts = attempts.filter(a => a.status === 429 || a.status === 423).length;
      testCase.successfulAttempts = attempts.filter(a => a.status >= 200 && a.status < 300).length;
      testCase.duration = endTime - startTime;
      testCase.vulnerable = analysis.vulnerable;
      testCase.analysis = analysis.analysis;
      testCase.severity = analysis.vulnerable ? 'CRITICAL' : 'SAFE';
      testCase.description = analysis.vulnerable ? 
        '暴力破解防护不足：允许过多登录尝试' : 
        '暴力破解防护良好：正确限制了登录尝试';
      
      this.testResults.loginBruteForce.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
        this.testResults.summary.critical++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      testCase.vulnerable = false;
      testCase.error = error.message;
      testCase.severity = 'ERROR';
      this.testResults.loginBruteForce.push(testCase);
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试密码字典攻击防护
   */
  async testPasswordBruteForce() {
    console.log('🔍 测试密码字典攻击防护...');
    
    // 注册一个使用弱密码的测试用户
    const weakCredentials = {
      email: `weakpass_${Date.now()}@example.com`,
      password: '123456', // 使用弱密码
      inviteCode: 'TEST123'
    };
    
    await this.registerTestUser(weakCredentials);
    
    const testCase = {
      type: 'Password Dictionary Attack',
      target: 'POST /auth/login',
      timestamp: new Date().toISOString()
    };
    
    try {
      const attempts = [];
      const startTime = Date.now();
      
      // 使用常用密码字典进行攻击
      for (let i = 0; i < this.commonPasswords.length && i < 10; i++) {
        const password = this.commonPasswords[i];
        
        const response = await axios.post(`${this.baseURL}/auth/login`, {
          email: weakCredentials.email,
          password: password
        }, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        attempts.push({
          attempt: i + 1,
          password: password,
          status: response.status,
          message: response.data?.message || '',
          success: response.status >= 200 && response.status < 300,
          timestamp: Date.now() - startTime
        });
        
        // 如果成功破解，记录
        if (response.status >= 200 && response.status < 300) {
          console.log(`密码破解成功！密码: ${password}`);
          break;
        }
        
        // 如果被阻止，记录并停止
        if (response.status === 429 || response.status === 423) {
          console.log(`第${i + 1}次尝试被阻止，状态码: ${response.status}`);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const endTime = Date.now();
      
      // 分析密码破解结果
      const successfulAttempt = attempts.find(a => a.success);
      const blockedAttempts = attempts.filter(a => a.status === 429 || a.status === 423).length;
      
      testCase.attempts = attempts;
      testCase.totalAttempts = attempts.length;
      testCase.successfulCrack = !!successfulAttempt;
      testCase.crackedPassword = successfulAttempt?.password || null;
      testCase.blockedAttempts = blockedAttempts;
      testCase.duration = endTime - startTime;
      testCase.vulnerable = successfulAttempt && blockedAttempts < 3;
      testCase.analysis = this.analyzePasswordBruteForce(attempts, successfulAttempt, blockedAttempts);
      testCase.severity = testCase.vulnerable ? 'CRITICAL' : 'SAFE';
      testCase.description = testCase.vulnerable ? 
        '密码字典攻击成功：弱密码被破解且缺乏防护' : 
        '密码字典攻击防护良好：攻击被阻止或密码足够强';
      
      this.testResults.passwordBruteForce.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
        this.testResults.summary.critical++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      testCase.vulnerable = false;
      testCase.error = error.message;
      testCase.severity = 'ERROR';
      this.testResults.passwordBruteForce.push(testCase);
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试账户锁定机制
   */
  async testAccountLockout() {
    console.log('🔍 测试账户锁定机制...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    
    const testCase = {
      type: 'Account Lockout',
      target: 'POST /auth/login',
      timestamp: new Date().toISOString()
    };
    
    try {
      const attempts = [];
      const maxAttempts = 10;
      const startTime = Date.now();
      
      // 连续错误登录尝试
      for (let i = 0; i < maxAttempts; i++) {
        const response = await axios.post(`${this.baseURL}/auth/login`, {
          email: credentials.email,
          password: `wrong_password_${i}`
        }, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        attempts.push({
          attempt: i + 1,
          status: response.status,
          message: response.data?.message || '',
          locked: response.status === 423,
          timestamp: Date.now() - startTime
        });
        
        // 如果账户被锁定，测试是否能用正确密码登录
        if (response.status === 423) {
          console.log(`账户在第${i + 1}次尝试后被锁定`);
          
          // 尝试用正确密码登录
          const correctPasswordResponse = await axios.post(`${this.baseURL}/auth/login`, {
            email: credentials.email,
            password: credentials.password
          }, {
            timeout: 10000,
            validateStatus: () => true
          });
          
          attempts.push({
            attempt: i + 2,
            status: correctPasswordResponse.status,
            message: correctPasswordResponse.data?.message || '',
            correctPassword: true,
            stillLocked: correctPasswordResponse.status === 423,
            timestamp: Date.now() - startTime
          });
          
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const endTime = Date.now();
      
      // 分析账户锁定机制
      const lockoutAnalysis = this.analyzeAccountLockout(attempts);
      
      testCase.attempts = attempts;
      testCase.totalAttempts = attempts.length;
      testCase.lockoutTriggered = lockoutAnalysis.lockoutTriggered;
      testCase.lockoutAttempt = lockoutAnalysis.lockoutAttempt;
      testCase.correctPasswordBlocked = lockoutAnalysis.correctPasswordBlocked;
      testCase.duration = endTime - startTime;
      testCase.vulnerable = lockoutAnalysis.vulnerable;
      testCase.analysis = lockoutAnalysis.analysis;
      testCase.severity = lockoutAnalysis.vulnerable ? 'HIGH' : 'SAFE';
      testCase.description = lockoutAnalysis.vulnerable ? 
        '账户锁定机制不足：未能有效防止暴力破解' : 
        '账户锁定机制良好：有效阻止了暴力破解尝试';
      
      this.testResults.accountLockout.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      testCase.vulnerable = false;
      testCase.error = error.message;
      testCase.severity = 'ERROR';
      this.testResults.accountLockout.push(testCase);
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试速率限制绕过
   */
  async testRateLimitingBypass() {
    console.log('🔍 测试速率限制绕过...');
    
    const testCase = {
      type: 'Rate Limiting Bypass',
      target: 'POST /auth/login',
      timestamp: new Date().toISOString()
    };
    
    try {
      const bypassMethods = [
        { name: 'IP轮换', headers: { 'X-Forwarded-For': '192.168.1.100' } },
        { name: 'User-Agent变更', headers: { 'User-Agent': 'Mozilla/5.0 (Different Browser)' } },
        { name: 'X-Real-IP伪造', headers: { 'X-Real-IP': '10.0.0.100' } },
        { name: 'X-Originating-IP伪造', headers: { 'X-Originating-IP': '172.16.0.100' } }
      ];
      
      const results = [];
      
      for (const method of bypassMethods) {
        const attempts = [];
        const startTime = Date.now();
        
        // 快速发送多个请求测试绕过
        for (let i = 0; i < 8; i++) {
          const response = await axios.post(`${this.baseURL}/auth/login`, {
            email: 'nonexistent@example.com',
            password: 'wrong_password'
          }, {
            headers: method.headers,
            timeout: 10000,
            validateStatus: () => true
          });
          
          attempts.push({
            attempt: i + 1,
            status: response.status,
            blocked: response.status === 429,
            timestamp: Date.now() - startTime
          });
          
          if (i < 7) await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const blockedCount = attempts.filter(a => a.blocked).length;
        const successCount = attempts.filter(a => a.status !== 429).length;
        
        results.push({
          method: method.name,
          attempts: attempts,
          blockedCount: blockedCount,
          successCount: successCount,
          bypassSuccessful: successCount > 5 // 如果超过5个请求成功，认为绕过了限制
        });
      }
      
      // 分析绕过结果
      const bypassAnalysis = this.analyzeRateLimitBypass(results);
      
      testCase.bypassMethods = results;
      testCase.vulnerable = bypassAnalysis.vulnerable;
      testCase.successfulBypasses = bypassAnalysis.successfulBypasses;
      testCase.analysis = bypassAnalysis.analysis;
      testCase.severity = bypassAnalysis.vulnerable ? 'HIGH' : 'SAFE';
      testCase.description = bypassAnalysis.vulnerable ? 
        '速率限制可被绕过：存在绕过方法' : 
        '速率限制防护良好：绕过尝试失败';
      
      this.testResults.rateLimiting.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      testCase.vulnerable = false;
      testCase.error = error.message;
      testCase.severity = 'ERROR';
      this.testResults.rateLimiting.push(testCase);
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试验证码绕过
   */
  async testCaptchaBypass() {
    console.log('🔍 测试验证码绕过...');
    
    const testCase = {
      type: 'CAPTCHA Bypass',
      target: 'POST /auth/login',
      timestamp: new Date().toISOString()
    };
    
    try {
      // 先触发验证码（通过多次错误登录）
      const triggerAttempts = [];
      for (let i = 0; i < 5; i++) {
        const response = await axios.post(`${this.baseURL}/auth/login`, {
          email: 'trigger@example.com',
          password: 'wrong_password'
        }, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        triggerAttempts.push({
          attempt: i + 1,
          status: response.status,
          requiresCaptcha: response.data?.requiresCaptcha || false
        });
        
        if (response.data?.requiresCaptcha) {
          console.log(`第${i + 1}次尝试后触发验证码要求`);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 测试验证码绕过方法
      const bypassMethods = [
        { name: '空验证码', captcha: '' },
        { name: '无效验证码', captcha: 'invalid' },
        { name: '重复验证码', captcha: 'ABCD' },
        { name: '不发送验证码字段', captcha: undefined }
      ];
      
      const bypassResults = [];
      
      for (const method of bypassMethods) {
        const data = {
          email: 'trigger@example.com',
          password: 'wrong_password'
        };
        
        if (method.captcha !== undefined) {
          data.captcha = method.captcha;
        }
        
        const response = await axios.post(`${this.baseURL}/auth/login`, data, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        bypassResults.push({
          method: method.name,
          status: response.status,
          message: response.data?.message || '',
          bypassSuccessful: response.status !== 400 && !response.data?.message?.includes('captcha'),
          captchaValue: method.captcha
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 分析验证码绕过结果
      const captchaAnalysis = this.analyzeCaptchaBypass(triggerAttempts, bypassResults);
      
      testCase.triggerAttempts = triggerAttempts;
      testCase.bypassResults = bypassResults;
      testCase.captchaTriggered = captchaAnalysis.captchaTriggered;
      testCase.vulnerable = captchaAnalysis.vulnerable;
      testCase.successfulBypasses = captchaAnalysis.successfulBypasses;
      testCase.analysis = captchaAnalysis.analysis;
      testCase.severity = captchaAnalysis.vulnerable ? 'MEDIUM' : 'SAFE';
      testCase.description = captchaAnalysis.vulnerable ? 
        '验证码可被绕过：验证机制存在漏洞' : 
        '验证码防护良好：绕过尝试失败';
      
      this.testResults.captchaBypass.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      testCase.vulnerable = false;
      testCase.error = error.message;
      testCase.severity = 'ERROR';
      this.testResults.captchaBypass.push(testCase);
      this.testResults.summary.total++;
    }
  }

  /**
   * 测试会话暴力破解
   */
  async testSessionBruteForce() {
    console.log('🔍 测试会话暴力破解...');
    
    const testCase = {
      type: 'Session Brute Force',
      target: 'GET /user/profile',
      timestamp: new Date().toISOString()
    };
    
    try {
      const sessionTokens = [];
      
      // 生成可能的会话token
      for (let i = 0; i < 20; i++) {
        // 生成不同格式的token
        sessionTokens.push({
          type: '简单数字',
          token: i.toString().padStart(10, '0')
        });
        sessionTokens.push({
          type: '短UUID',
          token: crypto.randomBytes(8).toString('hex')
        });
        sessionTokens.push({
          type: '弱JWT',
          token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoke2l9fQ.weak_signature_${i}`
        });
      }
      
      const attempts = [];
      const startTime = Date.now();
      
      // 尝试使用生成的token访问受保护资源
      for (let i = 0; i < Math.min(sessionTokens.length, 15); i++) {
        const tokenData = sessionTokens[i];
        
        const response = await axios.get(`${this.baseURL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${tokenData.token}`
          },
          timeout: 10000,
          validateStatus: () => true
        });
        
        attempts.push({
          attempt: i + 1,
          tokenType: tokenData.type,
          token: tokenData.token.substring(0, 20) + '...', // 只显示前20个字符
          status: response.status,
          success: response.status >= 200 && response.status < 300,
          blocked: response.status === 429,
          timestamp: Date.now() - startTime
        });
        
        if (response.status >= 200 && response.status < 300) {
          console.log(`会话token破解成功！类型: ${tokenData.type}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const endTime = Date.now();
      
      // 分析会话暴力破解结果
      const sessionAnalysis = this.analyzeSessionBruteForce(attempts);
      
      testCase.attempts = attempts;
      testCase.totalAttempts = attempts.length;
      testCase.successfulAttempts = sessionAnalysis.successfulAttempts;
      testCase.blockedAttempts = sessionAnalysis.blockedAttempts;
      testCase.duration = endTime - startTime;
      testCase.vulnerable = sessionAnalysis.vulnerable;
      testCase.analysis = sessionAnalysis.analysis;
      testCase.severity = sessionAnalysis.vulnerable ? 'CRITICAL' : 'SAFE';
      testCase.description = sessionAnalysis.vulnerable ? 
        '会话暴力破解成功：会话管理存在漏洞' : 
        '会话暴力破解防护良好：攻击被阻止';
      
      this.testResults.sessionBruteForce.push(testCase);
      this.testResults.summary.total++;
      
      if (testCase.vulnerable) {
        this.testResults.summary.failed++;
        this.testResults.summary.critical++;
      } else {
        this.testResults.summary.passed++;
      }
      
    } catch (error) {
      testCase.vulnerable = false;
      testCase.error = error.message;
      testCase.severity = 'ERROR';
      this.testResults.sessionBruteForce.push(testCase);
      this.testResults.summary.total++;
    }
  }

  /**
   * 分析暴力破解防护
   */
  analyzeBruteForceProtection(attempts, duration) {
    const analysis = {
      vulnerable: false,
      analysis: []
    };
    
    const blockedAttempts = attempts.filter(a => a.status === 429 || a.status === 423).length;
    const successfulAttempts = attempts.filter(a => a.status >= 200 && a.status < 300).length;
    
    // 如果超过5次尝试都没有被阻止，认为防护不足
    if (attempts.length > 5 && blockedAttempts === 0) {
      analysis.vulnerable = true;
      analysis.analysis.push(`允许了${attempts.length}次连续登录尝试而未被阻止`);
    }
    
    // 如果有成功的错误登录，说明存在问题
    if (successfulAttempts > 0) {
      analysis.vulnerable = true;
      analysis.analysis.push(`${successfulAttempts}次错误登录被接受`);
    }
    
    // 检查响应时间是否过快
    const avgResponseTime = duration / attempts.length;
    if (avgResponseTime < 100 && attempts.length > 8) {
      analysis.vulnerable = true;
      analysis.analysis.push('响应时间过快，未实施延迟防护');
    }
    
    if (!analysis.vulnerable) {
      analysis.analysis.push(`在${blockedAttempts}次尝试后被阻止，防护机制有效`);
    }
    
    return analysis;
  }

  /**
   * 分析密码暴力破解
   */
  analyzePasswordBruteForce(attempts, successfulAttempt, blockedAttempts) {
    const analysis = [];
    
    if (successfulAttempt) {
      analysis.push(`密码破解成功，使用密码: ${successfulAttempt.password}`);
      analysis.push('建议：强制使用强密码策略');
    }
    
    if (blockedAttempts < 3 && attempts.length > 5) {
      analysis.push('暴力破解防护不足，应该更早阻止攻击');
    }
    
    if (!successfulAttempt && blockedAttempts > 0) {
      analysis.push('密码强度足够且防护机制有效');
    }
    
    return analysis;
  }

  /**
   * 分析账户锁定机制
   */
  analyzeAccountLockout(attempts) {
    const analysis = {
      vulnerable: false,
      lockoutTriggered: false,
      lockoutAttempt: null,
      correctPasswordBlocked: false,
      analysis: []
    };
    
    const lockoutAttempt = attempts.find(a => a.locked);
    if (lockoutAttempt) {
      analysis.lockoutTriggered = true;
      analysis.lockoutAttempt = lockoutAttempt.attempt;
      analysis.analysis.push(`账户在第${lockoutAttempt.attempt}次尝试后被锁定`);
    }
    
    const correctPasswordAttempt = attempts.find(a => a.correctPassword);
    if (correctPasswordAttempt) {
      analysis.correctPasswordBlocked = correctPasswordAttempt.stillLocked;
      if (correctPasswordAttempt.stillLocked) {
        analysis.analysis.push('正确密码也被阻止，锁定机制有效');
      } else {
        analysis.vulnerable = true;
        analysis.analysis.push('锁定后仍可使用正确密码登录，机制存在漏洞');
      }
    }
    
    if (!analysis.lockoutTriggered && attempts.length > 5) {
      analysis.vulnerable = true;
      analysis.analysis.push('未触发账户锁定，防护机制不足');
    }
    
    return analysis;
  }

  /**
   * 分析速率限制绕过
   */
  analyzeRateLimitBypass(results) {
    const analysis = {
      vulnerable: false,
      successfulBypasses: [],
      analysis: []
    };
    
    for (const result of results) {
      if (result.bypassSuccessful) {
        analysis.vulnerable = true;
        analysis.successfulBypasses.push(result.method);
        analysis.analysis.push(`${result.method}绕过成功，${result.successCount}个请求通过`);
      }
    }
    
    if (!analysis.vulnerable) {
      analysis.analysis.push('所有绕过尝试失败，速率限制机制有效');
    }
    
    return analysis;
  }

  /**
   * 分析验证码绕过
   */
  analyzeCaptchaBypass(triggerAttempts, bypassResults) {
    const analysis = {
      vulnerable: false,
      captchaTriggered: false,
      successfulBypasses: [],
      analysis: []
    };
    
    // 检查是否触发了验证码
    const captchaTriggered = triggerAttempts.some(a => a.requiresCaptcha);
    analysis.captchaTriggered = captchaTriggered;
    
    if (!captchaTriggered) {
      analysis.analysis.push('未触发验证码要求，可能缺乏验证码防护');
      analysis.vulnerable = true;
      return analysis;
    }
    
    // 检查绕过尝试
    for (const result of bypassResults) {
      if (result.bypassSuccessful) {
        analysis.vulnerable = true;
        analysis.successfulBypasses.push(result.method);
        analysis.analysis.push(`${result.method}绕过成功`);
      }
    }
    
    if (!analysis.vulnerable && captchaTriggered) {
      analysis.analysis.push('验证码防护有效，所有绕过尝试失败');
    }
    
    return analysis;
  }

  /**
   * 分析会话暴力破解
   */
  analyzeSessionBruteForce(attempts) {
    const analysis = {
      vulnerable: false,
      successfulAttempts: 0,
      blockedAttempts: 0,
      analysis: []
    };
    
    analysis.successfulAttempts = attempts.filter(a => a.success).length;
    analysis.blockedAttempts = attempts.filter(a => a.blocked).length;
    
    if (analysis.successfulAttempts > 0) {
      analysis.vulnerable = true;
      analysis.analysis.push(`${analysis.successfulAttempts}个会话token破解成功`);
      analysis.analysis.push('会话管理存在严重安全漏洞');
    }
    
    if (analysis.blockedAttempts === 0 && attempts.length > 10) {
      analysis.vulnerable = true;
      analysis.analysis.push('未实施会话暴力破解防护');
    }
    
    if (!analysis.vulnerable) {
      analysis.analysis.push('会话暴力破解防护有效');
    }
    
    return analysis;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始暴力破解防护测试...');
    const startTime = Date.now();

    await this.testLoginBruteForce();
    await this.testPasswordBruteForce();
    await this.testAccountLockout();
    await this.testRateLimitingBypass();
    await this.testCaptchaBypass();
    await this.testSessionBruteForce();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 计算测试结果统计
    this.testResults.summary.duration = duration;
    this.testResults.summary.passRate = this.testResults.summary.total > 0 ? 
      (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(2) : 0;

    console.log('✅ 暴力破解防护测试完成');
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
      title: '暴力破解防护测试报告',
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      details: {
        loginBruteForce: this.testResults.loginBruteForce,
        passwordBruteForce: this.testResults.passwordBruteForce,
        accountLockout: this.testResults.accountLockout,
        rateLimiting: this.testResults.rateLimiting,
        captchaBypass: this.testResults.captchaBypass,
        sessionBruteForce: this.testResults.sessionBruteForce
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
      category: '登录防护',
      title: '实施强化的登录暴力破解防护',
      description: '防止暴力破解攻击的多层防护机制',
      actions: [
        '实施账户锁定机制（5次失败后锁定30分钟）',
        '添加登录延迟（失败次数越多延迟越长）',
        '实施IP级别的速率限制',
        '添加验证码验证（3次失败后要求）',
        '监控和告警异常登录行为'
      ]
    });

    recommendations.push({
      priority: 'HIGH',
      category: '密码策略',
      title: '强制实施强密码策略',
      description: '防止弱密码被字典攻击破解',
      actions: [
        '要求密码长度至少8位',
        '要求包含大小写字母、数字和特殊字符',
        '禁止使用常见弱密码',
        '实施密码历史记录（不能重复使用最近5个密码）',
        '定期提醒用户更新密码'
      ]
    });

    recommendations.push({
      priority: 'HIGH',
      category: '会话管理',
      title: '加强会话安全管理',
      description: '防止会话劫持和暴力破解',
      actions: [
        '使用强随机性的会话token',
        '实施会话超时机制',
        '绑定会话到IP地址',
        '实施并发会话限制',
        '记录和监控会话异常'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '速率限制',
      title: '实施全面的速率限制',
      description: '防止各种类型的暴力破解攻击',
      actions: [
        '为不同API端点设置不同的速率限制',
        '实施滑动窗口算法',
        '防止速率限制绕过（检查各种IP头）',
        '实施分布式速率限制',
        '提供速率限制状态反馈'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '验证码',
      title: '实施智能验证码系统',
      description: '在适当时机要求验证码验证',
      actions: [
        '在多次失败登录后要求验证码',
        '使用图形验证码或reCAPTCHA',
        '防止验证码绕过攻击',
        '实施验证码有效期限制',
        '记录验证码使用情况'
      ]
    });

    return recommendations;
  }
}

module.exports = BruteForceTest;

// 如果直接运行此文件
if (require.main === module) {
  const test = new BruteForceTest();
  test.runAllTests().then(results => {
    console.log('\n📋 测试报告:');
    console.log(JSON.stringify(test.generateReport(), null, 2));
  }).catch(error => {
    console.error('测试执行失败:', error);
  });
}