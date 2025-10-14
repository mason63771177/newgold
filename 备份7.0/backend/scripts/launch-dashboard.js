#!/usr/bin/env node

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
        console.log(`📊 监控间隔: ${interval}ms`);
        console.log(`🌐 监控地址: http://${host}:${port}`);
        console.log(`⏱️  超时时间: ${timeout}秒`);
        console.log('按 Ctrl+C 退出\n');

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
                console.error(`❌ 监控仪表板异常退出，退出码: ${code}`);
                process.exit(code);
            }
            console.log('👋 监控仪表板已退出');
        });

        // 处理进程信号
        process.on('SIGINT', () => {
            console.log('\n🛑 正在关闭监控仪表板...');
            dashboard.kill('SIGINT');
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 正在关闭监控仪表板...');
            dashboard.kill('SIGTERM');
        });
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(`
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
`);
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
                console.warn(`⚠️  未知参数: ${args[i]}`);
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

module.exports = DashboardLauncher;