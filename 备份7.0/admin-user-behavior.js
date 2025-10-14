/**
 * 用户行为分析系统
 * 提供活跃度统计、留存分析、行为路径追踪等功能
 */
class UserBehaviorAnalytics {
    constructor() {
        this.currentView = 'overview';
        this.data = {
            overview: {},
            activity: {},
            retention: {},
            pathTracking: {},
            segments: {}
        };
        this.charts = {};
        this.filters = {
            dateRange: '7d',
            userType: 'all',
            platform: 'all'
        };
        this.init();
    }

    /**
     * 初始化用户行为分析系统
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
        const container = document.getElementById('user-behavior-analytics');
        if (!container) return;

        container.innerHTML = `
            <div class="behavior-analytics">
                <div class="behavior-header">
                    <h2 class="behavior-title">用户行为分析</h2>
                    <div class="behavior-controls">
                        <select class="behavior-filter" data-filter="dateRange">
                            <option value="1d">今日</option>
                            <option value="7d" selected>近7天</option>
                            <option value="30d">近30天</option>
                            <option value="90d">近90天</option>
                        </select>
                        <select class="behavior-filter" data-filter="userType">
                            <option value="all" selected>所有用户</option>
                            <option value="new">新用户</option>
                            <option value="active">活跃用户</option>
                            <option value="inactive">非活跃用户</option>
                        </select>
                        <button class="btn btn-primary" onclick="userBehaviorAnalytics.exportReport()">
                            导出报告
                        </button>
                    </div>
                </div>

                <div class="behavior-nav">
                    <button class="behavior-nav-item active" data-view="overview">概览</button>
                    <button class="behavior-nav-item" data-view="activity">活跃度分析</button>
                    <button class="behavior-nav-item" data-view="retention">留存分析</button>
                    <button class="behavior-nav-item" data-view="pathTracking">行为路径</button>
                    <button class="behavior-nav-item" data-view="segments">用户分群</button>
                </div>

                <div class="behavior-content">
                    ${this.renderOverview()}
                    ${this.renderActivity()}
                    ${this.renderRetention()}
                    ${this.renderPathTracking()}
                    ${this.renderSegments()}
                </div>
            </div>

            <!-- 详情模态框 -->
            <div class="behavior-modal" id="behaviorModal">
                <div class="behavior-modal-content">
                    <div class="behavior-modal-header">
                        <h3 class="behavior-modal-title">详细信息</h3>
                        <button class="behavior-close" onclick="userBehaviorAnalytics.closeModal()">&times;</button>
                    </div>
                    <div class="behavior-modal-body">
                        <!-- 动态内容 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染概览视图
     */
    renderOverview() {
        return `
            <div class="behavior-view active" data-view="overview">
                <div class="behavior-stats">
                    <div class="behavior-stat-card">
                        <div class="behavior-stat-number" id="totalUsers">0</div>
                        <div class="behavior-stat-label">总用户数</div>
                        <div class="behavior-stat-trend" id="usersTrend">+0%</div>
                    </div>
                    <div class="behavior-stat-card success">
                        <div class="behavior-stat-number" id="activeUsers">0</div>
                        <div class="behavior-stat-label">活跃用户</div>
                        <div class="behavior-stat-trend" id="activeTrend">+0%</div>
                    </div>
                    <div class="behavior-stat-card warning">
                        <div class="behavior-stat-number" id="avgSessionTime">0</div>
                        <div class="behavior-stat-label">平均会话时长</div>
                        <div class="behavior-stat-trend" id="sessionTrend">+0%</div>
                    </div>
                    <div class="behavior-stat-card info">
                        <div class="behavior-stat-number" id="bounceRate">0%</div>
                        <div class="behavior-stat-label">跳出率</div>
                        <div class="behavior-stat-trend" id="bounceTrend">-0%</div>
                    </div>
                </div>

                <div class="behavior-charts">
                    <div class="behavior-chart-container">
                        <div class="behavior-chart-title">用户活跃度趋势</div>
                        <canvas id="activityTrendChart"></canvas>
                    </div>
                    <div class="behavior-chart-container">
                        <div class="behavior-chart-title">页面访问热力图</div>
                        <div id="pageHeatmap" class="behavior-heatmap"></div>
                    </div>
                </div>

                <div class="behavior-insights">
                    <h3>行为洞察</h3>
                    <div class="behavior-insight-cards" id="insightCards">
                        <!-- 动态生成洞察卡片 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染活跃度分析视图
     */
    renderActivity() {
        return `
            <div class="behavior-view" data-view="activity">
                <div class="behavior-controls">
                    <div class="behavior-search">
                        <input type="text" placeholder="搜索用户..." id="activitySearch">
                        <select id="activityMetric">
                            <option value="dau">日活跃用户</option>
                            <option value="wau">周活跃用户</option>
                            <option value="mau">月活跃用户</option>
                        </select>
                    </div>
                    <div class="behavior-actions">
                        <button class="btn btn-secondary" onclick="userBehaviorAnalytics.refreshActivity()">
                            刷新数据
                        </button>
                    </div>
                </div>

                <div class="behavior-activity-grid">
                    <div class="behavior-chart-container">
                        <div class="behavior-chart-title">活跃度趋势</div>
                        <canvas id="activityChart"></canvas>
                    </div>
                    <div class="behavior-chart-container">
                        <div class="behavior-chart-title">时段分布</div>
                        <canvas id="hourlyChart"></canvas>
                    </div>
                </div>

                <div class="behavior-table">
                    <table>
                        <thead>
                            <tr>
                                <th>用户ID</th>
                                <th>最后活跃时间</th>
                                <th>会话次数</th>
                                <th>总时长</th>
                                <th>活跃度评分</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="activityTableBody">
                            <!-- 动态生成表格内容 -->
                        </tbody>
                    </table>
                </div>

                <div class="behavior-pagination" id="activityPagination">
                    <!-- 分页控件 -->
                </div>
            </div>
        `;
    }

    /**
     * 渲染留存分析视图
     */
    renderRetention() {
        return `
            <div class="behavior-view" data-view="retention">
                <div class="behavior-controls">
                    <div class="behavior-search">
                        <select id="retentionType">
                            <option value="daily">日留存</option>
                            <option value="weekly">周留存</option>
                            <option value="monthly">月留存</option>
                        </select>
                        <select id="cohortPeriod">
                            <option value="7d">7天队列</option>
                            <option value="30d">30天队列</option>
                            <option value="90d">90天队列</option>
                        </select>
                    </div>
                    <div class="behavior-actions">
                        <button class="btn btn-secondary" onclick="userBehaviorAnalytics.generateCohort()">
                            生成队列分析
                        </button>
                    </div>
                </div>

                <div class="behavior-retention-stats">
                    <div class="behavior-stat-card">
                        <div class="behavior-stat-number" id="day1Retention">0%</div>
                        <div class="behavior-stat-label">次日留存率</div>
                    </div>
                    <div class="behavior-stat-card">
                        <div class="behavior-stat-number" id="day7Retention">0%</div>
                        <div class="behavior-stat-label">7日留存率</div>
                    </div>
                    <div class="behavior-stat-card">
                        <div class="behavior-stat-number" id="day30Retention">0%</div>
                        <div class="behavior-stat-label">30日留存率</div>
                    </div>
                </div>

                <div class="behavior-chart-container">
                    <div class="behavior-chart-title">留存率趋势</div>
                    <canvas id="retentionChart"></canvas>
                </div>

                <div class="behavior-cohort-table">
                    <h3>队列分析表</h3>
                    <div class="cohort-heatmap" id="cohortHeatmap">
                        <!-- 队列热力图 -->
                    </div>
                </div>

                <div class="behavior-retention-insights">
                    <h3>留存洞察</h3>
                    <div class="retention-insight-list" id="retentionInsights">
                        <!-- 留存分析洞察 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染行为路径追踪视图
     */
    renderPathTracking() {
        return `
            <div class="behavior-view" data-view="pathTracking">
                <div class="behavior-controls">
                    <div class="behavior-search">
                        <input type="text" placeholder="搜索路径..." id="pathSearch">
                        <select id="pathType">
                            <option value="all">所有路径</option>
                            <option value="conversion">转化路径</option>
                            <option value="bounce">跳出路径</option>
                            <option value="loop">循环路径</option>
                        </select>
                    </div>
                    <div class="behavior-actions">
                        <button class="btn btn-secondary" onclick="userBehaviorAnalytics.analyzePaths()">
                            分析路径
                        </button>
                    </div>
                </div>

                <div class="behavior-path-stats">
                    <div class="behavior-stat-card">
                        <div class="behavior-stat-number" id="totalPaths">0</div>
                        <div class="behavior-stat-label">总路径数</div>
                    </div>
                    <div class="behavior-stat-card">
                        <div class="behavior-stat-number" id="avgPathLength">0</div>
                        <div class="behavior-stat-label">平均路径长度</div>
                    </div>
                    <div class="behavior-stat-card">
                        <div class="behavior-stat-number" id="conversionPaths">0</div>
                        <div class="behavior-stat-label">转化路径数</div>
                    </div>
                </div>

                <div class="behavior-path-visualization">
                    <div class="behavior-chart-title">用户行为流</div>
                    <div id="pathFlowChart" class="path-flow-container">
                        <!-- Sankey图或流程图 -->
                    </div>
                </div>

                <div class="behavior-path-table">
                    <h3>热门路径</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>路径</th>
                                <th>用户数</th>
                                <th>转化率</th>
                                <th>平均时长</th>
                                <th>跳出率</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="pathTableBody">
                            <!-- 动态生成路径数据 -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 渲染用户分群视图
     */
    renderSegments() {
        return `
            <div class="behavior-view" data-view="segments">
                <div class="behavior-controls">
                    <div class="behavior-search">
                        <input type="text" placeholder="搜索分群..." id="segmentSearch">
                        <select id="segmentType">
                            <option value="behavior">行为分群</option>
                            <option value="demographic">人口统计</option>
                            <option value="value">价值分群</option>
                            <option value="lifecycle">生命周期</option>
                        </select>
                    </div>
                    <div class="behavior-actions">
                        <button class="btn btn-primary" onclick="userBehaviorAnalytics.createSegment()">
                            创建分群
                        </button>
                    </div>
                </div>

                <div class="behavior-segment-grid">
                    <div class="behavior-chart-container">
                        <div class="behavior-chart-title">用户分群分布</div>
                        <canvas id="segmentChart"></canvas>
                    </div>
                    <div class="behavior-chart-container">
                        <div class="behavior-chart-title">分群价值对比</div>
                        <canvas id="segmentValueChart"></canvas>
                    </div>
                </div>

                <div class="behavior-segment-list">
                    <h3>用户分群列表</h3>
                    <div class="segment-cards" id="segmentCards">
                        <!-- 动态生成分群卡片 -->
                    </div>
                </div>

                <div class="behavior-segment-insights">
                    <h3>分群洞察</h3>
                    <div class="segment-insight-list" id="segmentInsightList">
                        <!-- 分群分析洞察 -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 导航切换
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('behavior-nav-item')) {
                this.switchView(e.target.dataset.view);
            }
        });

        // 筛选器变化
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('behavior-filter')) {
                const filterType = e.target.dataset.filter;
                this.filters[filterType] = e.target.value;
                this.loadData();
            }
        });

        // 搜索功能
        document.addEventListener('input', (e) => {
            if (e.target.id.includes('Search')) {
                this.handleSearch(e.target.id, e.target.value);
            }
        });
    }

    /**
     * 切换视图
     */
    switchView(view) {
        // 更新导航状态
        document.querySelectorAll('.behavior-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // 切换内容视图
        document.querySelectorAll('.behavior-view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        document.querySelector(`.behavior-view[data-view="${view}"]`).classList.add('active');

        this.currentView = view;
        this.loadViewData(view);
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            const response = await fetch('/api/admin/user-behavior/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.filters)
            });

            if (response.ok) {
                const data = await response.json();
                this.data.overview = data;
                this.updateOverviewStats(data);
            }
        } catch (error) {
            console.error('加载用户行为数据失败:', error);
        }
    }

    /**
     * 加载特定视图数据
     */
    async loadViewData(view) {
        try {
            const response = await fetch(`/api/admin/user-behavior/${view}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.filters)
            });

            if (response.ok) {
                const data = await response.json();
                this.data[view] = data;
                this.updateViewContent(view, data);
            }
        } catch (error) {
            console.error(`加载${view}数据失败:`, error);
        }
    }

    /**
     * 更新概览统计
     */
    updateOverviewStats(data) {
        const elements = {
            totalUsers: data.totalUsers || 0,
            activeUsers: data.activeUsers || 0,
            avgSessionTime: this.formatTime(data.avgSessionTime || 0),
            bounceRate: `${(data.bounceRate || 0).toFixed(1)}%`,
            usersTrend: `${data.usersTrend > 0 ? '+' : ''}${(data.usersTrend || 0).toFixed(1)}%`,
            activeTrend: `${data.activeTrend > 0 ? '+' : ''}${(data.activeTrend || 0).toFixed(1)}%`,
            sessionTrend: `${data.sessionTrend > 0 ? '+' : ''}${(data.sessionTrend || 0).toFixed(1)}%`,
            bounceTrend: `${data.bounceTrend > 0 ? '+' : ''}${(data.bounceTrend || 0).toFixed(1)}%`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // 更新洞察卡片
        this.updateInsightCards(data.insights || []);
    }

    /**
     * 更新视图内容
     */
    updateViewContent(view, data) {
        switch (view) {
            case 'activity':
                this.updateActivityView(data);
                break;
            case 'retention':
                this.updateRetentionView(data);
                break;
            case 'pathTracking':
                this.updatePathTrackingView(data);
                break;
            case 'segments':
                this.updateSegmentsView(data);
                break;
        }
    }

    /**
     * 更新活跃度视图
     */
    updateActivityView(data) {
        // 更新活跃度表格
        const tbody = document.getElementById('activityTableBody');
        if (tbody && data.users) {
            tbody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${this.formatDate(user.lastActive)}</td>
                    <td>${user.sessions}</td>
                    <td>${this.formatTime(user.totalTime)}</td>
                    <td>
                        <span class="behavior-score ${this.getScoreClass(user.score)}">
                            ${user.score}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm" onclick="userBehaviorAnalytics.viewUserDetail('${user.id}')">
                            查看详情
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    /**
     * 更新留存视图
     */
    updateRetentionView(data) {
        // 更新留存率统计
        if (data.retention) {
            const elements = {
                day1Retention: `${(data.retention.day1 || 0).toFixed(1)}%`,
                day7Retention: `${(data.retention.day7 || 0).toFixed(1)}%`,
                day30Retention: `${(data.retention.day30 || 0).toFixed(1)}%`
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
        }

        // 更新队列热力图
        this.updateCohortHeatmap(data.cohort || []);
    }

    /**
     * 更新路径追踪视图
     */
    updatePathTrackingView(data) {
        // 更新路径统计
        if (data.pathStats) {
            const elements = {
                totalPaths: data.pathStats.total || 0,
                avgPathLength: (data.pathStats.avgLength || 0).toFixed(1),
                conversionPaths: data.pathStats.conversion || 0
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
        }

        // 更新路径表格
        const tbody = document.getElementById('pathTableBody');
        if (tbody && data.paths) {
            tbody.innerHTML = data.paths.map(path => `
                <tr>
                    <td>${path.sequence.join(' → ')}</td>
                    <td>${path.users}</td>
                    <td>${(path.conversionRate * 100).toFixed(1)}%</td>
                    <td>${this.formatTime(path.avgDuration)}</td>
                    <td>${(path.bounceRate * 100).toFixed(1)}%</td>
                    <td>
                        <button class="btn btn-sm" onclick="userBehaviorAnalytics.analyzePath('${path.id}')">
                            分析
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    /**
     * 更新用户分群视图
     */
    updateSegmentsView(data) {
        // 更新分群卡片
        const container = document.getElementById('segmentCards');
        if (container && data.segments) {
            container.innerHTML = data.segments.map(segment => `
                <div class="segment-card">
                    <div class="segment-header">
                        <h4>${segment.name}</h4>
                        <span class="segment-size">${segment.size}人</span>
                    </div>
                    <div class="segment-description">${segment.description}</div>
                    <div class="segment-metrics">
                        <div class="segment-metric">
                            <span class="metric-label">活跃度</span>
                            <span class="metric-value">${segment.activity}%</span>
                        </div>
                        <div class="segment-metric">
                            <span class="metric-label">价值</span>
                            <span class="metric-value">¥${segment.value}</span>
                        </div>
                    </div>
                    <div class="segment-actions">
                        <button class="btn btn-sm" onclick="userBehaviorAnalytics.editSegment('${segment.id}')">
                            编辑
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="userBehaviorAnalytics.deleteSegment('${segment.id}')">
                            删除
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 处理搜索
     */
    handleSearch(searchId, query) {
        // 根据不同的搜索框实现相应的搜索逻辑
        console.log(`搜索 ${searchId}:`, query);
    }

    /**
     * 导出报告
     */
    async exportReport() {
        try {
            const response = await fetch('/api/admin/user-behavior/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
                a.download = `user-behavior-report-${Date.now()}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('导出报告失败:', error);
        }
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        document.getElementById('behaviorModal').classList.remove('show');
    }

    /**
     * 工具方法：格式化时间
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    /**
     * 工具方法：格式化日期
     */
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString('zh-CN');
    }

    /**
     * 工具方法：获取评分样式类
     */
    getScoreClass(score) {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    }

    /**
     * 更新洞察卡片
     */
    updateInsightCards(insights) {
        const container = document.getElementById('insightCards');
        if (container) {
            container.innerHTML = insights.map(insight => `
                <div class="behavior-insight-card">
                    <div class="insight-icon">${insight.icon}</div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.description}</p>
                        <div class="insight-impact">${insight.impact}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 更新队列热力图
     */
    updateCohortHeatmap(cohortData) {
        const container = document.getElementById('cohortHeatmap');
        if (container && cohortData.length > 0) {
            // 这里可以使用图表库来渲染热力图
            container.innerHTML = '<div class="cohort-placeholder">队列热力图数据加载中...</div>';
        }
    }
}

// 全局实例
let userBehaviorAnalytics;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('user-behavior-analytics')) {
        userBehaviorAnalytics = new UserBehaviorAnalytics();
    }
});