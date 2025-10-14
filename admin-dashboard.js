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
                    
                    <div class="stat-card" id="active-users-card">
                        <div class="stat-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="active-users">-</h3>
                            <p>活跃用户</p>
                            <span class="stat-change" id="active-users-change">-</span>
                        </div>
                    </div>
                </div>

                <!-- 图表区域 -->
                <div class="charts-grid">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>用户增长趋势</h3>
                            <div class="chart-controls">
                                <select id="growth-period">
                                    <option value="7">最近7天</option>
                                    <option value="30" selected>最近30天</option>
                                    <option value="90">最近90天</option>
                                </select>
                            </div>
                        </div>
                        <canvas id="userGrowthChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>交易分布</h3>
                        </div>
                        <canvas id="transactionPieChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>收入统计</h3>
                        </div>
                        <canvas id="revenueDoughnutChart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>用户活跃度</h3>
                        </div>
                        <canvas id="activityRadarChart"></canvas>
                    </div>
                </div>

                <!-- 实时活动和系统状态 -->
                <div class="bottom-grid">
                    <div class="activity-panel">
                        <div class="panel-header">
                            <h3>实时活动</h3>
                            <button id="refresh-activity" class="btn-refresh">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        <div id="real-time-activity" class="activity-list">
                            <!-- 实时活动列表 -->
                        </div>
                    </div>
                    
                    <div class="status-panel">
                        <div class="panel-header">
                            <h3>系统状态</h3>
                            <span id="system-status-indicator" class="status-indicator">
                                <i class="fas fa-circle"></i>
                            </span>
                        </div>
                        <div id="system-status" class="status-list">
                            <!-- 系统状态列表 -->
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .dashboard-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    padding: 25px;
                    color: white;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
                }

                .stat-card:nth-child(2) {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }

                .stat-card:nth-child(3) {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                }

                .stat-card:nth-child(4) {
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                }

                .stat-icon {
                    font-size: 2.5rem;
                    margin-right: 20px;
                    opacity: 0.8;
                }

                .stat-content h3 {
                    font-size: 2rem;
                    margin: 0 0 5px 0;
                    font-weight: bold;
                }

                .stat-content p {
                    margin: 0 0 10px 0;
                    opacity: 0.9;
                    font-size: 0.9rem;
                }

                .stat-change {
                    font-size: 0.8rem;
                    padding: 3px 8px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.2);
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 25px;
                    margin-bottom: 30px;
                }

                .chart-container {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
                    border: 1px solid #f0f0f0;
                }

                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f8f9fa;
                }

                .chart-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.2rem;
                }

                .chart-controls select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    color: #333;
                    font-size: 0.9rem;
                }

                .bottom-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 25px;
                }

                .activity-panel, .status-panel {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
                    border: 1px solid #f0f0f0;
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f8f9fa;
                }

                .panel-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.2rem;
                }

                .btn-refresh {
                    background: none;
                    border: none;
                    color: #667eea;
                    font-size: 1.1rem;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .btn-refresh:hover {
                    background: #667eea;
                    color: white;
                    transform: rotate(180deg);
                }

                .status-indicator {
                    color: #28a745;
                    font-size: 0.8rem;
                }

                .activity-list, .status-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .activity-item, .status-item {
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                }

                .activity-item:last-child, .status-item:last-child {
                    border-bottom: none;
                }

                .activity-icon, .status-icon {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 15px;
                    font-size: 0.9rem;
                }

                .activity-content, .status-content {
                    flex: 1;
                }

                .activity-content h4, .status-content h4 {
                    margin: 0 0 5px 0;
                    font-size: 0.9rem;
                    color: #2c3e50;
                }

                .activity-content p, .status-content p {
                    margin: 0;
                    font-size: 0.8rem;
                    color: #7f8c8d;
                }

                .activity-time {
                    font-size: 0.7rem;
                    color: #bdc3c7;
                }

                @media (max-width: 768px) {
                    .charts-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .bottom-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    }
                }
            </style>
        `;

        document.getElementById('contentArea').innerHTML = content;
        
        // 加载数据和初始化图表
        await this.loadStatistics();
        await this.initializeCharts();
        await this.loadRealTimeActivity();
        await this.loadSystemStatus();
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 开始自动刷新
        this.startAutoRefresh();
    }

    /**
     * 加载统计数据
     */
    async loadStatistics() {
        try {
            const response = await fetch('/api/admin/users/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                this.updateStatCards(stats.data);
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    }

    /**
     * 更新统计卡片
     */
    updateStatCards(stats) {
        document.getElementById('total-users').textContent = stats.totalUsers || 0;
        document.getElementById('total-balance').textContent = `¥${(stats.totalBalance || 0).toFixed(2)}`;
        document.getElementById('total-transactions').textContent = stats.todayTransactions || 0;
        document.getElementById('active-users').textContent = stats.activeUsers || 0;
        
        // 更新变化指示器
        this.updateChangeIndicator('users-change', stats.usersChange);
        this.updateChangeIndicator('balance-change', stats.balanceChange);
        this.updateChangeIndicator('transactions-change', stats.transactionsChange);
        this.updateChangeIndicator('active-users-change', stats.activeUsersChange);
    }

    /**
     * 更新变化指示器
     */
    updateChangeIndicator(elementId, change) {
        const element = document.getElementById(elementId);
        if (change > 0) {
            element.textContent = `+${change}%`;
            element.style.background = 'rgba(40, 167, 69, 0.3)';
        } else if (change < 0) {
            element.textContent = `${change}%`;
            element.style.background = 'rgba(220, 53, 69, 0.3)';
        } else {
            element.textContent = '0%';
        }
    }

    /**
     * 初始化所有图表
     */
    async initializeCharts() {
        await this.initUserGrowthChart();
        await this.initPieChart();
        await this.initDoughnutChart();
        await this.initRadarChart();
    }

    /**
     * 初始化用户增长图表
     */
    async initUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart').getContext('2d');
        const data = await this.loadUserGrowthData();
        
        this.charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '新增用户',
                    data: data.values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
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
                            color: 'rgba(0,0,0,0.05)'
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
    }

    /**
     * 初始化饼图
     */
    async initPieChart() {
        const ctx = document.getElementById('transactionPieChart').getContext('2d');
        const data = await this.loadTransactionDistribution();
        
        this.charts.transactionPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#667eea',
                        '#f093fb',
                        '#4facfe',
                        '#43e97b',
                        '#ffa726'
                    ],
                    borderWidth: 0
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
     * 初始化环形图
     */
    async initDoughnutChart() {
        const ctx = document.getElementById('revenueDoughnutChart').getContext('2d');
        const data = await this.loadRevenueData();
        
        this.charts.revenueDoughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#667eea',
                        '#f093fb',
                        '#4facfe'
                    ],
                    borderWidth: 0
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
     * 初始化雷达图
     */
    async initRadarChart() {
        const ctx = document.getElementById('activityRadarChart').getContext('2d');
        const data = await this.loadUserActivityData();
        
        this.charts.activityRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '用户活跃度',
                    data: data.values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
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
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    /**
     * 加载用户增长数据
     */
    async loadUserGrowthData(period = 30) {
        try {
            // 模拟数据，实际应该从API获取
            const labels = [];
            const values = [];
            
            for (let i = period - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
                values.push(Math.floor(Math.random() * 50) + 10);
            }
            
            return { labels, values };
        } catch (error) {
            console.error('加载用户增长数据失败:', error);
            return { labels: [], values: [] };
        }
    }

    /**
     * 加载交易分布数据
     */
    async loadTransactionDistribution() {
        try {
            return {
                labels: ['充值', '提现', '转账', '红包', '任务奖励'],
                values: [35, 25, 20, 15, 5]
            };
        } catch (error) {
            console.error('加载交易分布数据失败:', error);
            return { labels: [], values: [] };
        }
    }

    /**
     * 加载收入数据
     */
    async loadRevenueData() {
        try {
            return {
                labels: ['手续费', '广告收入', '会员费'],
                values: [60, 30, 10]
            };
        } catch (error) {
            console.error('加载收入数据失败:', error);
            return { labels: [], values: [] };
        }
    }

    /**
     * 加载用户活跃度数据
     */
    async loadUserActivityData() {
        try {
            return {
                labels: ['登录', '任务', '交易', '社交', '游戏'],
                values: [85, 70, 60, 45, 55]
            };
        } catch (error) {
            console.error('加载用户活跃度数据失败:', error);
            return { labels: [], values: [] };
        }
    }

    /**
     * 加载实时活动
     */
    async loadRealTimeActivity() {
        try {
            // 模拟实时活动数据
            const activities = [
                { type: 'user_register', user: '用户123', time: new Date(), details: '新用户注册' },
                { type: 'transaction', user: '用户456', time: new Date(Date.now() - 60000), details: '完成充值 ¥100' },
                { type: 'task_complete', user: '用户789', time: new Date(Date.now() - 120000), details: '完成每日任务' },
                { type: 'redpacket', user: '用户321', time: new Date(Date.now() - 180000), details: '抢到红包 ¥5.2' },
                { type: 'withdraw', user: '用户654', time: new Date(Date.now() - 240000), details: '申请提现 ¥50' }
            ];
            
            this.renderRealTimeActivity(activities);
        } catch (error) {
            console.error('加载实时活动失败:', error);
        }
    }

    /**
     * 渲染实时活动
     */
    renderRealTimeActivity(activities) {
        const container = document.getElementById('real-time-activity');
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${this.getActivityColor(activity.type)}">
                    <i class="${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.details}</h4>
                    <p>${activity.user}</p>
                </div>
                <div class="activity-time">
                    ${this.formatTime(activity.time)}
                </div>
            </div>
        `).join('');
    }

    /**
     * 获取活动图标
     */
    getActivityIcon(type) {
        const icons = {
            user_register: 'fas fa-user-plus',
            transaction: 'fas fa-credit-card',
            task_complete: 'fas fa-check-circle',
            redpacket: 'fas fa-gift',
            withdraw: 'fas fa-money-bill-wave'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    /**
     * 获取活动颜色
     */
    getActivityColor(type) {
        const colors = {
            user_register: '#28a745',
            transaction: '#007bff',
            task_complete: '#ffc107',
            redpacket: '#dc3545',
            withdraw: '#6f42c1'
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
                this.renderSystemStatus(status.data);
            }
        } catch (error) {
            console.error('加载系统状态失败:', error);
            // 使用模拟数据
            this.renderSystemStatus({
                database: { status: 'online', responseTime: '2ms' },
                redis: { status: 'online', responseTime: '1ms' },
                api: { status: 'online', responseTime: '15ms' },
                storage: { status: 'online', usage: '45%' }
            });
        }
    }

    /**
     * 渲染系统状态
     */
    renderSystemStatus(status) {
        const container = document.getElementById('system-status');
        const services = Object.entries(status);
        
        container.innerHTML = services.map(([service, info]) => `
            <div class="status-item">
                <div class="status-icon" style="background: ${info.status === 'online' ? '#28a745' : '#dc3545'}">
                    <i class="fas fa-${info.status === 'online' ? 'check' : 'times'}"></i>
                </div>
                <div class="status-content">
                    <h4>${this.getServiceName(service)}</h4>
                    <p>${info.responseTime || info.usage || '正常'}</p>
                </div>
            </div>
        `).join('');
        
        // 更新状态指示器
        const allOnline = services.every(([, info]) => info.status === 'online');
        const indicator = document.getElementById('system-status-indicator');
        indicator.style.color = allOnline ? '#28a745' : '#dc3545';
    }

    /**
     * 获取服务名称
     */
    getServiceName(service) {
        const names = {
            database: '数据库',
            redis: 'Redis缓存',
            api: 'API服务',
            storage: '存储服务'
        };
        return names[service] || service;
    }

    /**
     * 格式化时间
     */
    formatTime(time) {
        const now = new Date();
        const diff = now - time;
        
        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        } else {
            return time.toLocaleDateString('zh-CN');
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 刷新活动按钮
        document.getElementById('refresh-activity')?.addEventListener('click', () => {
            this.loadRealTimeActivity();
        });
        
        // 增长周期选择
        document.getElementById('growth-period')?.addEventListener('change', async (e) => {
            const period = parseInt(e.target.value);
            const data = await this.loadUserGrowthData(period);
            this.charts.userGrowth.data.labels = data.labels;
            this.charts.userGrowth.data.datasets[0].data = data.values;
            this.charts.userGrowth.update();
        });
    }

    /**
     * 开始自动刷新
     */
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadStatistics();
            this.loadRealTimeActivity();
            this.loadSystemStatus();
        }, 30000); // 30秒刷新一次
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

// 将类暴露到全局作用域
window.AdminDashboard = AdminDashboard;