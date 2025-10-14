#!/usr/bin/env node

/**
 * 监控仪表板脚本
 * 用于在终端中显示实时监控数据
 */

const axios = require('axios');
const chalk = require('chalk');
const Table = require('cli-table3');
const blessed = require('blessed');

class MonitoringDashboard {
    constructor(apiUrl = 'http://localhost:3000', token = null) {
        this.apiUrl = apiUrl;
        this.token = token;
        this.screen = null;
        this.widgets = {};
        this.updateInterval = 5000; // 5秒更新一次
        this.intervalId = null;
    }

    /**
     * 初始化仪表板界面
     */
    initializeScreen() {
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'Tatum 钱包服务监控仪表板'
        });

        // 创建主容器
        const container = blessed.box({
            parent: this.screen,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'cyan'
                }
            }
        });

        // 系统指标显示区域
        this.widgets.systemBox = blessed.box({
            parent: container,
            label: ' 系统指标 ',
            top: 0,
            left: 0,
            width: '50%',
            height: '30%',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'green'
                }
            },
            scrollable: true,
            alwaysScroll: true
        });

        // 健康状态显示区域
        this.widgets.healthBox = blessed.box({
            parent: container,
            label: ' 健康状态 ',
            top: 0,
            left: '50%',
            width: '50%',
            height: '30%',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'blue'
                }
            },
            scrollable: true,
            alwaysScroll: true
        });

        // 性能数据显示区域
        this.widgets.performanceBox = blessed.box({
            parent: container,
            label: ' 性能数据 ',
            top: '30%',
            left: 0,
            width: '100%',
            height: '40%',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'yellow'
                }
            },
            scrollable: true,
            alwaysScroll: true
        });

        // 警报列表显示区域
        this.widgets.alertsBox = blessed.box({
            parent: container,
            label: ' 警报信息 ',
            top: '70%',
            left: 0,
            width: '100%',
            height: '30%',
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'red'
                }
            },
            scrollable: true,
            alwaysScroll: true
        });

        // 绑定退出键
        this.screen.key(['escape', 'q', 'C-c'], () => {
            this.stop();
            process.exit(0);
        });

        // 绑定刷新键
        this.screen.key(['r', 'R'], () => {
            this.updateDashboard();
        });

        this.screen.render();
    }

    /**
     * 停止监控
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * 获取监控数据
     */
    async fetchMonitoringData() {
        try {
            const headers = {};
            if (this.token) {
                headers.Authorization = `Bearer ${this.token}`;
            }

            const response = await axios.get(`${this.apiUrl}/api/monitoring/dashboard`, {
                headers,
                timeout: 10000
            });

            return response.data;
        } catch (error) {
            throw new Error(`获取监控数据失败: ${error.message}`);
        }
    }

    /**
     * 更新仪表板数据
     */
    async updateDashboard() {
        try {
            const data = await this.fetchMonitoringData();
            
            this.updateSystemMetrics(data.system);
            this.updateHealthStatus(data.health);
            this.updatePerformanceData(data.performance);
            this.updateAlertsList(data.alerts);
            
            this.screen.render();
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * 更新系统指标
     */
    updateSystemMetrics(system) {
        if (!system) return;

        const content = [
            `CPU 使用率: ${system.cpu?.toFixed(1) || 'N/A'}%`,
            `内存使用率: ${system.memory?.toFixed(1) || 'N/A'}%`,
            `系统负载: ${system.load?.toFixed(2) || 'N/A'}`,
            `磁盘使用率: ${system.disk?.toFixed(1) || 'N/A'}%`,
            `网络连接数: ${system.connections || 'N/A'}`,
            `运行时间: ${system.uptime || 'N/A'}`
        ].join('\n');

        this.widgets.systemBox.setContent(content);
    }

    /**
     * 更新健康状态
     */
    updateHealthStatus(health) {
        if (!health) return;

        const services = health.services || {};
        const content = Object.entries(services).map(([service, status]) => {
            const icon = status === 'healthy' ? '✓' : '✗';
            const color = status === 'healthy' ? 'green' : 'red';
            return `${icon} ${service}: ${status}`;
        }).join('\n');

        this.widgets.healthBox.setContent(content);
    }

    /**
     * 更新性能数据
     */
    updatePerformanceData(performance) {
        if (!performance) return;

        const stats = this.calculateRequestStats(performance);
        const content = [
            `总请求数: ${stats.totalRequests}`,
            `成功请求: ${stats.successRequests} (${stats.successRate}%)`,
            `失败请求: ${stats.failedRequests} (${stats.failureRate}%)`,
            `平均响应时间: ${stats.avgResponseTime}ms`,
            `最大响应时间: ${stats.maxResponseTime}ms`,
            `最小响应时间: ${stats.minResponseTime}ms`,
            `每秒请求数: ${stats.requestsPerSecond}`,
            `错误率: ${stats.errorRate}%`
        ].join('\n');

        this.widgets.performanceBox.setContent(content);
    }

    /**
     * 计算请求统计
     */
    calculateRequestStats(performanceData) {
        const requests = performanceData.requests || [];
        const totalRequests = requests.length;
        const successRequests = requests.filter(r => r.status < 400).length;
        const failedRequests = totalRequests - successRequests;
        
        const responseTimes = requests.map(r => r.responseTime).filter(t => t);
        const avgResponseTime = responseTimes.length > 0 
            ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
            : 0;
        
        const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
        const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
        
        const successRate = totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(1) : 0;
        const failureRate = totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(1) : 0;
        const errorRate = failureRate;
        
        const timeSpan = performanceData.timeSpan || 60; // 默认60秒
        const requestsPerSecond = (totalRequests / timeSpan).toFixed(2);

        return {
            totalRequests,
            successRequests,
            failedRequests,
            avgResponseTime,
            maxResponseTime,
            minResponseTime,
            successRate,
            failureRate,
            errorRate,
            requestsPerSecond
        };
    }

    /**
     * 更新警报列表
     */
    updateAlertsList(alerts) {
        if (!alerts || !Array.isArray(alerts)) return;

        const content = alerts.length > 0 
            ? alerts.map(alert => {
                const timestamp = new Date(alert.timestamp).toLocaleString();
                return `[${timestamp}] ${alert.level}: ${alert.message}`;
            }).join('\n')
            : '暂无警报';

        this.widgets.alertsBox.setContent(content);
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        if (this.screen) {
            const errorBox = blessed.message({
                parent: this.screen,
                top: 'center',
                left: 'center',
                width: '50%',
                height: '20%',
                label: ' 错误 ',
                tags: true,
                border: {
                    type: 'line'
                },
                style: {
                    border: {
                        fg: 'red'
                    }
                }
            });

            errorBox.display(message, () => {
                this.screen.render();
            });
        } else {
            console.error(chalk.red('错误:'), message);
        }
    }

    /**
     * 启动仪表板
     */
    async start() {
        console.log(chalk.blue('正在启动监控仪表板...'));
        
        this.initializeScreen();
        
        // 首次加载数据
        await this.updateDashboard();
        
        // 设置定时更新
        this.intervalId = setInterval(() => {
            this.updateDashboard();
        }, this.updateInterval);

        console.log(chalk.green('监控仪表板已启动'));
        console.log(chalk.yellow('快捷键: q/Esc 退出, r/F5 刷新'));
    }

    /**
     * 简单模式显示（终端表格）
     */
    async showSimple() {
        const data = await this.fetchMonitoringData();
        
        if (!data.dashboard) {
            console.log(chalk.red('❌ 无法获取监控数据'));
            return;
        }

        console.clear();
        console.log(chalk.blue.bold('=== Tatum 钱包服务监控 ===\n'));

        // 系统指标
        const systemTable = new Table({
            head: [chalk.cyan('指标'), chalk.cyan('当前值'), chalk.cyan('状态')],
            colWidths: [15, 15, 10]
        });

        const system = data.dashboard.system;
        systemTable.push(
            ['CPU 使用率', `${system.cpu.usage.toFixed(1)}%`, this.getStatusIcon(system.cpu.usage, 70, 90)],
            ['内存使用率', `${system.memory.usage.toFixed(1)}%`, this.getStatusIcon(system.memory.usage, 80, 95)],
            ['系统负载', system.loadAverage[0].toFixed(2), this.getStatusIcon(system.loadAverage[0] * 25, 50, 75)],
            ['运行时间', `${Math.floor(system.uptime / 3600)}小时`, '✅']
        );

        console.log(chalk.yellow('系统指标:'));
        console.log(systemTable.toString());

        // 健康检查
        const healthTable = new Table({
            head: [chalk.cyan('服务'), chalk.cyan('状态'), chalk.cyan('响应时间')],
            colWidths: [15, 10, 15]
        });

        for (const [service, status] of Object.entries(data.dashboard.health)) {
            healthTable.push([
                service,
                status.status === 'healthy' ? '✅ 正常' : '❌ 异常',
                status.responseTime ? `${status.responseTime}ms` : 'N/A'
            ]);
        }

        console.log(chalk.yellow('\n健康检查:'));
        console.log(healthTable.toString());

        // 告警统计
        const alerts = data.dashboard.alerts;
        console.log(chalk.yellow('\n告警统计:'));
        console.log(`总计: ${alerts.counts.total}, 严重: ${chalk.red(alerts.counts.critical)}, 警告: ${chalk.yellow(alerts.counts.warning)}`);

        // 性能统计
        const perf = data.dashboard.performance.stats;
        console.log(chalk.yellow('\n性能统计:'));
        console.log(`请求总数: ${perf.totalRequests}, 平均响应时间: ${perf.averageResponseTime.toFixed(2)}ms, 错误率: ${perf.errorRate.toFixed(2)}%`);

        console.log(chalk.gray(`\n最后更新: ${new Date().toLocaleString()}`));
    }

    /**
     * 获取状态图标
     */
    getStatusIcon(value, warningThreshold, criticalThreshold) {
        if (value >= criticalThreshold) return '🔴';
        if (value >= warningThreshold) return '🟡';
        return '🟢';
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const options = {
    apiUrl: 'http://localhost:3000',
    token: null,
    mode: 'dashboard', // dashboard 或 simple
    interval: 5000
};

// 解析命令行参数
for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--url':
        case '-u':
            options.apiUrl = args[++i];
            break;
        case '--token':
        case '-t':
            options.token = args[++i];
            break;
        case '--simple':
        case '-s':
            options.mode = 'simple';
            break;
        case '--interval':
        case '-i':
            options.interval = parseInt(args[++i]) * 1000;
            break;
        case '--help':
        case '-h':
            console.log(`
使用方法: node monitoring-dashboard.js [选项]

选项:
  -u, --url <url>        API 服务地址 (默认: http://localhost:3000)
  -t, --token <token>    认证令牌
  -s, --simple           简单模式 (终端表格显示)
  -i, --interval <sec>   更新间隔秒数 (默认: 5)
  -h, --help             显示帮助信息

示例:
  node monitoring-dashboard.js
  node monitoring-dashboard.js --simple
  node monitoring-dashboard.js --url http://localhost:3000 --token your-token
            `);
            process.exit(0);
    }
}

// 启动仪表板
async function main() {
    const dashboard = new MonitoringDashboard(options.apiUrl, options.token);
    dashboard.updateInterval = options.interval;

    try {
        if (options.mode === 'simple') {
            // 简单模式：定时刷新终端显示
            await dashboard.showSimple();
            setInterval(async () => {
                await dashboard.showSimple();
            }, options.interval);
        } else {
            // 交互式仪表板模式
            await dashboard.start();
        }
    } catch (error) {
        console.error(chalk.red('启动监控仪表板失败:'), error.message);
        process.exit(1);
    }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error(chalk.red('未捕获的异常:'), error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('未处理的 Promise 拒绝:'), reason);
    process.exit(1);
});

if (require.main === module) {
    main();
}

module.exports = MonitoringDashboard;