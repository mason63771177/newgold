/**
 * 红包系统分析模块
 * 提供红包发放统计、参与度分析、时间窗口优化、效果评估等功能
 */
class RedPacketAnalytics {
    constructor() {
        this.currentView = 'overview';
        this.dateRange = {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
            end: new Date()
        };
        this.filters = {
            timeWindow: 'all', // all, morning, noon, evening
            status: 'all', // all, active, completed, expired
            amount: 'all' // all, small, medium, large
        };
        this.charts = {};
        this.init();
    }

    /**
     * 初始化红包分析系统
     */
    init() {
        this.bindEvents();
        this.loadAnalyticsData();
    }

    /**
     * 渲染红包分析界面
     */
    render() {
        return `
            <div class="redpacket-analytics">
                <div class="analytics-header">
                    <h2>红包系统分析</h2>
                    <div class="analytics-actions">
                        <button class="btn btn-primary" onclick="redPacketAnalytics.exportReport()">
                            <i class="fas fa-download"></i> 导出报告
                        </button>
                        <button class="btn btn-secondary" onclick="redPacketAnalytics.refreshData()">
                            <i class="fas fa-sync-alt"></i> 刷新数据
                        </button>
                    </div>
                </div>

                <div class="analytics-nav">
                    <button class="nav-item ${this.currentView === 'overview' ? 'active' : ''}" 
                            onclick="redPacketAnalytics.switchView('overview')">概览</button>
                    <button class="nav-item ${this.currentView === 'distribution' ? 'active' : ''}" 
                            onclick="redPacketAnalytics.switchView('distribution')">发放统计</button>
                    <button class="nav-item ${this.currentView === 'participation' ? 'active' : ''}" 
                            onclick="redPacketAnalytics.switchView('participation')">参与度分析</button>
                    <button class="nav-item ${this.currentView === 'timewindow' ? 'active' : ''}" 
                            onclick="redPacketAnalytics.switchView('timewindow')">时间窗口</button>
                    <button class="nav-item ${this.currentView === 'effectiveness' ? 'active' : ''}" 
                            onclick="redPacketAnalytics.switchView('effectiveness')">效果评估</button>
                </div>

                <div class="analytics-content">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;
    }

    /**
     * 渲染当前视图
     */
    renderCurrentView() {
        switch (this.currentView) {
            case 'overview':
                return this.renderOverview();
            case 'distribution':
                return this.renderDistribution();
            case 'participation':
                return this.renderParticipation();
            case 'timewindow':
                return this.renderTimeWindow();
            case 'effectiveness':
                return this.renderEffectiveness();
            default:
                return this.renderOverview();
        }
    }

    /**
     * 渲染概览视图
     */
    renderOverview() {
        return `
            <div class="analytics-view overview-view active">
                <div class="overview-stats">
                    <div class="stat-card total-packets">
                        <div class="stat-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number" id="totalPackets">0</div>
                            <div class="stat-label">总红包数</div>
                        </div>
                    </div>
                    <div class="stat-card total-amount">
                        <div class="stat-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number" id="totalAmount">¥0</div>
                            <div class="stat-label">总金额</div>
                        </div>
                    </div>
                    <div class="stat-card participation-rate">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number" id="participationRate">0%</div>
                            <div class="stat-label">参与率</div>
                        </div>
                    </div>
                    <div class="stat-card success-rate">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-number" id="successRate">0%</div>
                            <div class="stat-label">成功率</div>
                        </div>
                    </div>
                </div>

                <div class="overview-charts">
                    <div class="chart-container">
                        <h3>红包发放趋势</h3>
                        <canvas id="trendChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3>时间窗口分布</h3>
                        <canvas id="timeWindowChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <div class="recent-activities">
                    <h3>最近活动</h3>
                    <div class="activity-list" id="recentActivities">
                        <!-- 动态加载 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染发放统计视图
     */
    renderDistribution() {
        return `
            <div class="analytics-view distribution-view">
                <div class="distribution-controls">
                    <div class="date-range">
                        <label>时间范围：</label>
                        <input type="date" id="startDate" value="${this.formatDate(this.dateRange.start)}">
                        <span>至</span>
                        <input type="date" id="endDate" value="${this.formatDate(this.dateRange.end)}">
                    </div>
                    <div class="filters">
                        <select id="timeWindowFilter">
                            <option value="all">全部时间窗口</option>
                            <option value="morning">上午场(9:00)</option>
                            <option value="noon">中午场(12:00)</option>
                            <option value="evening">晚上场(20:00)</option>
                        </select>
                        <select id="amountFilter">
                            <option value="all">全部金额</option>
                            <option value="small">小额(≤10元)</option>
                            <option value="medium">中额(10-50元)</option>
                            <option value="large">大额(>50元)</option>
                        </select>
                    </div>
                </div>

                <div class="distribution-stats">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-title">今日发放</div>
                            <div class="stat-value" id="todayPackets">0</div>
                            <div class="stat-change positive" id="todayChange">+0%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-title">本周发放</div>
                            <div class="stat-value" id="weekPackets">0</div>
                            <div class="stat-change positive" id="weekChange">+0%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-title">本月发放</div>
                            <div class="stat-value" id="monthPackets">0</div>
                            <div class="stat-change positive" id="monthChange">+0%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-title">平均金额</div>
                            <div class="stat-value" id="avgAmount">¥0</div>
                            <div class="stat-change neutral" id="avgChange">0%</div>
                        </div>
                    </div>
                </div>

                <div class="distribution-charts">
                    <div class="chart-row">
                        <div class="chart-container">
                            <h3>每日发放统计</h3>
                            <canvas id="dailyDistributionChart" width="600" height="300"></canvas>
                        </div>
                        <div class="chart-container">
                            <h3>金额分布</h3>
                            <canvas id="amountDistributionChart" width="400" height="300"></canvas>
                        </div>
                    </div>
                </div>

                <div class="distribution-table">
                    <h3>详细记录</h3>
                    <div class="table-container">
                        <table id="distributionTable">
                            <thead>
                                <tr>
                                    <th>日期</th>
                                    <th>时间窗口</th>
                                    <th>红包数量</th>
                                    <th>总金额</th>
                                    <th>平均金额</th>
                                    <th>参与人数</th>
                                    <th>完成率</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- 动态加载 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染参与度分析视图
     */
    renderParticipation() {
        return `
            <div class="analytics-view participation-view">
                <div class="participation-summary">
                    <div class="summary-cards">
                        <div class="summary-card">
                            <h4>总参与人数</h4>
                            <div class="summary-number" id="totalParticipants">0</div>
                            <div class="summary-trend">
                                <i class="fas fa-arrow-up"></i>
                                <span id="participantsTrend">+0%</span>
                            </div>
                        </div>
                        <div class="summary-card">
                            <h4>活跃用户</h4>
                            <div class="summary-number" id="activeUsers">0</div>
                            <div class="summary-trend">
                                <i class="fas fa-arrow-up"></i>
                                <span id="activeUsersTrend">+0%</span>
                            </div>
                        </div>
                        <div class="summary-card">
                            <h4>新用户</h4>
                            <div class="summary-number" id="newUsers">0</div>
                            <div class="summary-trend">
                                <i class="fas fa-arrow-up"></i>
                                <span id="newUsersTrend">+0%</span>
                            </div>
                        </div>
                        <div class="summary-card">
                            <h4>回头率</h4>
                            <div class="summary-number" id="returnRate">0%</div>
                            <div class="summary-trend">
                                <i class="fas fa-arrow-up"></i>
                                <span id="returnRateTrend">+0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="participation-analysis">
                    <div class="analysis-row">
                        <div class="chart-container">
                            <h3>用户参与频次分布</h3>
                            <canvas id="participationFrequencyChart" width="500" height="300"></canvas>
                        </div>
                        <div class="chart-container">
                            <h3>时间段参与度</h3>
                            <canvas id="timeParticipationChart" width="500" height="300"></canvas>
                        </div>
                    </div>
                </div>

                <div class="user-segments">
                    <h3>用户分群分析</h3>
                    <div class="segment-tabs">
                        <button class="segment-tab active" onclick="redPacketAnalytics.switchSegment('frequency')">按频次分群</button>
                        <button class="segment-tab" onclick="redPacketAnalytics.switchSegment('amount')">按金额分群</button>
                        <button class="segment-tab" onclick="redPacketAnalytics.switchSegment('time')">按时间分群</button>
                    </div>
                    <div class="segment-content" id="segmentContent">
                        <!-- 动态加载 -->
                    </div>
                </div>

                <div class="participation-heatmap">
                    <h3>参与热力图</h3>
                    <div class="heatmap-container">
                        <canvas id="participationHeatmap" width="800" height="400"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染时间窗口分析视图
     */
    renderTimeWindow() {
        return `
            <div class="analytics-view timewindow-view">
                <div class="timewindow-overview">
                    <div class="window-stats">
                        <div class="window-stat">
                            <div class="window-time">9:00</div>
                            <div class="window-label">上午场</div>
                            <div class="window-data">
                                <div class="data-item">
                                    <span class="data-label">参与率</span>
                                    <span class="data-value" id="morning-participation">0%</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">完成率</span>
                                    <span class="data-value" id="morning-completion">0%</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">平均金额</span>
                                    <span class="data-value" id="morning-amount">¥0</span>
                                </div>
                            </div>
                        </div>
                        <div class="window-stat">
                            <div class="window-time">12:00</div>
                            <div class="window-label">中午场</div>
                            <div class="window-data">
                                <div class="data-item">
                                    <span class="data-label">参与率</span>
                                    <span class="data-value" id="noon-participation">0%</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">完成率</span>
                                    <span class="data-value" id="noon-completion">0%</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">平均金额</span>
                                    <span class="data-value" id="noon-amount">¥0</span>
                                </div>
                            </div>
                        </div>
                        <div class="window-stat">
                            <div class="window-time">20:00</div>
                            <div class="window-label">晚上场</div>
                            <div class="window-data">
                                <div class="data-item">
                                    <span class="data-label">参与率</span>
                                    <span class="data-value" id="evening-participation">0%</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">完成率</span>
                                    <span class="data-value" id="evening-completion">0%</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">平均金额</span>
                                    <span class="data-value" id="evening-amount">¥0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="timewindow-analysis">
                    <div class="analysis-charts">
                        <div class="chart-container">
                            <h3>时间窗口对比</h3>
                            <canvas id="windowComparisonChart" width="600" height="300"></canvas>
                        </div>
                        <div class="chart-container">
                            <h3>77秒内参与分布</h3>
                            <canvas id="secondsDistributionChart" width="600" height="300"></canvas>
                        </div>
                    </div>
                </div>

                <div class="optimization-suggestions">
                    <h3>优化建议</h3>
                    <div class="suggestions-list" id="optimizationSuggestions">
                        <!-- 动态加载 -->
                    </div>
                </div>

                <div class="window-performance">
                    <h3>窗口表现详情</h3>
                    <div class="performance-table">
                        <table id="windowPerformanceTable">
                            <thead>
                                <tr>
                                    <th>日期</th>
                                    <th>时间窗口</th>
                                    <th>开始时间</th>
                                    <th>结束时间</th>
                                    <th>参与人数</th>
                                    <th>红包数量</th>
                                    <th>完成时间(秒)</th>
                                    <th>效率评分</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- 动态加载 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染效果评估视图
     */
    renderEffectiveness() {
        return `
            <div class="analytics-view effectiveness-view">
                <div class="effectiveness-metrics">
                    <div class="metric-cards">
                        <div class="metric-card roi">
                            <div class="metric-header">
                                <h4>投资回报率</h4>
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="metric-value" id="roiValue">0%</div>
                            <div class="metric-description">红包投入与用户价值比</div>
                        </div>
                        <div class="metric-card engagement">
                            <div class="metric-header">
                                <h4>用户粘性</h4>
                                <i class="fas fa-heart"></i>
                            </div>
                            <div class="metric-value" id="engagementValue">0</div>
                            <div class="metric-description">平均参与频次</div>
                        </div>
                        <div class="metric-card conversion">
                            <div class="metric-header">
                                <h4>转化效果</h4>
                                <i class="fas fa-exchange-alt"></i>
                            </div>
                            <div class="metric-value" id="conversionValue">0%</div>
                            <div class="metric-description">新用户转化率</div>
                        </div>
                        <div class="metric-card satisfaction">
                            <div class="metric-header">
                                <h4>满意度</h4>
                                <i class="fas fa-smile"></i>
                            </div>
                            <div class="metric-value" id="satisfactionValue">0</div>
                            <div class="metric-description">用户满意度评分</div>
                        </div>
                    </div>
                </div>

                <div class="effectiveness-analysis">
                    <div class="analysis-section">
                        <h3>成本效益分析</h3>
                        <div class="cost-benefit-chart">
                            <canvas id="costBenefitChart" width="800" height="400"></canvas>
                        </div>
                    </div>

                    <div class="analysis-section">
                        <h3>用户生命周期价值</h3>
                        <div class="lifecycle-analysis">
                            <div class="lifecycle-stages">
                                <div class="stage">
                                    <div class="stage-name">新用户</div>
                                    <div class="stage-count" id="newUserCount">0</div>
                                    <div class="stage-value" id="newUserValue">¥0</div>
                                </div>
                                <div class="stage">
                                    <div class="stage-name">活跃用户</div>
                                    <div class="stage-count" id="activeUserCount">0</div>
                                    <div class="stage-value" id="activeUserValue">¥0</div>
                                </div>
                                <div class="stage">
                                    <div class="stage-name">忠实用户</div>
                                    <div class="stage-count" id="loyalUserCount">0</div>
                                    <div class="stage-value" id="loyalUserValue">¥0</div>
                                </div>
                                <div class="stage">
                                    <div class="stage-name">流失用户</div>
                                    <div class="stage-count" id="churnedUserCount">0</div>
                                    <div class="stage-value" id="churnedUserValue">¥0</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="effectiveness-recommendations">
                    <h3>策略建议</h3>
                    <div class="recommendations-grid">
                        <div class="recommendation-card">
                            <div class="recommendation-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="recommendation-content">
                                <h4>时间优化</h4>
                                <p id="timeRecommendation">基于数据分析的时间窗口优化建议</p>
                            </div>
                        </div>
                        <div class="recommendation-card">
                            <div class="recommendation-icon">
                                <i class="fas fa-coins"></i>
                            </div>
                            <div class="recommendation-content">
                                <h4>金额策略</h4>
                                <p id="amountRecommendation">红包金额分配优化建议</p>
                            </div>
                        </div>
                        <div class="recommendation-card">
                            <div class="recommendation-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="recommendation-content">
                                <h4>用户运营</h4>
                                <p id="userRecommendation">用户分群运营策略建议</p>
                            </div>
                        </div>
                        <div class="recommendation-card">
                            <div class="recommendation-icon">
                                <i class="fas fa-chart-bar"></i>
                            </div>
                            <div class="recommendation-content">
                                <h4>效果提升</h4>
                                <p id="effectivenessRecommendation">整体效果提升建议</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 切换视图
     */
    switchView(view) {
        this.currentView = view;
        const container = document.querySelector('.analytics-content');
        if (container) {
            container.innerHTML = this.renderCurrentView();
            this.loadViewData(view);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 日期范围变化
        document.addEventListener('change', (e) => {
            if (e.target.id === 'startDate' || e.target.id === 'endDate') {
                this.updateDateRange();
            }
        });

        // 筛选器变化
        document.addEventListener('change', (e) => {
            if (e.target.id.includes('Filter')) {
                this.updateFilters();
            }
        });
    }

    /**
     * 更新日期范围
     */
    updateDateRange() {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate && endDate) {
            this.dateRange.start = new Date(startDate.value);
            this.dateRange.end = new Date(endDate.value);
            this.loadAnalyticsData();
        }
    }

    /**
     * 更新筛选器
     */
    updateFilters() {
        const timeWindowFilter = document.getElementById('timeWindowFilter');
        const amountFilter = document.getElementById('amountFilter');
        
        if (timeWindowFilter) {
            this.filters.timeWindow = timeWindowFilter.value;
        }
        if (amountFilter) {
            this.filters.amount = amountFilter.value;
        }
        
        this.loadAnalyticsData();
    }

    /**
     * 加载分析数据
     */
    async loadAnalyticsData() {
        try {
            const response = await fetch('/api/admin/redpacket-analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    dateRange: this.dateRange,
                    filters: this.filters
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.updateAnalyticsDisplay(data);
            }
        } catch (error) {
            console.error('加载分析数据失败:', error);
        }
    }

    /**
     * 加载视图数据
     */
    async loadViewData(view) {
        try {
            const response = await fetch(`/api/admin/redpacket-analytics/${view}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    dateRange: this.dateRange,
                    filters: this.filters
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.updateViewDisplay(view, data);
            }
        } catch (error) {
            console.error(`加载${view}数据失败:`, error);
        }
    }

    /**
     * 更新分析数据显示
     */
    updateAnalyticsDisplay(data) {
        // 更新概览统计
        this.updateElement('totalPackets', data.totalPackets || 0);
        this.updateElement('totalAmount', `¥${data.totalAmount || 0}`);
        this.updateElement('participationRate', `${data.participationRate || 0}%`);
        this.updateElement('successRate', `${data.successRate || 0}%`);

        // 更新图表
        this.updateCharts(data);
    }

    /**
     * 更新视图显示
     */
    updateViewDisplay(view, data) {
        switch (view) {
            case 'distribution':
                this.updateDistributionView(data);
                break;
            case 'participation':
                this.updateParticipationView(data);
                break;
            case 'timewindow':
                this.updateTimeWindowView(data);
                break;
            case 'effectiveness':
                this.updateEffectivenessView(data);
                break;
        }
    }

    /**
     * 更新发放统计视图
     */
    updateDistributionView(data) {
        // 更新统计数据
        this.updateElement('todayPackets', data.todayPackets || 0);
        this.updateElement('weekPackets', data.weekPackets || 0);
        this.updateElement('monthPackets', data.monthPackets || 0);
        this.updateElement('avgAmount', `¥${data.avgAmount || 0}`);

        // 更新变化趋势
        this.updateTrend('todayChange', data.todayChange || 0);
        this.updateTrend('weekChange', data.weekChange || 0);
        this.updateTrend('monthChange', data.monthChange || 0);
        this.updateTrend('avgChange', data.avgChange || 0);

        // 更新表格
        this.updateDistributionTable(data.records || []);
    }

    /**
     * 更新参与度分析视图
     */
    updateParticipationView(data) {
        // 更新参与度统计
        this.updateElement('totalParticipants', data.totalParticipants || 0);
        this.updateElement('activeUsers', data.activeUsers || 0);
        this.updateElement('newUsers', data.newUsers || 0);
        this.updateElement('returnRate', `${data.returnRate || 0}%`);

        // 更新趋势
        this.updateTrend('participantsTrend', data.participantsTrend || 0);
        this.updateTrend('activeUsersTrend', data.activeUsersTrend || 0);
        this.updateTrend('newUsersTrend', data.newUsersTrend || 0);
        this.updateTrend('returnRateTrend', data.returnRateTrend || 0);
    }

    /**
     * 更新时间窗口视图
     */
    updateTimeWindowView(data) {
        // 更新各时间窗口数据
        const windows = ['morning', 'noon', 'evening'];
        windows.forEach(window => {
            const windowData = data[window] || {};
            this.updateElement(`${window}-participation`, `${windowData.participation || 0}%`);
            this.updateElement(`${window}-completion`, `${windowData.completion || 0}%`);
            this.updateElement(`${window}-amount`, `¥${windowData.amount || 0}`);
        });

        // 更新优化建议
        this.updateOptimizationSuggestions(data.suggestions || []);
        
        // 更新表现表格
        this.updateWindowPerformanceTable(data.performance || []);
    }

    /**
     * 更新效果评估视图
     */
    updateEffectivenessView(data) {
        // 更新效果指标
        this.updateElement('roiValue', `${data.roi || 0}%`);
        this.updateElement('engagementValue', data.engagement || 0);
        this.updateElement('conversionValue', `${data.conversion || 0}%`);
        this.updateElement('satisfactionValue', data.satisfaction || 0);

        // 更新生命周期数据
        const lifecycle = data.lifecycle || {};
        this.updateElement('newUserCount', lifecycle.newUsers?.count || 0);
        this.updateElement('newUserValue', `¥${lifecycle.newUsers?.value || 0}`);
        this.updateElement('activeUserCount', lifecycle.activeUsers?.count || 0);
        this.updateElement('activeUserValue', `¥${lifecycle.activeUsers?.value || 0}`);
        this.updateElement('loyalUserCount', lifecycle.loyalUsers?.count || 0);
        this.updateElement('loyalUserValue', `¥${lifecycle.loyalUsers?.value || 0}`);
        this.updateElement('churnedUserCount', lifecycle.churnedUsers?.count || 0);
        this.updateElement('churnedUserValue', `¥${lifecycle.churnedUsers?.value || 0}`);

        // 更新建议
        this.updateRecommendations(data.recommendations || {});
    }

    /**
     * 更新图表
     */
    updateCharts(data) {
        // 这里可以使用Chart.js或其他图表库
        // 示例代码，实际需要根据具体图表库实现
        if (data.trendData) {
            this.renderTrendChart(data.trendData);
        }
        if (data.timeWindowData) {
            this.renderTimeWindowChart(data.timeWindowData);
        }
    }

    /**
     * 渲染趋势图表
     */
    renderTrendChart(data) {
        const canvas = document.getElementById('trendChart');
        if (canvas && window.Chart) {
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: '红包发放数量',
                        data: data.values || [],
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    /**
     * 渲染时间窗口图表
     */
    renderTimeWindowChart(data) {
        const canvas = document.getElementById('timeWindowChart');
        if (canvas && window.Chart) {
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['上午场', '中午场', '晚上场'],
                    datasets: [{
                        data: data.values || [0, 0, 0],
                        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    /**
     * 更新元素内容
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * 更新趋势显示
     */
    updateTrend(id, value) {
        const element = document.getElementById(id);
        if (element) {
            const isPositive = value > 0;
            const isNegative = value < 0;
            
            element.textContent = `${value > 0 ? '+' : ''}${value}%`;
            element.className = isPositive ? 'stat-change positive' : 
                              isNegative ? 'stat-change negative' : 
                              'stat-change neutral';
        }
    }

    /**
     * 更新发放统计表格
     */
    updateDistributionTable(records) {
        const tbody = document.querySelector('#distributionTable tbody');
        if (tbody) {
            tbody.innerHTML = records.map(record => `
                <tr>
                    <td>${this.formatDate(new Date(record.date))}</td>
                    <td>${record.timeWindow}</td>
                    <td>${record.packetCount}</td>
                    <td>¥${record.totalAmount}</td>
                    <td>¥${record.avgAmount}</td>
                    <td>${record.participants}</td>
                    <td>${record.completionRate}%</td>
                </tr>
            `).join('');
        }
    }

    /**
     * 更新优化建议
     */
    updateOptimizationSuggestions(suggestions) {
        const container = document.getElementById('optimizationSuggestions');
        if (container) {
            container.innerHTML = suggestions.map(suggestion => `
                <div class="suggestion-item">
                    <div class="suggestion-icon">
                        <i class="fas ${suggestion.icon}"></i>
                    </div>
                    <div class="suggestion-content">
                        <h4>${suggestion.title}</h4>
                        <p>${suggestion.description}</p>
                        <div class="suggestion-impact">预期提升: ${suggestion.impact}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 更新窗口表现表格
     */
    updateWindowPerformanceTable(performance) {
        const tbody = document.querySelector('#windowPerformanceTable tbody');
        if (tbody) {
            tbody.innerHTML = performance.map(record => `
                <tr>
                    <td>${this.formatDate(new Date(record.date))}</td>
                    <td>${record.timeWindow}</td>
                    <td>${record.startTime}</td>
                    <td>${record.endTime}</td>
                    <td>${record.participants}</td>
                    <td>${record.packetCount}</td>
                    <td>${record.completionTime}</td>
                    <td>
                        <span class="score-badge score-${this.getScoreClass(record.score)}">
                            ${record.score}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    }

    /**
     * 更新建议内容
     */
    updateRecommendations(recommendations) {
        this.updateElement('timeRecommendation', recommendations.time || '暂无建议');
        this.updateElement('amountRecommendation', recommendations.amount || '暂无建议');
        this.updateElement('userRecommendation', recommendations.user || '暂无建议');
        this.updateElement('effectivenessRecommendation', recommendations.effectiveness || '暂无建议');
    }

    /**
     * 获取评分样式类
     */
    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'average';
        return 'poor';
    }

    /**
     * 格式化日期
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * 导出报告
     */
    async exportReport() {
        try {
            const response = await fetch('/api/admin/redpacket-analytics/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    dateRange: this.dateRange,
                    filters: this.filters,
                    view: this.currentView
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `红包分析报告_${this.formatDate(new Date())}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('导出报告失败:', error);
            alert('导出报告失败，请稍后重试');
        }
    }

    /**
     * 刷新数据
     */
    refreshData() {
        this.loadAnalyticsData();
        this.loadViewData(this.currentView);
    }

    /**
     * 切换用户分群
     */
    switchSegment(type) {
        // 更新标签状态
        document.querySelectorAll('.segment-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');

        // 加载对应分群数据
        this.loadSegmentData(type);
    }

    /**
     * 加载分群数据
     */
    async loadSegmentData(type) {
        try {
            const response = await fetch(`/api/admin/redpacket-analytics/segments/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    dateRange: this.dateRange,
                    filters: this.filters
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSegmentDisplay(type, data);
            }
        } catch (error) {
            console.error(`加载${type}分群数据失败:`, error);
        }
    }

    /**
     * 更新分群显示
     */
    updateSegmentDisplay(type, data) {
        const container = document.getElementById('segmentContent');
        if (container) {
            container.innerHTML = this.renderSegmentContent(type, data);
        }
    }

    /**
     * 渲染分群内容
     */
    renderSegmentContent(type, data) {
        const segments = data.segments || [];
        return `
            <div class="segment-grid">
                ${segments.map(segment => `
                    <div class="segment-card">
                        <div class="segment-header">
                            <h4>${segment.name}</h4>
                            <span class="segment-count">${segment.count}人</span>
                        </div>
                        <div class="segment-stats">
                            <div class="stat-item">
                                <span class="stat-label">参与率</span>
                                <span class="stat-value">${segment.participationRate}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">平均金额</span>
                                <span class="stat-value">¥${segment.avgAmount}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">活跃度</span>
                                <span class="stat-value">${segment.activity}</span>
                            </div>
                        </div>
                        <div class="segment-description">
                            ${segment.description}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// 全局实例
let redPacketAnalytics = null;

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RedPacketAnalytics;
}