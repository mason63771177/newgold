/**
 * 金融风控系统
 * 提供异常交易检测、风险评估、反欺诈机制等功能
 */
class RiskControlSystem {
    constructor() {
        this.currentView = 'overview';
        this.filters = {
            dateRange: '7d',
            riskLevel: 'all',
            transactionType: 'all'
        };
        this.riskRules = [];
        this.alertSettings = {};
    }

    /**
     * 初始化风控系统
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadData();
    }

    /**
     * 渲染主界面
     */
    render() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="risk-control">
                <div class="risk-header">
                    <h1 class="risk-title">金融风控系统</h1>
                    <div class="risk-actions">
                        <button class="risk-btn risk-btn-primary" onclick="riskControl.exportReport()">
                            导出报告
                        </button>
                        <button class="risk-btn risk-btn-secondary" onclick="riskControl.showSettings()">
                            风控设置
                        </button>
                    </div>
                </div>

                <div class="risk-nav">
                    <div class="risk-nav-item active" data-view="overview">概览</div>
                    <div class="risk-nav-item" data-view="detection">异常检测</div>
                    <div class="risk-nav-item" data-view="assessment">风险评估</div>
                    <div class="risk-nav-item" data-view="fraud">反欺诈</div>
                    <div class="risk-nav-item" data-view="rules">规则管理</div>
                    <div class="risk-nav-item" data-view="alerts">预警中心</div>
                </div>

                <div class="risk-content">
                    <div id="risk-view-content">
                        <!-- 动态内容区域 -->
                    </div>
                </div>
            </div>
        `;

        // 设置全局引用
        window.riskControl = this;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 导航切换
        document.querySelectorAll('.risk-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    }

    /**
     * 切换视图
     */
    switchView(view) {
        this.currentView = view;
        
        // 更新导航状态
        document.querySelectorAll('.risk-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // 渲染对应视图
        this.renderView(view);
    }

    /**
     * 渲染视图内容
     */
    renderView(view) {
        const content = document.getElementById('risk-view-content');
        
        switch(view) {
            case 'overview':
                content.innerHTML = this.renderOverview();
                break;
            case 'detection':
                content.innerHTML = this.renderDetection();
                break;
            case 'assessment':
                content.innerHTML = this.renderAssessment();
                break;
            case 'fraud':
                content.innerHTML = this.renderFraud();
                break;
            case 'rules':
                content.innerHTML = this.renderRules();
                break;
            case 'alerts':
                content.innerHTML = this.renderAlerts();
                break;
        }

        // 重新绑定事件
        this.bindViewEvents(view);
    }

    /**
     * 渲染概览页面
     */
    renderOverview() {
        return `
            <div class="risk-overview">
                <div class="risk-stats">
                    <div class="risk-stat-card high-risk">
                        <div class="risk-stat-title">高风险交易</div>
                        <div class="risk-stat-value" id="high-risk-count">0</div>
                        <div class="risk-stat-trend" id="high-risk-trend">+0%</div>
                    </div>
                    <div class="risk-stat-card medium-risk">
                        <div class="risk-stat-title">中风险交易</div>
                        <div class="risk-stat-value" id="medium-risk-count">0</div>
                        <div class="risk-stat-trend" id="medium-risk-trend">+0%</div>
                    </div>
                    <div class="risk-stat-card blocked">
                        <div class="risk-stat-title">已拦截交易</div>
                        <div class="risk-stat-value" id="blocked-count">0</div>
                        <div class="risk-stat-trend" id="blocked-trend">+0%</div>
                    </div>
                    <div class="risk-stat-card fraud-rate">
                        <div class="risk-stat-title">欺诈率</div>
                        <div class="risk-stat-value" id="fraud-rate">0%</div>
                        <div class="risk-stat-trend" id="fraud-rate-trend">+0%</div>
                    </div>
                </div>

                <div class="risk-charts">
                    <div class="risk-chart-container">
                        <div class="risk-chart-title">风险趋势分析</div>
                        <canvas id="risk-trend-chart"></canvas>
                    </div>
                    <div class="risk-chart-container">
                        <div class="risk-chart-title">风险分布</div>
                        <canvas id="risk-distribution-chart"></canvas>
                    </div>
                </div>

                <div class="risk-insights">
                    <div class="risk-insights-title">风险洞察</div>
                    <div class="risk-insight-cards" id="risk-insights-list">
                        <!-- 动态生成洞察卡片 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染异常检测页面
     */
    renderDetection() {
        return `
            <div class="risk-detection">
                <div class="risk-controls">
                    <div class="risk-filters">
                        <div class="risk-filter">
                            <label>时间范围</label>
                            <select id="detection-date-range">
                                <option value="1d">今天</option>
                                <option value="7d" selected>最近7天</option>
                                <option value="30d">最近30天</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>
                        <div class="risk-filter">
                            <label>检测类型</label>
                            <select id="detection-type">
                                <option value="all">全部</option>
                                <option value="amount">金额异常</option>
                                <option value="frequency">频率异常</option>
                                <option value="pattern">模式异常</option>
                                <option value="location">地理异常</option>
                            </select>
                        </div>
                        <div class="risk-filter">
                            <label>风险等级</label>
                            <select id="detection-risk-level">
                                <option value="all">全部</option>
                                <option value="high">高风险</option>
                                <option value="medium">中风险</option>
                                <option value="low">低风险</option>
                            </select>
                        </div>
                    </div>
                    <div class="risk-actions">
                        <button class="risk-btn risk-btn-primary" onclick="riskControl.refreshDetection()">
                            刷新检测
                        </button>
                        <button class="risk-btn risk-btn-secondary" onclick="riskControl.exportDetection()">
                            导出数据
                        </button>
                    </div>
                </div>

                <div class="detection-results">
                    <table class="risk-table" id="detection-table">
                        <thead>
                            <tr>
                                <th>交易ID</th>
                                <th>用户ID</th>
                                <th>交易金额</th>
                                <th>异常类型</th>
                                <th>风险等级</th>
                                <th>检测时间</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="detection-tbody">
                            <!-- 动态生成检测结果 -->
                        </tbody>
                    </table>
                </div>

                <div class="risk-pagination" id="detection-pagination">
                    <!-- 分页控件 -->
                </div>
            </div>
        `;
    }

    /**
     * 渲染风险评估页面
     */
    renderAssessment() {
        return `
            <div class="risk-assessment">
                <div class="assessment-tools">
                    <div class="assessment-card">
                        <h3>用户风险评估</h3>
                        <div class="assessment-form">
                            <input type="text" id="user-id-input" placeholder="输入用户ID">
                            <button class="risk-btn risk-btn-primary" onclick="riskControl.assessUser()">
                                评估用户
                            </button>
                        </div>
                        <div id="user-assessment-result" class="assessment-result">
                            <!-- 用户评估结果 -->
                        </div>
                    </div>

                    <div class="assessment-card">
                        <h3>交易风险评估</h3>
                        <div class="assessment-form">
                            <input type="text" id="transaction-id-input" placeholder="输入交易ID">
                            <button class="risk-btn risk-btn-primary" onclick="riskControl.assessTransaction()">
                                评估交易
                            </button>
                        </div>
                        <div id="transaction-assessment-result" class="assessment-result">
                            <!-- 交易评估结果 -->
                        </div>
                    </div>
                </div>

                <div class="assessment-batch">
                    <h3>批量风险评估</h3>
                    <div class="batch-controls">
                        <div class="risk-filter">
                            <label>评估范围</label>
                            <select id="batch-scope">
                                <option value="new-users">新注册用户</option>
                                <option value="high-value">高价值交易</option>
                                <option value="suspicious">可疑行为</option>
                                <option value="all">全部用户</option>
                            </select>
                        </div>
                        <button class="risk-btn risk-btn-primary" onclick="riskControl.startBatchAssessment()">
                            开始批量评估
                        </button>
                    </div>
                    <div id="batch-progress" class="batch-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-text" id="progress-text">评估进度: 0%</div>
                    </div>
                    <div id="batch-results" class="batch-results">
                        <!-- 批量评估结果 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染反欺诈页面
     */
    renderFraud() {
        return `
            <div class="risk-fraud">
                <div class="fraud-stats">
                    <div class="fraud-stat-card">
                        <div class="fraud-stat-title">欺诈检测数</div>
                        <div class="fraud-stat-value" id="fraud-detection-count">0</div>
                    </div>
                    <div class="fraud-stat-card">
                        <div class="fraud-stat-title">误报率</div>
                        <div class="fraud-stat-value" id="false-positive-rate">0%</div>
                    </div>
                    <div class="fraud-stat-card">
                        <div class="fraud-stat-title">拦截金额</div>
                        <div class="fraud-stat-value" id="blocked-amount">¥0</div>
                    </div>
                </div>

                <div class="fraud-controls">
                    <div class="risk-filters">
                        <div class="risk-filter">
                            <label>欺诈类型</label>
                            <select id="fraud-type">
                                <option value="all">全部</option>
                                <option value="identity">身份欺诈</option>
                                <option value="payment">支付欺诈</option>
                                <option value="account">账户欺诈</option>
                                <option value="promotion">营销欺诈</option>
                            </select>
                        </div>
                        <div class="risk-filter">
                            <label>处理状态</label>
                            <select id="fraud-status">
                                <option value="all">全部</option>
                                <option value="pending">待处理</option>
                                <option value="confirmed">已确认</option>
                                <option value="false-positive">误报</option>
                                <option value="resolved">已解决</option>
                            </select>
                        </div>
                    </div>
                    <div class="risk-actions">
                        <button class="risk-btn risk-btn-primary" onclick="riskControl.refreshFraud()">
                            刷新数据
                        </button>
                        <button class="risk-btn risk-btn-secondary" onclick="riskControl.trainModel()">
                            训练模型
                        </button>
                    </div>
                </div>

                <div class="fraud-cases">
                    <table class="risk-table" id="fraud-table">
                        <thead>
                            <tr>
                                <th>案例ID</th>
                                <th>用户ID</th>
                                <th>欺诈类型</th>
                                <th>风险分数</th>
                                <th>涉及金额</th>
                                <th>检测时间</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="fraud-tbody">
                            <!-- 动态生成欺诈案例 -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 渲染规则管理页面
     */
    renderRules() {
        return `
            <div class="risk-rules">
                <div class="rules-header">
                    <h3>风控规则管理</h3>
                    <button class="risk-btn risk-btn-primary" onclick="riskControl.showAddRule()">
                        添加规则
                    </button>
                </div>

                <div class="rules-list" id="rules-list">
                    <!-- 动态生成规则列表 -->
                </div>
            </div>
        `;
    }

    /**
     * 渲染预警中心页面
     */
    renderAlerts() {
        return `
            <div class="risk-alerts">
                <div class="alerts-header">
                    <h3>风险预警中心</h3>
                    <div class="alert-actions">
                        <button class="risk-btn risk-btn-primary" onclick="riskControl.markAllRead()">
                            全部已读
                        </button>
                        <button class="risk-btn risk-btn-secondary" onclick="riskControl.configureAlerts()">
                            预警设置
                        </button>
                    </div>
                </div>

                <div class="alerts-filters">
                    <div class="risk-filter">
                        <label>预警级别</label>
                        <select id="alert-level">
                            <option value="all">全部</option>
                            <option value="critical">严重</option>
                            <option value="high">高</option>
                            <option value="medium">中</option>
                            <option value="low">低</option>
                        </select>
                    </div>
                    <div class="risk-filter">
                        <label>状态</label>
                        <select id="alert-status">
                            <option value="all">全部</option>
                            <option value="unread">未读</option>
                            <option value="read">已读</option>
                            <option value="handled">已处理</option>
                        </select>
                    </div>
                </div>

                <div class="alerts-list" id="alerts-list">
                    <!-- 动态生成预警列表 -->
                </div>
            </div>
        `;
    }

    /**
     * 绑定视图事件
     */
    bindViewEvents(view) {
        switch(view) {
            case 'detection':
                this.bindDetectionEvents();
                break;
            case 'assessment':
                this.bindAssessmentEvents();
                break;
            case 'fraud':
                this.bindFraudEvents();
                break;
            case 'rules':
                this.bindRulesEvents();
                break;
            case 'alerts':
                this.bindAlertsEvents();
                break;
        }
    }

    /**
     * 绑定异常检测事件
     */
    bindDetectionEvents() {
        // 筛选器变化事件
        ['detection-date-range', 'detection-type', 'detection-risk-level'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.loadDetectionData());
            }
        });
    }

    /**
     * 绑定风险评估事件
     */
    bindAssessmentEvents() {
        // 用户评估输入框回车事件
        const userInput = document.getElementById('user-id-input');
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.assessUser();
                }
            });
        }

        // 交易评估输入框回车事件
        const transactionInput = document.getElementById('transaction-id-input');
        if (transactionInput) {
            transactionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.assessTransaction();
                }
            });
        }
    }

    /**
     * 绑定反欺诈事件
     */
    bindFraudEvents() {
        // 筛选器变化事件
        ['fraud-type', 'fraud-status'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.loadFraudData());
            }
        });
    }

    /**
     * 绑定规则管理事件
     */
    bindRulesEvents() {
        // 规则相关事件将在具体方法中处理
    }

    /**
     * 绑定预警中心事件
     */
    bindAlertsEvents() {
        // 筛选器变化事件
        ['alert-level', 'alert-status'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.loadAlertsData());
            }
        });
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            await this.loadOverviewData();
        } catch (error) {
            console.error('加载风控数据失败:', error);
        }
    }

    /**
     * 加载概览数据
     */
    async loadOverviewData() {
        try {
            const response = await fetch('/api/admin/risk-control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(this.filters)
            });

            if (response.ok) {
                const data = await response.json();
                this.updateOverviewStats(data);
                this.updateInsights(data.insights);
            }
        } catch (error) {
            console.error('加载概览数据失败:', error);
        }
    }

    /**
     * 更新概览统计
     */
    updateOverviewStats(data) {
        const elements = {
            'high-risk-count': data.highRiskCount || 0,
            'high-risk-trend': `${data.highRiskTrend > 0 ? '+' : ''}${data.highRiskTrend}%`,
            'medium-risk-count': data.mediumRiskCount || 0,
            'medium-risk-trend': `${data.mediumRiskTrend > 0 ? '+' : ''}${data.mediumRiskTrend}%`,
            'blocked-count': data.blockedCount || 0,
            'blocked-trend': `${data.blockedTrend > 0 ? '+' : ''}${data.blockedTrend}%`,
            'fraud-rate': `${data.fraudRate || 0}%`,
            'fraud-rate-trend': `${data.fraudRateTrend > 0 ? '+' : ''}${data.fraudRateTrend}%`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * 更新洞察信息
     */
    updateInsights(insights) {
        const container = document.getElementById('risk-insights-list');
        if (!container || !insights) return;

        container.innerHTML = insights.map(insight => `
            <div class="risk-insight-card">
                <div class="risk-insight-header">
                    <span class="risk-insight-icon">${insight.icon}</span>
                    <span class="risk-insight-title">${insight.title}</span>
                </div>
                <div class="risk-insight-description">${insight.description}</div>
                <div class="risk-insight-impact">${insight.impact}</div>
            </div>
        `).join('');
    }

    /**
     * 刷新异常检测
     */
    async refreshDetection() {
        await this.loadDetectionData();
    }

    /**
     * 加载异常检测数据
     */
    async loadDetectionData() {
        // 实现异常检测数据加载逻辑
        console.log('加载异常检测数据');
    }

    /**
     * 评估用户风险
     */
    async assessUser() {
        const userId = document.getElementById('user-id-input').value;
        if (!userId) {
            alert('请输入用户ID');
            return;
        }

        // 实现用户风险评估逻辑
        console.log('评估用户风险:', userId);
    }

    /**
     * 评估交易风险
     */
    async assessTransaction() {
        const transactionId = document.getElementById('transaction-id-input').value;
        if (!transactionId) {
            alert('请输入交易ID');
            return;
        }

        // 实现交易风险评估逻辑
        console.log('评估交易风险:', transactionId);
    }

    /**
     * 开始批量评估
     */
    async startBatchAssessment() {
        // 实现批量风险评估逻辑
        console.log('开始批量评估');
    }

    /**
     * 刷新反欺诈数据
     */
    async refreshFraud() {
        await this.loadFraudData();
    }

    /**
     * 加载反欺诈数据
     */
    async loadFraudData() {
        // 实现反欺诈数据加载逻辑
        console.log('加载反欺诈数据');
    }

    /**
     * 训练反欺诈模型
     */
    async trainModel() {
        // 实现模型训练逻辑
        console.log('训练反欺诈模型');
    }

    /**
     * 显示添加规则对话框
     */
    showAddRule() {
        // 实现添加规则对话框
        console.log('显示添加规则对话框');
    }

    /**
     * 标记所有预警为已读
     */
    async markAllRead() {
        // 实现标记已读逻辑
        console.log('标记所有预警为已读');
    }

    /**
     * 配置预警设置
     */
    configureAlerts() {
        // 实现预警设置
        console.log('配置预警设置');
    }

    /**
     * 加载预警数据
     */
    async loadAlertsData() {
        // 实现预警数据加载逻辑
        console.log('加载预警数据');
    }

    /**
     * 导出报告
     */
    async exportReport() {
        try {
            const response = await fetch('/api/admin/risk-control/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    view: this.currentView,
                    filters: this.filters
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `risk-control-report-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('导出报告失败:', error);
            alert('导出报告失败');
        }
    }

    /**
     * 显示设置对话框
     */
    showSettings() {
        // 实现设置对话框
        console.log('显示风控设置');
    }
}

// 确保类在全局作用域中可用
window.RiskControlSystem = RiskControlSystem;