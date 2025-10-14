#!/usr/bin/env node

/**
 * 性能优化分析脚本
 * 基于监控数据分析系统性能并提供优化建议
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class PerformanceOptimizer {
    constructor(baseUrl = 'http://localhost:3000', token = 'mock-token-admin') {
        this.baseUrl = baseUrl;
        this.token = token;
        this.headers = { 'Authorization': `Bearer ${token}` };
    }

    /**
     * 获取监控指标数据
     */
    async getMetrics() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/monitoring/metrics`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('❌ 获取监控指标失败:', error.message);
            return null;
        }
    }

    /**
     * 获取健康状态数据
     */
    async getHealth() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/monitoring/health`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('❌ 获取健康状态失败:', error.message);
            return null;
        }
    }

    /**
     * 分析响应时间性能
     */
    analyzeResponseTime(performance) {
        if (!performance || performance.length === 0) {
            return { status: 'no_data', message: '暂无性能数据' };
        }

        const responseTimes = performance.map(p => p.responseTime);
        const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const max = Math.max(...responseTimes);
        const min = Math.min(...responseTimes);
        const p95 = this.calculatePercentile(responseTimes, 95);

        const slowRequests = performance.filter(p => p.responseTime > 100);
        const verySlowRequests = performance.filter(p => p.responseTime > 500);

        return {
            status: avg > 100 ? 'warning' : 'good',
            metrics: { avg, max, min, p95 },
            slowRequests: slowRequests.length,
            verySlowRequests: verySlowRequests.length,
            details: slowRequests.slice(0, 10) // 只显示前10个慢请求
        };
    }

    /**
     * 分析系统资源使用
     */
    analyzeSystemResources(health) {
        if (!health || !health.system) {
            return { status: 'no_data', message: '暂无系统数据' };
        }

        const { cpu, memory, loadAverage } = health.system;
        const issues = [];
        const recommendations = [];

        // CPU 分析
        if (cpu > 80) {
            issues.push(`CPU 使用率过高: ${cpu.toFixed(1)}%`);
            recommendations.push('优化计算密集型操作，考虑使用缓存');
        } else if (cpu > 60) {
            issues.push(`CPU 使用率较高: ${cpu.toFixed(1)}%`);
            recommendations.push('监控 CPU 使用情况，准备优化方案');
        }

        // 内存分析
        if (memory > 85) {
            issues.push(`内存使用率过高: ${memory.toFixed(1)}%`);
            recommendations.push('检查内存泄漏，优化内存使用');
        } else if (memory > 70) {
            issues.push(`内存使用率较高: ${memory.toFixed(1)}%`);
            recommendations.push('监控内存使用趋势');
        }

        // 负载分析
        if (loadAverage > 4) {
            issues.push(`系统负载过高: ${loadAverage.toFixed(2)}`);
            recommendations.push('检查系统瓶颈，考虑扩容');
        }

        return {
            status: issues.length > 0 ? 'warning' : 'good',
            metrics: { cpu, memory, loadAverage },
            issues,
            recommendations
        };
    }

    /**
     * 生成优化建议
     */
    generateOptimizationRecommendations(metrics, health) {
        const recommendations = [];

        // 基于响应时间的建议
        if (metrics && metrics.performance) {
            const responseAnalysis = this.analyzeResponseTime(metrics.performance);
            if (responseAnalysis.slowRequests > 0) {
                recommendations.push({
                    category: '响应时间优化',
                    priority: 'high',
                    items: [
                        '启用 Redis 缓存减少数据库查询',
                        '优化数据库索引',
                        '使用连接池管理数据库连接',
                        '启用 gzip 压缩减少传输大小'
                    ]
                });
            }
        }

        // 基于系统资源的建议
        if (health) {
            const resourceAnalysis = this.analyzeSystemResources(health);
            if (resourceAnalysis.recommendations.length > 0) {
                recommendations.push({
                    category: '系统资源优化',
                    priority: 'medium',
                    items: resourceAnalysis.recommendations
                });
            }
        }

        // 通用优化建议
        recommendations.push({
            category: '通用优化',
            priority: 'low',
            items: [
                '启用 HTTP/2 提高传输效率',
                '使用 CDN 加速静态资源',
                '实施代码分割和懒加载',
                '优化图片和静态资源',
                '启用浏览器缓存策略'
            ]
        });

        return recommendations;
    }

    /**
     * 计算百分位数
     */
    calculatePercentile(arr, percentile) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    /**
     * 生成性能报告
     */
    async generateReport() {
        console.log('🔍 开始性能分析...\n');

        const metrics = await this.getMetrics();
        const health = await this.getHealth();

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                status: 'unknown',
                totalIssues: 0,
                criticalIssues: 0
            },
            performance: null,
            resources: null,
            recommendations: []
        };

        // 分析性能数据
        if (metrics && metrics.performance) {
            report.performance = this.analyzeResponseTime(metrics.performance);
            console.log('📊 响应时间分析:');
            console.log(`- 平均响应时间: ${report.performance.metrics.avg.toFixed(2)} ms`);
            console.log(`- 最大响应时间: ${report.performance.metrics.max} ms`);
            console.log(`- 95% 响应时间: ${report.performance.metrics.p95} ms`);
            console.log(`- 慢请求数量: ${report.performance.slowRequests}`);
            if (report.performance.verySlowRequests > 0) {
                console.log(`- 极慢请求数量: ${report.performance.verySlowRequests}`);
            }
            console.log();
        }

        // 分析系统资源
        if (health) {
            report.resources = this.analyzeSystemResources(health);
            console.log('🖥️  系统资源分析:');
            console.log(`- CPU 使用率: ${report.resources.metrics.cpu.toFixed(1)}%`);
            console.log(`- 内存使用率: ${report.resources.metrics.memory.toFixed(1)}%`);
            console.log(`- 系统负载: ${report.resources.metrics.loadAverage.toFixed(2)}`);
            
            if (report.resources.issues.length > 0) {
                console.log('⚠️  发现问题:');
                report.resources.issues.forEach(issue => {
                    console.log(`  - ${issue}`);
                });
            }
            console.log();
        }

        // 生成优化建议
        report.recommendations = this.generateOptimizationRecommendations(metrics, health);
        console.log('💡 优化建议:');
        report.recommendations.forEach(category => {
            console.log(`\n${category.category} (优先级: ${category.priority}):`);
            category.items.forEach(item => {
                console.log(`  - ${item}`);
            });
        });

        // 计算总体状态
        const performanceIssues = report.performance && report.performance.status === 'warning' ? 1 : 0;
        const resourceIssues = report.resources && report.resources.issues.length || 0;
        report.summary.totalIssues = performanceIssues + resourceIssues;
        report.summary.criticalIssues = resourceIssues;
        report.summary.status = report.summary.criticalIssues > 0 ? 'critical' : 
                               report.summary.totalIssues > 0 ? 'warning' : 'good';

        console.log(`\n📋 总体评估: ${report.summary.status.toUpperCase()}`);
        console.log(`- 发现问题: ${report.summary.totalIssues} 个`);
        console.log(`- 关键问题: ${report.summary.criticalIssues} 个`);

        return report;
    }

    /**
     * 保存报告到文件
     */
    async saveReport(report) {
        const reportDir = path.join(__dirname, '../reports');
        await fs.mkdir(reportDir, { recursive: true });
        
        const filename = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
        const filepath = path.join(reportDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        console.log(`\n📄 报告已保存到: ${filepath}`);
    }
}

// 主函数
async function main() {
    const optimizer = new PerformanceOptimizer();
    
    try {
        const report = await optimizer.generateReport();
        await optimizer.saveReport(report);
        
        // 根据结果设置退出码
        process.exit(report.summary.criticalIssues > 0 ? 1 : 0);
    } catch (error) {
        console.error('❌ 性能分析失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = PerformanceOptimizer;