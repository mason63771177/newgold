/**
 * 报表系统管理模块
 * 提供自定义报表生成、数据导出、定时报告、可视化报表设计器等功能
 */
class ReportSystem {
    constructor() {
        this.currentView = 'overview';
        this.reports = [];
        this.templates = [];
        this.schedules = [];
        this.init();
    }

    /**
     * 初始化报表系统
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadData();
    }

    /**
     * 渲染报表系统界面
     */
    render() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="report-system">
                <div class="report-header">
                    <h2>报表系统</h2>
                    <div class="report-actions">
                        <button class="btn btn-primary" onclick="reportSystem.showCreateReportModal()">
                            <i class="fas fa-plus"></i> 创建报表
                        </button>
                        <button class="btn btn-secondary" onclick="reportSystem.showTemplateModal()">
                            <i class="fas fa-file-alt"></i> 模板管理
                        </button>
                        <button class="btn btn-info" onclick="reportSystem.showScheduleModal()">
                            <i class="fas fa-clock"></i> 定时报告
                        </button>
                    </div>
                </div>

                <div class="report-nav">
                    <button class="report-nav-btn ${this.currentView === 'overview' ? 'active' : ''}" 
                            onclick="reportSystem.switchView('overview')">概览</button>
                    <button class="report-nav-btn ${this.currentView === 'reports' ? 'active' : ''}" 
                            onclick="reportSystem.switchView('reports')">报表列表</button>
                    <button class="report-nav-btn ${this.currentView === 'templates' ? 'active' : ''}" 
                            onclick="reportSystem.switchView('templates')">模板管理</button>
                    <button class="report-nav-btn ${this.currentView === 'schedules' ? 'active' : ''}" 
                            onclick="reportSystem.switchView('schedules')">定时任务</button>
                    <button class="report-nav-btn ${this.currentView === 'designer' ? 'active' : ''}" 
                            onclick="reportSystem.switchView('designer')">报表设计器</button>
                </div>

                <div class="report-content" id="reportContent">
                    ${this.renderCurrentView()}
                </div>
            </div>

            <!-- 创建报表模态框 -->
            <div class="report-modal" id="createReportModal">
                <div class="report-modal-content">
                    <div class="report-modal-header">
                        <h3>创建报表</h3>
                        <span class="close" onclick="reportSystem.closeModal('createReportModal')">&times;</span>
                    </div>
                    <form class="report-form" id="createReportForm">
                        <div class="report-form-group">
                            <label>报表名称</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="report-form-group">
                            <label>报表类型</label>
                            <select name="type" required>
                                <option value="">请选择</option>
                                <option value="user">用户报表</option>
                                <option value="transaction">交易报表</option>
                                <option value="task">任务报表</option>
                                <option value="redpacket">红包报表</option>
                                <option value="team">团队报表</option>
                                <option value="financial">财务报表</option>
                                <option value="custom">自定义报表</option>
                            </select>
                        </div>
                        <div class="report-form-group">
                            <label>数据源</label>
                            <select name="dataSource" required>
                                <option value="">请选择</option>
                                <option value="users">用户数据</option>
                                <option value="transactions">交易数据</option>
                                <option value="tasks">任务数据</option>
                                <option value="redpackets">红包数据</option>
                                <option value="teams">团队数据</option>
                                <option value="logs">日志数据</option>
                            </select>
                        </div>
                        <div class="report-form-group">
                            <label>时间范围</label>
                            <select name="timeRange">
                                <option value="today">今天</option>
                                <option value="yesterday">昨天</option>
                                <option value="week">本周</option>
                                <option value="month">本月</option>
                                <option value="quarter">本季度</option>
                                <option value="year">本年</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>
                        <div class="report-form-group">
                            <label>输出格式</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" name="formats" value="excel"> Excel</label>
                                <label><input type="checkbox" name="formats" value="pdf"> PDF</label>
                                <label><input type="checkbox" name="formats" value="csv"> CSV</label>
                                <label><input type="checkbox" name="formats" value="json"> JSON</label>
                            </div>
                        </div>
                        <div class="report-form-group">
                            <label>描述</label>
                            <textarea name="description" rows="3"></textarea>
                        </div>
                        <div class="report-form-actions">
                            <button type="button" class="btn btn-secondary" onclick="reportSystem.closeModal('createReportModal')">取消</button>
                            <button type="submit" class="btn btn-primary">创建</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 模板管理模态框 -->
            <div class="report-modal" id="templateModal">
                <div class="report-modal-content">
                    <div class="report-modal-header">
                        <h3>模板管理</h3>
                        <span class="close" onclick="reportSystem.closeModal('templateModal')">&times;</span>
                    </div>
                    <div class="template-content">
                        <div class="template-actions">
                            <button class="btn btn-primary" onclick="reportSystem.createTemplate()">
                                <i class="fas fa-plus"></i> 新建模板
                            </button>
                        </div>
                        <div class="template-list" id="templateList">
                            <!-- 模板列表将在这里动态生成 -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- 定时任务模态框 -->
            <div class="report-modal" id="scheduleModal">
                <div class="report-modal-content">
                    <div class="report-modal-header">
                        <h3>定时报告设置</h3>
                        <span class="close" onclick="reportSystem.closeModal('scheduleModal')">&times;</span>
                    </div>
                    <form class="report-form" id="scheduleForm">
                        <div class="report-form-group">
                            <label>任务名称</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="report-form-group">
                            <label>选择报表</label>
                            <select name="reportId" required>
                                <option value="">请选择报表</option>
                                <!-- 报表选项将动态生成 -->
                            </select>
                        </div>
                        <div class="report-form-group">
                            <label>执行频率</label>
                            <select name="frequency" required>
                                <option value="">请选择</option>
                                <option value="daily">每日</option>
                                <option value="weekly">每周</option>
                                <option value="monthly">每月</option>
                                <option value="quarterly">每季度</option>
                                <option value="yearly">每年</option>
                            </select>
                        </div>
                        <div class="report-form-group">
                            <label>执行时间</label>
                            <input type="time" name="time" required>
                        </div>
                        <div class="report-form-group">
                            <label>接收邮箱</label>
                            <textarea name="emails" placeholder="多个邮箱用逗号分隔" rows="2"></textarea>
                        </div>
                        <div class="report-form-group">
                            <label>状态</label>
                            <select name="status">
                                <option value="active">启用</option>
                                <option value="inactive">禁用</option>
                            </select>
                        </div>
                        <div class="report-form-actions">
                            <button type="button" class="btn btn-secondary" onclick="reportSystem.closeModal('scheduleModal')">取消</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // 设置全局引用
        window.reportSystem = this;
    }

    /**
     * 渲染当前视图
     */
    renderCurrentView() {
        switch (this.currentView) {
            case 'overview':
                return this.renderOverview();
            case 'reports':
                return this.renderReports();
            case 'templates':
                return this.renderTemplates();
            case 'schedules':
                return this.renderSchedules();
            case 'designer':
                return this.renderDesigner();
            default:
                return this.renderOverview();
        }
    }

    /**
     * 渲染概览视图
     */
    renderOverview() {
        return `
            <div class="report-overview">
                <div class="report-stats">
                    <div class="report-stat-card">
                        <div class="report-stat-value">24</div>
                        <div class="report-stat-label">总报表数</div>
                    </div>
                    <div class="report-stat-card">
                        <div class="report-stat-value">8</div>
                        <div class="report-stat-label">活跃模板</div>
                    </div>
                    <div class="report-stat-card">
                        <div class="report-stat-value">12</div>
                        <div class="report-stat-label">定时任务</div>
                    </div>
                    <div class="report-stat-card">
                        <div class="report-stat-value">156</div>
                        <div class="report-stat-label">本月生成</div>
                    </div>
                </div>

                <div class="report-charts">
                    <div class="report-chart-card">
                        <h4>报表生成趋势</h4>
                        <div class="chart-placeholder">
                            <canvas id="reportTrendChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    <div class="report-chart-card">
                        <h4>报表类型分布</h4>
                        <div class="chart-placeholder">
                            <canvas id="reportTypeChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <div class="recent-reports">
                    <h4>最近生成的报表</h4>
                    <div class="report-list">
                        <div class="report-item">
                            <div class="report-info">
                                <div class="report-name">用户增长报表</div>
                                <div class="report-meta">2024-01-15 09:30 | Excel</div>
                            </div>
                            <div class="report-actions">
                                <button class="btn btn-sm btn-primary">下载</button>
                                <button class="btn btn-sm btn-secondary">查看</button>
                            </div>
                        </div>
                        <div class="report-item">
                            <div class="report-info">
                                <div class="report-name">交易统计报表</div>
                                <div class="report-meta">2024-01-15 08:45 | PDF</div>
                            </div>
                            <div class="report-actions">
                                <button class="btn btn-sm btn-primary">下载</button>
                                <button class="btn btn-sm btn-secondary">查看</button>
                            </div>
                        </div>
                        <div class="report-item">
                            <div class="report-info">
                                <div class="report-name">红包活动报表</div>
                                <div class="report-meta">2024-01-14 18:20 | CSV</div>
                            </div>
                            <div class="report-actions">
                                <button class="btn btn-sm btn-primary">下载</button>
                                <button class="btn btn-sm btn-secondary">查看</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染报表列表视图
     */
    renderReports() {
        return `
            <div class="report-list-view">
                <div class="report-controls">
                    <div class="report-search">
                        <input type="text" placeholder="搜索报表..." id="reportSearch">
                        <select id="reportTypeFilter">
                            <option value="">所有类型</option>
                            <option value="user">用户报表</option>
                            <option value="transaction">交易报表</option>
                            <option value="task">任务报表</option>
                            <option value="redpacket">红包报表</option>
                            <option value="team">团队报表</option>
                            <option value="financial">财务报表</option>
                        </select>
                        <select id="reportStatusFilter">
                            <option value="">所有状态</option>
                            <option value="completed">已完成</option>
                            <option value="processing">处理中</option>
                            <option value="failed">失败</option>
                            <option value="scheduled">已安排</option>
                        </select>
                    </div>
                    <div class="report-actions">
                        <button class="btn btn-primary" onclick="reportSystem.showCreateReportModal()">
                            <i class="fas fa-plus"></i> 新建报表
                        </button>
                        <button class="btn btn-secondary" onclick="reportSystem.exportReports()">
                            <i class="fas fa-download"></i> 批量导出
                        </button>
                    </div>
                </div>

                <div class="report-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="selectAll"></th>
                                <th>报表名称</th>
                                <th>类型</th>
                                <th>数据源</th>
                                <th>创建时间</th>
                                <th>状态</th>
                                <th>文件大小</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="reportTableBody">
                            <!-- 报表数据将在这里动态生成 -->
                        </tbody>
                    </table>
                </div>

                <div class="report-pagination">
                    <button class="btn btn-sm" disabled>上一页</button>
                    <button class="btn btn-sm active">1</button>
                    <button class="btn btn-sm">2</button>
                    <button class="btn btn-sm">3</button>
                    <button class="btn btn-sm">下一页</button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染模板管理视图
     */
    renderTemplates() {
        return `
            <div class="template-management">
                <div class="template-grid">
                    <div class="template-card">
                        <div class="template-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="template-info">
                            <h4>用户分析模板</h4>
                            <p>用户注册、活跃度、留存率分析</p>
                            <div class="template-meta">
                                <span>使用次数: 45</span>
                                <span>最后更新: 2024-01-10</span>
                            </div>
                        </div>
                        <div class="template-actions">
                            <button class="btn btn-sm btn-primary">使用</button>
                            <button class="btn btn-sm btn-secondary">编辑</button>
                            <button class="btn btn-sm btn-danger">删除</button>
                        </div>
                    </div>

                    <div class="template-card">
                        <div class="template-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="template-info">
                            <h4>财务报表模板</h4>
                            <p>收入、支出、利润分析报表</p>
                            <div class="template-meta">
                                <span>使用次数: 32</span>
                                <span>最后更新: 2024-01-08</span>
                            </div>
                        </div>
                        <div class="template-actions">
                            <button class="btn btn-sm btn-primary">使用</button>
                            <button class="btn btn-sm btn-secondary">编辑</button>
                            <button class="btn btn-sm btn-danger">删除</button>
                        </div>
                    </div>

                    <div class="template-card">
                        <div class="template-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <div class="template-info">
                            <h4>红包活动模板</h4>
                            <p>红包发放、参与度、效果分析</p>
                            <div class="template-meta">
                                <span>使用次数: 28</span>
                                <span>最后更新: 2024-01-05</span>
                            </div>
                        </div>
                        <div class="template-actions">
                            <button class="btn btn-sm btn-primary">使用</button>
                            <button class="btn btn-sm btn-secondary">编辑</button>
                            <button class="btn btn-sm btn-danger">删除</button>
                        </div>
                    </div>

                    <div class="template-card create-template">
                        <div class="template-icon">
                            <i class="fas fa-plus"></i>
                        </div>
                        <div class="template-info">
                            <h4>创建新模板</h4>
                            <p>自定义报表模板</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染定时任务视图
     */
    renderSchedules() {
        return `
            <div class="schedule-management">
                <div class="schedule-controls">
                    <button class="btn btn-primary" onclick="reportSystem.showScheduleModal()">
                        <i class="fas fa-plus"></i> 新建定时任务
                    </button>
                    <button class="btn btn-secondary" onclick="reportSystem.runAllSchedules()">
                        <i class="fas fa-play"></i> 执行所有任务
                    </button>
                </div>

                <div class="schedule-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>任务名称</th>
                                <th>关联报表</th>
                                <th>执行频率</th>
                                <th>下次执行</th>
                                <th>状态</th>
                                <th>最后执行</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>每日用户报表</td>
                                <td>用户增长分析</td>
                                <td>每日 09:00</td>
                                <td>2024-01-16 09:00</td>
                                <td><span class="schedule-status active">启用</span></td>
                                <td>2024-01-15 09:00</td>
                                <td class="schedule-actions">
                                    <button class="btn btn-sm btn-success">立即执行</button>
                                    <button class="btn btn-sm btn-secondary">编辑</button>
                                    <button class="btn btn-sm btn-warning">暂停</button>
                                    <button class="btn btn-sm btn-danger">删除</button>
                                </td>
                            </tr>
                            <tr>
                                <td>周度财务报表</td>
                                <td>财务统计分析</td>
                                <td>每周一 08:00</td>
                                <td>2024-01-22 08:00</td>
                                <td><span class="schedule-status active">启用</span></td>
                                <td>2024-01-15 08:00</td>
                                <td class="schedule-actions">
                                    <button class="btn btn-sm btn-success">立即执行</button>
                                    <button class="btn btn-sm btn-secondary">编辑</button>
                                    <button class="btn btn-sm btn-warning">暂停</button>
                                    <button class="btn btn-sm btn-danger">删除</button>
                                </td>
                            </tr>
                            <tr>
                                <td>月度运营报表</td>
                                <td>运营数据汇总</td>
                                <td>每月1日 10:00</td>
                                <td>2024-02-01 10:00</td>
                                <td><span class="schedule-status inactive">暂停</span></td>
                                <td>2024-01-01 10:00</td>
                                <td class="schedule-actions">
                                    <button class="btn btn-sm btn-success">立即执行</button>
                                    <button class="btn btn-sm btn-secondary">编辑</button>
                                    <button class="btn btn-sm btn-primary">启用</button>
                                    <button class="btn btn-sm btn-danger">删除</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 渲染报表设计器视图
     */
    renderDesigner() {
        return `
            <div class="report-designer">
                <div class="designer-toolbar">
                    <div class="toolbar-group">
                        <button class="btn btn-sm btn-primary">
                            <i class="fas fa-save"></i> 保存
                        </button>
                        <button class="btn btn-sm btn-secondary">
                            <i class="fas fa-eye"></i> 预览
                        </button>
                        <button class="btn btn-sm btn-info">
                            <i class="fas fa-play"></i> 生成
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button class="btn btn-sm btn-outline">
                            <i class="fas fa-undo"></i> 撤销
                        </button>
                        <button class="btn btn-sm btn-outline">
                            <i class="fas fa-redo"></i> 重做
                        </button>
                    </div>
                </div>

                <div class="designer-content">
                    <div class="designer-sidebar">
                        <div class="sidebar-section">
                            <h4>数据源</h4>
                            <div class="data-source-list">
                                <div class="data-source-item" draggable="true">
                                    <i class="fas fa-users"></i> 用户表
                                </div>
                                <div class="data-source-item" draggable="true">
                                    <i class="fas fa-exchange-alt"></i> 交易表
                                </div>
                                <div class="data-source-item" draggable="true">
                                    <i class="fas fa-tasks"></i> 任务表
                                </div>
                                <div class="data-source-item" draggable="true">
                                    <i class="fas fa-gift"></i> 红包表
                                </div>
                            </div>
                        </div>

                        <div class="sidebar-section">
                            <h4>图表组件</h4>
                            <div class="chart-component-list">
                                <div class="chart-component" draggable="true">
                                    <i class="fas fa-chart-bar"></i> 柱状图
                                </div>
                                <div class="chart-component" draggable="true">
                                    <i class="fas fa-chart-line"></i> 折线图
                                </div>
                                <div class="chart-component" draggable="true">
                                    <i class="fas fa-chart-pie"></i> 饼图
                                </div>
                                <div class="chart-component" draggable="true">
                                    <i class="fas fa-table"></i> 数据表
                                </div>
                            </div>
                        </div>

                        <div class="sidebar-section">
                            <h4>属性设置</h4>
                            <div class="property-panel">
                                <div class="property-group">
                                    <label>标题</label>
                                    <input type="text" placeholder="报表标题">
                                </div>
                                <div class="property-group">
                                    <label>时间范围</label>
                                    <select>
                                        <option>最近7天</option>
                                        <option>最近30天</option>
                                        <option>自定义</option>
                                    </select>
                                </div>
                                <div class="property-group">
                                    <label>刷新频率</label>
                                    <select>
                                        <option>实时</option>
                                        <option>每小时</option>
                                        <option>每天</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="designer-canvas">
                        <div class="canvas-header">
                            <h3>报表设计画布</h3>
                            <div class="canvas-tools">
                                <button class="btn btn-sm">网格</button>
                                <button class="btn btn-sm">对齐</button>
                                <select class="zoom-select">
                                    <option>100%</option>
                                    <option>75%</option>
                                    <option>50%</option>
                                </select>
                            </div>
                        </div>
                        <div class="canvas-area" id="designerCanvas">
                            <div class="canvas-placeholder">
                                <i class="fas fa-mouse-pointer"></i>
                                <p>拖拽组件到此处开始设计报表</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 表单提交事件
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'createReportForm') {
                e.preventDefault();
                this.createReport(e.target);
            } else if (e.target.id === 'scheduleForm') {
                e.preventDefault();
                this.createSchedule(e.target);
            }
        });

        // 搜索和筛选事件
        document.addEventListener('input', (e) => {
            if (e.target.id === 'reportSearch') {
                this.filterReports();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'reportTypeFilter' || e.target.id === 'reportStatusFilter') {
                this.filterReports();
            }
        });
    }

    /**
     * 切换视图
     */
    switchView(view) {
        this.currentView = view;
        document.getElementById('reportContent').innerHTML = this.renderCurrentView();
        
        // 更新导航按钮状态
        document.querySelectorAll('.report-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="reportSystem.switchView('${view}')"]`).classList.add('active');
    }

    /**
     * 显示创建报表模态框
     */
    showCreateReportModal() {
        document.getElementById('createReportModal').style.display = 'block';
    }

    /**
     * 显示模板模态框
     */
    showTemplateModal() {
        document.getElementById('templateModal').style.display = 'block';
        this.loadTemplates();
    }

    /**
     * 显示定时任务模态框
     */
    showScheduleModal() {
        document.getElementById('scheduleModal').style.display = 'block';
        this.loadReportOptions();
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    /**
     * 创建报表
     */
    async createReport(form) {
        const formData = new FormData(form);
        const reportData = {
            name: formData.get('name'),
            type: formData.get('type'),
            dataSource: formData.get('dataSource'),
            timeRange: formData.get('timeRange'),
            formats: formData.getAll('formats'),
            description: formData.get('description')
        };

        try {
            const response = await fetch('/admin/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                alert('报表创建成功！');
                this.closeModal('createReportModal');
                this.loadData();
            } else {
                alert('创建失败，请重试');
            }
        } catch (error) {
            console.error('创建报表失败:', error);
            alert('创建失败，请重试');
        }
    }

    /**
     * 创建定时任务
     */
    async createSchedule(form) {
        const formData = new FormData(form);
        const scheduleData = {
            name: formData.get('name'),
            reportId: formData.get('reportId'),
            frequency: formData.get('frequency'),
            time: formData.get('time'),
            emails: formData.get('emails'),
            status: formData.get('status')
        };

        try {
            const response = await fetch('/admin/report-schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scheduleData)
            });

            if (response.ok) {
                alert('定时任务创建成功！');
                this.closeModal('scheduleModal');
                this.loadData();
            } else {
                alert('创建失败，请重试');
            }
        } catch (error) {
            console.error('创建定时任务失败:', error);
            alert('创建失败，请重试');
        }
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            const [reportsResponse, templatesResponse, schedulesResponse] = await Promise.all([
                fetch('/admin/reports'),
                fetch('/admin/report-templates'),
                fetch('/admin/report-schedules')
            ]);

            this.reports = await reportsResponse.json();
            this.templates = await templatesResponse.json();
            this.schedules = await schedulesResponse.json();

            this.updateReportTable();
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    /**
     * 更新报表表格
     */
    updateReportTable() {
        const tbody = document.getElementById('reportTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.reports.map(report => `
            <tr>
                <td><input type="checkbox" value="${report.id}"></td>
                <td>${report.name}</td>
                <td><span class="report-type ${report.type}">${this.getTypeLabel(report.type)}</span></td>
                <td>${report.dataSource}</td>
                <td>${report.createdAt}</td>
                <td><span class="report-status ${report.status}">${this.getStatusLabel(report.status)}</span></td>
                <td>${report.fileSize || '-'}</td>
                <td class="report-actions">
                    <button class="report-action-btn download" onclick="reportSystem.downloadReport('${report.id}')">下载</button>
                    <button class="report-action-btn edit" onclick="reportSystem.editReport('${report.id}')">编辑</button>
                    <button class="report-action-btn delete" onclick="reportSystem.deleteReport('${report.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 获取类型标签
     */
    getTypeLabel(type) {
        const labels = {
            user: '用户报表',
            transaction: '交易报表',
            task: '任务报表',
            redpacket: '红包报表',
            team: '团队报表',
            financial: '财务报表',
            custom: '自定义报表'
        };
        return labels[type] || type;
    }

    /**
     * 获取状态标签
     */
    getStatusLabel(status) {
        const labels = {
            completed: '已完成',
            processing: '处理中',
            failed: '失败',
            scheduled: '已安排'
        };
        return labels[status] || status;
    }

    /**
     * 筛选报表
     */
    filterReports() {
        const search = document.getElementById('reportSearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('reportTypeFilter')?.value || '';
        const statusFilter = document.getElementById('reportStatusFilter')?.value || '';

        const filteredReports = this.reports.filter(report => {
            const matchSearch = report.name.toLowerCase().includes(search);
            const matchType = !typeFilter || report.type === typeFilter;
            const matchStatus = !statusFilter || report.status === statusFilter;
            return matchSearch && matchType && matchStatus;
        });

        // 更新表格显示
        this.updateFilteredReportTable(filteredReports);
    }

    /**
     * 更新筛选后的报表表格
     */
    updateFilteredReportTable(reports) {
        const tbody = document.getElementById('reportTableBody');
        if (!tbody) return;

        tbody.innerHTML = reports.map(report => `
            <tr>
                <td><input type="checkbox" value="${report.id}"></td>
                <td>${report.name}</td>
                <td><span class="report-type ${report.type}">${this.getTypeLabel(report.type)}</span></td>
                <td>${report.dataSource}</td>
                <td>${report.createdAt}</td>
                <td><span class="report-status ${report.status}">${this.getStatusLabel(report.status)}</span></td>
                <td>${report.fileSize || '-'}</td>
                <td class="report-actions">
                    <button class="report-action-btn download" onclick="reportSystem.downloadReport('${report.id}')">下载</button>
                    <button class="report-action-btn edit" onclick="reportSystem.editReport('${report.id}')">编辑</button>
                    <button class="report-action-btn delete" onclick="reportSystem.deleteReport('${report.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 下载报表
     */
    async downloadReport(reportId) {
        try {
            const response = await fetch(`/admin/reports/${reportId}/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${reportId}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('下载失败');
            }
        } catch (error) {
            console.error('下载报表失败:', error);
            alert('下载失败');
        }
    }

    /**
     * 编辑报表
     */
    editReport(reportId) {
        // 实现编辑报表功能
        console.log('编辑报表:', reportId);
    }

    /**
     * 删除报表
     */
    async deleteReport(reportId) {
        if (confirm('确定要删除这个报表吗？')) {
            try {
                const response = await fetch(`/admin/reports/${reportId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('删除成功');
                    this.loadData();
                } else {
                    alert('删除失败');
                }
            } catch (error) {
                console.error('删除报表失败:', error);
                alert('删除失败');
            }
        }
    }

    /**
     * 加载模板列表
     */
    loadTemplates() {
        const templateList = document.getElementById('templateList');
        if (!templateList) return;

        templateList.innerHTML = this.templates.map(template => `
            <div class="template-item">
                <div class="template-info">
                    <h4>${template.name}</h4>
                    <p>${template.description}</p>
                    <div class="template-meta">
                        <span>使用次数: ${template.usageCount}</span>
                        <span>更新时间: ${template.updatedAt}</span>
                    </div>
                </div>
                <div class="template-actions">
                    <button class="btn btn-sm btn-primary" onclick="reportSystem.useTemplate('${template.id}')">使用</button>
                    <button class="btn btn-sm btn-secondary" onclick="reportSystem.editTemplate('${template.id}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="reportSystem.deleteTemplate('${template.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 加载报表选项
     */
    loadReportOptions() {
        const select = document.querySelector('#scheduleForm select[name="reportId"]');
        if (!select) return;

        select.innerHTML = '<option value="">请选择报表</option>' + 
            this.reports.map(report => `
                <option value="${report.id}">${report.name}</option>
            `).join('');
    }
}

// 导出类供全局使用
window.ReportSystem = ReportSystem;