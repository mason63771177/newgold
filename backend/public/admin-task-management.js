
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
 * 任务系统增强管理模块
 * 功能：任务模板管理、完成率统计、奖励配置、自动化任务分配
 */
class TaskManagement {
    constructor() {
        this.currentView = 'overview';
        this.selectedTasks = new Set();
        this.taskTemplates = [];
        this.taskStats = {};
        this.rewardConfigs = [];
        this.autoAssignRules = [];
        this.init();
    }

    /**
     * 初始化任务管理系统
     */
    init() {
        this.bindEvents();
        this.loadTaskData();
    }

    /**
     * 渲染任务管理页面
     */
    render() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = DOMPurify.sanitize(`
            <div class="task-management-container">
                <div class="task-header">
                    <h2 class="task-title">
                        <i class="fas fa-tasks"></i>
                        任务系统管理
                    </h2>
                    <div class="task-controls">
                        <div class="view-switcher">
                            <button class="view-btn active" data-view="overview">
                                <i class="fas fa-chart-pie"></i>
                                概览
                            </button>
                            <button class="view-btn" data-view="templates">
                                <i class="fas fa-clipboard-list"></i>
                                任务模板
                            </button>
                            <button class="view-btn" data-view="rewards">
                                <i class="fas fa-gift"></i>
                                奖励配置
                            </button>
                            <button class="view-btn" data-view="automation">
                                <i class="fas fa-robot"></i>
                                自动分配
                            </button>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-primary" id="createTaskBtn">
                                <i class="fas fa-plus"></i>
                                创建任务
                            </button>
                            <button class="btn btn-secondary" id="exportTasksBtn">
                                <i class="fas fa-download"></i>
                                导出数据
                            </button>
                        </div>
                    </div>
                </div>

                <div class="task-content">
                    <div class="view-content" id="overviewView">
                        ${this.renderOverviewView()}
                    </div>
                    <div class="view-content" id="templatesView" style="display: none);">
                        ${this.renderTemplatesView()}
                    </div>
                    <div class="view-content" id="rewardsView" style="display: none;">
                        ${this.renderRewardsView()}
                    </div>
                    <div class="view-content" id="automationView" style="display: none;">
                        ${this.renderAutomationView()}
                    </div>
                </div>
            </div>

            <!-- 任务详情模态框 -->
            <div class="modal" id="taskDetailModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">任务详情</h3>
                        <button class="close-btn" onclick="this.closest('.modal').style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="taskDetailContent">
                        <!-- 任务详情内容 -->
                    </div>
                </div>
            </div>

            <!-- 创建/编辑任务模态框 -->
            <div class="modal" id="taskFormModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title" id="taskFormTitle">创建任务</h3>
                        <button class="close-btn" onclick="this.closest('.modal').style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${this.renderTaskForm()}
                    </div>
                </div>
            </div>

            <!-- 奖励配置模态框 -->
            <div class="modal" id="rewardConfigModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">奖励配置</h3>
                        <button class="close-btn" onclick="this.closest('.modal').style.display='none'">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${this.renderRewardConfigForm()}
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadTaskData();
    }

    /**
     * 渲染概览视图
     */
    renderOverviewView() {
        return `
            <div class="overview-stats">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="totalTasks">0</div>
                        <div class="stat-label">总任务数</div>
                        <div class="stat-change positive">
                            <i class="fas fa-arrow-up"></i>
                            +12%
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="completedTasks">0</div>
                        <div class="stat-label">已完成</div>
                        <div class="stat-change positive">
                            <i class="fas fa-arrow-up"></i>
                            +8%
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="completionRate">0%</div>
                        <div class="stat-label">完成率</div>
                        <div class="stat-change positive">
                            <i class="fas fa-arrow-up"></i>
                            +5%
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="activeUsers">0</div>
                        <div class="stat-label">活跃用户</div>
                        <div class="stat-change positive">
                            <i class="fas fa-arrow-up"></i>
                            +15%
                        </div>
                    </div>
                </div>
            </div>

            <div class="overview-charts">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">任务完成趋势</h3>
                        <div class="chart-controls">
                            <select class="time-range-select">
                                <option value="7d">最近7天</option>
                                <option value="30d">最近30天</option>
                                <option value="90d">最近90天</option>
                            </select>
                        </div>
                    </div>
                    <div class="chart-placeholder" id="taskTrendChart">
                        <i class="fas fa-chart-line"></i>
                        任务完成趋势图
                    </div>
                </div>
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">任务类型分布</h3>
                    </div>
                    <div class="chart-placeholder" id="taskTypeChart">
                        <i class="fas fa-chart-pie"></i>
                        任务类型分布图
                    </div>
                </div>
            </div>

            <div class="recent-tasks">
                <div class="section-header">
                    <h3>最近任务</h3>
                    <button class="btn btn-link" onclick="taskManagement.switchView('templates')">
                        查看全部 <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="task-list" id="recentTasksList">
                    <!-- 最近任务列表 -->
                </div>
            </div>
        `;
    }

    /**
     * 渲染任务模板视图
     */
    renderTemplatesView() {
        return `
            <div class="templates-header">
                <div class="search-filters">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="搜索任务模板..." id="templateSearch">
                    </div>
                    <div class="filter-group">
                        <select id="templateTypeFilter">
                            <option value="">所有类型</option>
                            <option value="newbie">新手任务</option>
                            <option value="daily">日常任务</option>
                            <option value="special">特殊任务</option>
                            <option value="quiz">答题任务</option>
                        </select>
                        <select id="templateStatusFilter">
                            <option value="">所有状态</option>
                            <option value="active">启用</option>
                            <option value="inactive">禁用</option>
                            <option value="draft">草稿</option>
                        </select>
                    </div>
                </div>
                <div class="bulk-actions">
                    <button class="btn btn-secondary" id="bulkEnableBtn" disabled>
                        <i class="fas fa-check"></i>
                        批量启用
                    </button>
                    <button class="btn btn-secondary" id="bulkDisableBtn" disabled>
                        <i class="fas fa-ban"></i>
                        批量禁用
                    </button>
                    <button class="btn btn-danger" id="bulkDeleteBtn" disabled>
                        <i class="fas fa-trash"></i>
                        批量删除
                    </button>
                </div>
            </div>

            <div class="templates-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" id="selectAllTemplates">
                            </th>
                            <th>任务名称</th>
                            <th>类型</th>
                            <th>奖励</th>
                            <th>状态</th>
                            <th>使用次数</th>
                            <th>完成率</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="templatesTableBody">
                        <!-- 任务模板列表 -->
                    </tbody>
                </table>
            </div>

            <div class="pagination" id="templatesPagination">
                <!-- 分页控件 -->
            </div>
        `;
    }

    /**
     * 渲染奖励配置视图
     */
    renderRewardsView() {
        return `
            <div class="rewards-header">
                <div class="section-title">
                    <h3>奖励配置管理</h3>
                    <p>配置不同任务类型的奖励规则和奖励池</p>
                </div>
                <button class="btn btn-primary" id="createRewardBtn">
                    <i class="fas fa-plus"></i>
                    创建奖励配置
                </button>
            </div>

            <div class="reward-stats">
                <div class="reward-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="totalRewardPool">0</div>
                        <div class="stat-label">总奖励池</div>
                    </div>
                </div>
                <div class="reward-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-gift"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="distributedRewards">0</div>
                        <div class="stat-label">已发放奖励</div>
                    </div>
                </div>
                <div class="reward-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="avgRewardPerTask">0</div>
                        <div class="stat-label">平均任务奖励</div>
                    </div>
                </div>
            </div>

            <div class="reward-configs">
                <div class="config-list" id="rewardConfigsList">
                    <!-- 奖励配置列表 -->
                </div>
            </div>
        `;
    }

    /**
     * 渲染自动分配视图
     */
    renderAutomationView() {
        return `
            <div class="automation-header">
                <div class="section-title">
                    <h3>自动化任务分配</h3>
                    <p>配置任务自动分配规则，提高任务分发效率</p>
                </div>
                <button class="btn btn-primary" id="createRuleBtn">
                    <i class="fas fa-plus"></i>
                    创建分配规则
                </button>
            </div>

            <div class="automation-stats">
                <div class="auto-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="activeRules">0</div>
                        <div class="stat-label">活跃规则</div>
                    </div>
                </div>
                <div class="auto-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-sync"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="autoAssignedTasks">0</div>
                        <div class="stat-label">自动分配任务</div>
                    </div>
                </div>
                <div class="auto-stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="automationRate">0%</div>
                        <div class="stat-label">自动化率</div>
                    </div>
                </div>
            </div>

            <div class="automation-rules">
                <div class="rules-list" id="automationRulesList">
                    <!-- 自动分配规则列表 -->
                </div>
            </div>
        `;
    }

    /**
     * 渲染任务表单
     */
    renderTaskForm() {
        return `
            <form id="taskForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">任务名称 *</label>
                        <input type="text" class="form-control" id="taskName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">任务类型 *</label>
                        <select class="form-control" id="taskType" required>
                            <option value="">选择任务类型</option>
                            <option value="newbie">新手任务</option>
                            <option value="daily">日常任务</option>
                            <option value="special">特殊任务</option>
                            <option value="quiz">答题任务</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">任务描述</label>
                    <textarea class="form-control" id="taskDescription" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">奖励金额</label>
                        <input type="number" class="form-control" id="rewardAmount" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">完成条件</label>
                        <input type="text" class="form-control" id="completionCondition">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">优先级</label>
                        <select class="form-control" id="taskPriority">
                            <option value="low">低</option>
                            <option value="medium" selected>中</option>
                            <option value="high">高</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">状态</label>
                        <select class="form-control" id="taskStatus">
                            <option value="draft">草稿</option>
                            <option value="active" selected>启用</option>
                            <option value="inactive">禁用</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="isRepeatable"> 可重复任务
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('taskFormModal').style.display='none'">
                        取消
                    </button>
                    <button type="submit" class="btn btn-primary">
                        保存任务
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * 渲染奖励配置表单
     */
    renderRewardConfigForm() {
        return `
            <form id="rewardConfigForm">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">配置名称 *</label>
                        <input type="text" class="form-control" id="rewardConfigName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">适用任务类型 *</label>
                        <select class="form-control" id="rewardTaskType" required>
                            <option value="">选择任务类型</option>
                            <option value="newbie">新手任务</option>
                            <option value="daily">日常任务</option>
                            <option value="special">特殊任务</option>
                            <option value="quiz">答题任务</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">基础奖励</label>
                        <input type="number" class="form-control" id="baseReward" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">奖励上限</label>
                        <input type="number" class="form-control" id="maxReward" min="0" step="0.01">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">奖励规则</label>
                    <textarea class="form-control" id="rewardRules" rows="3" placeholder="描述奖励计算规则..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="enableBonus"> 启用奖励加成
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('rewardConfigModal').style.display='none'">
                        取消
                    </button>
                    <button type="submit" class="btn btn-primary">
                        保存配置
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 视图切换
        document.addEventListener('click', (e) => {
            if (e.target.matches('.view-btn')) {
                this.switchView(e.target.dataset.view);
            }
        });

        // 创建任务
        document.addEventListener('click', (e) => {
            if (e.target.matches('#createTaskBtn')) {
                this.showTaskForm();
            }
        });

        // 导出数据
        document.addEventListener('click', (e) => {
            if (e.target.matches('#exportTasksBtn')) {
                this.exportTaskData();
            }
        });

        // 表单提交
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#taskForm')) {
                e.preventDefault();
                this.saveTask();
            }
            if (e.target.matches('#rewardConfigForm')) {
                e.preventDefault();
                this.saveRewardConfig();
            }
        });

        // 搜索和筛选
        document.addEventListener('input', (e) => {
            if (e.target.matches('#templateSearch')) {
                this.searchTemplates(e.target.value);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('#templateTypeFilter, #templateStatusFilter')) {
                this.filterTemplates();
            }
        });
    }

    /**
     * 切换视图
     */
    switchView(view) {
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // 切换内容
        document.querySelectorAll('.view-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`${view}View`).style.display = 'block';

        this.currentView = view;
        this.loadViewData(view);
    }

    /**
     * 加载任务数据
     */
    async loadTaskData() {
        try {
            const response = await fetch('/api/admin/tasks/analytics');
            const data = await response.json();
            
            if (data.success) {
                this.updateOverviewStats(data.data);
                this.updateTasksList(data.data.recentTasks);
            }
        } catch (error) {
            console.error('加载任务数据失败:', error);
            this.showError('加载任务数据失败');
        }
    }

    /**
     * 加载视图数据
     */
    async loadViewData(view) {
        switch (view) {
            case 'templates':
                await this.loadTemplates();
                break;
            case 'rewards':
                await this.loadRewardConfigs();
                break;
            case 'automation':
                await this.loadAutomationRules();
                break;
        }
    }

    /**
     * 更新概览统计
     */
    updateOverviewStats(data) {
        document.getElementById('totalTasks').textContent = data.totalTasks || 0;
        document.getElementById('completedTasks').textContent = data.completedTasks || 0;
        document.getElementById('completionRate').textContent = `${data.completionRate || 0}%`;
        document.getElementById('activeUsers').textContent = data.activeUsers || 0;
    }

    /**
     * 更新任务列表
     */
    updateTasksList(tasks) {
        const container = document.getElementById('recentTasksList');
        if (!container) return;

        container.innerHTML = DOMPurify.sanitize(tasks.map(task => `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-info">
                    <div class="task-name">${task.name}</div>
                    <div class="task-meta">
                        <span class="task-type">${this.getTaskTypeLabel(task.type)}</span>
                        <span class="task-reward">奖励: ${task.reward}元</span>
                        <span class="task-completion">${task.completionRate}%完成</span>
                    </div>
                </div>
                <div class="task-status">
                    <span class="status-badge ${task.status}">${this.getStatusLabel(task.status)}</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-primary" onclick="taskManagement.viewTaskDetail('${task.id}')">
                        查看
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="taskManagement.editTask('${task.id}')">
                        编辑
                    </button>
                </div>
            </div>
        `).join(''));
    }

    /**
     * 显示任务表单
     */
    showTaskForm(taskId = null) {
        const modal = document.getElementById('taskFormModal');
        const title = document.getElementById('taskFormTitle');
        
        if (taskId) {
            title.textContent = '编辑任务';
            this.loadTaskForEdit(taskId);
        } else {
            title.textContent = '创建任务';
            document.getElementById('taskForm').reset();
        }
        
        modal.style.display = 'block';
    }

    /**
     * 保存任务
     */
    async saveTask() {
        const formData = new FormData(document.getElementById('taskForm'));
        const taskData = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('taskFormModal').style.display = 'none';
                this.loadTaskData();
                this.showSuccess('任务保存成功');
            } else {
                this.showError(result.message || '保存失败');
            }
        } catch (error) {
            console.error('保存任务失败:', error);
            this.showError('保存任务失败');
        }
    }

    /**
     * 导出任务数据
     */
    async exportTaskData() {
        try {
            const response = await fetch('/api/admin/tasks/export', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 创建下载链接
                const link = document.createElement('a');
                link.href = result.data.downloadUrl;
                link.download = result.data.filename;
                link.click();
                
                this.showSuccess('数据导出成功');
            } else {
                this.showError(result.message || '导出失败');
            }
        } catch (error) {
            console.error('导出数据失败:', error);
            this.showError('导出数据失败');
        }
    }

    /**
     * 获取任务类型标签
     */
    getTaskTypeLabel(type) {
        const labels = {
            'newbie': '新手任务',
            'daily': '日常任务',
            'special': '特殊任务',
            'quiz': '答题任务'
        };
        return labels[type] || type;
    }

    /**
     * 获取状态标签
     */
    getStatusLabel(status) {
        const labels = {
            'active': '启用',
            'inactive': '禁用',
            'draft': '草稿'
        };
        return labels[status] || status;
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        // 实现成功提示
        console.log('Success:', message);
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        // 实现错误提示
        console.error('Error:', message);
    }
}

// 全局实例
window.TaskManagement = TaskManagement;