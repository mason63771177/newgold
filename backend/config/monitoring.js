/**
 * 监控仪表板配置文件
 */

module.exports = {
    // 服务器配置
    server: {
        host: process.env.MONITOR_HOST || 'localhost',
        port: process.env.MONITOR_PORT || 3000,
        timeout: process.env.MONITOR_TIMEOUT || 30000
    },

    // 监控基础配置
    monitoring: {
        basic: {
            interval: 5000, // 基础监控间隔
            verbose: false  // 详细日志
        },
        system: {
            cpu: {
                enabled: true,
                threshold: 80,
                warning: 70,
                critical: 90
            },
            memory: {
                enabled: true,
                threshold: 85,
                warning: 75,
                critical: 95
            },
            disk: {
                enabled: true,
                threshold: 90,
                warning: 80,
                critical: 95
            },
            loadAverage: {
                enabled: true,
                warning: 2.0,
                critical: 4.0
            }
        }
    },

    // 健康检查配置
    healthCheck: {
        interval: 10000, // 健康检查间隔
        checks: {
            database: {
                enabled: true,
                timeout: 5000
            },
            redis: {
                enabled: true,
                timeout: 3000
            },
            system: {
                enabled: true,
                timeout: 1000
            }
        }
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
        // 告警规则配置
        rules: {
            suppressionTime: 5, // 告警抑制时间（分钟）
            maxAlerts: 100,     // 最大告警数量
            retentionTime: 24   // 告警保留时间（小时）
        },
        // 告警通道配置
        channels: {
            email: {
                enabled: false,
                smtp: {
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: process.env.SMTP_PORT || 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                },
                recipients: ['admin@example.com']
            },
            webhook: {
                enabled: false,
                url: process.env.ALERT_WEBHOOK_URL
            }
        },
        // 告警级别配置
        levels: {
            critical: {
                color: 'red',
                priority: 1
            },
            warning: {
                color: 'yellow', 
                priority: 2
            },
            info: {
                color: 'blue',
                priority: 3
            }
        },
        // CPU 使用率告警阈值 (%)
        cpuThreshold: 80,
        // 内存使用率告警阈值 (%)
        memoryThreshold: 85,
        // 响应时间告警阈值 (毫秒)
        responseTimeThreshold: 1000,
        // 错误率告警阈值 (%)
        errorRateThreshold: 5
    },

    // 性能监控配置
    performance: {
        enabled: true,
        maxRecords: 1000,
        thresholds: {
            responseTime: 1000,
            errorRate: 5
        }
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
};