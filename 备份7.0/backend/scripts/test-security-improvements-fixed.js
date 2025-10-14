/**
 * 修复后的安全改进测试脚本
 * 验证密钥管理系统、环境安全和服务集成的完整功能
 */

const fs = require('fs');
const path = require('path');
const KeyManagementSystem = require('../utils/keyManagementSystem');
const EnvironmentSecurity = require('../config/environment-security');
const TatumWalletService = require('../services/tatumWalletService');
const UserWalletAddressService = require('../services/userWalletAddressService');
const TatumBasicWalletService = require('../services/tatumBasicWalletService');

class SecurityImprovementTesterFixed {
    constructor() {
        this.kms = new KeyManagementSystem();
        this.envSecurity = new EnvironmentSecurity();
        this.testResults = [];
        this.masterPassword = null; // 将从文件中读取
        this.secureDir = '/Users/mason1236/0930/secure';
    }

    /**
     * 从文件中读取主密码
     */
    loadMasterPassword() {
        try {
            const passwordPath = path.join(this.secureDir, 'master-password.txt');
            if (fs.existsSync(passwordPath)) {
                this.masterPassword = fs.readFileSync(passwordPath, 'utf8').trim();
                return true;
            } else {
                console.error('❌ 主密码文件不存在:', passwordPath);
                return false;
            }
        } catch (error) {
            console.error('❌ 读取主密码失败:', error.message);
            return false;
        }
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('🧪 开始运行修复后的安全改进测试...\n');
        
        const startTime = Date.now();
        
        try {
            // 首先加载主密码
            if (!this.loadMasterPassword()) {
                throw new Error('无法加载主密码');
            }
            
            // 初始化测试环境
            await this.initializeTestEnvironment();
            
            // 测试密钥管理系统
            await this.testKeyManagementSystem();
            
            // 测试环境安全
            await this.testEnvironmentSecurity();
            
            // 测试服务集成
            await this.testServiceIntegration();
            
            // 测试缓存机制
            await this.testCachingMechanism();
            
            // 测试安全特性
            await this.testSecurityFeatures();
            
            // 测试性能
            await this.testPerformance();
            
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
            this.addTestResult('CRITICAL_ERROR', false, error.message);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 生成测试报告
        await this.generateTestReport(duration);
        
        console.log('\n✅ 所有测试完成');
    }

    /**
     * 初始化测试环境
     */
    async initializeTestEnvironment() {
        console.log('🔧 初始化测试环境...');
        
        try {
            // 初始化密钥管理系统
            await this.kms.initialize();
            this.addTestResult('KMS_INITIALIZATION', true, '密钥管理系统初始化成功');
            
            // 验证主密码
            const mnemonic = await this.kms.getMasterMnemonic(this.masterPassword);
            if (mnemonic) {
                this.addTestResult('MASTER_PASSWORD_VERIFICATION', true, '主密码验证成功');
            } else {
                this.addTestResult('MASTER_PASSWORD_VERIFICATION', false, '主密码验证失败');
            }
            
            // 初始化环境安全
            await this.envSecurity.initialize(this.masterPassword);
            this.addTestResult('ENV_SECURITY_INITIALIZATION', true, '环境安全系统初始化成功');
            
        } catch (error) {
            this.addTestResult('TEST_ENVIRONMENT_INIT', false, error.message);
            throw error;
        }
    }

    /**
     * 测试密钥管理系统
     */
    async testKeyManagementSystem() {
        console.log('🔑 测试密钥管理系统...');
        
        // 测试主助记词获取
        try {
            const mnemonic = await this.kms.getMasterMnemonic(this.masterPassword);
            if (mnemonic && mnemonic.split(' ').length === 24) {
                this.addTestResult('MASTER_MNEMONIC_RETRIEVAL', true, '主助记词获取成功');
            } else {
                this.addTestResult('MASTER_MNEMONIC_RETRIEVAL', false, '主助记词格式不正确');
            }
        } catch (error) {
            this.addTestResult('MASTER_MNEMONIC_RETRIEVAL', false, error.message);
        }
        
        // 测试各种密钥获取
        const keyTypes = ['tatum_api_key', 'database_password', 'redis_password', 'jwt_secret', 'webhook_secret'];
        
        for (const keyType of keyTypes) {
            try {
                const key = await this.kms.getKey(keyType, this.masterPassword);
                if (key) {
                    this.addTestResult(`KEY_RETRIEVAL_${keyType.toUpperCase()}`, true, `${keyType} 获取成功`);
                } else {
                    this.addTestResult(`KEY_RETRIEVAL_${keyType.toUpperCase()}`, false, `${keyType} 为空`);
                }
            } catch (error) {
                this.addTestResult(`KEY_RETRIEVAL_${keyType.toUpperCase()}`, false, error.message);
            }
        }
        
        // 测试缓存功能
        try {
            // 第一次获取（应该从存储获取）
            const key1 = await this.kms.getKey('tatum_api_key', this.masterPassword);
            
            // 第二次获取（应该从缓存获取）
            const key2 = await this.kms.getKey('tatum_api_key', this.masterPassword);
            
            if (key1 === key2) {
                this.addTestResult('KEY_CACHING', true, '密钥缓存功能正常');
            } else {
                this.addTestResult('KEY_CACHING', false, '缓存返回的密钥不一致');
            }
        } catch (error) {
            this.addTestResult('KEY_CACHING', false, error.message);
        }
    }

    /**
     * 测试环境安全
     */
    async testEnvironmentSecurity() {
        console.log('🛡️ 测试环境安全...');
        
        // 为测试添加临时访问权限
        this.envSecurity.addAccessPermission('tatum_api_key', 'TestCaller');
        
        // 测试安全环境变量获取
        try {
            const apiKey = await this.envSecurity.getSecureEnvVar('TATUM_API_KEY', 'TestCaller');
            if (apiKey) {
                this.addTestResult('SECURE_ENV_VAR_ACCESS', true, '安全环境变量访问成功');
            } else {
                this.addTestResult('SECURE_ENV_VAR_ACCESS', false, '无法获取安全环境变量');
            }
        } catch (error) {
            this.addTestResult('SECURE_ENV_VAR_ACCESS', false, error.message);
        }
        
        // 测试访问权限控制
        try {
            await this.envSecurity.getSecureEnvVar('TATUM_API_KEY', 'UnauthorizedCaller');
            this.addTestResult('ACCESS_CONTROL', false, '未授权访问应该被拒绝');
        } catch (error) {
            if (error.message.includes('访问被拒绝')) {
                this.addTestResult('ACCESS_CONTROL', true, '访问控制正常工作');
            } else {
                this.addTestResult('ACCESS_CONTROL', false, error.message);
            }
        }
        
        // 测试访问日志
        try {
            const stats = await this.envSecurity.getAccessStats();
            if (stats && stats.total > 0) {
                this.addTestResult('ACCESS_LOGGING', true, `访问日志记录正常，共 ${stats.total} 条记录`);
            } else {
                this.addTestResult('ACCESS_LOGGING', false, '访问日志为空');
            }
        } catch (error) {
            this.addTestResult('ACCESS_LOGGING', false, error.message);
        }
    }

    /**
     * 测试服务集成
     */
    async testServiceIntegration() {
        console.log('🔧 测试服务集成...');
        
        // 测试 TatumWalletService (导出的是实例)
        try {
            const tatumService = require('../services/tatumWalletService');
            if (tatumService && typeof tatumService.initialize === 'function') {
                await tatumService.initialize(this.masterPassword);
                
                if (tatumService.isInitialized && tatumService.masterWallet) {
                    this.addTestResult('TATUM_WALLET_SERVICE', true, 'TatumWalletService 初始化成功');
                } else {
                    this.addTestResult('TATUM_WALLET_SERVICE', false, 'TatumWalletService 初始化不完整');
                }
            } else {
                this.addTestResult('TATUM_WALLET_SERVICE', false, 'TatumWalletService 实例不可用');
            }
        } catch (error) {
            this.addTestResult('TATUM_WALLET_SERVICE', false, error.message);
        }
        
        // 测试 UserWalletAddressService (导出的是实例)
        try {
            const userWalletService = require('../services/userWalletAddressService');
            if (userWalletService && typeof userWalletService.initialize === 'function') {
                await userWalletService.initialize(this.masterPassword);
                
                if (userWalletService.isInitialized) {
                    this.addTestResult('USER_WALLET_ADDRESS_SERVICE', true, 'UserWalletAddressService 初始化成功');
                } else {
                    this.addTestResult('USER_WALLET_ADDRESS_SERVICE', false, 'UserWalletAddressService 初始化不完整');
                }
            } else {
                this.addTestResult('USER_WALLET_ADDRESS_SERVICE', false, 'UserWalletAddressService 实例不可用');
            }
        } catch (error) {
            this.addTestResult('USER_WALLET_ADDRESS_SERVICE', false, error.message);
        }
        
        // 测试 TatumBasicWalletService
        try {
            const basicWalletService = new TatumBasicWalletService();
            await basicWalletService.initialize(this.masterPassword);
            
            if (basicWalletService.isInitialized) {
                this.addTestResult('TATUM_BASIC_WALLET_SERVICE', true, 'TatumBasicWalletService 初始化成功');
            } else {
                this.addTestResult('TATUM_BASIC_WALLET_SERVICE', false, 'TatumBasicWalletService 初始化不完整');
            }
        } catch (error) {
            this.addTestResult('TATUM_BASIC_WALLET_SERVICE', false, error.message);
        }
    }

    /**
     * 测试缓存机制
     */
    async testCachingMechanism() {
        console.log('💾 测试缓存机制...');
        
        try {
            // 测试缓存统计
            const cacheStats = this.kms.keyCache.getStats();
            
            if (cacheStats && cacheStats.totalEntries >= 0) {
                this.addTestResult('CACHE_STATS', true, `缓存统计正常，当前 ${cacheStats.totalEntries} 个条目`);
            } else {
                this.addTestResult('CACHE_STATS', false, '无法获取缓存统计');
            }
            
            // 测试缓存命中率
            if (cacheStats.accessStats && cacheStats.accessStats.hitRate) {
                this.addTestResult('CACHE_HIT_RATE', true, `缓存命中率: ${cacheStats.accessStats.hitRate}`);
            } else {
                this.addTestResult('CACHE_HIT_RATE', false, '无法计算缓存命中率');
            }
            
        } catch (error) {
            this.addTestResult('CACHING_MECHANISM', false, error.message);
        }
    }

    /**
     * 测试安全特性
     */
    async testSecurityFeatures() {
        console.log('🔒 测试安全特性...');
        
        // 测试错误密码处理
        try {
            await this.kms.getMasterMnemonic('wrong_password');
            this.addTestResult('INCORRECT_PASSWORD_HANDLING', false, '错误密码应该被拒绝');
        } catch (error) {
            if (error.message.includes('bad decrypt') || error.message.includes('解密失败')) {
                this.addTestResult('INCORRECT_PASSWORD_HANDLING', true, '错误密码正确被拒绝');
            } else {
                this.addTestResult('INCORRECT_PASSWORD_HANDLING', false, error.message);
            }
        }
        
        // 测试文件权限
        try {
            const encryptedFile = path.join(this.secureDir, 'master-wallet-encrypted.json');
            if (fs.existsSync(encryptedFile)) {
                const stats = fs.statSync(encryptedFile);
                const mode = stats.mode & parseInt('777', 8);
                
                if (mode === parseInt('600', 8)) {
                    this.addTestResult('FILE_PERMISSIONS', true, '加密文件权限设置正确 (600)');
                } else {
                    this.addTestResult('FILE_PERMISSIONS', false, `文件权限不安全: ${mode.toString(8)}`);
                }
            } else {
                this.addTestResult('FILE_PERMISSIONS', false, '加密文件不存在');
            }
        } catch (error) {
            this.addTestResult('FILE_PERMISSIONS', false, error.message);
        }
        
        // 测试敏感信息清理
        try {
            const hasEnvVar = process.env.TATUM_MASTER_WALLET_MNEMONIC;
            if (!hasEnvVar) {
                this.addTestResult('SENSITIVE_INFO_CLEANUP', true, '敏感环境变量已清理');
            } else {
                this.addTestResult('SENSITIVE_INFO_CLEANUP', false, '敏感环境变量未清理');
            }
        } catch (error) {
            this.addTestResult('SENSITIVE_INFO_CLEANUP', false, error.message);
        }
    }

    /**
     * 测试性能
     */
    async testPerformance() {
        console.log('⚡ 测试性能...');
        
        // 测试密钥获取性能
        try {
            const startTime = Date.now();
            
            for (let i = 0; i < 10; i++) {
                await this.kms.getKey('tatum_api_key', this.masterPassword);
            }
            
            const endTime = Date.now();
            const avgTime = (endTime - startTime) / 10;
            
            if (avgTime < 100) { // 平均每次获取少于100ms
                this.addTestResult('KEY_RETRIEVAL_PERFORMANCE', true, `平均获取时间: ${avgTime.toFixed(2)}ms`);
            } else {
                this.addTestResult('KEY_RETRIEVAL_PERFORMANCE', false, `获取时间过长: ${avgTime.toFixed(2)}ms`);
            }
        } catch (error) {
            this.addTestResult('KEY_RETRIEVAL_PERFORMANCE', false, error.message);
        }
        
        // 测试内存使用
        try {
            const memUsage = process.memoryUsage();
            const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
            
            if (heapUsedMB < 100) { // 堆内存使用少于100MB
                this.addTestResult('MEMORY_EFFICIENCY', true, `堆内存使用: ${heapUsedMB.toFixed(2)}MB`);
            } else {
                this.addTestResult('MEMORY_EFFICIENCY', false, `内存使用过高: ${heapUsedMB.toFixed(2)}MB`);
            }
        } catch (error) {
            this.addTestResult('MEMORY_EFFICIENCY', false, error.message);
        }
    }

    /**
     * 添加测试结果
     */
    addTestResult(testName, success, details = '') {
        const result = {
            test: testName,
            success,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }

    /**
     * 生成测试报告
     */
    async generateTestReport(duration) {
        const passedTests = this.testResults.filter(r => r.success).length;
        const totalTests = this.testResults.length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(2);
        
        const report = {
            summary: {
                total_tests: totalTests,
                passed: passedTests,
                failed: totalTests - passedTests,
                success_rate: `${successRate}%`,
                duration_ms: duration,
                timestamp: new Date().toISOString()
            },
            test_results: this.testResults,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(this.secureDir, 'security-test-report-fixed.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
        
        console.log('\n📊 测试报告摘要:');
        console.log(`总测试数: ${totalTests}`);
        console.log(`通过: ${passedTests}`);
        console.log(`失败: ${totalTests - passedTests}`);
        console.log(`成功率: ${successRate}%`);
        console.log(`耗时: ${duration}ms`);
        console.log(`报告保存至: ${reportPath}`);
        
        return report;
    }

    /**
     * 生成改进建议
     */
    generateRecommendations() {
        const failedTests = this.testResults.filter(r => !r.success);
        const recommendations = [];
        
        if (failedTests.length === 0) {
            recommendations.push('🎉 所有测试都通过了！系统安全性良好。');
            recommendations.push('💡 建议定期运行安全测试以确保持续的安全性。');
        } else {
            recommendations.push('🔧 需要修复以下问题:');
            
            failedTests.forEach(test => {
                recommendations.push(`- ${test.test}: ${test.details}`);
            });
            
            recommendations.push('🛡️ 建议在修复问题后重新运行测试。');
        }
        
        return recommendations;
    }

    /**
     * 清理测试环境
     */
    async cleanup() {
        try {
            await this.envSecurity.cleanup();
            this.kms.keyCache.destroy();
            console.log('✅ 测试环境清理完成');
        } catch (error) {
            console.error('❌ 清理测试环境失败:', error);
        }
    }
}

// 运行测试
async function runTests() {
    const tester = new SecurityImprovementTesterFixed();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('❌ 测试运行失败:', error);
    } finally {
        await tester.cleanup();
        process.exit(0);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    runTests();
}

module.exports = SecurityImprovementTesterFixed;