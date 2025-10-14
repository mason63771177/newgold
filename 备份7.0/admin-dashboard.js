/**
 * 增强版管理员仪表板类
 * 提供更丰富的图表类型和数据可视化功能
 */
class AdminDashboard {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
    }

    /**
     * 渲染仪表板主界面
     */
    async render() {
        const content = `
            <div class="dashboard-container">
                <!-- 统计卡片区域 -->
                <div class="stats-grid">
                    <div class="stat-card" id="users-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="total-users">-</h3>
                            <p>总用户数</p>
                            <span class="stat-change" id="users-change">-</span>
                        </div>
                    </div>
                    
                    <div class="stat-card" id="balance-card">
                        <div class="stat-icon">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="total-balance">-</h3>
                            <p>总余额</p>
                            <span class="stat-change" id="balance-change">-</span>
                        </div>
                    </div>
                    
                    <div class="stat-card" id="transactions-card">
                        <div class="stat-icon">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="total-transactions">-</h3>
                            <p>今日交易</p>
                            <span class="stat-change" id="transactions-change">-</span>
                        </div>
                    </div>
                    
                    <div class="stat-card" id="tasks-card">
                        <div class="stat-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="completed-tasks">-</h3>
                            <p>已完成任务</p>
                            <span class="stat-change" id="tasks-change">-</span>
                        </div>
                    </div>
                    
                    <div class="stat-card" id="redpackets-card">
                        <div class="stat-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="redpackets-sent">-</h3>
                            <p>红包发放</p>
                            <span class="stat-change" id="redpackets-change">-</span>
                        </div>
                    </div>
                    
                    <div class="stat-card" id="teams-card">
                        <div class="stat-icon">
                            <i class="fas fa-users-cog"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="active-teams">-</h3>
                            <p>活跃团队</p>
                            <span class="stat-change" id="teams-change">-</span>
                        </div>
                    </div>
                </div>

                <!-- 统计卡片 -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="totalUsers">-</h3>
                                <p>总用户数</p>
                                <span class="stat-change positive" id="userGrowth">+0%</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-wallet"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="totalBalance">-</h3>
                                <p>总余额</p>
                                <span class="stat-change positive" id="balanceGrowth">+0%</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-exchange-alt"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="dailyTransactions">-</h3>
                                <p>今日交易</p>
                                <span class="stat-change positive" id="transactionGrowth">+0%</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="stat-info">
                                <h3 id="completedTasks">-</h3>
                                <p>完成任务</p>
                                <span class="stat-change positive" id="taskGrowth">+0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 第一行：用户增长和交易分布 -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">用户增长趋势</h5>
                                <div class="card-tools">
                                    <select id="periodSelect" class="form-select form-select-sm">
                                        <option value="7">最近7天</option>
                                        <option value="30" selected>最近30天</option>
                                        <option value="90">最近90天</option>
                                    </select>
                                </div>
                            </div>
                            <div class="chart-container">
                                <canvas id="userGrowthChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">交易类型分布</h5>
                            </div>
                            <div class="chart-container">
                                <canvas id="pieChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 第二行：收支分析和用户活跃度 -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">收支分析</h5>
                            </div>
                            <div class="chart-container">
                                <canvas id="doughnutChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">用户活跃度对比</h5>
                            </div>
                            <div class="chart-container">
                                <canvas id="radarChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 第三行：红包趋势和任务完成 -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">红包发放趋势</h5>
                            </div>
                            <div class="chart-container">
                                <canvas id="redpacketChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">任务完成情况</h5>
                            </div>
                            <div class="chart-container">
                                <canvas id="taskChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 第四行：实时活动和系统状态 -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">实时活动</h5>
                            </div>
                            <div class="card-body">
                                <div class="activity-list" id="activityList">
                                    <div class="loading">加载中...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">系统状态</h5>
                            </div>
                            <div class="card-body">
                                <div class="system-status" id="systemStatus">
                                    <div class="loading">加载中...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('main-content').innerHTML = content;
        
        // 初始化所有功能
        await this.loadStatistics();
        await this.initializeCharts();
        await this.loadRealTimeActivity();
        await this.loadSystemStatus();
        
        // 设置自动刷新
        this.startAutoRefresh();
        
        // 绑定事件监听器
        this.bindEventListeners();
    }

    /**
     * 加载统计数据
     */
    async loadStatistics() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                this.updateStatCards(stats);
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    }

    /**
     * 更新统计卡片
     */
    updateStatCards(stats) {
        // 更新数值
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalBalance').textContent = `¥${(stats.totalBalance || 0).toLocaleString()}`;
        document.getElementById('dailyTransactions').textContent = stats.dailyTransactions || 0;
        document.getElementById('completedTasks').textContent = stats.completedTasks || 0;

        // 更新变化百分比
        this.updateChangeIndicator('userGrowth', stats.userGrowth);
        this.updateChangeIndicator('balanceGrowth', stats.balanceChange);
        this.updateChangeIndicator('transactionGrowth', stats.transactionChange);
        this.updateChangeIndicator('taskGrowth', stats.taskChange);
    }

    /**
     * 更新变化指示器
     */
    updateChangeIndicator(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element || change === undefined) return;

        const isPositive = change >= 0;
        element.textContent = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;
        element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
    }

    /**
     * 初始化所有图表
     */
    async initializeCharts() {
        await Promise.all([
            this.initUserGrowthChart(),
            this.initPieChart(),
            this.initDoughnutChart(),
            this.initRadarChart(),
            this.initRedpacketChart(),
            this.initTaskChart()
        ]);
    }

    /**
     * 初始化用户增长趋势图
     */
    async initUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(54, 162, 235, 0.4)');
        gradient.addColorStop(1, 'rgba(54, 162, 235, 0.0)');

        this.charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '新增用户',
                    data: [],
                    borderColor: '#36A2EB',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        await this.loadUserGrowthData();
    }

    /**
     * 初始化交易类型分布饼图
     */
    async initPieChart() {
        const ctx = document.getElementById('pieChart').getContext('2d');
        
        this.charts.pie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['充值', '提现', '转账', '红包', '任务奖励'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
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

        await this.loadTransactionDistribution();
    }

    /**
     * 初始化收支分析环形图
     */
    async initDoughnutChart() {
        const ctx = document.getElementById('doughnutChart').getContext('2d');
        
        this.charts.doughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['收入', '支出'],
                datasets: [{
                    data: [],
                    backgroundColor: ['#4CAF50', '#FF5722'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        await this.loadRevenueData();
    }

    /**
     * 初始化用户活跃度雷达图
     */
    async initRadarChart() {
        const ctx = document.getElementById('radarChart').getContext('2d');
        
        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['登录频率', '任务完成', '红包参与', '邀请活跃', '交易活跃', '社交互动'],
                datasets: [{
                    label: '本周',
                    data: [],
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    pointBackgroundColor: '#36A2EB',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#36A2EB'
                }, {
                    label: '上周',
                    data: [],
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    pointBackgroundColor: '#FF6384',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#FF6384'
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
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        await this.loadUserActivityData();
    }

    /**
     * 初始化任务完成情况图表
     */
    async initTaskChart() {
        const ctx = document.getElementById('taskChart').getContext('2d');
        
        this.charts.task = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['新手任务', '答题任务', '大神任务', '日常任务'],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#4BC0C0',
                        '#FFCE56',
                        '#FF6384',
                        '#36A2EB'
                    ],
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '60%'
            }
        });

        await this.loadTaskCompletionData();
    }

    /**
     * 初始化红包发放趋势图
     */
    async initRedpacketChart() {
        const ctx = document.getElementById('redpacketChart').getContext('2d');
        
        this.charts.redpacket = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '红包发放数量',
                    data: [],
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: '参与人数',
                    data: [],
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
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
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        await this.loadRedpacketTrendData();
    }

    /**
     * 加载用户增长数据
     */
    async loadUserGrowthData(period = 30) {
        try {
            const response = await fetch(`/api/admin/user-growth?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.charts.userGrowth.data.labels = data.labels;
                this.charts.userGrowth.data.datasets[0].data = data.values;
                this.charts.userGrowth.update();
            }
        } catch (error) {
            console.error('加载用户增长数据失败:', error);
        }
    }

    /**
     * 加载交易分布数据
     */
    async loadTransactionDistribution() {
        try {
            const response = await fetch('/api/admin/transaction-distribution', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.charts.pie.data.datasets[0].data = data.values;
                this.charts.pie.update();
            }
        } catch (error) {
            console.error('加载交易分布数据失败:', error);
        }
    }

    /**
     * 加载收支数据
     */
    async loadRevenueData() {
        try {
            const response = await fetch('/api/admin/revenue-data', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.charts.doughnut.data.datasets[0].data = [data.income, data.expense];
                this.charts.doughnut.update();
            }
        } catch (error) {
            console.error('加载收支数据失败:', error);
        }
    }

    /**
     * 加载用户活跃度数据
     */
    async loadUserActivityData() {
        try {
            const response = await fetch('/api/admin/user-activity', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.charts.radar.data.datasets[0].data = data.thisWeek;
                this.charts.radar.data.datasets[1].data = data.lastWeek;
                this.charts.radar.update();
            }
        } catch (error) {
            console.error('加载用户活跃度数据失败:', error);
        }
    }

    /**
     * 加载任务完成数据
     */
    async loadTaskCompletionData() {
        try {
            const response = await fetch('/api/admin/task-completion', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.charts.task.data.datasets[0].data = data.values;
                this.charts.task.update();
            }
        } catch (error) {
            console.error('加载任务完成数据失败:', error);
        }
    }

    /**
     * 加载红包趋势数据
     */
    async loadRedpacketTrendData() {
        try {
            const response = await fetch('/api/admin/redpacket-trend', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.charts.redpacket.data.labels = data.labels;
                this.charts.redpacket.data.datasets[0].data = data.redpackets;
                this.charts.redpacket.data.datasets[1].data = data.participants;
                this.charts.redpacket.update();
            }
        } catch (error) {
            console.error('加载红包趋势数据失败:', error);
        }
    }

    /**
     * 加载实时活动
     */
    async loadRealTimeActivity() {
        try {
            const response = await fetch('/api/admin/activity', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const activities = await response.json();
                this.renderRealTimeActivity(activities);
            }
        } catch (error) {
            console.error('加载实时活动失败:', error);
            document.getElementById('activityList').innerHTML = 
                '<div class="activity-error">加载失败</div>';
        }
    }

    /**
     * 渲染实时活动
     */
    renderRealTimeActivity(activities) {
        const container = document.getElementById('activityList');
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="activity-loading">暂无活动记录</div>';
            return;
        }

        const html = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${this.getActivityColor(activity.type)}">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.description}</div>
                    <div class="activity-time">${this.formatTime(activity.createdAt)}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * 获取活动图标
     */
    getActivityIcon(type) {
        const icons = {
            'user': 'fa-user-plus',
            'transaction': 'fa-exchange-alt',
            'task': 'fa-check-circle',
            'redpacket': 'fa-gift',
            'system': 'fa-cog'
        };
        return icons[type] || 'fa-info-circle';
    }

    /**
     * 获取活动图标
     */
    getActivityIcon(type) {
        const icons = {
            'user': 'fa-user-plus',
            'transaction': 'fa-exchange-alt',
            'task': 'fa-tasks',
            'redpacket': 'fa-gift',
            'system': 'fa-cog'
        };
        return icons[type] || 'fa-info-circle';
    }

    /**
     * 获取活动颜色
     */
    getActivityColor(type) {
        const colors = {
            'user': '#36A2EB',
            'transaction': '#4BC0C0',
            'task': '#FFCE56',
            'redpacket': '#FF6384',
            'system': '#9966FF'
        };
        return colors[type] || '#6c757d';
    }

    /**
     * 加载系统状态
     */
    async loadSystemStatus() {
        try {
            const response = await fetch('/api/admin/system-status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const status = await response.json();
                this.renderSystemStatus(status);
            }
        } catch (error) {
            console.error('加载系统状态失败:', error);
            document.getElementById('systemStatus').innerHTML = 
                '<div class="status-error">状态检查失败</div>';
        }
    }

    /**
     * 渲染系统状态
     */
    renderSystemStatus(status) {
        const container = document.getElementById('systemStatus');
        
        const statusHtml = Object.entries(status).map(([service, info]) => `
            <div class="status-item">
                <div class="status-indicator ${info.status}"></div>
                <div class="status-content">
                    <span class="service-name">${this.getServiceName(service)}</span>
                    <span class="status-text">${info.status === 'healthy' ? '正常' : '异常'}</span>
                    ${info.responseTime ? `<span class="response-time">${info.responseTime}ms</span>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = statusHtml;
    }

    /**
     * 获取服务名称
     */
    getServiceName(service) {
        const names = {
            'database': '数据库',
            'tatum': 'Tatum API',
            'redis': 'Redis缓存',
            'server': '服务器'
        };
        return names[service] || service;
    }

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        } else {
            return time.toLocaleDateString();
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 用户增长周期选择
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.loadUserGrowthData(parseInt(e.target.value));
            });
        }
    }

    /**
     * 开始自动刷新
     */
    startAutoRefresh() {
        // 每30秒刷新一次数据
        this.refreshInterval = setInterval(() => {
            this.loadStatistics();
            this.loadRealTimeActivity();
            this.loadSystemStatus();
        }, 30000);
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
     * 销毁仪表板
     */
    destroy() {
        this.stopAutoRefresh();
        
        // 销毁所有图表
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
    }
}

// 导出模块
window.AdminDashboard = AdminDashboard;