
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
 * 交易分析管理模块
 * 提供交易趋势图表、收支统计、异常交易检测、财务报表等功能
 */
class TransactionAnalytics {
    constructor() {
        this.charts = {};
        this.currentDateRange = 'week';
        this.currentFilter = 'all';
        this.init();
    }

    /**
     * 初始化交易分析模块
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadAnalyticsData();
    }

    /**
     * 渲染交易分析页面
     */
    render() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = DOMPurify.sanitize(`
            <div class="transaction-analytics">
                <div class="analytics-header">
                    <h2><i class="fas fa-chart-line"></i> 交易分析</h2>
                    <div class="analytics-controls">
                        <div class="date-range-selector">
                            <select id="dateRangeSelect" class="filter-select">
                                <option value="today">今日</option>
                                <option value="week" selected>本周</option>
                                <option value="month">本月</option>
                                <option value="quarter">本季度</option>
                                <option value="year">本年</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>
                        <div class="transaction-filter">
                            <select id="transactionFilter" class="filter-select">
                                <option value="all">全部交易</option>
                                <option value="deposit">充值</option>
                                <option value="withdraw">提现</option>
                                <option value="redpacket">红包</option>
                                <option value="task_reward">任务奖励</option>
                            </select>
                        </div>
                        <button id="exportReportBtn" class="btn btn-primary">
                            <i class="fas fa-download"></i> 导出报表
                        </button>
                    </div>
                </div>

                <!-- 统计卡片 -->
                <div class="analytics-stats">
                    <div class="stat-card">
                        <div class="stat-icon" style="color: #28a745);">
                            <i class="fas fa-arrow-up"></i>
                        </div>
                        <div class="stat-value" id="totalIncome">¥0</div>
                        <div class="stat-label">总收入</div>
                        <div class="stat-change positive" id="incomeChange">+0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: #dc3545;">
                            <i class="fas fa-arrow-down"></i>
                        </div>
                        <div class="stat-value" id="totalExpense">¥0</div>
                        <div class="stat-label">总支出</div>
                        <div class="stat-change negative" id="expenseChange">-0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: #667eea;">
                            <i class="fas fa-balance-scale"></i>
                        </div>
                        <div class="stat-value" id="netProfit">¥0</div>
                        <div class="stat-label">净利润</div>
                        <div class="stat-change" id="profitChange">0%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="color: #ffc107;">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="stat-value" id="transactionCount">0</div>
                        <div class="stat-label">交易笔数</div>
                        <div class="stat-change" id="countChange">+0%</div>
                    </div>
                </div>

                <!-- 图表区域 -->
                <div class="charts-container">
                    <div class="chart-row">
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>交易趋势</h3>
                                <div class="chart-controls">
                                    <button class="chart-type-btn active" data-type="line">线图</button>
                                    <button class="chart-type-btn" data-type="bar">柱图</button>
                                </div>
                            </div>
                            <canvas id="transactionTrendChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>交易类型分布</h3>
                            </div>
                            <canvas id="transactionTypeChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-row">
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>收支对比</h3>
                            </div>
                            <canvas id="incomeExpenseChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <div class="chart-header">
                                <h3>异常交易监控</h3>
                            </div>
                            <canvas id="anomalyChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 详细数据表格 -->
                <div class="analytics-table">
                    <div class="table-header">
                        <h3>交易详情</h3>
                        <div class="table-controls">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="transactionSearch" placeholder="搜索交易记录...">
                            </div>
                            <button id="refreshDataBtn" class="btn btn-secondary">
                                <i class="fas fa-sync-alt"></i> 刷新
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="table" id="transactionTable">
                            <thead>
                                <tr>
                                    <th>交易ID</th>
                                    <th>用户</th>
                                    <th>类型</th>
                                    <th>金额</th>
                                    <th>状态</th>
                                    <th>时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="transactionTableBody">
                                <!-- 动态加载 -->
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="transactionPagination">
                        <!-- 动态生成分页 -->
                    </div>
                </div>

                <!-- 异常交易警报 -->
                <div class="anomaly-alerts" id="anomalyAlerts">
                    <!-- 动态加载异常警报 -->
                </div>
            </div>

            <!-- 交易详情模态框 -->
            <div class="modal" id="transactionDetailModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">交易详情</h3>
                        <button class="close-btn" id="closeDetailModal">&times;</button>
                    </div>
                    <div class="modal-body" id="transactionDetailBody">
                        <!-- 动态加载交易详情 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 日期范围选择
        document.getElementById('dateRangeSelect').addEventListener('change', (e) => {
            this.currentDateRange = e.target.value;
            this.loadAnalyticsData();
        });

        // 交易类型过滤
        document.getElementById('transactionFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.loadAnalyticsData();
        });

        // 导出报表
        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportReport();
        });

        // 图表类型切换
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateTrendChart(e.target.dataset.type);
            });
        });

        // 搜索功能
        document.getElementById('transactionSearch').addEventListener('input', (e) => {
            this.searchTransactions(e.target.value);
        });

        // 刷新数据
        document.getElementById('refreshDataBtn').addEventListener('click', () => {
            this.loadAnalyticsData();
        });

        // 模态框关闭
        document.getElementById('closeDetailModal').addEventListener('click', () => {
            document.getElementById('transactionDetailModal').classList.remove('show');
        });
    }

    /**
     * 加载分析数据
     */
    async loadAnalyticsData() {
        try {
            const response = await fetch(`/api/admin/analytics/transactions?range=${this.currentDateRange}&filter=${this.currentFilter}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateStatistics(data.statistics);
                this.updateCharts(data.charts);
                this.updateTransactionTable(data.transactions);
                this.updateAnomalyAlerts(data.anomalies);
            }
        } catch (error) {
            console.error('加载分析数据失败:', error);
        }
    }

    /**
     * 更新统计数据
     */
    updateStatistics(stats) {
        document.getElementById('totalIncome').textContent = `¥${stats.totalIncome.toLocaleString()}`;
        document.getElementById('totalExpense').textContent = `¥${stats.totalExpense.toLocaleString()}`;
        document.getElementById('netProfit').textContent = `¥${stats.netProfit.toLocaleString()}`;
        document.getElementById('transactionCount').textContent = stats.transactionCount.toLocaleString();

        // 更新变化百分比
        this.updateChangeIndicator('incomeChange', stats.incomeChange);
        this.updateChangeIndicator('expenseChange', stats.expenseChange);
        this.updateChangeIndicator('profitChange', stats.profitChange);
        this.updateChangeIndicator('countChange', stats.countChange);
    }

    /**
     * 更新变化指示器
     */
    updateChangeIndicator(elementId, change) {
        const element = document.getElementById(elementId);
        const isPositive = change >= 0;
        
        element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
        element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
    }

    /**
     * 更新图表
     */
    updateCharts(chartData) {
        this.initTrendChart(chartData.trend);
        this.initTypeChart(chartData.types);
        this.initIncomeExpenseChart(chartData.incomeExpense);
        this.initAnomalyChart(chartData.anomalies);
    }

    /**
     * 初始化趋势图表
     */
    initTrendChart(data) {
        const ctx = document.getElementById('transactionTrendChart').getContext('2d');
        
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '收入',
                    data: data.income,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                }, {
                    label: '支出',
                    data: data.expense,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 初始化交易类型图表
     */
    initTypeChart(data) {
        const ctx = document.getElementById('transactionTypeChart').getContext('2d');
        
        if (this.charts.type) {
            this.charts.type.destroy();
        }

        this.charts.type = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#28a745',
                        '#dc3545',
                        '#ffc107',
                        '#17a2b8',
                        '#6f42c1'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * 初始化收支对比图表
     */
    initIncomeExpenseChart(data) {
        const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
        
        if (this.charts.incomeExpense) {
            this.charts.incomeExpense.destroy();
        }

        this.charts.incomeExpense = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '收入',
                    data: data.income,
                    backgroundColor: '#28a745'
                }, {
                    label: '支出',
                    data: data.expense,
                    backgroundColor: '#dc3545'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 初始化异常监控图表
     */
    initAnomalyChart(data) {
        const ctx = document.getElementById('anomalyChart').getContext('2d');
        
        if (this.charts.anomaly) {
            this.charts.anomaly.destroy();
        }

        this.charts.anomaly = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: '正常交易',
                    data: data.normal,
                    backgroundColor: '#28a745',
                    pointRadius: 3
                }, {
                    label: '异常交易',
                    data: data.anomalies,
                    backgroundColor: '#dc3545',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                hour: 'HH:mm'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '交易金额 (¥)'
                        }
                    }
                }
            }
        });
    }

    /**
     * 更新趋势图表类型
     */
    updateTrendChart(type) {
        if (this.charts.trend) {
            this.charts.trend.config.type = type;
            this.charts.trend.update();
        }
    }

    /**
     * 更新交易表格
     */
    updateTransactionTable(transactions) {
        const tbody = document.getElementById('transactionTableBody');
        tbody.innerHTML = DOMPurify.sanitize('');

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = DOMPurify.sanitize(`
                <td>${transaction.id}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${transaction.user.username.charAt(0).toUpperCase()}</div>
                        <span>${transaction.user.username}</span>
                    </div>
                </td>
                <td>
                    <span class="transaction-type ${transaction.type}">${this.getTypeLabel(transaction.type)}</span>
                </td>
                <td class="${transaction.amount >= 0 ? 'positive' : 'negative'}">
                    ¥${Math.abs(transaction.amount).toLocaleString()}
                </td>
                <td>
                    <span class="status-badge status-${transaction.status}">${this.getStatusLabel(transaction.status)}</span>
                </td>
                <td>${new Date(transaction.createdAt).toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="transactionAnalytics.viewTransactionDetail('${transaction.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `);
            tbody.appendChild(row);
        });
    }

    /**
     * 更新异常警报
     */
    updateAnomalyAlerts(anomalies) {
        const alertsContainer = document.getElementById('anomalyAlerts');
        
        if (anomalies.length === 0) {
            alertsContainer.innerHTML = DOMPurify.sanitize('');
            return;
        }

        alertsContainer.innerHTML = DOMPurify.sanitize(`
            <div class="alert-section">
                <h3><i class="fas fa-exclamation-triangle"></i> 异常交易警报</h3>
                <div class="alerts-list">
                    ${anomalies.map(anomaly => `
                        <div class="alert-item ${anomaly.severity}">
                            <div class="alert-icon">
                                <i class="fas fa-${this.getAlertIcon(anomaly.type)}"></i>
                            </div>
                            <div class="alert-content">
                                <div class="alert-title">${anomaly.title}</div>
                                <div class="alert-description">${anomaly.description}</div>
                                <div class="alert-time">${new Date(anomaly.timestamp).toLocaleString()}</div>
                            </div>
                            <div class="alert-actions">
                                <button class="btn btn-sm btn-primary" onclick="transactionAnalytics.handleAnomaly('${anomaly.id}')">
                                    处理
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
    }

    /**
     * 搜索交易记录
     */
    searchTransactions(query) {
        // 实现搜索逻辑
        console.log('搜索交易:', query);
    }

    /**
     * 查看交易详情
     */
    async viewTransactionDetail(transactionId) {
        try {
            const response = await fetch(`/api/admin/transactions/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showTransactionDetail(data.transaction);
            }
        } catch (error) {
            console.error('获取交易详情失败:', error);
        }
    }

    /**
     * 显示交易详情
     */
    showTransactionDetail(transaction) {
        const modal = document.getElementById('transactionDetailModal');
        const body = document.getElementById('transactionDetailBody');
        
        body.innerHTML = DOMPurify.sanitize(`
            <div class="transaction-detail">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>交易ID:</label>
                            <span>${transaction.id}</span>
                        </div>
                        <div class="detail-item">
                            <label>用户:</label>
                            <span>${transaction.user.username}</span>
                        </div>
                        <div class="detail-item">
                            <label>类型:</label>
                            <span>${this.getTypeLabel(transaction.type)}</span>
                        </div>
                        <div class="detail-item">
                            <label>金额:</label>
                            <span class="${transaction.amount >= 0 ? 'positive' : 'negative'}">
                                ¥${Math.abs(transaction.amount).toLocaleString()}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>状态:</label>
                            <span class="status-badge status-${transaction.status}">
                                ${this.getStatusLabel(transaction.status)}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>创建时间:</label>
                            <span>${new Date(transaction.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                ${transaction.details ? `
                    <div class="detail-section">
                        <h4>详细信息</h4>
                        <div class="detail-content">
                            ${JSON.stringify(transaction.details, null, 2)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `);
        
        modal.classList.add('show');
    }

    /**
     * 处理异常交易
     */
    async handleAnomaly(anomalyId) {
        try {
            const response = await fetch(`/api/admin/anomalies/${anomalyId}/handle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.loadAnalyticsData(); // 重新加载数据
            }
        } catch (error) {
            console.error('处理异常失败:', error);
        }
    }

    /**
     * 导出报表
     */
    async exportReport() {
        try {
            const response = await fetch(`/api/admin/analytics/export?range=${this.currentDateRange}&filter=${this.currentFilter}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transaction-report-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('导出报表失败:', error);
        }
    }

    /**
     * 获取交易类型标签
     */
    getTypeLabel(type) {
        const labels = {
            'deposit': '充值',
            'withdraw': '提现',
            'redpacket': '红包',
            'task_reward': '任务奖励',
            'transfer': '转账'
        };
        return labels[type] || type;
    }

    /**
     * 获取状态标签
     */
    getStatusLabel(status) {
        const labels = {
            'pending': '待处理',
            'completed': '已完成',
            'failed': '失败',
            'cancelled': '已取消'
        };
        return labels[status] || status;
    }

    /**
     * 获取警报图标
     */
    getAlertIcon(type) {
        const icons = {
            'high_amount': 'dollar-sign',
            'frequent': 'clock',
            'suspicious': 'shield-alt',
            'failed': 'times-circle'
        };
        return icons[type] || 'exclamation';
    }
}

// 全局实例
window.transactionAnalytics = new TransactionAnalytics();