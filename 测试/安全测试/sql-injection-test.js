/**
 * SQL注入攻击防护测试套件
 * 测试各种SQL注入攻击载荷和防护机制
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

class SQLInjectionTest {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.testResults = {
      classicSQLi: [],
      blindSQLi: [],
      timeBased: [],
      unionBased: [],
      errorBased: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
  }

  /**
   * 经典SQL注入载荷
   */
  getClassicSQLiPayloads() {
    return [
      "' OR '1'='1",
      "' OR 1=1--",
      "' OR 1=1#",
      "' OR 1=1/*",
      "admin'--",
      "admin'#",
      "admin'/*",
      "' OR 'x'='x",
      "' OR 'a'='a",
      "') OR ('1'='1",
      "') OR (1=1)--",
      "' UNION SELECT NULL--",
      "' UNION SELECT 1,2,3--",
      "' AND 1=0 UNION SELECT NULL, username, password FROM users--",
      "'; DROP TABLE users--",
      "'; INSERT INTO users VALUES('hacker','password')--",
      "' OR SLEEP(5)--",
      "' OR pg_sleep(5)--",
      "' WAITFOR DELAY '00:00:05'--",
      "' AND (SELECT COUNT(*) FROM users) > 0--"
    ];
  }

  /**
   * 盲注载荷
   */
  getBlindSQLiPayloads() {
    return [
      "' AND (SELECT SUBSTRING(@@version,1,1))='5'--",
      "' AND (SELECT COUNT(*) FROM information_schema.tables)>0--",
      "' AND (SELECT LENGTH(database()))>0--",
      "' AND ASCII(SUBSTRING((SELECT database()),1,1))>64--",
      "' AND (SELECT COUNT(*) FROM users WHERE username='admin')=1--",
      "' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a'--",
      "' AND EXISTS(SELECT * FROM users WHERE username='admin')--",
      "' AND 1=(SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users')--",
      "' AND (SELECT user())='root@localhost'--",
      "' AND ORD(MID((SELECT IFNULL(CAST(username AS CHAR),0x20) FROM users ORDER BY id LIMIT 0,1),1,1))>64--"
    ];
  }

  /**
   * 基于时间的盲注载荷
   */
  getTimeBasedPayloads() {
    return [
      "' AND SLEEP(3)--",
      "' AND (SELECT SLEEP(3))--",
      "' AND IF(1=1,SLEEP(3),0)--",
      "' AND IF((SELECT COUNT(*) FROM users)>0,SLEEP(3),0)--",
      "' AND IF(ASCII(SUBSTRING((SELECT database()),1,1))>64,SLEEP(3),0)--",
      "'; WAITFOR DELAY '00:00:03'--",
      "' OR pg_sleep(3)--",
      "' AND BENCHMARK(5000000,MD5(1))--",
      "' AND (SELECT COUNT(*) FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3) AS x GROUP BY CONCAT(MID(@@version,1,1),FLOOR(RAND(0)*2))) AND SLEEP(3)--",
      "' AND IF(SUBSTRING(@@version,1,1)='5',SLEEP(3),0)--"
    ];
  }

  /**
   * 基于UNION的注入载荷
   */
  getUnionBasedPayloads() {
    return [
      "' UNION SELECT NULL,NULL,NULL--",
      "' UNION SELECT 1,2,3--",
      "' UNION SELECT username,password,email FROM users--",
      "' UNION SELECT table_name,column_name,data_type FROM information_schema.columns--",
      "' UNION SELECT database(),user(),version()--",
      "' UNION SELECT CONCAT(username,':',password),NULL,NULL FROM users--",
      "' UNION SELECT GROUP_CONCAT(username),GROUP_CONCAT(password),NULL FROM users--",
      "' UNION SELECT LOAD_FILE('/etc/passwd'),NULL,NULL--",
      "' UNION SELECT @@datadir,@@version_compile_os,@@version_compile_machine--",
      "' UNION SELECT HEX(password),username,email FROM users--"
    ];
  }

  /**
   * 基于错误的注入载荷
   */
  getErrorBasedPayloads() {
    return [
      "' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT database()),0x7e))--",
      "' AND UPDATEXML(1,CONCAT(0x7e,(SELECT user()),0x7e),1)--",
      "' AND (SELECT COUNT(*) FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3) AS x GROUP BY CONCAT(0x7e,(SELECT database()),0x7e,FLOOR(RAND(0)*2)))--",
      "' AND EXP(~(SELECT * FROM (SELECT COUNT(*),CONCAT(0x7e,(SELECT database()),0x7e,FLOOR(RAND(0)*2)) AS x FROM information_schema.tables GROUP BY x)a))--",
      "' AND GTID_SUBSET(CONCAT(0x7e,(SELECT database()),0x7e),1)--",
      "' AND JSON_KEYS((SELECT CONVERT((SELECT CONCAT(0x7e,(SELECT database()),0x7e)) USING utf8)))--",
      "' AND POLYGON((SELECT * FROM (SELECT COUNT(*),CONCAT(0x7e,(SELECT database()),0x7e,FLOOR(RAND(0)*2)) AS x FROM information_schema.tables GROUP BY x)a))--",
      "' AND LINESTRING((SELECT * FROM (SELECT COUNT(*),CONCAT(0x7e,(SELECT user()),0x7e,FLOOR(RAND(0)*2)) AS x FROM information_schema.tables GROUP BY x)a))--",
      "' AND MULTIPOINT((SELECT * FROM (SELECT COUNT(*),CONCAT(0x7e,(SELECT @@version),0x7e,FLOOR(RAND(0)*2)) AS x FROM information_schema.tables GROUP BY x)a))--",
      "' AND GEOMETRYCOLLECTION((SELECT * FROM (SELECT COUNT(*),CONCAT(0x7e,(SELECT database()),0x7e,FLOOR(RAND(0)*2)) AS x FROM information_schema.tables GROUP BY x)a))--"
    ];
  }

  /**
   * 测试登录接口的SQL注入
   */
  async testLoginSQLInjection() {
    console.log('🔍 测试登录接口SQL注入...');
    const payloads = this.getClassicSQLiPayloads();
    
    for (const payload of payloads) {
      try {
        const testCase = {
          type: 'Login SQL Injection',
          payload: payload,
          target: 'POST /auth/login',
          timestamp: new Date().toISOString()
        };

        const startTime = Date.now();
        
        // 测试邮箱字段注入
        const emailResponse = await axios.post(`${this.baseURL}/auth/login`, {
          email: payload,
          password: 'testpassword'
        }, {
          timeout: 10000,
          validateStatus: () => true
        });

        const emailResponseTime = Date.now() - startTime;
        
        // 测试密码字段注入
        const passwordStartTime = Date.now();
        const passwordResponse = await axios.post(`${this.baseURL}/auth/login`, {
          email: 'test@example.com',
          password: payload
        }, {
          timeout: 10000,
          validateStatus: () => true
        });

        const passwordResponseTime = Date.now() - passwordStartTime;

        // 分析响应判断是否存在注入
        const isVulnerable = this.analyzeSQLInjectionResponse(
          emailResponse, passwordResponse, emailResponseTime, passwordResponseTime
        );

        testCase.vulnerable = isVulnerable.vulnerable;
        testCase.emailStatus = emailResponse.status;
        testCase.passwordStatus = passwordResponse.status;
        testCase.emailResponseTime = emailResponseTime;
        testCase.passwordResponseTime = passwordResponseTime;
        testCase.indicators = isVulnerable.indicators;
        testCase.severity = isVulnerable.vulnerable ? 'CRITICAL' : 'SAFE';
        testCase.description = isVulnerable.vulnerable ? 
          'SQL注入漏洞：登录接口可能存在SQL注入' : 
          '登录接口正确处理了恶意输入';

        this.testResults.classicSQLi.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable.vulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        this.testResults.classicSQLi.push({
          type: 'Login SQL Injection',
          payload: payload,
          target: 'POST /auth/login',
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
   * 测试用户查询接口的SQL注入
   */
  async testUserQuerySQLInjection() {
    console.log('🔍 测试用户查询接口SQL注入...');
    const payloads = this.getUnionBasedPayloads();
    
    // 首先尝试获取一个有效的token
    let authToken = 'mock-token-1';
    
    for (const payload of payloads) {
      try {
        const testCase = {
          type: 'User Query SQL Injection',
          payload: payload,
          target: 'GET /user/profile',
          timestamp: new Date().toISOString()
        };

        const startTime = Date.now();
        
        // 测试用户ID参数注入
        const response = await axios.get(`${this.baseURL}/user/profile?userId=${encodeURIComponent(payload)}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          timeout: 10000,
          validateStatus: () => true
        });

        const responseTime = Date.now() - startTime;

        // 分析响应
        const isVulnerable = this.analyzeSQLInjectionResponse(response, null, responseTime, 0);

        testCase.vulnerable = isVulnerable.vulnerable;
        testCase.statusCode = response.status;
        testCase.responseTime = responseTime;
        testCase.indicators = isVulnerable.indicators;
        testCase.severity = isVulnerable.vulnerable ? 'CRITICAL' : 'SAFE';
        testCase.description = isVulnerable.vulnerable ? 
          'SQL注入漏洞：用户查询接口存在SQL注入' : 
          '用户查询接口正确处理了恶意输入';

        this.testResults.unionBased.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable.vulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        this.testResults.unionBased.push({
          type: 'User Query SQL Injection',
          payload: payload,
          target: 'GET /user/profile',
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
   * 测试基于时间的盲注
   */
  async testTimeBasedSQLInjection() {
    console.log('🔍 测试基于时间的盲注...');
    const payloads = this.getTimeBasedPayloads();
    
    for (const payload of payloads) {
      try {
        const testCase = {
          type: 'Time-based Blind SQL Injection',
          payload: payload,
          target: 'POST /auth/login',
          timestamp: new Date().toISOString()
        };

        const startTime = Date.now();
        
        const response = await axios.post(`${this.baseURL}/auth/login`, {
          email: payload,
          password: 'testpassword'
        }, {
          timeout: 15000,
          validateStatus: () => true
        });

        const responseTime = Date.now() - startTime;

        // 如果响应时间超过2.5秒，可能存在时间盲注
        const isVulnerable = responseTime > 2500;

        testCase.vulnerable = isVulnerable;
        testCase.statusCode = response.status;
        testCase.responseTime = responseTime;
        testCase.severity = isVulnerable ? 'CRITICAL' : 'SAFE';
        testCase.description = isVulnerable ? 
          `时间盲注漏洞：响应时间异常(${responseTime}ms)，可能存在时间盲注` : 
          `响应时间正常(${responseTime}ms)，未检测到时间盲注`;

        this.testResults.timeBased.push(testCase);
        this.testResults.summary.total++;
        
        if (isVulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        const responseTime = Date.now() - Date.now();
        this.testResults.timeBased.push({
          type: 'Time-based Blind SQL Injection',
          payload: payload,
          target: 'POST /auth/login',
          vulnerable: false,
          error: error.message,
          responseTime: responseTime,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试基于错误的SQL注入
   */
  async testErrorBasedSQLInjection() {
    console.log('🔍 测试基于错误的SQL注入...');
    const payloads = this.getErrorBasedPayloads();
    
    for (const payload of payloads) {
      try {
        const testCase = {
          type: 'Error-based SQL Injection',
          payload: payload,
          target: 'POST /auth/register',
          timestamp: new Date().toISOString()
        };

        const response = await axios.post(`${this.baseURL}/auth/register`, {
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          inviterCode: payload
        }, {
          timeout: 10000,
          validateStatus: () => true
        });

        // 检查错误响应中是否包含数据库信息
        const responseText = JSON.stringify(response.data);
        const hasDBError = this.checkForDatabaseErrors(responseText);

        testCase.vulnerable = hasDBError.vulnerable;
        testCase.statusCode = response.status;
        testCase.errorIndicators = hasDBError.indicators;
        testCase.severity = hasDBError.vulnerable ? 'CRITICAL' : 'SAFE';
        testCase.description = hasDBError.vulnerable ? 
          '错误注入漏洞：错误信息泄露了数据库结构信息' : 
          '错误处理安全，未泄露敏感信息';

        this.testResults.errorBased.push(testCase);
        this.testResults.summary.total++;
        
        if (hasDBError.vulnerable) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }

      } catch (error) {
        this.testResults.errorBased.push({
          type: 'Error-based SQL Injection',
          payload: payload,
          target: 'POST /auth/register',
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
   * 分析SQL注入响应
   */
  analyzeSQLInjectionResponse(response1, response2, time1, time2) {
    const indicators = [];
    let vulnerable = false;

    // 检查响应状态码
    if (response1 && response1.status === 200) {
      indicators.push('Unexpected 200 status for malicious input');
      vulnerable = true;
    }

    // 检查响应内容
    const responseText1 = response1 ? JSON.stringify(response1.data) : '';
    const responseText2 = response2 ? JSON.stringify(response2.data) : '';

    // 检查是否包含数据库错误信息
    const dbErrors = [
      'mysql', 'sql syntax', 'ORA-', 'Microsoft OLE DB', 'ODBC',
      'PostgreSQL', 'SQLite', 'Unclosed quotation mark', 'quoted string not properly terminated',
      'mysql_fetch', 'mysql_num_rows', 'mysql_query', 'mysql_error',
      'Warning: mysql', 'Error: mysql', 'MySQL server version'
    ];

    for (const error of dbErrors) {
      if (responseText1.toLowerCase().includes(error.toLowerCase()) || 
          responseText2.toLowerCase().includes(error.toLowerCase())) {
        indicators.push(`Database error detected: ${error}`);
        vulnerable = true;
      }
    }

    // 检查是否返回了意外的数据
    if (responseText1.includes('admin') || responseText1.includes('root') ||
        responseText2.includes('admin') || responseText2.includes('root')) {
      indicators.push('Potential data leakage detected');
      vulnerable = true;
    }

    // 检查响应时间异常
    if (time1 > 5000 || time2 > 5000) {
      indicators.push('Abnormal response time detected');
      vulnerable = true;
    }

    return { vulnerable, indicators };
  }

  /**
   * 检查数据库错误信息
   */
  checkForDatabaseErrors(responseText) {
    const indicators = [];
    let vulnerable = false;

    const errorPatterns = [
      /mysql.*error/i,
      /sql.*syntax.*error/i,
      /table.*doesn't exist/i,
      /column.*unknown/i,
      /duplicate entry/i,
      /constraint.*failed/i,
      /foreign key constraint/i,
      /access denied for user/i,
      /unknown database/i,
      /connection.*refused/i,
      /SQLSTATE\[\d+\]/i,
      /PDOException/i,
      /mysqli_query/i,
      /mysql_query/i
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(responseText)) {
        indicators.push(`Database error pattern matched: ${pattern.source}`);
        vulnerable = true;
      }
    }

    return { vulnerable, indicators };
  }

  /**
   * 运行所有SQL注入测试
   */
  async runAllTests() {
    console.log('🚀 开始SQL注入防护测试...');
    const startTime = Date.now();

    await this.testLoginSQLInjection();
    await this.testUserQuerySQLInjection();
    await this.testTimeBasedSQLInjection();
    await this.testErrorBasedSQLInjection();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 计算测试结果统计
    this.testResults.summary.duration = duration;
    this.testResults.summary.passRate = this.testResults.summary.total > 0 ? 
      (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(2) : 0;

    console.log('✅ SQL注入防护测试完成');
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
      title: 'SQL注入攻击防护测试报告',
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      details: {
        classicSQLi: this.testResults.classicSQLi,
        blindSQLi: this.testResults.blindSQLi,
        timeBased: this.testResults.timeBased,
        unionBased: this.testResults.unionBased,
        errorBased: this.testResults.errorBased
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
        category: 'SQL注入防护',
        title: '使用参数化查询和预编译语句',
        description: '所有数据库查询必须使用参数化查询，避免字符串拼接',
        actions: [
          '使用prepared statements',
          '避免动态SQL构建',
          '使用ORM框架的安全查询方法',
          '对所有用户输入进行严格验证',
          '实施最小权限原则'
        ]
      });

      recommendations.push({
        priority: 'HIGH',
        category: '错误处理',
        title: '安全的错误处理机制',
        description: '避免在错误信息中泄露数据库结构信息',
        actions: [
          '使用通用错误消息',
          '记录详细错误到日志文件',
          '不向用户显示数据库错误',
          '实施错误监控和告警'
        ]
      });
    }

    recommendations.push({
      priority: 'HIGH',
      category: '数据库安全',
      title: '数据库安全配置',
      description: '加强数据库层面的安全配置',
      actions: [
        '使用专用数据库用户，限制权限',
        '禁用不必要的数据库功能',
        '启用数据库审计日志',
        '定期更新数据库软件',
        '使用数据库防火墙'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '输入验证',
      title: '强化输入验证',
      description: '在应用层实施严格的输入验证',
      actions: [
        '使用白名单验证',
        '限制输入长度和格式',
        '过滤特殊字符',
        '使用正则表达式验证',
        '实施多层验证'
      ]
    });

    return recommendations;
  }
}

module.exports = SQLInjectionTest;

// 如果直接运行此文件
if (require.main === module) {
  const test = new SQLInjectionTest();
  test.runAllTests().then(results => {
    console.log('\n📋 测试报告:');
    console.log(JSON.stringify(test.generateReport(), null, 2));
  }).catch(error => {
    console.error('测试执行失败:', error);
  });
}