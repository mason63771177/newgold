#!/usr/bin/env node

/**
 * 监控仪表板安装和配置脚本
 * 自动安装依赖并配置监控仪表板
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class MonitoringDashboardSetup {
    constructor() {
        this.requiredPackages = [
            'blessed',
            'blessed-contrib',
            'cli-table3',
            'chalk',
            'commander'
        ];
        this.installedPackages = [];
        this.failedPackages = [];
    }

    /**
     * 检查包是否已安装
     */
    async checkPackageInstalled(packageName) {
        try {
            require.resolve(packageName);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 安装缺失的依赖包
     */
    async installMissingPackages() {
        console.log('🔍 检查监控仪表板依赖...');
        
        const missingPackages = [];
        
        for (const pkg of this.requiredPackages) {
            const isInstalled = await this.checkPackageInstalled(pkg);
            if (!isInstalled) {
                missingPackages.push(pkg);
            } else {
                console.log(`✅ ${pkg} 已安装`);
            }
        }

        if (missingPackages.length === 0) {
            console.log('✅ 所有依赖包已安装');
            return;
        }

        console.log(`📦 需要安装 ${missingPackages.length} 个依赖包: ${missingPackages.join(', ')}`);
        
        for (const pkg of missingPackages) {
            try {
                console.log(`📦 正在安装 ${pkg}...`);
                execSync(`npm install ${pkg}`, { 
                    stdio: 'inherit',
                    cwd: path.join(__dirname, '..')
                });
                this.installedPackages.push(pkg);
                console.log(`✅ ${pkg} 安装成功`);
            } catch (error) {
                this.failedPackages.push({ pkg, error: error.message });
                console.log(`❌ ${pkg} 安装失败: ${error.message}`);
            }
        }
    }

    /**
     * 创建监控仪表板启动脚本
     */
    async createDashboardLauncher() {
        console.log('🔧 创建监控仪表板启动脚本...');
        
        const launcherScript = `#!/usr/bin/env node

/**
 * 监控仪表板启动器
 * 简化监控仪表板的启动过程
 */

const { spawn } = require('child_process');
const path = require('path');

class DashboardLauncher {
    constructor() {
        this.dashboardPath = path.join(__dirname, 'monitoring-dashboard.js');
    }

    /**
     * 启动监控仪表板
     */
    launch(options = {}) {
        const {
            interval = 5000,
            host = 'localhost',
            port = 3000,
            timeout = 30
        } = options;

        console.log('🚀 启动监控仪表板...');
        console.log(\`📊 监控间隔: \${interval}ms\`);
        console.log(\`🌐 监控地址: http://\${host}:\${port}\`);
        console.log(\`⏱️  超时时间: \${timeout}秒\`);
        console.log('按 Ctrl+C 退出\\n');

        const args = [
            this.dashboardPath,
            '--interval', interval.toString(),
            '--host', host,
            '--port', port.toString(),
            '--timeout', timeout.toString()
        ];

        const dashboard = spawn('node', args, {
            stdio: 'inherit',
            cwd: __dirname
        });

        dashboard.on('error', (error) => {
            console.error('❌ 启动监控仪表板失败:', error.message);
            process.exit(1);
        });

        dashboard.on('exit', (code) => {
            if (code !== 0) {
                console.error(\`❌ 监控仪表板异常退出，退出码: \${code}\`);
                process.exit(code);
            }
            console.log('👋 监控仪表板已退出');
        });

        // 处理进程信号
        process.on('SIGINT', () => {
            console.log('\\n🛑 正在关闭监控仪表板...');
            dashboard.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
            console.log('\\n🛑 正在关闭监控仪表板...');
            dashboard.kill('SIGTERM');
        });
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(\`
监控仪表板启动器

用法:
  node launch-dashboard.js [选项]

选项:
  --interval <ms>    监控数据刷新间隔 (默认: 5000ms)
  --host <host>      监控的服务器地址 (默认: localhost)
  --port <port>      监控的服务器端口 (默认: 3000)
  --timeout <sec>    请求超时时间 (默认: 30秒)
  --help             显示帮助信息

示例:
  node launch-dashboard.js
  node launch-dashboard.js --interval 3000 --port 8080
  node launch-dashboard.js --host 192.168.1.100 --port 3000
\`);
    }
}

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--interval':
                options.interval = parseInt(args[++i]) || 5000;
                break;
            case '--host':
                options.host = args[++i] || 'localhost';
                break;
            case '--port':
                options.port = parseInt(args[++i]) || 3000;
                break;
            case '--timeout':
                options.timeout = parseInt(args[++i]) || 30;
                break;
            case '--help':
                return { help: true };
            default:
                console.warn(\`⚠️  未知参数: \${args[i]}\`);
                break;
        }
    }

    return options;
}

// 主函数
function main() {
    const launcher = new DashboardLauncher();
    const options = parseArgs();

    if (options.help) {
        launcher.showHelp();
        return;
    }

    launcher.launch(options);
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = DashboardLauncher;`;

        try {
            const launcherPath = path.join(__dirname, 'launch-dashboard.js');
            await fs.writeFile(launcherPath, launcherScript);
            
            // 设置执行权限
            await fs.chmod(launcherPath, 0o755);
            
            console.log('✅ 监控仪表板启动脚本创建成功');
            return launcherPath;
        } catch (error) {
            console.log(`❌ 创建启动脚本失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 创建监控配置文件
     */
    async createMonitoringConfig() {
        console.log('🔧 创建监控配置文件...');
        
        const configContent = `/**
 * 监控仪表板配置文件
 */

module.exports = {
    // 服务器配置
    server: {
        host: process.env.MONITOR_HOST || 'localhost',
        port: process.env.MONITOR_PORT || 3000,
        timeout: process.env.MONITOR_TIMEOUT || 30000
    },

    // 刷新间隔配置
    intervals: {
        // 仪表板刷新间隔 (毫秒)
        dashboard: 5000,
        // 健康检查间隔 (毫秒)
        healthCheck: 10000,
        // 性能指标收集间隔 (毫秒)
        metrics: 3000,
        // 系统资源监控间隔 (毫秒)
        system: 5000
    },

    // 显示配置
    display: {
        // 图表历史数据点数
        maxDataPoints: 50,
        // 日志显示行数
        maxLogLines: 100,
        // 表格显示行数
        maxTableRows: 20,
        // 颜色主题
        theme: {
            primary: 'cyan',
            success: 'green',
            warning: 'yellow',
            error: 'red',
            info: 'blue'
        }
    },

    // 告警配置
    alerts: {
        // CPU 使用率告警阈值 (%)
        cpuThreshold: 80,
        // 内存使用率告警阈值 (%)
        memoryThreshold: 85,
        // 响应时间告警阈值 (毫秒)
        responseTimeThreshold: 1000,
        // 错误率告警阈值 (%)
        errorRateThreshold: 5
    },

    // API 端点配置
    endpoints: {
        health: '/api/monitoring/health',
        metrics: '/api/monitoring/metrics',
        system: '/api/monitoring/system',
        logs: '/api/monitoring/logs'
    },

    // 认证配置
    auth: {
        // 是否启用认证
        enabled: process.env.NODE_ENV === 'production',
        // 管理员令牌
        adminToken: process.env.ADMIN_TOKEN || 'admin-mock-token-for-development'
    }
};`;

        try {
            const configPath = path.join(__dirname, '../config/monitoring.js');
            await fs.writeFile(configPath, configContent);
            console.log('✅ 监控配置文件创建成功');
            return configPath;
        } catch (error) {
            console.log(`❌ 创建监控配置文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 创建快速启动脚本
     */
    async createQuickStartScript() {
        console.log('🔧 创建快速启动脚本...');
        
        const quickStartScript = `#!/bin/bash

# 监控仪表板快速启动脚本

echo "🚀 启动裂金7日监控仪表板"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查服务器是否运行
echo "🔍 检查服务器状态..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 服务器正在运行"
else
    echo "⚠️  服务器未运行，请先启动服务器: node server.js"
    echo "继续启动监控仪表板..."
fi

# 启动监控仪表板
echo "📊 启动监控仪表板..."
echo "提示: 按 Ctrl+C 退出监控仪表板"
echo ""

cd scripts
node launch-dashboard.js "$@"`;

        try {
            const scriptPath = path.join(__dirname, '../start-monitoring.sh');
            await fs.writeFile(scriptPath, quickStartScript);
            
            // 设置执行权限
            await fs.chmod(scriptPath, 0o755);
            
            console.log('✅ 快速启动脚本创建成功');
            return scriptPath;
        } catch (error) {
            console.log(`❌ 创建快速启动脚本失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 验证安装
     */
    async verifyInstallation() {
        console.log('🔍 验证安装...');
        
        let allGood = true;
        
        // 检查依赖包
        for (const pkg of this.requiredPackages) {
            const isInstalled = await this.checkPackageInstalled(pkg);
            if (isInstalled) {
                console.log(`✅ ${pkg} 可用`);
            } else {
                console.log(`❌ ${pkg} 不可用`);
                allGood = false;
            }
        }

        // 检查脚本文件
        const scriptFiles = [
            'scripts/launch-dashboard.js',
            'scripts/monitoring-dashboard.js',
            'config/monitoring.js',
            'start-monitoring.sh'
        ];

        for (const file of scriptFiles) {
            try {
                const filePath = path.join(__dirname, '..', file);
                await fs.access(filePath);
                console.log(`✅ ${file} 存在`);
            } catch (error) {
                console.log(`❌ ${file} 不存在`);
                allGood = false;
            }
        }

        return allGood;
    }

    /**
     * 生成安装报告
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPackages: this.requiredPackages.length,
                installedPackages: this.installedPackages.length,
                failedPackages: this.failedPackages.length
            },
            installedPackages: this.installedPackages,
            failedPackages: this.failedPackages,
            requiredPackages: this.requiredPackages
        };

        return report;
    }

    /**
     * 打印安装报告
     */
    printReport(report) {
        console.log('\n📋 监控仪表板安装报告');
        console.log('='.repeat(50));
        
        console.log(`\n📦 依赖包状态:`);
        console.log(`- 总计: ${report.summary.totalPackages} 个`);
        console.log(`- 已安装: ${report.summary.installedPackages} 个`);
        console.log(`- 安装失败: ${report.summary.failedPackages} 个`);

        if (report.installedPackages.length > 0) {
            console.log('\n✅ 成功安装的包:');
            report.installedPackages.forEach((pkg, index) => {
                console.log(`  ${index + 1}. ${pkg}`);
            });
        }

        if (report.failedPackages.length > 0) {
            console.log('\n❌ 安装失败的包:');
            report.failedPackages.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.pkg}: ${item.error}`);
            });
        }

        console.log('\n🚀 使用方法:');
        console.log('1. 启动服务器: node server.js');
        console.log('2. 启动监控仪表板: ./start-monitoring.sh');
        console.log('3. 或者使用: node scripts/launch-dashboard.js');
        console.log('4. 自定义参数: node scripts/launch-dashboard.js --interval 3000 --port 8080');
    }

    /**
     * 保存安装报告
     */
    async saveReport(report) {
        const reportDir = path.join(__dirname, '../reports');
        await fs.mkdir(reportDir, { recursive: true });
        
        const filename = `monitoring-setup-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(reportDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        console.log(`\n📄 安装报告已保存到: ${filepath}`);
    }

    /**
     * 运行完整安装
     */
    async runSetup() {
        console.log('🔧 开始设置监控仪表板...\n');
        
        try {
            await this.installMissingPackages();
            await this.createDashboardLauncher();
            await this.createMonitoringConfig();
            await this.createQuickStartScript();
            
            const isValid = await this.verifyInstallation();
            
            const report = this.generateReport();
            this.printReport(report);
            await this.saveReport(report);
            
            if (isValid && this.failedPackages.length === 0) {
                console.log('\n🎉 监控仪表板设置完成！');
                console.log('\n🚀 现在可以使用以下命令启动监控仪表板:');
                console.log('   ./start-monitoring.sh');
                console.log('   或者: node scripts/launch-dashboard.js');
            } else {
                console.log('\n⚠️  设置过程中遇到一些问题，请检查上述报告');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ 设置监控仪表板失败:', error.message);
            process.exit(1);
        }
    }
}

// 主函数
async function main() {
    const setup = new MonitoringDashboardSetup();
    await setup.runSetup();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 设置失败:', error.message);
        process.exit(1);
    });
}

module.exports = MonitoringDashboardSetup;