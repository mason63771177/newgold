#!/usr/bin/env node

/**
 * 安全审计脚本
 * 检查系统安全配置和潜在漏洞
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SecurityAuditor {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.recommendations = [];
    }

    /**
     * 添加安全问题
     */
    addIssue(severity, category, description, recommendation) {
        const issue = {
            severity,
            category,
            description,
            recommendation,
            timestamp: new Date().toISOString()
        };

        if (severity === 'high' || severity === 'critical') {
            this.issues.push(issue);
        } else {
            this.warnings.push(issue);
        }
    }

    /**
     * 检查环境变量安全性
     */
    async checkEnvironmentSecurity() {
        console.log('🔍 检查环境变量安全性...');
        
        try {
            const envPath = path.join(__dirname, '../.env');
            const envContent = await fs.readFile(envPath, 'utf8');
            
            // 检查敏感信息是否使用默认值
            const defaultValues = [
                { key: 'JWT_SECRET', default: 'your_jwt_secret', severity: 'critical' },
                { key: 'DB_PASSWORD', default: 'password', severity: 'critical' },
                { key: 'TATUM_API_KEY', default: 'your_api_key', severity: 'high' },
                { key: 'MAIN_WALLET_MNEMONIC', default: 'your_mnemonic', severity: 'critical' }
            ];

            defaultValues.forEach(({ key, default: defaultValue, severity }) => {
                if (envContent.includes(`${key}=${defaultValue}`)) {
                    this.addIssue(
                        severity,
                        'Environment Security',
                        `${key} 使用默认值`,
                        `请为 ${key} 设置安全的自定义值`
                    );
                }
            });

            // 检查密码强度
            const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
            if (jwtSecretMatch && jwtSecretMatch[1].length < 32) {
                this.addIssue(
                    'high',
                    'Environment Security',
                    'JWT_SECRET 长度不足',
                    'JWT_SECRET 应至少包含32个字符'
                );
            }

            // 检查生产环境配置
            if (!envContent.includes('NODE_ENV=production')) {
                this.addIssue(
                    'medium',
                    'Environment Security',
                    '未设置生产环境模式',
                    '在生产环境中设置 NODE_ENV=production'
                );
            }

        } catch (error) {
            this.addIssue(
                'medium',
                'Environment Security',
                '无法读取 .env 文件',
                '确保 .env 文件存在且可读'
            );
        }
    }

    /**
     * 检查依赖包安全性
     */
    async checkDependencySecurity() {
        console.log('🔍 检查依赖包安全性...');
        
        try {
            // 运行 npm audit
            const auditResult = execSync('npm audit --json', { 
                encoding: 'utf8',
                cwd: path.join(__dirname, '..')
            });
            
            const audit = JSON.parse(auditResult);
            
            if (audit.vulnerabilities) {
                Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
                    const severity = vuln.severity;
                    this.addIssue(
                        severity,
                        'Dependency Security',
                        `${pkg} 存在 ${severity} 级别安全漏洞`,
                        `运行 npm audit fix 或手动更新 ${pkg}`
                    );
                });
            }

        } catch (error) {
            // npm audit 在发现漏洞时会返回非零退出码
            try {
                const auditResult = error.stdout;
                const audit = JSON.parse(auditResult);
                
                if (audit.vulnerabilities) {
                    Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
                        const severity = vuln.severity;
                        this.addIssue(
                            severity,
                            'Dependency Security',
                            `${pkg} 存在 ${severity} 级别安全漏洞`,
                            `运行 npm audit fix 或手动更新 ${pkg}`
                        );
                    });
                }
            } catch (parseError) {
                this.addIssue(
                    'medium',
                    'Dependency Security',
                    '无法解析 npm audit 结果',
                    '手动运行 npm audit 检查依赖安全性'
                );
            }
        }
    }

    /**
     * 检查文件权限
     */
    async checkFilePermissions() {
        console.log('🔍 检查文件权限...');
        
        const sensitiveFiles = [
            '.env',
            'config/database.js',
            'middleware/auth.js'
        ];

        for (const file of sensitiveFiles) {
            try {
                const filePath = path.join(__dirname, '..', file);
                const stats = await fs.stat(filePath);
                const mode = stats.mode & parseInt('777', 8);
                
                // 检查是否对其他用户可读
                if (mode & parseInt('044', 8)) {
                    this.addIssue(
                        'high',
                        'File Permissions',
                        `${file} 对其他用户可读`,
                        `运行 chmod 600 ${file} 限制文件权限`
                    );
                }
            } catch (error) {
                // 文件不存在，跳过
            }
        }
    }

    /**
     * 检查代码安全性
     */
    async checkCodeSecurity() {
        console.log('🔍 检查代码安全性...');
        
        const codeFiles = await this.findJSFiles(path.join(__dirname, '..'));
        
        for (const file of codeFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                
                // 检查硬编码密码
                const passwordPatterns = [
                    /password\s*=\s*['"][^'"]{1,20}['"]/gi,
                    /secret\s*=\s*['"][^'"]{1,50}['"]/gi,
                    /api_key\s*=\s*['"][^'"]{1,50}['"]/gi
                ];

                passwordPatterns.forEach(pattern => {
                    const matches = content.match(pattern);
                    if (matches) {
                        matches.forEach(match => {
                            if (!match.includes('process.env') && 
                                !match.includes('your_') && 
                                !match.includes('example')) {
                                this.addIssue(
                                    'high',
                                    'Code Security',
                                    `${path.relative(process.cwd(), file)} 包含硬编码敏感信息`,
                                    '使用环境变量存储敏感信息'
                                );
                            }
                        });
                    }
                });

                // 检查 SQL 注入风险
                const sqlPatterns = [
                    /query\s*\(\s*['"`][^'"`]*\$\{[^}]+\}[^'"`]*['"`]/gi,
                    /query\s*\(\s*['"`][^'"`]*\+[^'"`]*['"`]/gi
                ];

                sqlPatterns.forEach(pattern => {
                    if (pattern.test(content)) {
                        this.addIssue(
                            'high',
                            'Code Security',
                            `${path.relative(process.cwd(), file)} 可能存在 SQL 注入风险`,
                            '使用参数化查询或 ORM'
                        );
                    }
                });

                // 检查 XSS 风险
                if (content.includes('innerHTML') && !content.includes('DOMPurify')) {
                    this.addIssue(
                        'medium',
                        'Code Security',
                        `${path.relative(process.cwd(), file)} 可能存在 XSS 风险`,
                        '使用 DOMPurify 清理用户输入'
                    );
                }

            } catch (error) {
                // 跳过无法读取的文件
            }
        }
    }

    /**
     * 查找 JavaScript 文件
     */
    async findJSFiles(dir) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory() && 
                    !entry.name.startsWith('.') && 
                    entry.name !== 'node_modules') {
                    files.push(...await this.findJSFiles(fullPath));
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // 跳过无法访问的目录
        }
        
        return files;
    }

    /**
     * 检查网络安全配置
     */
    async checkNetworkSecurity() {
        console.log('🔍 检查网络安全配置...');
        
        try {
            const serverPath = path.join(__dirname, '../server.js');
            const serverContent = await fs.readFile(serverPath, 'utf8');
            
            // 检查是否启用 HTTPS
            if (!serverContent.includes('https') && !serverContent.includes('ssl')) {
                this.addIssue(
                    'high',
                    'Network Security',
                    '未配置 HTTPS',
                    '在生产环境中启用 HTTPS'
                );
            }

            // 检查是否使用安全头
            const securityHeaders = ['helmet', 'cors', 'csp'];
            securityHeaders.forEach(header => {
                if (!serverContent.includes(header)) {
                    this.addIssue(
                        'medium',
                        'Network Security',
                        `未配置 ${header} 安全头`,
                        `添加 ${header} 中间件提高安全性`
                    );
                }
            });

        } catch (error) {
            this.addIssue(
                'medium',
                'Network Security',
                '无法检查网络安全配置',
                '手动检查服务器安全配置'
            );
        }
    }

    /**
     * 检查数据库安全配置
     */
    async checkDatabaseSecurity() {
        console.log('🔍 检查数据库安全配置...');
        
        try {
            const dbConfigPath = path.join(__dirname, '../config/database.js');
            const dbContent = await fs.readFile(dbConfigPath, 'utf8');
            
            // 检查是否使用 SSL
            if (!dbContent.includes('ssl') && !dbContent.includes('SSL')) {
                this.addIssue(
                    'medium',
                    'Database Security',
                    '数据库连接未启用 SSL',
                    '在生产环境中启用数据库 SSL 连接'
                );
            }

            // 检查连接池配置
            if (!dbContent.includes('connectionLimit')) {
                this.addIssue(
                    'low',
                    'Database Security',
                    '未配置数据库连接池限制',
                    '设置合理的连接池大小限制'
                );
            }

        } catch (error) {
            this.addIssue(
                'medium',
                'Database Security',
                '无法检查数据库安全配置',
                '手动检查数据库安全设置'
            );
        }
    }

    /**
     * 生成安全报告
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: this.issues.length,
                totalWarnings: this.warnings.length,
                criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
                highIssues: this.issues.filter(i => i.severity === 'high').length,
                mediumIssues: [...this.issues, ...this.warnings].filter(i => i.severity === 'medium').length,
                lowIssues: [...this.issues, ...this.warnings].filter(i => i.severity === 'low').length
            },
            issues: this.issues,
            warnings: this.warnings,
            recommendations: this.recommendations
        };

        return report;
    }

    /**
     * 打印报告
     */
    printReport(report) {
        console.log('\n📋 安全审计报告');
        console.log('='.repeat(50));
        
        console.log('\n📊 概要统计:');
        console.log(`- 严重问题: ${report.summary.criticalIssues} 个`);
        console.log(`- 高风险问题: ${report.summary.highIssues} 个`);
        console.log(`- 中风险问题: ${report.summary.mediumIssues} 个`);
        console.log(`- 低风险问题: ${report.summary.lowIssues} 个`);
        console.log(`- 总计: ${report.summary.totalIssues + report.summary.totalWarnings} 个问题`);

        if (report.issues.length > 0) {
            console.log('\n🚨 严重安全问题:');
            report.issues.forEach((issue, index) => {
                console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category}`);
                console.log(`   问题: ${issue.description}`);
                console.log(`   建议: ${issue.recommendation}`);
            });
        }

        if (report.warnings.length > 0) {
            console.log('\n⚠️  安全警告:');
            report.warnings.forEach((warning, index) => {
                console.log(`\n${index + 1}. [${warning.severity.toUpperCase()}] ${warning.category}`);
                console.log(`   问题: ${warning.description}`);
                console.log(`   建议: ${warning.recommendation}`);
            });
        }

        // 安全评分
        const totalScore = 100;
        const criticalPenalty = report.summary.criticalIssues * 20;
        const highPenalty = report.summary.highIssues * 10;
        const mediumPenalty = report.summary.mediumIssues * 5;
        const lowPenalty = report.summary.lowIssues * 2;
        
        const securityScore = Math.max(0, totalScore - criticalPenalty - highPenalty - mediumPenalty - lowPenalty);
        
        console.log(`\n🏆 安全评分: ${securityScore}/100`);
        
        if (securityScore >= 90) {
            console.log('✅ 安全状况良好');
        } else if (securityScore >= 70) {
            console.log('⚠️  安全状况一般，建议改进');
        } else {
            console.log('🚨 安全状况较差，需要立即处理');
        }
    }

    /**
     * 保存报告
     */
    async saveReport(report) {
        const reportDir = path.join(__dirname, '../reports');
        await fs.mkdir(reportDir, { recursive: true });
        
        const filename = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(reportDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        console.log(`\n📄 报告已保存到: ${filepath}`);
    }

    /**
     * 运行完整安全审计
     */
    async runFullAudit() {
        console.log('🔒 开始安全审计...\n');
        
        await this.checkEnvironmentSecurity();
        await this.checkDependencySecurity();
        await this.checkFilePermissions();
        await this.checkCodeSecurity();
        await this.checkNetworkSecurity();
        await this.checkDatabaseSecurity();
        
        const report = this.generateReport();
        this.printReport(report);
        await this.saveReport(report);
        
        // 根据严重程度设置退出码
        if (report.summary.criticalIssues > 0) {
            process.exit(2);
        } else if (report.summary.highIssues > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

// 主函数
async function main() {
    const auditor = new SecurityAuditor();
    await auditor.runFullAudit();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 安全审计失败:', error.message);
        process.exit(1);
    });
}

module.exports = SecurityAuditor;