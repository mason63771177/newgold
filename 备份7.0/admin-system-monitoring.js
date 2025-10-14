/**
 * 系统监控面板管理类
 * 负责服务器状态、性能指标、错误日志监控
 */
class SystemMonitoring {
    constructor() {
        this.currentView = 'overview';
        this.refreshInterval = null;
        this.chartInstances = {};
        this.init();
    }

    /**
     * 初始化系统监控面板
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadData();
        this.startAutoRefresh();
    }

    /**
     * 渲染系统监控面板界面
     */
    render() {
        const container = document.getElementById('mainContent');
        container.innerHTML = `
            <div class="system-monitoring-container">
                <div class="system-monitoring-header">
                    <h2 class="system-monitoring-title">系统监控面板</h2>
                    <div class="system-monitoring-actions">
                        <button class="system-monitoring-btn primary" id="refreshBtn">刷新数据</button>
                        <button class="system-monitoring-btn secondary" id="exportBtn">导出报告</button>
                        <button class="system-monitoring-btn warning" id="alertsBtn">告警设置</button>
                    </div>
                </div>

                <div class="system-monitoring-nav">
                    <button class="system-monitoring-nav-item active" data-view="overview">系统概览</button>
                    <button class="system-monitoring-nav-item" data-view="server">服务器状态</button>
                    <button class="system-monitoring-nav-item" data-view="performance">性能指标</button>
                    <button class="system-monitoring-nav-item" data-view="logs">错误日志</button>
                    <button class="system-monitoring-nav-item" data-view="alerts">告警管理</button>
                </div>

                <div class="system-monitoring-stats" id="systemStats">
                    <!-- 统计卡片将在这里动态生成 -->
                </div>

                <div class="system-monitoring-content" id="systemContent">
                    <!-- 内容区域将在这里动态生成 -->
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 导航切换
        document.querySelectorAll('.system-monitoring-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // 刷新按钮
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadData();
        });

        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportReport();
        });

        // 告警设置按钮
        document.getElementById('alertsBtn').addEventListener('click', () => {
            this.showAlertsModal();
        });
    }

    /**
     * 切换视图
     * @param {string} view - 视图名称
     */
    switchView(view) {
        this.currentView = view;
        
        // 更新导航状态
        document.querySelectorAll('.system-monitoring-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // 加载对应视图数据
        this.loadViewData(view);
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            const response = await fetch('/admin/system-monitoring/overview');
            const data = await response.json();
            this.renderStats(data.stats);
            this.loadViewData(this.currentView);
        } catch (error) {
            console.error('加载系统监控数据失败:', error);
        }
    }

    /**
     * 加载视图数据
     * @param {string} view - 视图名称
     */
    async loadViewData(view) {
        try {
            let endpoint = '';
            switch (view) {
                case 'overview':
                    endpoint = '/admin/system-monitoring/overview';
                    break;
                case 'server':
                    endpoint = '/admin/system-monitoring/server';
                    break;
                case 'performance':
                    endpoint = '/admin/system-monitoring/performance';
                    break;
                case 'logs':
                    endpoint = '/admin/system-monitoring/logs';
                    break;
                case 'alerts':
                    endpoint = '/admin/system-monitoring/alerts';
                    break;
            }

            const response = await fetch(endpoint);
            const data = await response.json();
            this.renderView(view, data);
        } catch (error) {
            console.error(`加载${view}数据失败:`, error);
        }
    }

    /**
     * 渲染统计卡片
     * @param {Array} stats - 统计数据
     */
    renderStats(stats) {
        const container = document.getElementById('systemStats');
        container.innerHTML = stats.map(stat => `
            <div class="system-monitoring-stat-card ${stat.type}">
                <div class="system-monitoring-stat-title">${stat.title}</div>
                <div class="system-monitoring-stat-value">${stat.value}</div>
                <div class="system-monitoring-stat-change ${stat.change > 0 ? 'positive' : 'negative'}">
                    ${stat.change > 0 ? '+' : ''}${stat.change}%
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染视图内容
     * @param {string} view - 视图名称
     * @param {Object} data - 数据
     */
    renderView(view, data) {
        const container = document.getElementById('systemContent');
        
        switch (view) {
            case 'overview':
                this.renderOverview(container, data);
                break;
            case 'server':
                this.renderServerStatus(container, data);
                break;
            case 'performance':
                this.renderPerformance(container, data);
                break;
            case 'logs':
                this.renderLogs(container, data);
                break;
            case 'alerts':
                this.renderAlerts(container, data);
                break;
        }
    }

    /**
     * 渲染系统概览
     * @param {HTMLElement} container - 容器元素
     * @param {Object} data - 数据
     */
    renderOverview(container, data) {
        container.innerHTML = `
            <div class="system-monitoring-overview">
                <div class="system-monitoring-charts">
                    <div class="system-monitoring-chart-item">
                        <div class="system-monitoring-content-header">
                            <h3 class="system-monitoring-content-title">CPU使用率</h3>
                        </div>
                        <div class="system-monitoring-chart-container" id="cpuChart"></div>
                    </div>
                    <div class="system-monitoring-chart-item">
                        <div class="system-monitoring-content-header">
                            <h3 class="system-monitoring-content-title">内存使用率</h3>
                        </div>
                        <div class="system-monitoring-chart-container" id="memoryChart"></div>
                    </div>
                </div>
                <div class="system-monitoring-recent-alerts">
                    <div class="system-monitoring-content-header">
                        <h3 class="system-monitoring-content-title">最近告警</h3>
                    </div>
                    <div class="system-monitoring-alerts-list">
                        ${data.recentAlerts.map(alert => `
                            <div class="system-monitoring-alert ${alert.level}">
                                <div class="alert-content">
                                    <div class="alert-title">${alert.title}</div>
                                    <div class="alert-message">${alert.message}</div>
                                    <div class="alert-time">${alert.time}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // 渲染图表
        this.renderChart('cpuChart', data.cpuData, 'CPU使用率');
        this.renderChart('memoryChart', data.memoryData, '内存使用率');
    }

    /**
     * 渲染服务器状态
     * @param {HTMLElement} container - 容器元素
     * @param {Object} data - 数据
     */
    renderServerStatus(container, data) {
        container.innerHTML = `
            <div class="system-monitoring-server">
                <div class="system-monitoring-content-header">
                    <h3 class="system-monitoring-content-title">服务器状态</h3>
                </div>
                <div class="system-monitoring-server-grid">
                    ${data.servers.map(server => `
                        <div class="system-monitoring-server-card ${server.status}">
                            <div class="server-header">
                                <h4>${server.name}</h4>
                                <span class="server-status ${server.status}">${server.statusText}</span>
                            </div>
                            <div class="server-info">
                                <div class="server-metric">
                                    <span class="metric-label">CPU:</span>
                                    <span class="metric-value">${server.cpu}%</span>
                                </div>
                                <div class="server-metric">
                                    <span class="metric-label">内存:</span>
                                    <span class="metric-value">${server.memory}%</span>
                                </div>
                                <div class="server-metric">
                                    <span class="metric-label">磁盘:</span>
                                    <span class="metric-value">${server.disk}%</span>
                                </div>
                                <div class="server-metric">
                                    <span class="metric-label">网络:</span>
                                    <span class="metric-value">${server.network}</span>
                                </div>
                            </div>
                            <div class="server-actions">
                                <button class="system-monitoring-btn small primary">详情</button>
                                <button class="system-monitoring-btn small secondary">重启</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 渲染性能指标
     * @param {HTMLElement} container - 容器元素
     * @param {Object} data - 数据
     */
    renderPerformance(container, data) {
        container.innerHTML = `
            <div class="system-monitoring-performance">
                <div class="system-monitoring-controls">
                    <select class="system-monitoring-filter" id="timeRange">
                        <option value="1h">最近1小时</option>
                        <option value="6h">最近6小时</option>
                        <option value="24h">最近24小时</option>
                        <option value="7d">最近7天</option>
                    </select>
                    <select class="system-monitoring-filter" id="metricType">
                        <option value="all">所有指标</option>
                        <option value="cpu">CPU</option>
                        <option value="memory">内存</option>
                        <option value="disk">磁盘</option>
                        <option value="network">网络</option>
                    </select>
                </div>
                <div class="system-monitoring-performance-charts">
                    <div class="system-monitoring-chart-item">
                        <div class="system-monitoring-content-header">
                            <h3 class="system-monitoring-content-title">系统负载</h3>
                        </div>
                        <div class="system-monitoring-chart-container" id="loadChart"></div>
                    </div>
                    <div class="system-monitoring-chart-item">
                        <div class="system-monitoring-content-header">
                            <h3 class="system-monitoring-content-title">响应时间</h3>
                        </div>
                        <div class="system-monitoring-chart-container" id="responseChart"></div>
                    </div>
                </div>
            </div>
        `;

        // 渲染性能图表
        this.renderChart('loadChart', data.loadData, '系统负载');
        this.renderChart('responseChart', data.responseData, '响应时间');
    }

    /**
     * 渲染错误日志
     * @param {HTMLElement} container - 容器元素
     * @param {Object} data - 数据
     */
    renderLogs(container, data) {
        container.innerHTML = `
            <div class="system-monitoring-logs">
                <div class="system-monitoring-controls">
                    <input type="text" class="system-monitoring-search" placeholder="搜索日志..." id="logSearch">
                    <select class="system-monitoring-filter" id="logLevel">
                        <option value="all">所有级别</option>
                        <option value="error">错误</option>
                        <option value="warning">警告</option>
                        <option value="info">信息</option>
                    </select>
                    <select class="system-monitoring-filter" id="logSource">
                        <option value="all">所有来源</option>
                        <option value="api">API</option>
                        <option value="database">数据库</option>
                        <option value="system">系统</option>
                    </select>
                    <button class="system-monitoring-btn primary" id="clearLogsBtn">清空日志</button>
                </div>
                <div class="system-monitoring-content">
                    <div class="system-monitoring-content-header">
                        <h3 class="system-monitoring-content-title">错误日志</h3>
                    </div>
                    <div class="system-monitoring-logs-container">
                        ${data.logs.map(log => `
                            <div class="system-monitoring-log-item ${log.level}">
                                <div class="log-time">${log.time}</div>
                                <div class="log-level ${log.level}">${log.level.toUpperCase()}</div>
                                <div class="log-source">${log.source}</div>
                                <div class="log-message">${log.message}</div>
                                <div class="log-details">${log.details || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="system-monitoring-pagination">
                        <button class="system-monitoring-btn secondary">上一页</button>
                        <span>第 1 页，共 ${Math.ceil(data.total / 20)} 页</span>
                        <button class="system-monitoring-btn secondary">下一页</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染告警管理
     * @param {HTMLElement} container - 容器元素
     * @param {Object} data - 数据
     */
    renderAlerts(container, data) {
        container.innerHTML = `
            <div class="system-monitoring-alerts">
                <div class="system-monitoring-controls">
                    <button class="system-monitoring-btn primary" id="addAlertBtn">添加告警规则</button>
                    <button class="system-monitoring-btn warning" id="testAlertBtn">测试告警</button>
                </div>
                <div class="system-monitoring-content">
                    <div class="system-monitoring-content-header">
                        <h3 class="system-monitoring-content-title">告警规则</h3>
                    </div>
                    <table class="system-monitoring-table">
                        <thead>
                            <tr>
                                <th>规则名称</th>
                                <th>监控指标</th>
                                <th>阈值</th>
                                <th>状态</th>
                                <th>最后触发</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.alertRules.map(rule => `
                                <tr>
                                    <td>${rule.name}</td>
                                    <td>${rule.metric}</td>
                                    <td>${rule.threshold}</td>
                                    <td><span class="system-monitoring-status ${rule.status}">${rule.statusText}</span></td>
                                    <td>${rule.lastTriggered || '从未'}</td>
                                    <td>
                                        <button class="system-monitoring-btn small primary">编辑</button>
                                        <button class="system-monitoring-btn small secondary">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 渲染图表
     * @param {string} containerId - 容器ID
     * @param {Array} data - 数据
     * @param {string} title - 标题
     */
    renderChart(containerId, data, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 简单的图表渲染（实际项目中可以使用Chart.js等图表库）
        container.innerHTML = `
            <div class="simple-chart">
                <div class="chart-title">${title}</div>
                <div class="chart-data">
                    ${data.map((point, index) => `
                        <div class="chart-bar" style="height: ${point.value}%; background: linear-gradient(135deg, #007bff, #0056b3);">
                            <span class="chart-value">${point.value}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 开始自动刷新
     */
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadData();
        }, 30000); // 每30秒刷新一次
    }

    /**
     * 停止自动刷新
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * 导出报告
     */
    async exportReport() {
        try {
            const response = await fetch('/admin/system-monitoring/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'monitoring',
                    timeRange: '24h'
                })
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system-monitoring-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('导出报告失败:', error);
            alert('导出报告失败，请稍后重试');
        }
    }

    /**
     * 显示告警设置模态框
     */
    showAlertsModal() {
        const modal = document.createElement('div');
        modal.className = 'system-monitoring-modal show';
        modal.innerHTML = `
            <div class="system-monitoring-modal-content">
                <div class="system-monitoring-modal-header">
                    <h3 class="system-monitoring-modal-title">告警设置</h3>
                    <button class="system-monitoring-modal-close">&times;</button>
                </div>
                <div class="system-monitoring-modal-body">
                    <div class="system-monitoring-form-group">
                        <label class="system-monitoring-form-label">规则名称</label>
                        <input type="text" class="system-monitoring-form-control" placeholder="输入规则名称">
                    </div>
                    <div class="system-monitoring-form-group">
                        <label class="system-monitoring-form-label">监控指标</label>
                        <select class="system-monitoring-form-control">
                            <option value="cpu">CPU使用率</option>
                            <option value="memory">内存使用率</option>
                            <option value="disk">磁盘使用率</option>
                            <option value="response">响应时间</option>
                        </select>
                    </div>
                    <div class="system-monitoring-form-group">
                        <label class="system-monitoring-form-label">阈值</label>
                        <input type="number" class="system-monitoring-form-control" placeholder="输入阈值">
                    </div>
                    <div class="system-monitoring-form-group">
                        <label class="system-monitoring-form-label">通知方式</label>
                        <select class="system-monitoring-form-control">
                            <option value="email">邮件</option>
                            <option value="sms">短信</option>
                            <option value="webhook">Webhook</option>
                        </select>
                    </div>
                </div>
                <div class="system-monitoring-modal-footer">
                    <button class="system-monitoring-btn secondary" id="cancelBtn">取消</button>
                    <button class="system-monitoring-btn primary" id="saveBtn">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定模态框事件
        modal.querySelector('.system-monitoring-modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#cancelBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#saveBtn').addEventListener('click', () => {
            // 保存告警规则逻辑
            document.body.removeChild(modal);
        });
    }

    /**
     * 销毁实例
     */
    destroy() {
        this.stopAutoRefresh();
        // 清理图表实例
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.chartInstances = {};
    }
}

// 导出类
window.SystemMonitoring = SystemMonitoring;