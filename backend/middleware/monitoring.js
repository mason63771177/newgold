/**
 * 监控中间件
 * 用于收集应用性能指标、健康状态和告警处理
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { monitoring, alerts, healthCheck, performance } = require('../config/monitoring');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const axios = require('axios');

class MonitoringService extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.alerts = new Map();
        this.healthStatus = new Map();
        this.performanceData = [];
        this.startTime = Date.now();
        
        // 初始化邮件发送器
        this.emailTransporter = null;
        if (alerts && alerts.channels && alerts.channels.email && alerts.channels.email.enabled) {
            this.emailTransporter = nodemailer.createTransporter(alerts.channels.email.smtp);
        }
        
        // 启动监控
        this.startMonitoring();
    }

    /**
     * 启动监控服务
     */
    startMonitoring() {
        // 使用默认间隔值，避免配置错误
        const defaultInterval = 30000; // 30秒
        const healthCheckDefaultInterval = 60000; // 60秒
        
        // 系统监控
        const monitoringInterval = (monitoring && monitoring.basic && monitoring.basic.interval) ? monitoring.basic.interval : defaultInterval;
        setInterval(() => this.collectSystemMetrics(), monitoringInterval);
        
        // 健康检查
        const healthInterval = (healthCheck && healthCheck.interval) ? healthCheck.interval : healthCheckDefaultInterval;
        setInterval(() => this.performHealthChecks(), healthInterval);
        
        // 清理过期数据
        setInterval(() => this.cleanupExpiredData(), 60000 * 60); // 每小时清理一次
        
        logger.info('监控服务已启动', {
            interval: monitoringInterval,
            healthCheckInterval: healthInterval
        });
    }

    /**
     * 收集系统指标
     */
    async collectSystemMetrics() {
        try {
            const metrics = {
                cpu: this.getCPUUsage(),
                memory: this.getMemoryUsage(),
                loadAverage: os.loadavg(),
                uptime: os.uptime(),
                connections: this.getConnectionCount(),
                timestamp: Date.now()
            };

            // 添加磁盘使用率（如果启用）
            if (monitoring.system && monitoring.system.disk && monitoring.system.disk.enabled) {
                try {
                    metrics.disk = await this.getDiskUsage();
                } catch (error) {
                    logger.warn('获取磁盘使用率失败', { error: error.message });
                }
            }

            this.metrics.set('system', metrics);
            this.checkSystemThresholds(metrics);

            if (monitoring.basic && monitoring.basic.verbose) {
                logger.debug('系统指标收集完成', metrics);
            }
        } catch (error) {
            logger.error('收集系统指标失败', { error: error.message });
        }
    }

    /**
     * 获取 CPU 使用率
     */
    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - ~~(100 * idle / total);

        return {
            usage,
            cores: cpus.length,
            model: cpus[0].model
        };
    }

    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const usage = (usedMem / totalMem) * 100;

        const processMemory = process.memoryUsage();

        return {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usage,
            process: {
                rss: processMemory.rss,
                heapTotal: processMemory.heapTotal,
                heapUsed: processMemory.heapUsed,
                external: processMemory.external
            }
        };
    }

    /**
     * 获取磁盘使用情况
     */
    async getDiskUsage() {
        try {
            const stats = await fs.stat('/');
            // 简化的磁盘使用率计算（实际生产环境建议使用更精确的方法）
            return {
                usage: 0, // 占位符，实际需要系统调用
                available: 0,
                total: 0
            };
        } catch (error) {
            logger.warn('获取磁盘使用情况失败', { error: error.message });
            return { usage: 0, available: 0, total: 0 };
        }
    }

    /**
     * 获取连接数
     */
    getConnectionCount() {
        // 这里需要根据实际的数据库和 Redis 连接池来获取
        return {
            database: 0, // 占位符
            redis: 0,    // 占位符
            http: 0      // 占位符
        };
    }

    /**
     * 检查系统阈值并触发告警
     */
    checkSystemThresholds(metrics) {
        if (!monitoring.system) {
            return;
        }

        const { cpu, memory, loadAverage } = monitoring.system;

        // CPU 使用率检查
        if (cpu && cpu.enabled && metrics.cpu) {
            if (cpu.critical && metrics.cpu.usage > cpu.critical) {
                this.triggerAlert('cpu_critical', `CPU 使用率过高: ${metrics.cpu.usage.toFixed(2)}%`, 'critical');
            } else if (cpu.warning && metrics.cpu.usage > cpu.warning) {
                this.triggerAlert('cpu_warning', `CPU 使用率警告: ${metrics.cpu.usage.toFixed(2)}%`, 'warning');
            }
        }

        // 内存使用率检查
        if (memory && memory.enabled && metrics.memory) {
            if (memory.critical && metrics.memory.usage > memory.critical) {
                this.triggerAlert('memory_critical', `内存使用率过高: ${metrics.memory.usage.toFixed(2)}%`, 'critical');
            } else if (memory.warning && metrics.memory.usage > memory.warning) {
                this.triggerAlert('memory_warning', `内存使用率警告: ${metrics.memory.usage.toFixed(2)}%`, 'warning');
            }
        }

        // 负载平均值检查
        if (loadAverage && loadAverage.enabled && metrics.loadAverage) {
            const currentLoad = metrics.loadAverage[0];
            if (loadAverage.critical && currentLoad > loadAverage.critical) {
                this.triggerAlert('load_critical', `系统负载过高: ${currentLoad.toFixed(2)}`, 'critical');
            } else if (loadAverage.warning && currentLoad > loadAverage.warning) {
                this.triggerAlert('load_warning', `系统负载警告: ${currentLoad.toFixed(2)}`, 'warning');
            }
        }
    }

    /**
     * 执行健康检查
     */
    async performHealthChecks() {
        const results = {};

        for (const [name, config] of Object.entries(healthCheck.checks)) {
            if (!config.enabled) continue;

            try {
                const result = await this.performSingleHealthCheck(name, config);
                results[name] = result;
                this.healthStatus.set(name, result);
            } catch (error) {
                const result = {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: Date.now()
                };
                results[name] = result;
                this.healthStatus.set(name, result);
                
                this.triggerAlert(
                    `health_${name}`,
                    `健康检查失败: ${name} - ${error.message}`,
                    'critical'
                );
            }
        }

        if (monitoring.basic.verbose) {
            logger.debug('健康检查完成', results);
        }
    }

    /**
     * 执行单个健康检查
     */
    async performSingleHealthCheck(name, config) {
        const startTime = Date.now();

        switch (name) {
            case 'database':
                // 数据库连接检查（需要实际的数据库连接）
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    timestamp: Date.now()
                };

            case 'redis':
                // Redis 连接检查（需要实际的 Redis 连接）
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    timestamp: Date.now()
                };

            case 'tatumApi':
                // Tatum API 检查
                const response = await axios.get(
                    `https://api.tatum.io${config.endpoint}`,
                    { timeout: config.timeout }
                );
                return {
                    status: response.status === 200 ? 'healthy' : 'unhealthy',
                    responseTime: Date.now() - startTime,
                    statusCode: response.status,
                    timestamp: Date.now()
                };

            default:
                throw new Error(`未知的健康检查类型: ${name}`);
        }
    }

    /**
     * 触发告警
     */
    async triggerAlert(alertId, message, level = 'warning') {
        const now = Date.now();
        const existingAlert = this.alerts.get(alertId);

        // 检查告警抑制
        if (existingAlert && (now - existingAlert.lastTriggered) < (alerts.rules.suppressionTime * 60000)) {
            return;
        }

        const alert = {
            id: alertId,
            level,
            message,
            timestamp: now,
            lastTriggered: now,
            count: existingAlert ? existingAlert.count + 1 : 1
        };

        this.alerts.set(alertId, alert);

        // 记录告警日志
        logger.warn('触发告警', alert);

        // 发送通知
        await this.sendAlertNotifications(alert);

        // 触发事件
        this.emit('alert', alert);
    }

    /**
     * 发送告警通知
     */
    async sendAlertNotifications(alert) {
        if (!alerts || !alerts.channels) {
            logger.warn('告警通道配置缺失，跳过通知发送');
            return;
        }

        const notifications = [];

        // 邮件通知
        if (alerts.channels.email && alerts.channels.email.enabled && this.emailTransporter) {
            notifications.push(this.sendEmailAlert(alert));
        }

        // Webhook 通知
        if (alerts.channels.webhook && alerts.channels.webhook.enabled) {
            notifications.push(this.sendWebhookAlert(alert));
        }

        // Slack 通知
        if (alerts.channels.slack && alerts.channels.slack.enabled) {
            notifications.push(this.sendSlackAlert(alert));
        }

        // 企业微信通知
        if (alerts.channels.wechat && alerts.channels.wechat.enabled) {
            notifications.push(this.sendWechatAlert(alert));
        }

        try {
            await Promise.allSettled(notifications);
        } catch (error) {
            logger.error('发送告警通知失败', { error: error.message });
        }
    }

    /**
     * 发送邮件告警
     */
    async sendEmailAlert(alert) {
        const template = alerts.channels.email.templates[alert.level] || alerts.channels.email.templates.warning;
        const subject = template.replace('{{title}}', `Tatum 钱包服务告警`).replace('{{message}}', alert.message);

        const mailOptions = {
            from: alerts.channels.email.smtp.auth.user,
            to: alerts.channels.email.recipients.join(','),
            subject,
            html: `
                <h2>Tatum 钱包服务告警</h2>
                <p><strong>级别:</strong> ${alert.level}</p>
                <p><strong>消息:</strong> ${alert.message}</p>
                <p><strong>时间:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
                <p><strong>告警ID:</strong> ${alert.id}</p>
                <p><strong>触发次数:</strong> ${alert.count}</p>
            `
        };

        await this.emailTransporter.sendMail(mailOptions);
    }

    /**
     * 发送 Webhook 告警
     */
    async sendWebhookAlert(alert) {
        const payload = {
            service: 'tatum-wallet-service',
            alert,
            timestamp: alert.timestamp
        };

        const promises = alerts.channels.webhook.urls.map(url =>
            axios.post(url, payload, {
                timeout: alerts.channels.webhook.timeout,
                headers: { 'Content-Type': 'application/json' }
            })
        );

        await Promise.allSettled(promises);
    }

    /**
     * 发送 Slack 告警
     */
    async sendSlackAlert(alert) {
        const emoji = alert.level === 'critical' ? '🚨' : '⚠️';
        const payload = {
            channel: alerts.channels.slack.channel,
            username: alerts.channels.slack.username,
            icon_emoji: alerts.channels.slack.iconEmoji,
            text: `${emoji} *${alert.level.toUpperCase()}*: ${alert.message}`,
            attachments: [{
                color: alert.level === 'critical' ? 'danger' : 'warning',
                fields: [
                    { title: '服务', value: 'Tatum 钱包服务', short: true },
                    { title: '时间', value: new Date(alert.timestamp).toLocaleString(), short: true },
                    { title: '告警ID', value: alert.id, short: true },
                    { title: '触发次数', value: alert.count.toString(), short: true }
                ]
            }]
        };

        await axios.post(alerts.channels.slack.webhookUrl, payload);
    }

    /**
     * 发送企业微信告警
     */
    async sendWechatAlert(alert) {
        const emoji = alert.level === 'critical' ? '🚨' : '⚠️';
        const payload = {
            msgtype: 'text',
            text: {
                content: `${emoji} Tatum 钱包服务告警\n级别: ${alert.level}\n消息: ${alert.message}\n时间: ${new Date(alert.timestamp).toLocaleString()}`,
                mentioned_list: alerts.channels.wechat.mentioned
            }
        };

        await axios.post(alerts.channels.wechat.webhookUrl, payload);
    }

    /**
     * 记录性能指标
     */
    recordPerformanceMetric(metric) {
        if (!performance.enabled) return;

        // 采样控制
        if (Math.random() > performance.sampleRate) return;

        this.performanceData.push({
            ...metric,
            timestamp: Date.now()
        });

        // 限制数据量
        if (this.performanceData.length > 1000) {
            this.performanceData = this.performanceData.slice(-500);
        }

        // 检查慢请求
        if (metric.responseTime > performance.slowRequestThreshold) {
            this.triggerAlert(
                'slow_request',
                `慢请求检测: ${metric.path} 耗时 ${metric.responseTime}ms`,
                'warning'
            );
        }
    }

    /**
     * 清理过期数据
     */
    cleanupExpiredData() {
        const now = Date.now();
        const retentionTime = monitoring.basic.retentionHours * 60 * 60 * 1000;

        // 清理过期的性能数据
        this.performanceData = this.performanceData.filter(
            data => (now - data.timestamp) < retentionTime
        );

        // 清理过期的告警
        for (const [alertId, alert] of this.alerts.entries()) {
            if ((now - alert.timestamp) > retentionTime) {
                this.alerts.delete(alertId);
            }
        }

        logger.debug('清理过期监控数据完成');
    }

    /**
     * 获取监控摘要
     */
    getSummary() {
        const systemMetrics = this.metrics.get('system') || {};
        const healthStatuses = Array.from(this.healthStatus.values());
        const activeAlerts = Array.from(this.alerts.values()).filter(
            alert => (Date.now() - alert.timestamp) < (60 * 60 * 1000) // 1小时内的告警
        );

        return {
            uptime: process.uptime(),
            system: {
                cpu: systemMetrics.cpu?.usage || 0,
                memory: systemMetrics.memory?.usage || 0,
                loadAverage: systemMetrics.loadAverage?.[0] || 0
            },
            health: {
                total: healthStatuses.length,
                healthy: healthStatuses.filter(h => h.status === 'healthy').length,
                unhealthy: healthStatuses.filter(h => h.status === 'unhealthy').length
            },
            alerts: {
                total: activeAlerts.length,
                critical: activeAlerts.filter(a => a.level === 'critical').length,
                warning: activeAlerts.filter(a => a.level === 'warning').length
            },
            performance: {
                totalRequests: this.performanceData.length,
                averageResponseTime: this.performanceData.length > 0 
                    ? this.performanceData.reduce((sum, d) => sum + d.responseTime, 0) / this.performanceData.length 
                    : 0
            }
        };
    }

    /**
     * 获取详细指标
     */
    getMetrics() {
        return {
            system: this.metrics.get('system'),
            health: Object.fromEntries(this.healthStatus),
            alerts: Array.from(this.alerts.values()),
            performance: this.performanceData.slice(-100) // 最近100条记录
        };
    }
}

// 创建全局监控实例
const monitoringService = new MonitoringService();

/**
 * Express 中间件：性能监控
 */
const performanceMiddleware = (req, res, next) => {
    if (!performance.enabled) return next();

    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // 记录性能指标
        monitoringService.recordPerformanceMetric({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });

        return originalSend.call(this, data);
    };

    next();
};

/**
 * Express 中间件：健康检查端点
 */
const healthCheckMiddleware = (req, res) => {
    const summary = monitoringService.getSummary();
    const isHealthy = summary.health.unhealthy === 0 && summary.alerts.critical === 0;

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        ...summary
    });
};

/**
 * Express 中间件：监控指标端点
 */
const metricsMiddleware = (req, res) => {
    const metrics = monitoringService.getMetrics();
    res.json({
        timestamp: Date.now(),
        ...metrics
    });
};

module.exports = {
    MonitoringService,
    monitoringService,
    performanceMiddleware,
    healthCheckMiddleware,
    metricsMiddleware
};