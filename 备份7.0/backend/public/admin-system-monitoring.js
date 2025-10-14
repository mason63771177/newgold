
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

/**
 * 系统监控面板模块
 * 提供服务器性能监控、API调用统计、错误日志分析、实时告警等功能
 */
class SystemMonitoring {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.alertSound = null;
        this.init();
    }

    /**
     * 初始化监控系统
     */
    init() {
        this.setupAlertSound();
        this.bindEvents();
    }

    /**
     * 设置告警音效
     */
    setupAlertSound() {
        this.alertSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    }

    /**
     * 渲染监控面板
     */
    render() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = DOMPurify.sanitize(`
            <div class="monitoring-container">
                <div class="monitoring-header">
                    <h2><i class="fas fa-chart-line"></i> 系统监控面板</h2>
                    <div class="monitoring-controls">
                        <select id="refreshInterval" class="form-select">
                            <option value="5000">5秒刷新</option>
                            <option value="10000" selected>10秒刷新</option>
                            <option value="30000">30秒刷新</option>
                            <option value="60000">1分钟刷新</option>
                        </select>
                        <button id="pauseMonitoring" class="btn btn-warning">
                            <i class="fas fa-pause"></i> 暂停监控
                        </button>
                        <button id="exportReport" class="btn btn-info">
                            <i class="fas fa-download"></i> 导出报告
                        </button>
                    </div>
                </div>

                <!-- 系统状态概览 -->
                <div class="system-overview">
                    <div class="status-card cpu">
                        <div class="status-icon">
                            <i class="fas fa-microchip"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-value" id="cpuUsage">0%</div>
                            <div class="status-label">CPU使用率</div>
                            <div class="status-trend" id="cpuTrend">
                                <i class="fas fa-arrow-up"></i> +2.3%
                            </div>
                        </div>
                    </div>

                    <div class="status-card memory">
                        <div class="status-icon">
                            <i class="fas fa-memory"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-value" id="memoryUsage">0%</div>
                            <div class="status-label">内存使用率</div>
                            <div class="status-trend" id="memoryTrend">
                                <i class="fas fa-arrow-down"></i> -1.2%
                            </div>
                        </div>
                    </div>

                    <div class="status-card disk">
                        <div class="status-icon">
                            <i class="fas fa-hdd"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-value" id="diskUsage">0%</div>
                            <div class="status-label">磁盘使用率</div>
                            <div class="status-trend" id="diskTrend">
                                <i class="fas fa-arrow-up"></i> +0.5%
                            </div>
                        </div>
                    </div>

                    <div class="status-card network">
                        <div class="status-icon">
                            <i class="fas fa-network-wired"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-value" id="networkSpeed">0 MB/s</div>
                            <div class="status-label">网络速度</div>
                            <div class="status-trend" id="networkTrend">
                                <i class="fas fa-arrow-up"></i> +5.7%
                            </div>
                        </div>
                    </div>

                    <div class="status-card api">
                        <div class="status-icon">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-value" id="apiCalls">0</div>
                            <div class="status-label">API调用/分钟</div>
                            <div class="status-trend" id="apiTrend">
                                <i class="fas fa-arrow-up"></i> +12.4%
                            </div>
                        </div>
                    </div>

                    <div class="status-card errors">
                        <div class="status-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="status-info">
                            <div class="status-value" id="errorCount">0</div>
                            <div class="status-label">错误数量</div>
                            <div class="status-trend" id="errorTrend">
                                <i class="fas fa-arrow-down"></i> -8.1%
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 性能图表 -->
                <div class="monitoring-charts">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>系统性能趋势</h3>
                            <div class="chart-controls">
                                <button class="btn btn-sm" data-range="1h">1小时</button>
                                <button class="btn btn-sm active" data-range="6h">6小时</button>
                                <button class="btn btn-sm" data-range="24h">24小时</button>
                            </div>
                        </div>
                        <canvas id="performanceChart" class="chart-canvas"></canvas>
                    </div>

                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>API调用统计</h3>
                        </div>
                        <canvas id="apiChart" class="chart-canvas"></canvas>
                    </div>
                </div>

                <!-- 底部区域 -->
                <div class="monitoring-bottom">
                    <!-- 错误日志 -->
                    <div class="error-logs">
                        <div class="section-header">
                            <h3><i class="fas fa-bug"></i> 错误日志</h3>
                            <div class="log-controls">
                                <select id="logLevel" class="form-select">
                                    <option value="all">所有级别</option>
                                    <option value="error">错误</option>
                                    <option value="warning">警告</option>
                                    <option value="info">信息</option>
                                </select>
                                <button id="clearLogs" class="btn btn-sm btn-danger">清空日志</button>
                            </div>
                        </div>
                        <div class="log-container" id="logContainer">
                            <!-- 日志条目将在这里动态加载 -->
                        </div>
                    </div>

                    <!-- 实时告警 -->
                    <div class="alert-panel">
                        <div class="section-header">
                            <h3><i class="fas fa-bell"></i> 实时告警</h3>
                            <div class="alert-controls">
                                <button id="muteAlerts" class="btn btn-sm">
                                    <i class="fas fa-volume-up"></i> 静音
                                </button>
                                <button id="clearAlerts" class="btn btn-sm btn-danger">清空告警</button>
                            </div>
                        </div>
                        <div class="alert-container" id="alertContainer">
                            <!-- 告警条目将在这里动态加载 -->
                        </div>
                    </div>
                </div>

                <!-- 服务状态 -->
                <div class="service-status">
                    <h3><i class="fas fa-server"></i> 服务状态</h3>
                    <div class="service-grid" id="serviceGrid">
                        <!-- 服务状态将在这里动态加载 -->
                    </div>
                </div>
            </div>
        `);

        this.bindEvents();
        this.loadData();
        this.initCharts();
        this.startMonitoring();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 刷新间隔控制
        document.addEventListener('change', (e) => {
            if (e.target.id === 'refreshInterval') {
                this.updateRefreshInterval(parseInt(e.target.value));
            }
        });

        // 暂停/恢复监控
        document.addEventListener('click', (e) => {
            if (e.target.id === 'pauseMonitoring' || e.target.closest('#pauseMonitoring')) {
                this.toggleMonitoring();
            }
        });

        // 导出报告
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportReport' || e.target.closest('#exportReport')) {
                this.exportReport();
            }
        });

        // 清空日志
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clearLogs' || e.target.closest('#clearLogs')) {
                this.clearLogs();
            }
        });

        // 静音告警
        document.addEventListener('click', (e) => {
            if (e.target.id === 'muteAlerts' || e.target.closest('#muteAlerts')) {
                this.toggleAlertSound();
            }
        });

        // 清空告警
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clearAlerts' || e.target.closest('#clearAlerts')) {
                this.clearAlerts();
            }
        });

        // 时间范围切换
        document.addEventListener('click', (e) => {
            if (e.target.dataset.range) {
                this.switchTimeRange(e.target.dataset.range);
            }
        });

        // 日志级别过滤
        document.addEventListener('change', (e) => {
            if (e.target.id === 'logLevel') {
                this.filterLogs(e.target.value);
            }
        });
    }

    /**
     * 加载监控数据
     */
    async loadData() {
        try {
            const response = await fetch('/api/admin/system-monitoring');
            const data = await response.json();
            
            if (data.success) {
                this.updateSystemStatus(data.data.systemStatus);
                this.updateCharts(data.data.charts);
                this.updateLogs(data.data.logs);
                this.updateAlerts(data.data.alerts);
                this.updateServices(data.data.services);
            }
        } catch (error) {
            console.error('加载监控数据失败:', error);
            this.showError('加载监控数据失败');
        }
    }

    /**
     * 初始化图表
     */
    initCharts() {
        this.initPerformanceChart();
        this.initApiChart();
    }

    /**
     * 初始化性能图表
     */
    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'CPU使用率',
                        data: [],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: '内存使用率',
                        data: [],
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: '磁盘使用率',
                        data: [],
                        borderColor: '#45b7d1',
                        backgroundColor: 'rgba(69, 183, 209, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    /**
     * 初始化API图表
     */
    initApiChart() {
        const ctx = document.getElementById('apiChart').getContext('2d');
        this.charts.api = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '成功请求',
                        data: [],
                        backgroundColor: '#51cf66'
                    },
                    {
                        label: '失败请求',
                        data: [],
                        backgroundColor: '#ff6b6b'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    /**
     * 更新系统状态
     */
    updateSystemStatus(status) {
        document.getElementById('cpuUsage').textContent = status.cpu + '%';
        document.getElementById('memoryUsage').textContent = status.memory + '%';
        document.getElementById('diskUsage').textContent = status.disk + '%';
        document.getElementById('networkSpeed').textContent = status.network + ' MB/s';
        document.getElementById('apiCalls').textContent = status.apiCalls;
        document.getElementById('errorCount').textContent = status.errors;

        // 更新趋势指示器
        this.updateTrend('cpuTrend', status.cpuChange);
        this.updateTrend('memoryTrend', status.memoryChange);
        this.updateTrend('diskTrend', status.diskChange);
        this.updateTrend('networkTrend', status.networkChange);
        this.updateTrend('apiTrend', status.apiChange);
        this.updateTrend('errorTrend', status.errorChange);

        // 检查告警阈值
        this.checkAlertThresholds(status);
    }

    /**
     * 更新趋势指示器
     */
    updateTrend(elementId, change) {
        const element = document.getElementById(elementId);
        const isPositive = change > 0;
        const icon = element.querySelector('i');
        
        icon.className = isPositive ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        element.className = `status-trend ${isPositive ? 'positive' : 'negative'}`;
        element.innerHTML = DOMPurify.sanitize(`<i class="${icon.className}"></i> ${Math.abs(change).toFixed(1)}%`);
    }

    /**
     * 更新图表数据
     */
    updateCharts(chartData) {
        // 更新性能图表
        if (this.charts.performance && chartData.performance) {
            this.charts.performance.data.labels = chartData.performance.labels;
            this.charts.performance.data.datasets[0].data = chartData.performance.cpu;
            this.charts.performance.data.datasets[1].data = chartData.performance.memory;
            this.charts.performance.data.datasets[2].data = chartData.performance.disk;
            this.charts.performance.update();
        }

        // 更新API图表
        if (this.charts.api && chartData.api) {
            this.charts.api.data.labels = chartData.api.labels;
            this.charts.api.data.datasets[0].data = chartData.api.success;
            this.charts.api.data.datasets[1].data = chartData.api.failed;
            this.charts.api.update();
        }
    }

    /**
     * 更新日志显示
     */
    updateLogs(logs) {
        const container = document.getElementById('logContainer');
        container.innerHTML = DOMPurify.sanitize(logs.map(log => `
            <div class="log-item ${log.level}">
                <div class="log-time">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="log-level">${log.level.toUpperCase()}</div>
                <div class="log-message">${log.message}</div>
            </div>
        `).join(''));
    }

    /**
     * 更新告警显示
     */
    updateAlerts(alerts) {
        const container = document.getElementById('alertContainer');
        container.innerHTML = DOMPurify.sanitize(alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-icon">
                    <i class="fas ${this.getAlertIcon(alert.type)}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${new Date(alert.timestamp).toLocaleString()}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm" onclick="this.dismissAlert('${alert.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join(''));

        // 播放告警音效
        if (alerts.length > 0 && !this.alertsMuted) {
            this.playAlertSound();
        }
    }

    /**
     * 更新服务状态
     */
    updateServices(services) {
        const container = document.getElementById('serviceGrid');
        container.innerHTML = DOMPurify.sanitize(services.map(service => `
            <div class="service-item ${service.status}">
                <div class="service-icon">
                    <i class="fas ${this.getServiceIcon(service.type)}"></i>
                </div>
                <div class="service-info">
                    <div class="service-name">${service.name}</div>
                    <div class="service-status">${service.status}</div>
                    <div class="service-uptime">运行时间: ${service.uptime}</div>
                </div>
            </div>
        `).join(''));
    }

    /**
     * 开始监控
     */
    startMonitoring() {
        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, 10000); // 默认10秒刷新
    }

    /**
     * 停止监控
     */
    stopMonitoring() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * 切换监控状态
     */
    toggleMonitoring() {
        const button = document.getElementById('pauseMonitoring');
        if (this.refreshInterval) {
            this.stopMonitoring();
            button.innerHTML = DOMPurify.sanitize('<i class="fas fa-play"></i> 恢复监控');
            button.className = 'btn btn-success';
        } else {
            this.startMonitoring();
            button.innerHTML = DOMPurify.sanitize('<i class="fas fa-pause"></i> 暂停监控');
            button.className = 'btn btn-warning';
        }
    }

    /**
     * 更新刷新间隔
     */
    updateRefreshInterval(interval) {
        this.stopMonitoring();
        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, interval);
    }

    /**
     * 导出监控报告
     */
    async exportReport() {
        try {
            const response = await fetch('/api/admin/system-monitoring/export', {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                // 创建下载链接
                const link = document.createElement('a');
                link.href = data.data.downloadUrl;
                link.download = data.data.filename;
                link.click();
            }
        } catch (error) {
            console.error('导出报告失败:', error);
            this.showError('导出报告失败');
        }
    }

    /**
     * 清空日志
     */
    clearLogs() {
        document.getElementById('logContainer').innerHTML = '<div class="empty-state">暂无日志记录</div>';
    }

    /**
     * 清空告警
     */
    clearAlerts() {
        document.getElementById('alertContainer').innerHTML = '<div class="empty-state">暂无告警信息</div>';
    }

    /**
     * 切换告警音效
     */
    toggleAlertSound() {
        const button = document.getElementById('muteAlerts');
        this.alertsMuted = !this.alertsMuted;
        
        if (this.alertsMuted) {
            button.innerHTML = DOMPurify.sanitize('<i class="fas fa-volume-mute"></i> 取消静音');
        } else {
            button.innerHTML = DOMPurify.sanitize('<i class="fas fa-volume-up"></i> 静音');
        }
    }

    /**
     * 播放告警音效
     */
    playAlertSound() {
        if (this.alertSound && !this.alertsMuted) {
            this.alertSound.play().catch(e => console.log('无法播放告警音效'));
        }
    }

    /**
     * 过滤日志
     */
    filterLogs(level) {
        const logItems = document.querySelectorAll('.log-item');
        logItems.forEach(item => {
            if (level === 'all' || item.classList.contains(level)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * 切换时间范围
     */
    switchTimeRange(range) {
        // 更新按钮状态
        document.querySelectorAll('[data-range]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-range="${range}"]`).classList.add('active');

        // 重新加载数据
        this.loadData();
    }

    /**
     * 检查告警阈值
     */
    checkAlertThresholds(status) {
        const thresholds = {
            cpu: 80,
            memory: 85,
            disk: 90,
            errors: 10
        };

        if (status.cpu > thresholds.cpu) {
            this.addAlert('high', 'CPU使用率过高', `当前CPU使用率为${status.cpu}%，超过阈值${thresholds.cpu}%`);
        }

        if (status.memory > thresholds.memory) {
            this.addAlert('high', '内存使用率过高', `当前内存使用率为${status.memory}%，超过阈值${thresholds.memory}%`);
        }

        if (status.disk > thresholds.disk) {
            this.addAlert('medium', '磁盘空间不足', `当前磁盘使用率为${status.disk}%，超过阈值${thresholds.disk}%`);
        }

        if (status.errors > thresholds.errors) {
            this.addAlert('high', '错误数量异常', `当前错误数量为${status.errors}，超过阈值${thresholds.errors}`);
        }
    }

    /**
     * 添加告警
     */
    addAlert(severity, title, message) {
        const alert = {
            id: Date.now().toString(),
            severity,
            title,
            message,
            timestamp: new Date(),
            type: 'system'
        };

        const container = document.getElementById('alertContainer');
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${severity}`;
        alertElement.innerHTML = DOMPurify.sanitize(`
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${title}</div>
                <div class="alert-message">${message}</div>
                <div class="alert-time">${alert.timestamp.toLocaleString()}</div>
            </div>
            <div class="alert-actions">
                <button class="btn btn-sm" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);

        container.insertBefore(alertElement, container.firstChild);
        this.playAlertSound();
    }

    /**
     * 获取告警图标
     */
    getAlertIcon(type) {
        const icons = {
            system: 'fa-server',
            performance: 'fa-tachometer-alt',
            security: 'fa-shield-alt',
            network: 'fa-network-wired',
            database: 'fa-database'
        };
        return icons[type] || 'fa-exclamation-triangle';
    }

    /**
     * 获取服务图标
     */
    getServiceIcon(type) {
        const icons = {
            web: 'fa-globe',
            database: 'fa-database',
            cache: 'fa-memory',
            queue: 'fa-list',
            storage: 'fa-hdd'
        };
        return icons[type] || 'fa-server';
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        // 这里可以集成通知系统
        console.error(message);
    }

    /**
     * 销毁监控实例
     */
    destroy() {
        this.stopMonitoring();
        
        // 销毁图表
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
    }
}

// 导出类供全局使用
window.SystemMonitoring = SystemMonitoring;