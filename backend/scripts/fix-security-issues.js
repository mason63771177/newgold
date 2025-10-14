#!/usr/bin/env node

/**
 * 安全问题修复脚本
 * 自动修复已识别的安全问题
 */

const fs = require('fs').promises;
const path = require('path');

class SecurityFixer {
    constructor() {
        this.fixedIssues = [];
        this.failedFixes = [];
    }

    /**
     * 修复前端文件中的XSS风险
     */
    async fixXSSIssues() {
        console.log('🔧 修复 XSS 安全问题...');
        
        const frontendFiles = [
            'public/admin-notification-center.js',
            'public/admin-report-system.js',
            'public/admin-wallet-management.js',
            'public/admin-system-monitoring.js',
            'public/admin-task-management.js',
            'public/admin-transaction-analytics.js',
            'public/admin-user-management.js'
        ];

        for (const file of frontendFiles) {
            try {
                const filePath = path.join(__dirname, '..', file);
                const content = await fs.readFile(filePath, 'utf8');
                
                // 检查是否已经包含 DOMPurify
                if (content.includes('DOMPurify')) {
                    console.log(`✅ ${file} 已经使用 DOMPurify`);
                    continue;
                }

                // 检查是否使用了 innerHTML
                if (content.includes('innerHTML')) {
                    // 在文件开头添加 DOMPurify 引用
                    const domPurifyScript = `
// 安全防护：使用 DOMPurify 防止 XSS 攻击
// 在生产环境中，请通过 CDN 或 npm 包引入 DOMPurify
// <script src="https://cdn.jsdelivr.net/npm/dompurify@2.4.0/dist/purify.min.js"></script>

// 如果 DOMPurify 不可用，提供基本的 HTML 转义函数
if (typeof DOMPurify === 'undefined') {
    window.DOMPurify = {
        sanitize: function(html) {
            const div = document.createElement('div');
            div.textContent = html;
            return div.innerHTML;
        }
    };
}

`;

                    // 替换 innerHTML 使用
                    let fixedContent = content.replace(
                        /(\w+)\.innerHTML\s*=\s*([^;]+);/g,
                        '$1.innerHTML = DOMPurify.sanitize($2);'
                    );

                    // 在文件开头添加 DOMPurify 引用
                    fixedContent = domPurifyScript + fixedContent;

                    await fs.writeFile(filePath, fixedContent);
                    this.fixedIssues.push(`修复 ${file} 中的 XSS 风险`);
                    console.log(`✅ 已修复 ${file} 中的 XSS 风险`);
                }
            } catch (error) {
                this.failedFixes.push(`修复 ${file} 失败: ${error.message}`);
                console.log(`❌ 修复 ${file} 失败: ${error.message}`);
            }
        }
    }

    /**
     * 修复数据库SSL配置
     */
    async fixDatabaseSSL() {
        console.log('🔧 修复数据库 SSL 配置...');
        
        try {
            const dbConfigPath = path.join(__dirname, '../config/database.js');
            const content = await fs.readFile(dbConfigPath, 'utf8');
            
            // 检查是否已经配置了 SSL
            if (content.includes('ssl:') || content.includes('SSL')) {
                console.log('✅ 数据库已配置 SSL');
                return;
            }

            // 添加 SSL 配置注释和示例
            const sslConfig = `
  // SSL 配置 (生产环境建议启用)
  // ssl: process.env.NODE_ENV === 'production' ? {
  //   rejectUnauthorized: false, // 开发环境可设为 false，生产环境建议设为 true
  //   ca: fs.readFileSync('path/to/ca-cert.pem'),
  //   key: fs.readFileSync('path/to/client-key.pem'),
  //   cert: fs.readFileSync('path/to/client-cert.pem')
  // } : false,`;

            // 在连接配置中添加 SSL 选项
            const fixedContent = content.replace(
                /(const pool = mysql\.createPool\(\{[^}]+)(}\);)/s,
                `$1${sslConfig}\n$2`
            );

            await fs.writeFile(dbConfigPath, fixedContent);
            this.fixedIssues.push('添加数据库 SSL 配置注释');
            console.log('✅ 已添加数据库 SSL 配置注释');
            
        } catch (error) {
            this.failedFixes.push(`修复数据库 SSL 配置失败: ${error.message}`);
            console.log(`❌ 修复数据库 SSL 配置失败: ${error.message}`);
        }
    }

    /**
     * 修复文件权限
     */
    async fixFilePermissions() {
        console.log('🔧 修复文件权限...');
        
        const sensitiveFiles = [
            '.env',
            'config/database.js',
            'middleware/auth.js'
        ];

        for (const file of sensitiveFiles) {
            try {
                const filePath = path.join(__dirname, '..', file);
                
                // 检查文件是否存在
                await fs.access(filePath);
                
                // 设置文件权限为 600 (仅所有者可读写)
                await fs.chmod(filePath, 0o600);
                
                this.fixedIssues.push(`设置 ${file} 文件权限为 600`);
                console.log(`✅ 已设置 ${file} 文件权限为 600`);
                
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    this.failedFixes.push(`修复 ${file} 权限失败: ${error.message}`);
                    console.log(`❌ 修复 ${file} 权限失败: ${error.message}`);
                }
            }
        }
    }

    /**
     * 创建安全配置文件
     */
    async createSecurityConfig() {
        console.log('🔧 创建安全配置文件...');
        
        const securityConfig = `/**
 * 安全配置文件
 * 包含应用程序的安全设置和最佳实践
 */

module.exports = {
    // JWT 配置
    jwt: {
        // JWT 密钥应至少 32 个字符
        secretMinLength: 32,
        // JWT 过期时间
        expiresIn: '24h',
        // 刷新令牌过期时间
        refreshExpiresIn: '7d'
    },

    // 密码策略
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    },

    // 速率限制
    rateLimit: {
        // 全局限制
        global: {
            windowMs: 15 * 60 * 1000, // 15分钟
            max: 100 // 每个IP最多100个请求
        },
        // 登录限制
        login: {
            windowMs: 15 * 60 * 1000, // 15分钟
            max: 5 // 每个IP最多5次登录尝试
        },
        // API限制
        api: {
            windowMs: 1 * 60 * 1000, // 1分钟
            max: 60 // 每个IP每分钟最多60个API请求
        }
    },

    // 会话配置
    session: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        sameSite: 'strict'
    },

    // CORS 配置
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.ALLOWED_ORIGINS?.split(',') || []
            : ['http://localhost:8000', 'http://127.0.0.1:8000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // 内容安全策略
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },

    // 文件上传限制
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf'
        ],
        maxFiles: 5
    },

    // 数据库安全
    database: {
        // 连接池配置
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
        // SSL 配置
        ssl: process.env.NODE_ENV === 'production',
        // 查询超时
        queryTimeout: 30000
    },

    // Redis 安全
    redis: {
        // 连接超时
        connectTimeout: 10000,
        // 命令超时
        commandTimeout: 5000,
        // 重试配置
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
    },

    // 日志配置
    logging: {
        // 敏感字段，不应记录在日志中
        sensitiveFields: [
            'password',
            'token',
            'secret',
            'key',
            'mnemonic',
            'privateKey',
            'authorization'
        ],
        // 日志级别
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    },

    // 监控配置
    monitoring: {
        // 健康检查间隔
        healthCheckInterval: 30000, // 30秒
        // 性能监控
        performanceMonitoring: true,
        // 错误追踪
        errorTracking: true
    }
};`;

        try {
            const configPath = path.join(__dirname, '../config/security.js');
            await fs.writeFile(configPath, securityConfig);
            this.fixedIssues.push('创建安全配置文件');
            console.log('✅ 已创建安全配置文件');
        } catch (error) {
            this.failedFixes.push(`创建安全配置文件失败: ${error.message}`);
            console.log(`❌ 创建安全配置文件失败: ${error.message}`);
        }
    }

    /**
     * 生成修复报告
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFixed: this.fixedIssues.length,
                totalFailed: this.failedFixes.length
            },
            fixedIssues: this.fixedIssues,
            failedFixes: this.failedFixes
        };

        return report;
    }

    /**
     * 打印修复报告
     */
    printReport(report) {
        console.log('\n📋 安全修复报告');
        console.log('='.repeat(50));
        
        console.log(`\n✅ 成功修复: ${report.summary.totalFixed} 个问题`);
        if (report.fixedIssues.length > 0) {
            report.fixedIssues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
            });
        }

        if (report.summary.totalFailed > 0) {
            console.log(`\n❌ 修复失败: ${report.summary.totalFailed} 个问题`);
            report.failedFixes.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
            });
        }

        console.log('\n🔒 安全建议:');
        console.log('1. 定期运行 npm audit 检查依赖安全性');
        console.log('2. 在生产环境中启用 HTTPS 和数据库 SSL');
        console.log('3. 定期更新依赖包到最新安全版本');
        console.log('4. 实施强密码策略和多因素认证');
        console.log('5. 定期备份数据并测试恢复流程');
        console.log('6. 监控系统日志和异常活动');
    }

    /**
     * 保存修复报告
     */
    async saveReport(report) {
        const reportDir = path.join(__dirname, '../reports');
        await fs.mkdir(reportDir, { recursive: true });
        
        const filename = `security-fixes-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(reportDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        console.log(`\n📄 修复报告已保存到: ${filepath}`);
    }

    /**
     * 运行所有安全修复
     */
    async runAllFixes() {
        console.log('🔧 开始修复安全问题...\n');
        
        await this.fixXSSIssues();
        await this.fixDatabaseSSL();
        await this.fixFilePermissions();
        await this.createSecurityConfig();
        
        const report = this.generateReport();
        this.printReport(report);
        await this.saveReport(report);
        
        console.log('\n🎉 安全修复完成！');
    }
}

// 主函数
async function main() {
    const fixer = new SecurityFixer();
    await fixer.runAllFixes();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 安全修复失败:', error.message);
        process.exit(1);
    });
}

module.exports = SecurityFixer;