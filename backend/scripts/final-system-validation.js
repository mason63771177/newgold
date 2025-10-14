#!/usr/bin/env node

/**
 * 最终系统验证脚本
 * 执行全面的系统检查、功能验证和文档整理
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

class FinalSystemValidator {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.adminToken = 'mock-admin-token';
        this.validationResults = {
            systemHealth: {},
            apiEndpoints: {},
            walletFunctions: {},
            security: {},
            performance: {},
            documentation: {},
            deployment: {}
        };
        this.issues = [];
        this.warnings = [];
        this.recommendations = [];
    }

    /**
     * 执行完整的系统验证
     */
    async runValidation() {
        console.log('🔍 开始执行最终系统验证...\n');

        try {
            await this.validateSystemHealth();
            await this.validateApiEndpoints();
            await this.validateWalletFunctions();
            await this.validateSecurity();
            await this.validatePerformance();
            await this.validateDocumentation();
            await this.validateDeployment();

            this.generateReport();
            this.printSummary();
            await this.saveReport();

        } catch (error) {
            console.error('❌ 系统验证过程中发生错误:', error.message);
            process.exit(1);
        }
    }

    /**
     * 验证系统健康状态
     */
    async validateSystemHealth() {
        console.log('🏥 验证系统健康状态...');
        
        try {
            const response = await axios.get(`${this.baseUrl}/api/health`, {
                headers: { Authorization: `Bearer ${this.adminToken}` },
                timeout: 5000
            });

            this.validationResults.systemHealth = {
                status: response.data.status,
                checks: response.data.checks || {},
                alerts: response.data.alerts || []
            };

            if (response.data.status === 'healthy') {
                console.log('✅ 系统健康状态良好');
            } else {
                this.issues.push('系统健康检查失败');
                console.log('⚠️  系统健康状态异常');
            }

        } catch (error) {
            this.issues.push(`系统健康检查失败: ${error.message}`);
            console.log('❌ 无法获取系统健康状态');
        }
    }

    /**
     * 验证API端点
     */
    async validateApiEndpoints() {
        console.log('🔌 验证API端点...');

        const endpoints = [
            { path: '/api/auth/login', method: 'POST', requiresAuth: false },
            { path: '/api/auth/register', method: 'POST', requiresAuth: false },
            { path: '/api/wallet/balance', method: 'GET', requiresAuth: true },
            { path: '/api/wallet/deposit-address', method: 'GET', requiresAuth: true },
            { path: '/api/wallet/withdraw', method: 'POST', requiresAuth: true },
            { path: '/api/admin/users', method: 'GET', requiresAuth: true },
            { path: '/api/admin/transactions', method: 'GET', requiresAuth: true },
            { path: '/api/admin/consolidate', method: 'POST', requiresAuth: true }
        ];

        let successCount = 0;
        let totalCount = endpoints.length;

        for (const endpoint of endpoints) {
            try {
                const config = {
                    method: endpoint.method.toLowerCase(),
                    url: `${this.baseUrl}${endpoint.path}`,
                    timeout: 5000
                };

                if (endpoint.requiresAuth) {
                    config.headers = { Authorization: `Bearer ${this.adminToken}` };
                }

                if (endpoint.method === 'POST') {
                    config.data = {};
                }

                const response = await axios(config);
                
                if (response.status < 400) {
                    successCount++;
                    console.log(`✅ ${endpoint.method} ${endpoint.path}`);
                } else {
                    this.warnings.push(`API端点响应异常: ${endpoint.path}`);
                    console.log(`⚠️  ${endpoint.method} ${endpoint.path} - 状态码: ${response.status}`);
                }

            } catch (error) {
                if (error.response && error.response.status < 500) {
                    successCount++;
                    console.log(`✅ ${endpoint.method} ${endpoint.path} (预期错误)`);
                } else {
                    this.issues.push(`API端点不可用: ${endpoint.path}`);
                    console.log(`❌ ${endpoint.method} ${endpoint.path} - ${error.message}`);
                }
            }
        }

        this.validationResults.apiEndpoints = {
            total: totalCount,
            success: successCount,
            successRate: (successCount / totalCount * 100).toFixed(2) + '%'
        };
    }

    /**
     * 验证钱包功能
     */
    async validateWalletFunctions() {
        console.log('💰 验证钱包功能...');

        const walletTests = [
            { name: '地址生成', passed: false },
            { name: '余额查询', passed: false },
            { name: '充值监听', passed: false },
            { name: '提现处理', passed: false },
            { name: '资金归集', passed: false }
        ];

        // 检查钱包相关文件
        const walletFiles = [
            'services/wallet.js',
            'services/tatum.js',
            'routes/wallet.js',
            'models/Transaction.js',
            'models/Wallet.js'
        ];

        let filesExist = 0;
        for (const file of walletFiles) {
            if (fs.existsSync(path.join(__dirname, '..', file))) {
                filesExist++;
                console.log(`✅ ${file} 存在`);
            } else {
                this.issues.push(`钱包文件缺失: ${file}`);
                console.log(`❌ ${file} 不存在`);
            }
        }

        // 检查环境变量
        const requiredEnvVars = ['TATUM_API_KEY', 'TATUM_TESTNET'];
        let envVarsSet = 0;
        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                envVarsSet++;
                console.log(`✅ ${envVar} 已配置`);
            } else {
                this.warnings.push(`环境变量未设置: ${envVar}`);
                console.log(`⚠️  ${envVar} 未配置`);
            }
        }

        this.validationResults.walletFunctions = {
            filesExist: `${filesExist}/${walletFiles.length}`,
            envVarsSet: `${envVarsSet}/${requiredEnvVars.length}`,
            tests: walletTests
        };
    }

    /**
     * 验证安全配置
     */
    async validateSecurity() {
        console.log('🔒 验证安全配置...');

        const securityChecks = [];

        // 检查环境变量
        if (process.env.NODE_ENV === 'production') {
            securityChecks.push({ name: '生产环境模式', passed: true });
            console.log('✅ 生产环境模式已启用');
        } else {
            securityChecks.push({ name: '生产环境模式', passed: false });
            this.warnings.push('未设置为生产环境模式');
            console.log('⚠️  未设置为生产环境模式');
        }

        // 检查安全文件
        const securityFiles = [
            'config/security.js',
            'middleware/auth.js',
            'middleware/rateLimit.js'
        ];

        let securityFilesExist = 0;
        for (const file of securityFiles) {
            if (fs.existsSync(path.join(__dirname, '..', file))) {
                securityFilesExist++;
                securityChecks.push({ name: `${file} 存在`, passed: true });
                console.log(`✅ ${file} 存在`);
            } else {
                securityChecks.push({ name: `${file} 存在`, passed: false });
                this.warnings.push(`安全文件缺失: ${file}`);
                console.log(`⚠️  ${file} 不存在`);
            }
        }

        // 检查敏感文件权限
        const sensitiveFiles = ['.env', 'config/database.js'];
        for (const file of sensitiveFiles) {
            const filePath = path.join(__dirname, '..', file);
            if (fs.existsSync(filePath)) {
                try {
                    const stats = fs.statSync(filePath);
                    const mode = (stats.mode & parseInt('777', 8)).toString(8);
                    if (mode === '600') {
                        securityChecks.push({ name: `${file} 权限`, passed: true });
                        console.log(`✅ ${file} 权限设置正确 (${mode})`);
                    } else {
                        securityChecks.push({ name: `${file} 权限`, passed: false });
                        this.warnings.push(`${file} 权限不安全: ${mode}`);
                        console.log(`⚠️  ${file} 权限不安全: ${mode}`);
                    }
                } catch (error) {
                    console.log(`⚠️  无法检查 ${file} 权限`);
                }
            }
        }

        this.validationResults.security = {
            checks: securityChecks,
            passedCount: securityChecks.filter(c => c.passed).length,
            totalCount: securityChecks.length
        };
    }

    /**
     * 验证性能指标
     */
    async validatePerformance() {
        console.log('⚡ 验证性能指标...');

        try {
            const response = await axios.get(`${this.baseUrl}/api/metrics`, {
                headers: { Authorization: `Bearer ${this.adminToken}` },
                timeout: 5000
            });

            const metrics = response.data;
            this.validationResults.performance = {
                responseTime: metrics.averageResponseTime || 'N/A',
                requestCount: metrics.totalRequests || 0,
                errorRate: metrics.errorRate || 'N/A',
                uptime: metrics.uptime || 'N/A'
            };

            console.log(`✅ 平均响应时间: ${metrics.averageResponseTime || 'N/A'}`);
            console.log(`✅ 总请求数: ${metrics.totalRequests || 0}`);
            console.log(`✅ 错误率: ${metrics.errorRate || 'N/A'}`);

        } catch (error) {
            this.warnings.push('无法获取性能指标');
            console.log('⚠️  无法获取性能指标');
        }
    }

    /**
     * 验证文档完整性
     */
    async validateDocumentation() {
        console.log('📚 验证文档完整性...');

        const requiredDocs = [
            'README.md',
            'docs/deployment-guide.md',
            'docs/operations-manual.md',
            'docs/api-documentation.md'
        ];

        let docsExist = 0;
        const docStatus = [];

        for (const doc of requiredDocs) {
            const docPath = path.join(__dirname, '..', doc);
            if (fs.existsSync(docPath)) {
                docsExist++;
                docStatus.push({ name: doc, exists: true });
                console.log(`✅ ${doc} 存在`);
            } else {
                docStatus.push({ name: doc, exists: false });
                this.warnings.push(`文档缺失: ${doc}`);
                console.log(`⚠️  ${doc} 不存在`);
            }
        }

        this.validationResults.documentation = {
            total: requiredDocs.length,
            existing: docsExist,
            completeness: (docsExist / requiredDocs.length * 100).toFixed(2) + '%',
            status: docStatus
        };
    }

    /**
     * 验证部署准备
     */
    async validateDeployment() {
        console.log('🚀 验证部署准备...');

        const deploymentChecks = [];

        // 检查package.json
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
            if (packageJson.scripts && packageJson.scripts.start) {
                deploymentChecks.push({ name: 'start脚本', passed: true });
                console.log('✅ start脚本已配置');
            } else {
                deploymentChecks.push({ name: 'start脚本', passed: false });
                this.issues.push('package.json缺少start脚本');
                console.log('❌ package.json缺少start脚本');
            }
        } catch (error) {
            deploymentChecks.push({ name: 'package.json', passed: false });
            this.issues.push('package.json文件问题');
            console.log('❌ package.json文件问题');
        }

        // 检查环境配置
        const envExample = path.join(__dirname, '..', '.env.example');
        if (fs.existsSync(envExample)) {
            deploymentChecks.push({ name: '.env.example', passed: true });
            console.log('✅ .env.example 存在');
        } else {
            deploymentChecks.push({ name: '.env.example', passed: false });
            this.warnings.push('.env.example文件缺失');
            console.log('⚠️  .env.example文件缺失');
        }

        // 检查数据库初始化脚本
        const initScript = path.join(__dirname, '..', 'scripts', 'init-database.js');
        if (fs.existsSync(initScript)) {
            deploymentChecks.push({ name: '数据库初始化脚本', passed: true });
            console.log('✅ 数据库初始化脚本存在');
        } else {
            deploymentChecks.push({ name: '数据库初始化脚本', passed: false });
            this.warnings.push('数据库初始化脚本缺失');
            console.log('⚠️  数据库初始化脚本缺失');
        }

        this.validationResults.deployment = {
            checks: deploymentChecks,
            readiness: (deploymentChecks.filter(c => c.passed).length / deploymentChecks.length * 100).toFixed(2) + '%'
        };
    }

    /**
     * 生成验证报告
     */
    generateReport() {
        const totalIssues = this.issues.length;
        const totalWarnings = this.warnings.length;
        
        let overallScore = 100;
        overallScore -= totalIssues * 10; // 每个问题扣10分
        overallScore -= totalWarnings * 5; // 每个警告扣5分
        overallScore = Math.max(0, overallScore);

        this.validationResults.summary = {
            overallScore,
            totalIssues,
            totalWarnings,
            status: overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : overallScore >= 40 ? 'fair' : 'poor',
            timestamp: new Date().toISOString()
        };

        // 生成建议
        if (totalIssues > 0) {
            this.recommendations.push('立即修复所有严重问题');
        }
        if (totalWarnings > 0) {
            this.recommendations.push('处理所有警告项目');
        }
        if (overallScore < 80) {
            this.recommendations.push('建议在生产部署前进行全面优化');
        }
    }

    /**
     * 打印验证摘要
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 最终系统验证报告');
        console.log('='.repeat(60));

        const summary = this.validationResults.summary;
        console.log(`🏆 总体评分: ${summary.overallScore}/100 (${summary.status.toUpperCase()})`);
        console.log(`🔴 严重问题: ${summary.totalIssues} 个`);
        console.log(`🟡 警告项目: ${summary.totalWarnings} 个`);

        if (this.issues.length > 0) {
            console.log('\n🚨 严重问题:');
            this.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  警告项目:');
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }

        if (this.recommendations.length > 0) {
            console.log('\n💡 建议:');
            this.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        console.log('\n📊 详细结果:');
        console.log(`   系统健康: ${this.validationResults.systemHealth.status || 'unknown'}`);
        console.log(`   API端点: ${this.validationResults.apiEndpoints.successRate || 'N/A'}`);
        console.log(`   安全检查: ${this.validationResults.security.passedCount || 0}/${this.validationResults.security.totalCount || 0}`);
        console.log(`   文档完整性: ${this.validationResults.documentation.completeness || 'N/A'}`);
        console.log(`   部署准备: ${this.validationResults.deployment.readiness || 'N/A'}`);

        console.log('\n' + '='.repeat(60));
    }

    /**
     * 保存验证报告
     */
    async saveReport() {
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportData = {
            ...this.validationResults,
            issues: this.issues,
            warnings: this.warnings,
            recommendations: this.recommendations,
            generatedAt: new Date().toISOString()
        };

        const reportPath = path.join(reportsDir, `final-validation-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        console.log(`📄 验证报告已保存到: ${reportPath}`);
    }
}

// 执行验证
if (require.main === module) {
    const validator = new FinalSystemValidator();
    validator.runValidation().catch(error => {
        console.error('验证失败:', error);
        process.exit(1);
    });
}

module.exports = FinalSystemValidator;