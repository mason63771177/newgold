/**
 * 通知中心管理模块
 * 实现实时通知、消息推送、通知模板、批量通知管理功能
 */
class NotificationCenter {
    constructor() {
        this.currentView = 'overview';
        this.notifications = [];
        this.templates = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.filters = {
            status: 'all',
            type: 'all',
            priority: 'all'
        };
        this.init();
    }

    /**
     * 初始化通知中心
     */
    init() {
        this.render();
        this.bindEvents();
        this.loadNotificationData();
        this.startRealTimeUpdates();
    }

    /**
     * 渲染通知中心界面
     */
    render() {
        const container = document.getElementById('content');
        container.innerHTML = `
            <div class="notification-center">
                <div class="notification-header">
                    <h2 class="notification-title">通知中心</h2>
                    <div class="notification-controls">
                        <button class="btn btn-primary" id="createNotificationBtn">
                            <i class="fas fa-plus"></i> 创建通知
                        </button>
                        <button class="btn btn-secondary" id="createTemplateBtn">
                            <i class="fas fa-file-alt"></i> 创建模板
                        </button>
                        <button class="btn btn-info" id="batchSendBtn">
                            <i class="fas fa-paper-plane"></i> 批量发送
                        </button>
                    </div>
                </div>

                <div class="notification-nav">
                    <button class="notification-nav-btn active" data-view="overview">概览</button>
                    <button class="notification-nav-btn" data-view="notifications">通知管理</button>
                    <button class="notification-nav-btn" data-view="templates">模板管理</button>
                    <button class="notification-nav-btn" data-view="analytics">发送统计</button>
                    <button class="notification-nav-btn" data-view="settings">推送设置</button>
                </div>

                <div id="notificationContent" class="notification-content">
                    ${this.renderOverview()}
                </div>
            </div>

            <!-- 创建通知模态框 -->
            <div id="notificationModal" class="notification-modal">
                <div class="notification-modal-content">
                    <div class="notification-modal-header">
                        <h3 class="notification-modal-title">创建通知</h3>
                        <button class="notification-modal-close">&times;</button>
                    </div>
                    <div class="notification-modal-body">
                        <form id="notificationForm">
                            <div class="notification-form-group">
                                <label class="notification-form-label">通知标题</label>
                                <input type="text" class="notification-form-control" name="title" required>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">通知内容</label>
                                <textarea class="notification-form-control" name="content" rows="4" required></textarea>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">通知类型</label>
                                <select class="notification-form-control" name="type" required>
                                    <option value="system">系统通知</option>
                                    <option value="promotion">推广通知</option>
                                    <option value="warning">警告通知</option>
                                    <option value="info">信息通知</option>
                                </select>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">优先级</label>
                                <select class="notification-form-control" name="priority" required>
                                    <option value="low">低</option>
                                    <option value="medium">中</option>
                                    <option value="high">高</option>
                                    <option value="urgent">紧急</option>
                                </select>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">发送方式</label>
                                <div class="notification-checkbox-group">
                                    <label><input type="checkbox" name="channels" value="push"> 推送通知</label>
                                    <label><input type="checkbox" name="channels" value="email"> 邮件通知</label>
                                    <label><input type="checkbox" name="channels" value="sms"> 短信通知</label>
                                    <label><input type="checkbox" name="channels" value="in-app"> 应用内通知</label>
                                </div>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">目标用户</label>
                                <select class="notification-form-control" name="target" required>
                                    <option value="all">所有用户</option>
                                    <option value="active">活跃用户</option>
                                    <option value="inactive">非活跃用户</option>
                                    <option value="vip">VIP用户</option>
                                    <option value="custom">自定义用户组</option>
                                </select>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">发送时间</label>
                                <select class="notification-form-control" name="sendTime" required>
                                    <option value="now">立即发送</option>
                                    <option value="scheduled">定时发送</option>
                                </select>
                            </div>
                            <div class="notification-form-group" id="scheduledTimeGroup" style="display: none;">
                                <label class="notification-form-label">定时时间</label>
                                <input type="datetime-local" class="notification-form-control" name="scheduledTime">
                            </div>
                        </form>
                    </div>
                    <div class="notification-modal-footer">
                        <button type="button" class="notification-btn secondary" id="cancelNotificationBtn">取消</button>
                        <button type="submit" class="notification-btn primary" form="notificationForm">发送通知</button>
                    </div>
                </div>
            </div>

            <!-- 模板管理模态框 -->
            <div id="templateModal" class="notification-modal">
                <div class="notification-modal-content">
                    <div class="notification-modal-header">
                        <h3 class="notification-modal-title">创建模板</h3>
                        <button class="notification-modal-close">&times;</button>
                    </div>
                    <div class="notification-modal-body">
                        <form id="templateForm">
                            <div class="notification-form-group">
                                <label class="notification-form-label">模板名称</label>
                                <input type="text" class="notification-form-control" name="name" required>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">模板类型</label>
                                <select class="notification-form-control" name="type" required>
                                    <option value="welcome">欢迎消息</option>
                                    <option value="promotion">推广消息</option>
                                    <option value="reminder">提醒消息</option>
                                    <option value="alert">警告消息</option>
                                    <option value="custom">自定义</option>
                                </select>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">标题模板</label>
                                <input type="text" class="notification-form-control" name="titleTemplate" required>
                                <small class="form-text">支持变量：{username}, {amount}, {date} 等</small>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">内容模板</label>
                                <textarea class="notification-form-control" name="contentTemplate" rows="6" required></textarea>
                                <small class="form-text">支持变量：{username}, {amount}, {date} 等</small>
                            </div>
                        </form>
                    </div>
                    <div class="notification-modal-footer">
                        <button type="button" class="notification-btn secondary" id="cancelTemplateBtn">取消</button>
                        <button type="submit" class="notification-btn primary" form="templateForm">保存模板</button>
                    </div>
                </div>
            </div>

            <!-- 批量发送模态框 -->
            <div id="batchSendModal" class="notification-modal">
                <div class="notification-modal-content">
                    <div class="notification-modal-header">
                        <h3 class="notification-modal-title">批量发送通知</h3>
                        <button class="notification-modal-close">&times;</button>
                    </div>
                    <div class="notification-modal-body">
                        <form id="batchSendForm">
                            <div class="notification-form-group">
                                <label class="notification-form-label">选择模板</label>
                                <select class="notification-form-control" name="templateId" required>
                                    <option value="">请选择模板</option>
                                </select>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">用户列表</label>
                                <textarea class="notification-form-control" name="userList" rows="6" 
                                    placeholder="请输入用户ID，每行一个，或上传CSV文件"></textarea>
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">或上传用户文件</label>
                                <input type="file" class="notification-form-control" name="userFile" accept=".csv,.txt">
                            </div>
                            <div class="notification-form-group">
                                <label class="notification-form-label">发送间隔（秒）</label>
                                <input type="number" class="notification-form-control" name="interval" value="1" min="0.1" step="0.1">
                                <small class="form-text">避免频率限制，建议设置适当间隔</small>
                            </div>
                        </form>
                    </div>
                    <div class="notification-modal-footer">
                        <button type="button" class="notification-btn secondary" id="cancelBatchSendBtn">取消</button>
                        <button type="submit" class="notification-btn primary" form="batchSendForm">开始发送</button>
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
            <div class="notification-stats-grid">
                <div class="notification-stat-card">
                    <h3>今日发送</h3>
                    <div class="notification-stat-value">1,234</div>
                    <div class="notification-stat-change positive">+12.5%</div>
                </div>
                <div class="notification-stat-card">
                    <h3>成功率</h3>
                    <div class="notification-stat-value">98.7%</div>
                    <div class="notification-stat-change positive">+0.3%</div>
                </div>
                <div class="notification-stat-card">
                    <h3>点击率</h3>
                    <div class="notification-stat-value">15.2%</div>
                    <div class="notification-stat-change negative">-1.1%</div>
                </div>
                <div class="notification-stat-card">
                    <h3>活跃模板</h3>
                    <div class="notification-stat-value">23</div>
                    <div class="notification-stat-change positive">+2</div>
                </div>
            </div>

            <div class="notification-content">
                <div class="notification-content-header">
                    <h3 class="notification-content-title">最近通知</h3>
                    <div class="notification-content-actions">
                        <button class="btn btn-sm btn-outline-primary">查看全部</button>
                    </div>
                </div>
                <div class="notification-recent-list" id="recentNotifications">
                    <!-- 最近通知列表 -->
                </div>
            </div>
        `;
    }

    /**
     * 渲染通知管理视图
     */
    renderNotifications() {
        return `
            <div class="notification-search-filters">
                <input type="text" class="notification-search-box" placeholder="搜索通知..." id="notificationSearch">
                <select class="notification-filter-select" id="statusFilter">
                    <option value="all">所有状态</option>
                    <option value="sent">已发送</option>
                    <option value="pending">待发送</option>
                    <option value="failed">发送失败</option>
                    <option value="draft">草稿</option>
                </select>
                <select class="notification-filter-select" id="typeFilter">
                    <option value="all">所有类型</option>
                    <option value="system">系统通知</option>
                    <option value="promotion">推广通知</option>
                    <option value="warning">警告通知</option>
                    <option value="info">信息通知</option>
                </select>
                <select class="notification-filter-select" id="priorityFilter">
                    <option value="all">所有优先级</option>
                    <option value="urgent">紧急</option>
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                </select>
            </div>

            <div class="notification-content">
                <table class="notification-table">
                    <thead>
                        <tr>
                            <th>标题</th>
                            <th>类型</th>
                            <th>优先级</th>
                            <th>目标用户</th>
                            <th>发送状态</th>
                            <th>发送时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="notificationTableBody">
                        <!-- 通知列表 -->
                    </tbody>
                </table>

                <div class="notification-pagination" id="notificationPagination">
                    <!-- 分页控件 -->
                </div>
            </div>
        `;
    }

    /**
     * 渲染模板管理视图
     */
    renderTemplates() {
        return `
            <div class="notification-content">
                <div class="notification-content-header">
                    <h3 class="notification-content-title">通知模板</h3>
                    <div class="notification-content-actions">
                        <button class="btn btn-primary" id="createTemplateBtn2">
                            <i class="fas fa-plus"></i> 新建模板
                        </button>
                    </div>
                </div>

                <div class="template-grid" id="templateGrid">
                    <!-- 模板卡片 -->
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
            if (e.target.classList.contains('notification-nav-btn')) {
                this.switchView(e.target.dataset.view);
            }
        });

        // 模态框控制
        document.getElementById('createNotificationBtn').addEventListener('click', () => {
            this.showNotificationModal();
        });

        document.getElementById('createTemplateBtn').addEventListener('click', () => {
            this.showTemplateModal();
        });

        document.getElementById('batchSendBtn').addEventListener('click', () => {
            this.showBatchSendModal();
        });

        // 表单提交
        document.getElementById('notificationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNotification(new FormData(e.target));
        });

        document.getElementById('templateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTemplate(new FormData(e.target));
        });

        document.getElementById('batchSendForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.executeBatchSend(new FormData(e.target));
        });

        // 发送时间选择
        document.querySelector('select[name="sendTime"]').addEventListener('change', (e) => {
            const scheduledGroup = document.getElementById('scheduledTimeGroup');
            scheduledGroup.style.display = e.target.value === 'scheduled' ? 'block' : 'none';
        });

        // 模态框关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-modal-close') || 
                e.target.id.includes('cancel')) {
                this.closeModals();
            }
        });
    }

    /**
     * 切换视图
     */
    switchView(view) {
        this.currentView = view;
        
        // 更新导航状态
        document.querySelectorAll('.notification-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // 渲染对应视图
        const content = document.getElementById('notificationContent');
        switch(view) {
            case 'overview':
                content.innerHTML = this.renderOverview();
                this.loadRecentNotifications();
                break;
            case 'notifications':
                content.innerHTML = this.renderNotifications();
                this.loadNotificationList();
                break;
            case 'templates':
                content.innerHTML = this.renderTemplates();
                this.loadTemplateList();
                break;
            case 'analytics':
                content.innerHTML = this.renderAnalytics();
                this.loadAnalyticsData();
                break;
            case 'settings':
                content.innerHTML = this.renderSettings();
                this.loadSettingsData();
                break;
        }
    }

    /**
     * 加载通知数据
     */
    async loadNotificationData() {
        try {
            const response = await fetch('/api/admin/notifications');
            const data = await response.json();
            this.notifications = data.notifications || [];
            this.updateNotificationDisplay();
        } catch (error) {
            console.error('加载通知数据失败:', error);
        }
    }

    /**
     * 显示通知创建模态框
     */
    showNotificationModal() {
        document.getElementById('notificationModal').style.display = 'block';
    }

    /**
     * 显示模板创建模态框
     */
    showTemplateModal() {
        document.getElementById('templateModal').style.display = 'block';
    }

    /**
     * 显示批量发送模态框
     */
    showBatchSendModal() {
        document.getElementById('batchSendModal').style.display = 'block';
        this.loadTemplateOptions();
    }

    /**
     * 关闭所有模态框
     */
    closeModals() {
        document.querySelectorAll('.notification-modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    /**
     * 创建通知
     */
    async createNotification(formData) {
        try {
            const notificationData = {
                title: formData.get('title'),
                content: formData.get('content'),
                type: formData.get('type'),
                priority: formData.get('priority'),
                channels: formData.getAll('channels'),
                target: formData.get('target'),
                sendTime: formData.get('sendTime'),
                scheduledTime: formData.get('scheduledTime')
            };

            const response = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            });

            if (response.ok) {
                this.closeModals();
                this.loadNotificationData();
                this.showSuccess('通知创建成功');
            }
        } catch (error) {
            console.error('创建通知失败:', error);
            this.showError('创建通知失败');
        }
    }

    /**
     * 开始实时更新
     */
    startRealTimeUpdates() {
        setInterval(() => {
            if (this.currentView === 'overview') {
                this.loadRecentNotifications();
            }
        }, 30000); // 每30秒更新一次
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

    /**
     * 更新通知显示
     */
    updateNotificationDisplay() {
        if (this.currentView === 'notifications') {
            this.loadNotificationList();
        } else if (this.currentView === 'overview') {
            this.loadRecentNotifications();
        }
    }

    /**
     * 加载最近通知
     */
    loadRecentNotifications() {
        const container = document.getElementById('recentNotifications');
        if (!container) return;

        // 模拟最近通知数据
        const recentNotifications = [
            { id: 1, title: '系统维护通知', type: 'system', status: 'sent', time: '2024-01-15 10:30' },
            { id: 2, title: '新功能上线', type: 'info', status: 'sent', time: '2024-01-15 09:15' },
            { id: 3, title: '活动推广', type: 'promotion', status: 'pending', time: '2024-01-15 14:00' }
        ];

        container.innerHTML = recentNotifications.map(notification => `
            <div class="notification-item">
                <div class="notification-item-content">
                    <h4>${notification.title}</h4>
                    <span class="notification-type ${notification.type}">${this.getTypeLabel(notification.type)}</span>
                    <span class="notification-status ${notification.status}">${this.getStatusLabel(notification.status)}</span>
                </div>
                <div class="notification-item-time">${notification.time}</div>
            </div>
        `).join('');
    }

    /**
     * 加载通知列表
     */
    loadNotificationList() {
        const tbody = document.getElementById('notificationTableBody');
        if (!tbody) return;

        // 模拟通知列表数据
        const notifications = [
            { id: 1, title: '系统维护通知', type: 'system', priority: 'high', target: '所有用户', status: 'sent', time: '2024-01-15 10:30' },
            { id: 2, title: '新功能上线', type: 'info', priority: 'medium', target: '活跃用户', status: 'sent', time: '2024-01-15 09:15' },
            { id: 3, title: '活动推广', type: 'promotion', priority: 'low', target: 'VIP用户', status: 'pending', time: '2024-01-15 14:00' }
        ];

        tbody.innerHTML = notifications.map(notification => `
            <tr>
                <td>${notification.title}</td>
                <td><span class="notification-type ${notification.type}">${this.getTypeLabel(notification.type)}</span></td>
                <td><span class="notification-priority ${notification.priority}">${this.getPriorityLabel(notification.priority)}</span></td>
                <td>${notification.target}</td>
                <td><span class="notification-status ${notification.status}">${this.getStatusLabel(notification.status)}</span></td>
                <td>${notification.time}</td>
                <td>
                    <button class="notification-action-btn view">查看</button>
                    <button class="notification-action-btn edit">编辑</button>
                    <button class="notification-action-btn delete">删除</button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 加载模板列表
     */
    loadTemplateList() {
        const container = document.getElementById('templateGrid');
        if (!container) return;

        // 模拟模板数据
        const templates = [
            { id: 1, name: '欢迎新用户', type: 'welcome', usage: 156 },
            { id: 2, name: '活动推广', type: 'promotion', usage: 89 },
            { id: 3, name: '系统提醒', type: 'reminder', usage: 234 }
        ];

        container.innerHTML = templates.map(template => `
            <div class="template-card">
                <h4>${template.name}</h4>
                <p>类型: ${this.getTypeLabel(template.type)}</p>
                <p>使用次数: ${template.usage}</p>
                <div class="template-actions">
                    <button class="btn btn-sm btn-primary">使用</button>
                    <button class="btn btn-sm btn-secondary">编辑</button>
                    <button class="btn btn-sm btn-danger">删除</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 获取类型标签
     */
    getTypeLabel(type) {
        const labels = {
            system: '系统',
            promotion: '推广',
            warning: '警告',
            info: '信息',
            welcome: '欢迎',
            reminder: '提醒'
        };
        return labels[type] || type;
    }

    /**
     * 获取状态标签
     */
    getStatusLabel(status) {
        const labels = {
            sent: '已发送',
            pending: '待发送',
            failed: '发送失败',
            draft: '草稿'
        };
        return labels[status] || status;
    }

    /**
     * 获取优先级标签
     */
    getPriorityLabel(priority) {
        const labels = {
            urgent: '紧急',
            high: '高',
            medium: '中',
            low: '低'
        };
        return labels[priority] || priority;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationCenter;
}