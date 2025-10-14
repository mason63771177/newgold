/**
 * 高级用户管理模块
 * 提供用户详情页面、批量操作、用户行为分析、权限管理等功能
 */
class AdvancedUserManagement {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.selectedUsers = new Set();
        this.filters = {
            status: 'all',
            role: 'all',
            dateRange: 'all',
            searchTerm: ''
        };
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        
        this.init();
    }

    /**
     * 初始化用户管理模块
     */
    async init() {
        this.renderUserManagementPage();
        await this.loadUsers();
        this.bindEventListeners();
    }

    /**
     * 渲染用户管理页面
     */
    renderUserManagementPage() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="user-management-container">
                <!-- 页面标题 -->
                <div class="page-header">
                    <h2><i class="fas fa-users"></i> 高级用户管理</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="userManagement.showAddUserModal()">
                            <i class="fas fa-plus"></i> 添加用户
                        </button>
                        <button class="btn btn-success" onclick="userManagement.exportUsers()">
                            <i class="fas fa-download"></i> 导出数据
                        </button>
                    </div>
                </div>

                <!-- 搜索和筛选区域 -->
                <div class="filters-section">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>搜索用户</label>
                                <div class="input-group">
                                    <input type="text" id="searchInput" class="form-control" placeholder="用户名、邮箱、手机号">
                                    <div class="input-group-append">
                                        <button class="btn btn-outline-secondary" onclick="userManagement.searchUsers()">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="form-group">
                                <label>用户状态</label>
                                <select id="statusFilter" class="form-control">
                                    <option value="all">全部状态</option>
                                    <option value="active">活跃</option>
                                    <option value="inactive">未激活</option>
                                    <option value="suspended">已暂停</option>
                                    <option value="banned">已封禁</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="form-group">
                                <label>用户角色</label>
                                <select id="roleFilter" class="form-control">
                                    <option value="all">全部角色</option>
                                    <option value="user">普通用户</option>
                                    <option value="vip">VIP用户</option>
                                    <option value="admin">管理员</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>注册时间</label>
                                <select id="dateRangeFilter" class="form-control">
                                    <option value="all">全部时间</option>
                                    <option value="today">今天</option>
                                    <option value="week">本周</option>
                                    <option value="month">本月</option>
                                    <option value="quarter">本季度</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="form-group">
                                <label>&nbsp;</label>
                                <button class="btn btn-info btn-block" onclick="userManagement.resetFilters()">
                                    <i class="fas fa-refresh"></i> 重置
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 批量操作区域 -->
                <div class="batch-actions" id="batchActions" style="display: none;">
                    <div class="selected-info">
                        已选择 <span id="selectedCount">0</span> 个用户
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-warning" onclick="userManagement.batchSuspend()">
                            <i class="fas fa-pause"></i> 批量暂停
                        </button>
                        <button class="btn btn-success" onclick="userManagement.batchActivate()">
                            <i class="fas fa-play"></i> 批量激活
                        </button>
                        <button class="btn btn-danger" onclick="userManagement.batchDelete()">
                            <i class="fas fa-trash"></i> 批量删除
                        </button>
                        <button class="btn btn-info" onclick="userManagement.batchExport()">
                            <i class="fas fa-download"></i> 导出选中
                        </button>
                    </div>
                </div>

                <!-- 用户列表 -->
                <div class="users-table-container">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th width="40">
                                    <input type="checkbox" id="selectAll" onchange="userManagement.toggleSelectAll()">
                                </th>
                                <th onclick="userManagement.sortBy('id')" class="sortable">
                                    ID <i class="fas fa-sort"></i>
                                </th>
                                <th onclick="userManagement.sortBy('username')" class="sortable">
                                    用户名 <i class="fas fa-sort"></i>
                                </th>
                                <th>邮箱</th>
                                <th>手机号</th>
                                <th onclick="userManagement.sortBy('status')" class="sortable">
                                    状态 <i class="fas fa-sort"></i>
                                </th>
                                <th onclick="userManagement.sortBy('balance')" class="sortable">
                                    余额 <i class="fas fa-sort"></i>
                                </th>
                                <th onclick="userManagement.sortBy('created_at')" class="sortable">
                                    注册时间 <i class="fas fa-sort"></i>
                                </th>
                                <th onclick="userManagement.sortBy('last_login')" class="sortable">
                                    最后登录 <i class="fas fa-sort"></i>
                                </th>
                                <th width="200">操作</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <!-- 用户数据将在这里动态加载 -->
                        </tbody>
                    </table>
                </div>

                <!-- 分页 -->
                <div class="pagination-container" id="paginationContainer">
                    <!-- 分页控件将在这里动态生成 -->
                </div>

                <!-- 用户统计卡片 -->
                <div class="user-stats-cards">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon bg-primary">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="stat-content">
                                    <h3 id="totalUsersCount">0</h3>
                                    <p>总用户数</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon bg-success">
                                    <i class="fas fa-user-check"></i>
                                </div>
                                <div class="stat-content">
                                    <h3 id="activeUsersCount">0</h3>
                                    <p>活跃用户</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon bg-warning">
                                    <i class="fas fa-user-plus"></i>
                                </div>
                                <div class="stat-content">
                                    <h3 id="newUsersCount">0</h3>
                                    <p>新增用户(本月)</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon bg-info">
                                    <i class="fas fa-coins"></i>
                                </div>
                                <div class="stat-content">
                                    <h3 id="totalBalanceSum">¥0</h3>
                                    <p>总余额</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 用户详情模态框 -->
            <div class="modal fade" id="userDetailModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">用户详情</h5>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="userDetailContent">
                            <!-- 用户详情内容将在这里动态加载 -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- 添加用户模态框 -->
            <div class="modal fade" id="addUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">添加新用户</h5>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="addUserForm">
                                <div class="form-group">
                                    <label>用户名 *</label>
                                    <input type="text" name="username" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>邮箱 *</label>
                                    <input type="email" name="email" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>手机号</label>
                                    <input type="tel" name="phone" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>密码 *</label>
                                    <input type="password" name="password" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>用户角色</label>
                                    <select name="role" class="form-control">
                                        <option value="user">普通用户</option>
                                        <option value="vip">VIP用户</option>
                                        <option value="admin">管理员</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>初始余额</label>
                                    <input type="number" name="balance" class="form-control" value="0" min="0" step="0.01">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="userManagement.addUser()">添加用户</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 加载用户数据
     */
    async loadUsers() {
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

            if (response.ok) {
                const data = await response.json();
                this.renderUsersTable(data.users);
                this.renderPagination(data.pagination);
                this.updateUserStats(data.stats);
            }
        } catch (error) {
            console.error('加载用户数据失败:', error);
            this.showError('加载用户数据失败');
        }
    }

    /**
     * 渲染用户表格
     */
    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-users fa-3x text-muted"></i>
                            <p class="mt-3">暂无用户数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <input type="checkbox" class="user-checkbox" value="${user.id}" 
                           onchange="userManagement.toggleUserSelection(${user.id})">
                </td>
                <td>${user.id}</td>
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || '/default-avatar.png'}" class="user-avatar" alt="头像">
                        <span>${user.username}</span>
                    </div>
                </td>
                <td>${user.email || '-'}</td>
                <td>${user.phone || '-'}</td>
                <td>
                    <span class="badge badge-${this.getStatusColor(user.status)}">
                        ${this.getStatusText(user.status)}
                    </span>
                </td>
                <td>¥${(user.balance || 0).toLocaleString()}</td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>${user.last_login ? this.formatDate(user.last_login) : '从未登录'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="userManagement.showUserDetail(${user.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="userManagement.editUser(${user.id})" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-${user.status === 'active' ? 'secondary' : 'success'}" 
                                onclick="userManagement.toggleUserStatus(${user.id})" 
                                title="${user.status === 'active' ? '暂停' : '激活'}">
                            <i class="fas fa-${user.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="userManagement.deleteUser(${user.id})" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 渲染分页控件
     */
    renderPagination(pagination) {
        const container = document.getElementById('paginationContainer');
        
        if (!pagination || pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const { currentPage, totalPages, totalItems } = pagination;
        
        let paginationHtml = `
            <div class="pagination-info">
                显示第 ${(currentPage - 1) * this.pageSize + 1} - ${Math.min(currentPage * this.pageSize, totalItems)} 条，
                共 ${totalItems} 条记录
            </div>
            <nav>
                <ul class="pagination">
        `;

        // 上一页
        paginationHtml += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="userManagement.goToPage(${currentPage - 1})">上一页</a>
            </li>
        `;

        // 页码
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="userManagement.goToPage(1)">1</a></li>`;
            if (startPage > 2) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="userManagement.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="userManagement.goToPage(${totalPages})">${totalPages}</a></li>`;
        }

        // 下一页
        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="userManagement.goToPage(${currentPage + 1})">下一页</a>
            </li>
        `;

        paginationHtml += `
                </ul>
            </nav>
        `;

        container.innerHTML = paginationHtml;
    }

    /**
     * 更新用户统计信息
     */
    updateUserStats(stats) {
        document.getElementById('totalUsersCount').textContent = stats.totalUsers || 0;
        document.getElementById('activeUsersCount').textContent = stats.activeUsers || 0;
        document.getElementById('newUsersCount').textContent = stats.newUsers || 0;
        document.getElementById('totalBalanceSum').textContent = `¥${(stats.totalBalance || 0).toLocaleString()}`;
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 搜索输入框回车事件
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchUsers();
            }
        });

        // 筛选器变化事件
        ['statusFilter', 'roleFilter', 'dateRangeFilter'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    /**
     * 搜索用户
     */
    searchUsers() {
        this.filters.searchTerm = document.getElementById('searchInput').value.trim();
        this.currentPage = 1;
        this.loadUsers();
    }

    /**
     * 应用筛选器
     */
    applyFilters() {
        this.filters.status = document.getElementById('statusFilter').value;
        this.filters.role = document.getElementById('roleFilter').value;
        this.filters.dateRange = document.getElementById('dateRangeFilter').value;
        this.currentPage = 1;
        this.loadUsers();
    }

    /**
     * 重置筛选器
     */
    resetFilters() {
        this.filters = {
            status: 'all',
            role: 'all',
            dateRange: 'all',
            searchTerm: ''
        };
        
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('roleFilter').value = 'all';
        document.getElementById('dateRangeFilter').value = 'all';
        
        this.currentPage = 1;
        this.loadUsers();
    }

    /**
     * 排序
     */
    sortBy(field) {
        if (this.sortBy === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortOrder = 'asc';
        }
        this.loadUsers();
    }

    /**
     * 跳转到指定页面
     */
    goToPage(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadUsers();
    }

    /**
     * 切换用户选择状态
     */
    toggleUserSelection(userId) {
        if (this.selectedUsers.has(userId)) {
            this.selectedUsers.delete(userId);
        } else {
            this.selectedUsers.add(userId);
        }
        this.updateBatchActions();
    }

    /**
     * 全选/取消全选
     */
    toggleSelectAll() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.user-checkbox');
        
        if (selectAll.checked) {
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                this.selectedUsers.add(parseInt(checkbox.value));
            });
        } else {
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                this.selectedUsers.delete(parseInt(checkbox.value));
            });
        }
        
        this.updateBatchActions();
    }

    /**
     * 更新批量操作区域
     */
    updateBatchActions() {
        const batchActions = document.getElementById('batchActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedUsers.size > 0) {
            batchActions.style.display = 'flex';
            selectedCount.textContent = this.selectedUsers.size;
        } else {
            batchActions.style.display = 'none';
        }
    }

    /**
     * 显示用户详情
     */
    async showUserDetail(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                this.renderUserDetail(user);
                $('#userDetailModal').modal('show');
            }
        } catch (error) {
            console.error('加载用户详情失败:', error);
            this.showError('加载用户详情失败');
        }
    }

    /**
     * 渲染用户详情
     */
    renderUserDetail(user) {
        const content = document.getElementById('userDetailContent');
        content.innerHTML = `
            <div class="user-detail-tabs">
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-toggle="tab" href="#basicInfo">基本信息</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-toggle="tab" href="#walletInfo">钱包信息</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-toggle="tab" href="#activityLog">活动记录</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-toggle="tab" href="#behaviorAnalysis">行为分析</a>
                    </li>
                </ul>
                
                <div class="tab-content mt-3">
                    <!-- 基本信息 -->
                    <div class="tab-pane active" id="basicInfo">
                        <div class="row">
                            <div class="col-md-4 text-center">
                                <img src="${user.avatar || '/default-avatar.png'}" class="user-detail-avatar" alt="头像">
                                <h5 class="mt-2">${user.username}</h5>
                                <span class="badge badge-${this.getStatusColor(user.status)}">
                                    ${this.getStatusText(user.status)}
                                </span>
                            </div>
                            <div class="col-md-8">
                                <table class="table table-borderless">
                                    <tr><td><strong>用户ID:</strong></td><td>${user.id}</td></tr>
                                    <tr><td><strong>邮箱:</strong></td><td>${user.email || '-'}</td></tr>
                                    <tr><td><strong>手机号:</strong></td><td>${user.phone || '-'}</td></tr>
                                    <tr><td><strong>用户角色:</strong></td><td>${this.getRoleText(user.role)}</td></tr>
                                    <tr><td><strong>注册时间:</strong></td><td>${this.formatDate(user.created_at)}</td></tr>
                                    <tr><td><strong>最后登录:</strong></td><td>${user.last_login ? this.formatDate(user.last_login) : '从未登录'}</td></tr>
                                    <tr><td><strong>登录次数:</strong></td><td>${user.login_count || 0}</td></tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 钱包信息 -->
                    <div class="tab-pane" id="walletInfo">
                        <div class="wallet-summary">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="wallet-card">
                                        <h6>当前余额</h6>
                                        <h4 class="text-success">¥${(user.balance || 0).toLocaleString()}</h4>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="wallet-card">
                                        <h6>累计收入</h6>
                                        <h4 class="text-info">¥${(user.total_income || 0).toLocaleString()}</h4>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="wallet-card">
                                        <h6>累计支出</h6>
                                        <h4 class="text-warning">¥${(user.total_expense || 0).toLocaleString()}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <h6 class="mt-4">最近交易记录</h6>
                        <div class="transaction-list" id="userTransactions">
                            <!-- 交易记录将在这里动态加载 -->
                        </div>
                    </div>
                    
                    <!-- 活动记录 -->
                    <div class="tab-pane" id="activityLog">
                        <div class="activity-timeline" id="userActivityLog">
                            <!-- 活动记录将在这里动态加载 -->
                        </div>
                    </div>
                    
                    <!-- 行为分析 -->
                    <div class="tab-pane" id="behaviorAnalysis">
                        <div class="behavior-charts">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="chart-container">
                                        <h6>活跃度趋势</h6>
                                        <canvas id="userActivityChart"></canvas>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="chart-container">
                                        <h6>任务完成情况</h6>
                                        <canvas id="userTaskChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 加载用户的详细数据
        this.loadUserTransactions(user.id);
        this.loadUserActivityLog(user.id);
        this.loadUserBehaviorAnalysis(user.id);
    }

    /**
     * 获取状态颜色
     */
    getStatusColor(status) {
        const colors = {
            'active': 'success',
            'inactive': 'secondary',
            'suspended': 'warning',
            'banned': 'danger'
        };
        return colors[status] || 'secondary';
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const texts = {
            'active': '活跃',
            'inactive': '未激活',
            'suspended': '已暂停',
            'banned': '已封禁'
        };
        return texts[status] || '未知';
    }

    /**
     * 获取角色文本
     */
    getRoleText(role) {
        const texts = {
            'user': '普通用户',
            'vip': 'VIP用户',
            'admin': '管理员'
        };
        return texts[role] || '未知';
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        // 这里可以使用 toast 或其他通知组件
        alert(message);
    }

    /**
     * 显示成功信息
     */
    showSuccess(message) {
        // 这里可以使用 toast 或其他通知组件
        alert(message);
    }
}

// 创建全局实例
let userManagement;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin') && 
        document.getElementById('content')) {
        userManagement = new AdvancedUserManagement();
    }
});