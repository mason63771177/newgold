
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
 * 高级用户管理模块
 * 提供用户列表、详情、编辑、删除等功能
 */
class UserManagement {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        this.filters = {
            status: 'all',
            role: 'all',
            dateRange: 'all',
            searchTerm: ''
        };
        this.selectedUsers = new Set();
        this.users = [];
        this.stats = {};
        this.pagination = {};
    }

    /**
     * 初始化用户管理页面
     */
    init() {
        this.renderPage();
        this.bindEvents();
        this.loadUsers();
    }

    /**
     * 渲染页面HTML结构
     */
    renderPage() {
        const content = `
            <div class="user-management">
                <!-- 页面标题 -->
                <div class="page-header">
                    <h2><i class="fas fa-users"></i> 用户管理</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="addUserBtn">
                            <i class="fas fa-plus"></i> 添加用户
                        </button>
                        <button class="btn btn-success" id="exportUsersBtn">
                            <i class="fas fa-download"></i> 导出数据
                        </button>
                    </div>
                </div>

                <!-- 统计卡片 -->
                <div class="stats-cards">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalUsersCount">0</h3>
                            <p>总用户数</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="activeUsersCount">0</h3>
                            <p>活跃用户</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="newUsersCount">0</h3>
                            <p>新增用户</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalBalanceAmount">¥0</h3>
                            <p>总余额</p>
                        </div>
                    </div>
                </div>

                <!-- 筛选和搜索 -->
                <div class="filters-section">
                    <div class="filter-group">
                        <label>状态筛选:</label>
                        <select id="statusFilter">
                            <option value="all">全部状态</option>
                            <option value="active">活跃</option>
                            <option value="inactive">非活跃</option>
                            <option value="suspended">已暂停</option>
                            <option value="banned">已封禁</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>角色筛选:</label>
                        <select id="roleFilter">
                            <option value="all">全部角色</option>
                            <option value="user">普通用户</option>
                            <option value="vip">VIP用户</option>
                            <option value="admin">管理员</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>注册时间:</label>
                        <select id="dateRangeFilter">
                            <option value="all">全部时间</option>
                            <option value="today">今天</option>
                            <option value="week">本周</option>
                            <option value="month">本月</option>
                            <option value="quarter">本季度</option>
                        </select>
                    </div>
                    <div class="filter-group search-group">
                        <label>搜索:</label>
                        <input type="text" id="searchInput" placeholder="搜索用户名、邮箱或手机号">
                        <button class="btn btn-primary" id="searchBtn">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                <!-- 批量操作 -->
                <div class="batch-actions" id="batchActions" style="display: none;">
                    <span class="selected-count">已选择 <span id="selectedCount">0</span> 个用户</span>
                    <div class="batch-buttons">
                        <button class="btn btn-success" data-action="activate">
                            <i class="fas fa-check"></i> 激活
                        </button>
                        <button class="btn btn-warning" data-action="suspend">
                            <i class="fas fa-pause"></i> 暂停
                        </button>
                        <button class="btn btn-danger" data-action="delete">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>

                <!-- 用户列表 -->
                <div class="users-table-container">
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" id="selectAllUsers">
                                </th>
                                <th class="sortable" data-sort="id">
                                    ID <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="username">
                                    用户名 <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="email">
                                    邮箱 <i class="fas fa-sort"></i>
                                </th>
                                <th>手机号</th>
                                <th class="sortable" data-sort="status">
                                    状态 <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="role">
                                    角色 <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="balance">
                                    余额 <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="created_at">
                                    注册时间 <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="last_login">
                                    最后登录 <i class="fas fa-sort"></i>
                                </th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <!-- 用户数据将在这里动态加载 -->
                        </tbody>
                    </table>
                </div>

                <!-- 分页 -->
                <div class="pagination-container">
                    <div class="pagination-info">
                        显示第 <span id="pageStart">0</span> - <span id="pageEnd">0</span> 条，
                        共 <span id="totalItems">0</span> 条记录
                    </div>
                    <div class="pagination" id="pagination">
                        <!-- 分页按钮将在这里动态生成 -->
                    </div>
                </div>

                <!-- 加载状态 -->
                <div class="loading-overlay" id="loadingOverlay" style="display: none;">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>加载中...</p>
                    </div>
                </div>
            </div>

            <!-- 用户详情模态框 -->
            <div class="modal" id="userDetailModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>用户详情</h3>
                        <span class="close" id="closeUserDetail">&times;</span>
                    </div>
                    <div class="modal-body" id="userDetailContent">
                        <!-- 用户详情内容将在这里动态加载 -->
                    </div>
                </div>
            </div>

            <!-- 添加/编辑用户模态框 -->
            <div class="modal" id="userFormModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="userFormTitle">添加用户</h3>
                        <span class="close" id="closeUserForm">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="userForm">
                            <div class="form-group">
                                <label for="username">用户名 *</label>
                                <input type="text" id="username" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="email">邮箱 *</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="phone">手机号</label>
                                <input type="tel" id="phone" name="phone">
                            </div>
                            <div class="form-group" id="passwordGroup">
                                <label for="password">密码 *</label>
                                <input type="password" id="password" name="password" required>
                            </div>
                            <div class="form-group">
                                <label for="role">角色</label>
                                <select id="role" name="role">
                                    <option value="user">普通用户</option>
                                    <option value="vip">VIP用户</option>
                                    <option value="admin">管理员</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="balance">初始余额</label>
                                <input type="number" id="balance" name="balance" min="0" step="0.01" value="0">
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" id="cancelUserForm">取消</button>
                                <button type="submit" class="btn btn-primary">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('content').innerHTML = content;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 搜索和筛选
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        document.getElementById('statusFilter').addEventListener('change', () => this.handleFilterChange());
        document.getElementById('roleFilter').addEventListener('change', () => this.handleFilterChange());
        document.getElementById('dateRangeFilter').addEventListener('change', () => this.handleFilterChange());

        // 排序
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => this.handleSort(th.dataset.sort));
        });

        // 全选
        document.getElementById('selectAllUsers').addEventListener('change', (e) => {
            this.handleSelectAll(e.target.checked);
        });

        // 批量操作
        document.querySelectorAll('.batch-buttons button').forEach(btn => {
            btn.addEventListener('click', () => this.handleBatchAction(btn.dataset.action));
        });

        // 添加用户
        document.getElementById('addUserBtn').addEventListener('click', () => this.showUserForm());
        
        // 导出数据
        document.getElementById('exportUsersBtn').addEventListener('click', () => this.exportUsers());

        // 模态框关闭
        document.getElementById('closeUserDetail').addEventListener('click', () => this.closeModal('userDetailModal'));
        document.getElementById('closeUserForm').addEventListener('click', () => this.closeModal('userFormModal'));
        document.getElementById('cancelUserForm').addEventListener('click', () => this.closeModal('userFormModal'));

        // 用户表单提交
        document.getElementById('userForm').addEventListener('submit', (e) => this.handleUserFormSubmit(e));

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    /**
     * 加载用户数据
     */
    async loadUsers() {
        this.showLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                ...this.filters
            });

            const response = await fetch(`/api/admin/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('获取用户数据失败');
            }

            const data = await response.json();
            this.users = data.users;
            this.stats = data.stats;
            this.pagination = data.pagination;

            this.renderUsers();
            this.renderStats();
            this.renderPagination();
            
        } catch (error) {
            console.error('加载用户数据失败:', error);
            this.showMessage('加载用户数据失败', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 渲染用户列表
     */
    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        
        if (this.users.length === 0) {
            tbody.innerHTML = DOMPurify.sanitize(`
                <tr>
                    <td colspan="11" class="no-data">
                        <i class="fas fa-users"></i>
                        <p>暂无用户数据</p>
                    </td>
                </tr>
            `);
            return;
        }

        tbody.innerHTML = DOMPurify.sanitize(this.users.map(user => `
            <tr>
                <td>
                    <input type="checkbox" class="user-checkbox" value="${user.id}">
                </td>
                <td>${user.id}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            ${user.avatar ? `<img src="${user.avatar}" alt="${user.username}">` : 
                              `<i class="fas fa-user"></i>`}
                        </div>
                        <span>${user.username}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.phone || '-'}</td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${this.getStatusText(user.status)}
                    </span>
                </td>
                <td>
                    <span class="role-badge role-${user.role}">
                        ${this.getRoleText(user.role)}
                    </span>
                </td>
                <td>¥${user.balance.toFixed(2)}</td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>${user.last_login ? this.formatDate(user.last_login) : '从未登录'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="userManagement.viewUserDetail(${user.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="userManagement.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="userManagement.toggleUserStatus(${user.id}, '${user.status}')">
                            <i class="fas fa-${user.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="userManagement.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join(''));

        // 绑定复选框事件
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleUserSelect());
        });
    }

    /**
     * 渲染统计信息
     */
    renderStats() {
        document.getElementById('totalUsersCount').textContent = this.stats.totalUsers || 0;
        document.getElementById('activeUsersCount').textContent = this.stats.activeUsers || 0;
        document.getElementById('newUsersCount').textContent = this.stats.newUsers || 0;
        document.getElementById('totalBalanceAmount').textContent = `¥${(this.stats.totalBalance || 0).toFixed(2)}`;
    }

    /**
     * 渲染分页
     */
    renderPagination() {
        const { currentPage, totalPages, totalItems } = this.pagination;
        const startItem = (currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(currentPage * this.pageSize, totalItems);

        document.getElementById('pageStart').textContent = startItem;
        document.getElementById('pageEnd').textContent = endItem;
        document.getElementById('totalItems').textContent = totalItems;

        const paginationContainer = document.getElementById('pagination');
        let paginationHTML = '';

        // 上一页
        if (currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="userManagement.goToPage(${currentPage - 1})">上一页</button>`;
        }

        // 页码按钮
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="userManagement.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="page-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="userManagement.goToPage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="page-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="page-btn" onclick="userManagement.goToPage(${totalPages})">${totalPages}</button>`;
        }

        // 下一页
        if (currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="userManagement.goToPage(${currentPage + 1})">下一页</button>`;
        }

        paginationContainer.innerHTML = DOMPurify.sanitize(paginationHTML);
    }

    /**
     * 处理搜索
     */
    handleSearch() {
        this.filters.searchTerm = document.getElementById('searchInput').value.trim();
        this.currentPage = 1;
        this.loadUsers();
    }

    /**
     * 处理筛选变化
     */
    handleFilterChange() {
        this.filters.status = document.getElementById('statusFilter').value;
        this.filters.role = document.getElementById('roleFilter').value;
        this.filters.dateRange = document.getElementById('dateRangeFilter').value;
        this.currentPage = 1;
        this.loadUsers();
    }

    /**
     * 处理排序
     */
    handleSort(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'desc';
        }
        this.loadUsers();
    }

    /**
     * 跳转到指定页面
     */
    goToPage(page) {
        this.currentPage = page;
        this.loadUsers();
    }

    /**
     * 处理全选
     */
    handleSelectAll(checked) {
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.handleUserSelect();
    }

    /**
     * 处理用户选择
     */
    handleUserSelect() {
        const checkboxes = document.querySelectorAll('.user-checkbox:checked');
        this.selectedUsers.clear();
        
        checkboxes.forEach(checkbox => {
            this.selectedUsers.add(parseInt(checkbox.value));
        });

        const batchActions = document.getElementById('batchActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedUsers.size > 0) {
            batchActions.style.display = 'flex';
            selectedCount.textContent = this.selectedUsers.size;
        } else {
            batchActions.style.display = 'none';
        }

        // 更新全选状态
        const selectAllCheckbox = document.getElementById('selectAllUsers');
        const totalCheckboxes = document.querySelectorAll('.user-checkbox').length;
        selectAllCheckbox.indeterminate = this.selectedUsers.size > 0 && this.selectedUsers.size < totalCheckboxes;
        selectAllCheckbox.checked = this.selectedUsers.size === totalCheckboxes;
    }

    /**
     * 处理批量操作
     */
    async handleBatchAction(action) {
        if (this.selectedUsers.size === 0) {
            this.showMessage('请先选择要操作的用户', 'warning');
            return;
        }

        const actionText = {
            'activate': '激活',
            'suspend': '暂停',
            'delete': '删除'
        };

        if (!confirm(`确定要${actionText[action]}选中的 ${this.selectedUsers.size} 个用户吗？`)) {
            return;
        }

        try {
            const response = await fetch('/api/admin/users/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    action,
                    userIds: Array.from(this.selectedUsers)
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.selectedUsers.clear();
                document.getElementById('batchActions').style.display = 'none';
                this.loadUsers();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('批量操作失败:', error);
            this.showMessage('批量操作失败', 'error');
        }
    }

    /**
     * 查看用户详情
     */
    async viewUserDetail(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('获取用户详情失败');
            }

            const user = await response.json();
            this.renderUserDetail(user);
            this.showModal('userDetailModal');
            
        } catch (error) {
            console.error('获取用户详情失败:', error);
            this.showMessage('获取用户详情失败', 'error');
        }
    }

    /**
     * 渲染用户详情
     */
    async renderUserDetail(user) {
        const content = document.getElementById('userDetailContent');
        
        // 获取用户的交易记录和活动记录
        const [transactions, activities] = await Promise.all([
            this.getUserTransactions(user.id),
            this.getUserActivities(user.id)
        ]);

        content.innerHTML = DOMPurify.sanitize(`
            <div class="user-detail">
                <div class="user-basic-info">
                    <div class="user-avatar-large">
                        ${user.avatar ? `<img src="${user.avatar}" alt="${user.username}">` : 
                          `<i class="fas fa-user"></i>`}
                    </div>
                    <div class="user-info-details">
                        <h4>${user.username}</h4>
                        <p><i class="fas fa-envelope"></i> ${user.email}</p>
                        <p><i class="fas fa-phone"></i> ${user.phone || '未设置'}</p>
                        <p><i class="fas fa-calendar"></i> 注册时间：${this.formatDate(user.created_at)}</p>
                        <p><i class="fas fa-clock"></i> 最后登录：${user.last_login ? this.formatDate(user.last_login) : '从未登录'}</p>
                    </div>
                </div>

                <div class="user-stats-grid">
                    <div class="stat-item">
                        <h5>账户余额</h5>
                        <p class="stat-value">¥${user.balance.toFixed(2)}</p>
                    </div>
                    <div class="stat-item">
                        <h5>总收入</h5>
                        <p class="stat-value">¥${user.total_income.toFixed(2)}</p>
                    </div>
                    <div class="stat-item">
                        <h5>总支出</h5>
                        <p class="stat-value">¥${user.total_expense.toFixed(2)}</p>
                    </div>
                    <div class="stat-item">
                        <h5>登录次数</h5>
                        <p class="stat-value">${user.login_count}</p>
                    </div>
                </div>

                <div class="user-detail-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="transactions">交易记录</button>
                        <button class="tab-btn" data-tab="activities">活动记录</button>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-pane active" id="transactions">
                            <div class="transactions-list">
                                ${transactions.map(tx => `
                                    <div class="transaction-item">
                                        <div class="transaction-icon ${tx.type}">
                                            <i class="fas fa-${tx.type === 'income' ? 'plus' : 'minus'}"></i>
                                        </div>
                                        <div class="transaction-info">
                                            <h6>${tx.description}</h6>
                                            <p>${this.formatDate(tx.created_at)}</p>
                                        </div>
                                        <div class="transaction-amount ${tx.type}">
                                            ${tx.type === 'income' ? '+' : '-'}¥${tx.amount.toFixed(2)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="tab-pane" id="activities">
                            <div class="activities-list">
                                ${activities.map(activity => `
                                    <div class="activity-item">
                                        <div class="activity-icon">
                                            <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                                        </div>
                                        <div class="activity-info">
                                            <h6>${activity.description}</h6>
                                            <p>${this.formatDate(activity.created_at)}</p>
                                            <small>IP: ${activity.ip}</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // 绑定标签切换事件
        content.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // 切换按钮状态
                content.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 切换内容
                content.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                content.querySelector(`#${tabName}`).classList.add('active');
            });
        });
    }

    /**
     * 获取用户交易记录
     */
    async getUserTransactions(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/transactions`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error('获取交易记录失败:', error);
            return [];
        }
    }

    /**
     * 获取用户活动记录
     */
    async getUserActivities(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/activity-log`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.error('获取活动记录失败:', error);
            return [];
        }
    }

    /**
     * 显示用户表单（添加/编辑）
     */
    showUserForm(user = null) {
        const modal = document.getElementById('userFormModal');
        const title = document.getElementById('userFormTitle');
        const form = document.getElementById('userForm');
        const passwordGroup = document.getElementById('passwordGroup');

        if (user) {
            title.textContent = '编辑用户';
            passwordGroup.style.display = 'none';
            document.getElementById('password').required = false;
            
            // 填充表单数据
            form.username.value = user.username;
            form.email.value = user.email;
            form.phone.value = user.phone || '';
            form.role.value = user.role;
            form.balance.value = user.balance;
        } else {
            title.textContent = '添加用户';
            passwordGroup.style.display = 'block';
            document.getElementById('password').required = true;
            form.reset();
        }

        form.dataset.userId = user ? user.id : '';
        this.showModal('userFormModal');
    }

    /**
     * 处理用户表单提交
     */
    async handleUserFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());
        const userId = form.dataset.userId;
        
        try {
            const url = userId ? `/api/admin/users/${userId}` : '/api/admin/users';
            const method = userId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.closeModal('userFormModal');
                this.loadUsers();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('保存用户失败:', error);
            this.showMessage('保存用户失败', 'error');
        }
    }

    /**
     * 编辑用户
     */
    async editUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('获取用户信息失败');
            }

            const user = await response.json();
            this.showUserForm(user);
            
        } catch (error) {
            console.error('获取用户信息失败:', error);
            this.showMessage('获取用户信息失败', 'error');
        }
    }

    /**
     * 切换用户状态
     */
    async toggleUserStatus(userId, currentStatus) {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        const actionText = newStatus === 'active' ? '激活' : '暂停';
        
        if (!confirm(`确定要${actionText}该用户吗？`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.loadUsers();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('切换用户状态失败:', error);
            this.showMessage('切换用户状态失败', 'error');
        }
    }

    /**
     * 删除用户
     */
    async deleteUser(userId) {
        if (!confirm('确定要删除该用户吗？此操作不可恢复！')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.loadUsers();
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            this.showMessage('删除用户失败', 'error');
        }
    }

    /**
     * 导出用户数据
     */
    async exportUsers() {
        try {
            const response = await fetch('/api/admin/users/export', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                // 这里可以添加下载逻辑
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('导出用户数据失败:', error);
            this.showMessage('导出用户数据失败', 'error');
        }
    }

    /**
     * 显示模态框
     */
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    /**
     * 显示加载状态
     */
    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        // 这里可以使用现有的消息显示系统
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message); // 临时使用alert，可以替换为更好的消息组件
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusMap = {
            'active': '活跃',
            'inactive': '非活跃',
            'suspended': '已暂停',
            'banned': '已封禁'
        };
        return statusMap[status] || status;
    }

    /**
     * 获取角色文本
     */
    getRoleText(role) {
        const roleMap = {
            'user': '普通用户',
            'vip': 'VIP用户',
            'admin': '管理员'
        };
        return roleMap[role] || role;
    }

    /**
     * 获取活动图标
     */
    getActivityIcon(type) {
        const iconMap = {
            'login': 'sign-in-alt',
            'task': 'tasks',
            'redpacket': 'gift',
            'transaction': 'exchange-alt'
        };
        return iconMap[type] || 'circle';
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// 创建全局实例
const userManagement = new UserManagement();