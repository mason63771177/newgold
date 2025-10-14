/**
 * 主应用程序文件 - Main Application
 * 基于Context7 MCP标准的后台管理系统
 * 整合所有组件和功能模块，提供应用程序的核心逻辑
 */
class AdminApp {
    constructor() {
        this.name = 'AdminApp';
        this.version = '1.0.0';
        this.initialized = false;
        this.components = new Map();
        this.currentPage = 'dashboard';
        this.config = null;
        this.router = null;
        this.state = {
            user: null,
            permissions: [],
            theme: 'light',
            sidebarCollapsed: false,
            loading: false
        };
    }

    /**
     * 初始化应用程序
     */
    async init() {
        try {
            console.log('开始初始化后台管理系统...');
            
            // 显示加载状态
            this.showInitialLoading();
            
            // 1. 初始化配置加载器
            await this.initConfigLoader();
            
            // 2. 初始化API客户端
            await this.initApiClient();
            
            // 3. 初始化事件总线
            await this.initEventBus();
            
            // 4. 初始化核心组件
            await this.initCoreComponents();
            
            // 5. 初始化路由系统
            await this.initRouter();
            
            // 6. 初始化用户认证
            await this.initAuth();
            
            // 7. 绑定全局事件
            await this.bindGlobalEvents();
            
            // 8. 启动应用程序
            await this.start();
            
            this.initialized = true;
            console.log('后台管理系统初始化完成');
            
            // 隐藏加载状态
            this.hideInitialLoading();
            
            // 发布初始化完成事件
            window.EventBus.emit('app:initialized', this);
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.handleInitError(error);
        }
    }

    /**
     * 显示初始加载状态
     */
    showInitialLoading() {
        const loadingElement = document.getElementById('loading-screen');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    /**
     * 隐藏初始加载状态
     */
    hideInitialLoading() {
        const loadingElement = document.getElementById('loading-screen');
        if (loadingElement) {
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 500);
        }
    }

    /**
     * 初始化配置加载器
     */
    async initConfigLoader() {
        if (!window.ConfigLoader) {
            throw new Error('ConfigLoader未找到');
        }
        
        await window.ConfigLoader.init();
        this.config = window.ConfigLoader.get('admin');
        
        if (!this.config) {
            throw new Error('管理配置加载失败');
        }
        
        console.log('配置加载器初始化完成');
    }

    /**
     * 初始化API客户端
     */
    async initApiClient() {
        if (!window.ApiClient) {
            throw new Error('ApiClient未找到');
        }
        
        await window.ApiClient.init();
        console.log('API客户端初始化完成');
    }

    /**
     * 初始化事件总线
     */
    async initEventBus() {
        if (!window.EventBus) {
            throw new Error('EventBus未找到');
        }
        
        // 设置全局错误处理
        window.EventBus.setupGlobalErrorHandling();
        console.log('事件总线初始化完成');
    }

    /**
     * 初始化核心组件
     */
    async initCoreComponents() {
        const componentList = [
            { name: 'Navigation', selector: '#sidebar' },
            { name: 'Breadcrumb', selector: '#breadcrumb' },
            { name: 'PageLoader', selector: '#page-loader-container' },
            { name: 'Notification', selector: '#notification-container' },
            { name: 'Modal', selector: '#modal-container' }
        ];

        for (const componentConfig of componentList) {
            try {
                const component = window[componentConfig.name];
                
                if (!component) {
                    console.warn(`组件 ${componentConfig.name} 未找到`);
                    continue;
                }

                // 检查容器是否存在
                const container = document.querySelector(componentConfig.selector);
                if (!container) {
                    console.warn(`组件 ${componentConfig.name} 容器 ${componentConfig.selector} 不存在`);
                    continue;
                }

                await component.init();
                await component.mount(container);
                
                this.components.set(componentConfig.name, component);
                console.log(`组件 ${componentConfig.name} 初始化完成`);
                
            } catch (error) {
                console.error(`组件 ${componentConfig.name} 初始化失败:`, error);
            }
        }
    }

    /**
     * 初始化路由系统
     */
    async initRouter() {
        this.router = {
            routes: new Map(),
            currentRoute: null,
            
            // 注册路由
            register: (path, handler) => {
                this.router.routes.set(path, handler);
            },
            
            // 导航到指定路由
            navigate: async (path, params = {}) => {
                const handler = this.router.routes.get(path);
                
                if (handler) {
                    this.router.currentRoute = { path, params };
                    await handler(params);
                    window.EventBus.emit('route:change', path, params);
                } else {
                    console.warn(`路由 ${path} 未找到`);
                }
            },
            
            // 获取当前路由
            getCurrentRoute: () => {
                return this.router.currentRoute;
            }
        };

        // 注册默认路由
        this.registerDefaultRoutes();
        
        console.log('路由系统初始化完成');
    }

    /**
     * 注册默认路由
     */
    registerDefaultRoutes() {
        // 仪表盘路由
        this.router.register('dashboard', async (params) => {
            await this.loadPage('dashboard', '仪表盘');
        });

        // 用户管理路由
        this.router.register('users', async (params) => {
            await this.loadPage('users', '用户管理');
        });

        // 钱包管理路由
        this.router.register('wallet', async (params) => {
            await this.loadPage('wallet', '钱包管理');
        });

        // 交易记录路由
        this.router.register('transactions', async (params) => {
            await this.loadPage('transactions', '交易记录');
        });

        // 任务管理路由
        this.router.register('tasks', async (params) => {
            await this.loadPage('tasks', '任务管理');
        });

        // 红包管理路由
        this.router.register('red-packets', async (params) => {
            await this.loadPage('red-packets', '红包管理');
        });

        // 团队管理路由
        this.router.register('teams', async (params) => {
            await this.loadPage('teams', '团队管理');
        });

        // 系统监控路由
        this.router.register('system-monitoring', async (params) => {
            await this.loadPage('system-monitoring', '系统监控');
        });

        // 数据备份路由
        this.router.register('data-backup', async (params) => {
            await this.loadPage('data-backup', '数据备份');
        });
    }

    /**
     * 初始化用户认证
     */
    async initAuth() {
        try {
            // 检查本地存储的认证信息
            const token = localStorage.getItem('admin_token');
            
            if (token) {
                // 验证token有效性
                const response = await window.ApiClient.get('/auth/verify');
                
                if (response.success) {
                    this.state.user = response.data.user;
                    this.state.permissions = response.data.permissions || [];
                    
                    console.log('用户认证成功:', this.state.user);
                } else {
                    // token无效，清除本地存储
                    localStorage.removeItem('admin_token');
                    this.redirectToLogin();
                }
            } else {
                // 没有token，重定向到登录页
                this.redirectToLogin();
            }
            
        } catch (error) {
            console.error('用户认证失败:', error);
            this.redirectToLogin();
        }
    }

    /**
     * 重定向到登录页
     */
    redirectToLogin() {
        // 这里可以重定向到登录页面
        // 暂时显示登录提示
        window.Notification.warning('请先登录系统', {
            title: '未登录',
            persistent: true,
            actions: [
                {
                    text: '登录',
                    type: 'primary',
                    action: 'login',
                    handler: () => {
                        this.showLoginModal();
                    }
                }
            ]
        });
    }

    /**
     * 显示登录模态框
     */
    showLoginModal() {
        window.Modal.show({
            title: '管理员登录',
            size: 'small',
            template: `
                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <input type="text" id="username" name="username" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-check">
                            <input type="checkbox" name="remember" class="form-check-input">
                            <span class="form-check-label">记住我</span>
                        </label>
                    </div>
                </form>
            `,
            buttons: [
                {
                    text: '取消',
                    type: 'secondary',
                    action: 'cancel'
                },
                {
                    text: '登录',
                    type: 'primary',
                    action: 'login',
                    handler: async (modalId) => {
                        const form = document.getElementById('login-form');
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        
                        try {
                            const response = await window.ApiClient.post('/auth/login', data);
                            
                            if (response.success) {
                                // 保存token
                                localStorage.setItem('admin_token', response.data.token);
                                
                                // 更新用户状态
                                this.state.user = response.data.user;
                                this.state.permissions = response.data.permissions || [];
                                
                                window.Notification.success('登录成功');
                                
                                // 重新初始化应用
                                await this.start();
                                
                                return true; // 关闭模态框
                            } else {
                                window.Notification.error(response.message || '登录失败');
                                return false; // 不关闭模态框
                            }
                        } catch (error) {
                            window.Notification.error('登录失败，请稍后重试');
                            return false;
                        }
                    }
                }
            ],
            closable: false,
            backdrop: 'static'
        });
    }

    /**
     * 绑定全局事件
     */
    async bindGlobalEvents() {
        // 导航变化事件
        window.EventBus.on('navigation:change', this.handleNavigationChange.bind(this));
        
        // 页面变化事件
        window.EventBus.on('page:change', this.handlePageChange.bind(this));
        
        // 用户登出事件
        window.EventBus.on('user:logout', this.handleUserLogout.bind(this));
        
        // 主题变化事件
        window.EventBus.on('theme:change', this.handleThemeChange.bind(this));
        
        // 侧边栏切换事件
        window.EventBus.on('sidebar:toggle', this.handleSidebarToggle.bind(this));
        
        // 窗口大小变化事件
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        
        // 页面可见性变化事件
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        console.log('全局事件绑定完成');
    }

    /**
     * 启动应用程序
     */
    async start() {
        try {
            // 加载默认页面
            await this.router.navigate(this.currentPage);
            
            // 更新UI状态
            this.updateUIState();
            
            // 启动定时任务
            this.startPeriodicTasks();
            
            console.log('应用程序启动完成');
            
        } catch (error) {
            console.error('应用程序启动失败:', error);
            throw error;
        }
    }

    /**
     * 加载页面
     * @param {string} pageName - 页面名称
     * @param {string} pageTitle - 页面标题
     */
    async loadPage(pageName, pageTitle) {
        try {
            // 显示页面加载状态
            this.showLoader();
            
            // 更新当前页面
            this.currentPage = pageName;
            
            // 更新面包屑
            window.EventBus.emit('navigation:change', pageName, pageTitle);
            
            // 加载页面内容
            const pageContent = await this.loadPageContent(pageName);
            
            // 更新页面内容
            const contentElement = document.getElementById('page-container');
            if (contentElement) {
                contentElement.innerHTML = pageContent;
            }
            
            // 初始化页面特定的功能
            await this.initPageFeatures(pageName);
            
            // 隐藏页面加载状态
            this.hideLoader();
            
            // 发布页面变化事件
            window.EventBus.emit('page:change', pageName, pageTitle);
            
        } catch (error) {
            console.error('页面加载失败:', error);
            this.hideLoader();
            this.showError('页面加载失败，请稍后重试');
        }
    }

    /**
     * 加载页面内容
     * @param {string} pageName - 页面名称
     */
    async loadPageContent(pageName) {
        // 这里可以从服务器加载页面模板
        // 暂时返回默认内容
        const pageTemplates = {
            dashboard: this.getDashboardTemplate(),
            users: this.getUsersTemplate(),
            wallet: this.getWalletTemplate(),
            transactions: this.getTransactionsTemplate(),
            tasks: this.getTasksTemplate(),
            'red-packets': this.getRedPacketsTemplate(),
            teams: this.getTeamsTemplate(),
            'system-monitoring': this.getSystemMonitoringTemplate(),
            'data-backup': this.getDataBackupTemplate()
        };

        return pageTemplates[pageName] || this.getDefaultPageTemplate(pageName);
    }

    /**
     * 显示加载状态
     */
    showLoader() {
        const loader = document.getElementById('page-loader-container');
        if (loader) {
            loader.innerHTML = `
                <div class="page-loader">
                    <div class="loader-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="loader-text">加载中...</div>
                </div>
            `;
            loader.style.display = 'flex';
        }
    }

    /**
     * 隐藏加载状态
     */
    hideLoader() {
        const loader = document.getElementById('page-loader-container');
        if (loader) {
            loader.style.display = 'none';
            loader.innerHTML = '';
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        if (window.Notification && window.Notification.error) {
            window.Notification.error(message);
        } else {
            alert(message);
        }
    }

    /**
     * 获取用户管理模板
     */
    getUsersTemplate() {
        return `
            <div class="users-page">
                <div class="page-header">
                    <h1 class="page-title">用户管理</h1>
                    <p class="page-description">系统用户信息管理</p>
                </div>
                
                <div class="users-stats">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">1,234</div>
                                    <div class="stat-label">总用户数</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-user-check"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">987</div>
                                    <div class="stat-label">活跃用户</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-user-plus"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">56</div>
                                    <div class="stat-label">今日新增</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-user-times"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">12</div>
                                    <div class="stat-label">禁用用户</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">用户列表</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>用户ID</th>
                                        <th>用户名</th>
                                        <th>邮箱</th>
                                        <th>状态</th>
                                        <th>注册时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="6" class="text-center">
                                            <div class="loading-placeholder">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                加载中...
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取仪表盘模板
     */
    getDashboardTemplate() {
        return `
            <div class="dashboard-page">
                <div class="page-header">
                    <h1 class="page-title">
                        <i class="fas fa-tachometer-alt"></i>
                        系统仪表盘
                    </h1>
                    <p class="page-description">实时监控系统运行状态和关键指标</p>
                </div>
                
                <!-- 统计卡片区域 -->
                <div class="dashboard-stats">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-card stat-card-primary">
                                <div class="stat-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number" id="total-users">1,234</div>
                                    <div class="stat-label">总用户数</div>
                                    <div class="stat-change positive">
                                        <i class="fas fa-arrow-up"></i> +12%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card stat-card-success">
                                <div class="stat-icon">
                                    <i class="fas fa-wallet"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number" id="total-balance">¥56,789</div>
                                    <div class="stat-label">总余额</div>
                                    <div class="stat-change positive">
                                        <i class="fas fa-arrow-up"></i> +8.5%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card stat-card-warning">
                                <div class="stat-icon">
                                    <i class="fas fa-exchange-alt"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number" id="today-transactions">89</div>
                                    <div class="stat-label">今日交易</div>
                                    <div class="stat-change positive">
                                        <i class="fas fa-arrow-up"></i> +15%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card stat-card-danger">
                                <div class="stat-icon">
                                    <i class="fas fa-gift"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number" id="active-redpackets">23</div>
                                    <div class="stat-label">活跃红包</div>
                                    <div class="stat-change negative">
                                        <i class="fas fa-arrow-down"></i> -3%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 图表和活动区域 -->
                <div class="dashboard-content">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="dashboard-card">
                                <div class="card-header">
                                    <h3 class="card-title">
                                        <i class="fas fa-chart-line"></i>
                                        用户增长趋势
                                    </h3>
                                    <div class="card-actions">
                                        <select class="form-select">
                                            <option>最近7天</option>
                                            <option>最近30天</option>
                                            <option>最近90天</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="chart-container">
                                        <canvas id="user-growth-chart" width="400" height="200"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="dashboard-card">
                                <div class="card-header">
                                    <h3 class="card-title">
                                        <i class="fas fa-clock"></i>
                                        实时活动
                                    </h3>
                                </div>
                                <div class="card-body">
                                    <div class="activity-list">
                                        <div class="activity-item">
                                            <div class="activity-icon success">
                                                <i class="fas fa-user-plus"></i>
                                            </div>
                                            <div class="activity-content">
                                                <div class="activity-text">新用户注册</div>
                                                <div class="activity-time">2分钟前</div>
                                            </div>
                                        </div>
                                        <div class="activity-item">
                                            <div class="activity-icon warning">
                                                <i class="fas fa-exchange-alt"></i>
                                            </div>
                                            <div class="activity-content">
                                                <div class="activity-text">用户提现 ¥500</div>
                                                <div class="activity-time">5分钟前</div>
                                            </div>
                                        </div>
                                        <div class="activity-item">
                                            <div class="activity-icon primary">
                                                <i class="fas fa-gift"></i>
                                            </div>
                                            <div class="activity-content">
                                                <div class="activity-text">红包被抢夺</div>
                                                <div class="activity-time">8分钟前</div>
                                            </div>
                                        </div>
                                        <div class="activity-item">
                                            <div class="activity-icon success">
                                                <i class="fas fa-tasks"></i>
                                            </div>
                                            <div class="activity-content">
                                                <div class="activity-text">任务完成</div>
                                                <div class="activity-time">12分钟前</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 快捷操作区域 -->
                <div class="dashboard-actions">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="dashboard-card">
                                <div class="card-header">
                                    <h3 class="card-title">
                                        <i class="fas fa-bolt"></i>
                                        快捷操作
                                    </h3>
                                </div>
                                <div class="card-body">
                                    <div class="quick-actions">
                                        <button class="action-btn action-btn-primary" onclick="window.AdminApp.loadPage('users', '用户管理')">
                                            <i class="fas fa-users"></i>
                                            <span>用户管理</span>
                                        </button>
                                        <button class="action-btn action-btn-success" onclick="window.AdminApp.loadPage('wallet', '钱包管理')">
                                            <i class="fas fa-wallet"></i>
                                            <span>钱包管理</span>
                                        </button>
                                        <button class="action-btn action-btn-warning" onclick="window.AdminApp.loadPage('transactions', '交易记录')">
                                            <i class="fas fa-exchange-alt"></i>
                                            <span>交易记录</span>
                                        </button>
                                        <button class="action-btn action-btn-info" onclick="window.AdminApp.loadPage('tasks', '任务管理')">
                                            <i class="fas fa-tasks"></i>
                                            <span>任务管理</span>
                                        </button>
                                        <button class="action-btn action-btn-danger" onclick="window.AdminApp.loadPage('red-packets', '红包管理')">
                                            <i class="fas fa-gift"></i>
                                            <span>红包管理</span>
                                        </button>
                                        <button class="action-btn action-btn-secondary" onclick="window.AdminApp.loadPage('teams', '团队管理')">
                                            <i class="fas fa-users-cog"></i>
                                            <span>团队管理</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 系统状态区域 -->
                <div class="dashboard-status">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="dashboard-card">
                                <div class="card-header">
                                    <h3 class="card-title">
                                        <i class="fas fa-server"></i>
                                        系统状态
                                    </h3>
                                </div>
                                <div class="card-body">
                                    <div class="status-list">
                                        <div class="status-item">
                                            <div class="status-label">服务器状态</div>
                                            <div class="status-value status-online">
                                                <i class="fas fa-circle"></i> 正常运行
                                            </div>
                                        </div>
                                        <div class="status-item">
                                            <div class="status-label">数据库连接</div>
                                            <div class="status-value status-online">
                                                <i class="fas fa-circle"></i> 连接正常
                                            </div>
                                        </div>
                                        <div class="status-item">
                                            <div class="status-label">API响应时间</div>
                                            <div class="status-value status-warning">
                                                <i class="fas fa-circle"></i> 125ms
                                            </div>
                                        </div>
                                        <div class="status-item">
                                            <div class="status-label">内存使用率</div>
                                            <div class="status-value status-online">
                                                <i class="fas fa-circle"></i> 68%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="dashboard-card">
                                <div class="card-header">
                                    <h3 class="card-title">
                                        <i class="fas fa-chart-pie"></i>
                                        用户分布
                                    </h3>
                                </div>
                                <div class="card-body">
                                    <div class="distribution-chart">
                                        <canvas id="user-distribution-chart" width="300" height="200"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取钱包管理模板
     */
    getWalletTemplate() {
        return `
            <div class="wallet-page">
                <div class="page-header">
                    <h1 class="page-title">钱包管理</h1>
                    <p class="page-description">用户钱包余额和交易管理</p>
                </div>
                
                <div class="wallet-stats">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-coins"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">¥123,456</div>
                                    <div class="stat-label">总余额</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-arrow-up"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">¥12,345</div>
                                    <div class="stat-label">今日充值</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-arrow-down"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">¥5,678</div>
                                    <div class="stat-label">今日提现</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">钱包列表</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>用户ID</th>
                                        <th>用户名</th>
                                        <th>余额</th>
                                        <th>冻结金额</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="6" class="text-center">
                                            <div class="loading-placeholder">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                加载中...
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取交易记录模板
     */
    getTransactionsTemplate() {
        return `
            <div class="transactions-page">
                <div class="page-header">
                    <h1 class="page-title">交易记录</h1>
                    <p class="page-description">所有交易记录和流水管理</p>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>交易ID</th>
                                        <th>用户</th>
                                        <th>类型</th>
                                        <th>金额</th>
                                        <th>状态</th>
                                        <th>时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="7" class="text-center">
                                            <div class="loading-placeholder">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                加载中...
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取任务管理模板
     */
    getTasksTemplate() {
        return `
            <div class="tasks-page">
                <div class="page-header">
                    <h1 class="page-title">任务管理</h1>
                    <p class="page-description">系统任务配置和管理</p>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>任务ID</th>
                                        <th>任务名称</th>
                                        <th>奖励</th>
                                        <th>状态</th>
                                        <th>完成人数</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="6" class="text-center">
                                            <div class="loading-placeholder">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                加载中...
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取红包管理模板
     */
    getRedPacketsTemplate() {
        return `
            <div class="red-packets-page">
                <div class="page-header">
                    <h1 class="page-title">红包管理</h1>
                    <p class="page-description">红包活动配置和统计</p>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>红包ID</th>
                                        <th>总金额</th>
                                        <th>剩余金额</th>
                                        <th>参与人数</th>
                                        <th>状态</th>
                                        <th>时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="7" class="text-center">
                                            <div class="loading-placeholder">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                加载中...
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取团队管理模板
     */
    getTeamsTemplate() {
        return `
            <div class="teams-page">
                <div class="page-header">
                    <h1 class="page-title">团队管理</h1>
                    <p class="page-description">用户团队和邀请关系管理</p>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>团队ID</th>
                                        <th>团队长</th>
                                        <th>成员数量</th>
                                        <th>总收益</th>
                                        <th>状态</th>
                                        <th>创建时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="7" class="text-center">
                                            <div class="loading-placeholder">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                加载中...
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取系统监控模板
     */
    getSystemMonitoringTemplate() {
        return `
            <div class="system-monitoring-page">
                <div class="page-header">
                    <h1 class="page-title">系统监控</h1>
                    <p class="page-description">系统性能和运行状态监控</p>
                </div>
                
                <div class="monitoring-stats">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-server"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">98.5%</div>
                                    <div class="stat-label">系统可用性</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-memory"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">65%</div>
                                    <div class="stat-label">内存使用率</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-microchip"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">45%</div>
                                    <div class="stat-label">CPU使用率</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon">
                                    <i class="fas fa-hdd"></i>
                                </div>
                                <div class="stat-content">
                                    <div class="stat-number">78%</div>
                                    <div class="stat-label">磁盘使用率</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">系统日志</h5>
                    </div>
                    <div class="card-body">
                        <div class="log-container">
                            <div class="log-entry">
                                <span class="log-time">2024-01-01 12:00:00</span>
                                <span class="log-level info">INFO</span>
                                <span class="log-message">系统启动成功</span>
                            </div>
                            <div class="log-entry">
                                <span class="log-time">2024-01-01 12:01:00</span>
                                <span class="log-level warning">WARN</span>
                                <span class="log-message">内存使用率较高</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取数据备份模板
     */
    getDataBackupTemplate() {
        return `
            <div class="data-backup-page">
                <div class="page-header">
                    <h1 class="page-title">数据备份</h1>
                    <p class="page-description">数据库备份和恢复管理</p>
                </div>
                
                <div class="backup-actions">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title">创建备份</h5>
                                </div>
                                <div class="card-body">
                                    <button class="btn btn-primary btn-block">
                                        <i class="fas fa-download"></i> 立即备份
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title">恢复数据</h5>
                                </div>
                                <div class="card-body">
                                    <button class="btn btn-warning btn-block">
                                        <i class="fas fa-upload"></i> 选择备份文件
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title">备份历史</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>备份文件</th>
                                        <th>大小</th>
                                        <th>创建时间</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colspan="5" class="text-center">
                                            <div class="loading-placeholder">
                                                <i class="fas fa-spinner fa-spin"></i>
                                                加载中...
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取数据备份模板
     */
    getDataBackupTemplate() {
        return `
            <div class="data-backup-page">
                <div class="page-header">
                    <h1 class="page-title">数据备份</h1>
                    <p class="page-description">系统数据备份与恢复管理</p>
                </div>
                
                <div class="backup-actions">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title">创建备份</h5>
                                </div>
                                <div class="card-body">
                                    <p class="text-muted">创建系统数据的完整备份</p>
                                    <button class="btn btn-primary">
                                        <i class="fas fa-download"></i> 立即备份
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title">恢复数据</h5>
                                </div>
                                <div class="card-body">
                                    <p class="text-muted">从备份文件恢复系统数据</p>
                                    <button class="btn btn-warning">
                                        <i class="fas fa-upload"></i> 选择文件
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="backup-history">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">备份历史</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>备份时间</th>
                                            <th>文件大小</th>
                                            <th>备份类型</th>
                                            <th>状态</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td colspan="5" class="text-center">
                                                <div class="loading-placeholder">
                                                    <i class="fas fa-spinner fa-spin"></i>
                                                    加载中...
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取默认页面模板
     * @param {string} pageName - 页面名称
     */
    getDefaultPageTemplate(pageName) {
        return `
            <div class="default-page">
                <div class="page-header">
                    <h1 class="page-title">${pageName}</h1>
                    <p class="page-description">页面开发中...</p>
                </div>
                
                <div class="card">
                    <div class="card-body text-center">
                        <i class="fas fa-tools fa-3x text-muted mb-3"></i>
                        <h5>功能开发中</h5>
                        <p class="text-muted">该页面功能正在开发中，敬请期待。</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 初始化页面特定功能
     * @param {string} pageName - 页面名称
     */
    async initPageFeatures(pageName) {
        // 根据页面名称初始化特定功能
        switch (pageName) {
            case 'dashboard':
                await this.initDashboardFeatures();
                break;
            case 'users':
                await this.initUsersFeatures();
                break;
            // 其他页面...
        }
    }

    /**
     * 初始化仪表盘功能
     */
    async initDashboardFeatures() {
        // 加载统计数据和图表
        try {
            await this.updateDashboardStats();
            await this.initDashboardCharts();
        } catch (error) {
            // 安全地获取错误信息
            let errorMessage = '未知错误';
            try {
                if (error && typeof error === 'object') {
                    errorMessage = error.message || error.toString() || '未知错误';
                } else if (error) {
                    errorMessage = String(error);
                }
            } catch (e) {
                errorMessage = '错误信息获取失败';
            }
            
            console.error('初始化仪表盘功能失败:', errorMessage);
        }
    }

    /**
     * 初始化用户管理功能
     */
    async initUsersFeatures() {
        // 加载用户列表
        try {
            const users = await window.ApiClient.get('/users');
            if (users.success) {
                this.updateUsersTable(users.data);
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
        }
    }

    /**
     * 更新仪表盘统计数据
     * @param {object} stats - 统计数据
     */
    /**
     * 更新仪表盘统计数据
     * @param {Object} stats - 统计数据对象
     */
    async updateDashboardStats(stats = null) {
        try {
            let data = stats;
            
            // 如果没有传入数据，从API获取真实数据
            if (!data) {
                try {
                    const response = await fetch('/api/admin/dashboard/stats', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        data = result.data;
                    } else {
                        throw new Error('API请求失败');
                    }
                } catch (error) {
                    console.error('获取仪表盘统计数据失败:', error);
                    // 使用默认值
                    data = {
                        totalUsers: 0,
                        totalBalance: 0,
                        todayTransactions: 0,
                        activeRedpackets: 0,
                        userGrowth: 0,
                        balanceGrowth: 0,
                        transactionGrowth: 0,
                        redpacketGrowth: 0
                    };
                }
            }

            // 更新统计卡片数据
            const elements = {
                'total-users': data.totalUsers?.toLocaleString() || '1,234',
                'total-balance': `¥${data.totalBalance?.toLocaleString() || '56,789'}`,
                'today-transactions': data.todayTransactions?.toString() || '89',
                'active-redpackets': data.activeRedpackets?.toString() || '23'
            };

            // 安全更新DOM元素
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });

            // 更新增长率显示
            this.updateGrowthIndicators(data);

            // 初始化图表
            this.initDashboardCharts();

            console.log('仪表盘统计数据更新成功');
        } catch (error) {
            console.error('更新仪表盘统计数据失败:', error);
            // 即使出错也要显示基础数据
            this.showFallbackStats();
        }
    }

    /**
     * 更新增长率指示器
     * @param {Object} data - 包含增长率的数据
     */
    updateGrowthIndicators(data) {
        const growthData = [
            { selector: '.stat-card-primary .stat-change', value: data.userGrowth || 12 },
            { selector: '.stat-card-success .stat-change', value: data.balanceGrowth || 8.5 },
            { selector: '.stat-card-warning .stat-change', value: data.transactionGrowth || 15 },
            { selector: '.stat-card-danger .stat-change', value: data.redpacketGrowth || -3 }
        ];

        growthData.forEach(({ selector, value }) => {
            const element = document.querySelector(selector);
            if (element) {
                const isPositive = value >= 0;
                element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
                element.innerHTML = `
                    <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> 
                    ${isPositive ? '+' : ''}${value}%
                `;
            }
        });
    }

    /**
     * 显示备用统计数据
     */
    showFallbackStats() {
        const fallbackElements = {
            'total-users': '1,234',
            'total-balance': '¥56,789',
            'today-transactions': '89',
            'active-redpackets': '23'
        };

        Object.entries(fallbackElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * 初始化仪表盘图表
     */
    async initDashboardCharts() {
        try {
            // 初始化用户增长趋势图表
            await this.initUserGrowthChart();
            
            // 初始化用户分布饼图
            await this.initUserDistributionChart();
        } catch (error) {
            console.error('初始化图表失败:', error);
        }
    }

    /**
     * 初始化用户增长趋势图表
     */
    async initUserGrowthChart() {
        const canvas = document.getElementById('user-growth-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        try {
            // 从API获取真实图表数据
            const response = await fetch('/api/admin/dashboard/user-growth', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            let chartData;
            if (response.ok) {
                const result = await response.json();
                chartData = result.data;
            } else {
                throw new Error('API请求失败');
            }
            
            // 简单的图表绘制（如果没有Chart.js库，使用基础绘制）
            this.drawSimpleLineChart(ctx, chartData);
        } catch (error) {
            console.error('获取用户增长图表数据失败:', error);
            // 使用空数据
            const emptyData = {
                labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                datasets: [{
                    label: '新增用户',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            };
            this.drawSimpleLineChart(ctx, emptyData);
        }
    }

    /**
     * 初始化用户分布饼图
     */
    async initUserDistributionChart() {
        const canvas = document.getElementById('user-distribution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        try {
            // 从API获取真实图表数据
            const response = await fetch('/api/admin/dashboard/user-distribution', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            let chartData;
            if (response.ok) {
                const result = await response.json();
                chartData = result.data;
            } else {
                throw new Error('API请求失败');
            }
            
            // 简单的饼图绘制
            this.drawSimplePieChart(ctx, chartData);
        } catch (error) {
            console.error('获取用户分布图表数据失败:', error);
            // 使用空数据
            const emptyData = {
                labels: ['新用户', '活跃用户', '沉睡用户'],
                data: [0, 0, 0],
                colors: ['#28a745', '#007bff', '#ffc107']
            };
            this.drawSimplePieChart(ctx, emptyData);
        }
    }

    /**
     * 绘制简单的折线图
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} data - 图表数据
     */
    drawSimpleLineChart(ctx, data) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 设置样式
        ctx.strokeStyle = '#007bff';
        ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
        ctx.lineWidth = 2;

        // 计算数据点位置
        const maxValue = Math.max(...data.datasets[0].data);
        const stepX = (width - padding * 2) / (data.labels.length - 1);
        const stepY = (height - padding * 2) / maxValue;

        // 绘制折线
        ctx.beginPath();
        data.datasets[0].data.forEach((value, index) => {
            const x = padding + index * stepX;
            const y = height - padding - value * stepY;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // 绘制数据点
        ctx.fillStyle = '#007bff';
        data.datasets[0].data.forEach((value, index) => {
            const x = padding + index * stepX;
            const y = height - padding - value * stepY;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * 绘制简单的饼图
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} data - 图表数据
     */
    drawSimplePieChart(ctx, data) {
        const canvas = ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 计算总值
        const total = data.data.reduce((sum, value) => sum + value, 0);
        
        let currentAngle = -Math.PI / 2; // 从顶部开始

        data.data.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            
            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            
            ctx.fillStyle = data.colors[index];
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });
    }

    /**
     * 更新用户表格
     * @param {Array} users - 用户数据
     */
    updateUsersTable(users) {
        const tbody = document.querySelector('.users-table tbody');
        if (!tbody || !users) return;

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-placeholder">
                            <i class="fas fa-users fa-2x text-muted mb-2"></i>
                            <p class="text-muted">暂无用户数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <span class="badge badge-${this.getUserStatusClass(user.status)}">
                        ${this.getUserStatusText(user.status)}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="AdminApp.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="AdminApp.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * 获取用户状态样式类
     * @param {string} status - 用户状态
     */
    getUserStatusClass(status) {
        const statusMap = {
            active: 'success',
            inactive: 'warning',
            banned: 'danger'
        };
        return statusMap[status] || 'secondary';
    }

    /**
     * 获取用户状态文本
     * @param {string} status - 用户状态
     */
    getUserStatusText(status) {
        const statusMap = {
            active: '活跃',
            inactive: '非活跃',
            banned: '已封禁'
        };
        return statusMap[status] || '未知';
    }

    /**
     * 更新UI状态
     */
    updateUIState() {
        // 更新用户信息显示
        if (this.state.user) {
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = this.state.user.name || this.state.user.username;
            }
        }

        // 更新主题
        document.body.className = `theme-${this.state.theme}`;

        // 更新侧边栏状态
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
        }
    }

    /**
     * 启动定时任务
     */
    startPeriodicTasks() {
        // 每5分钟检查一次认证状态
        setInterval(async () => {
            try {
                await window.ApiClient.get('/auth/verify');
            } catch (error) {
                console.warn('认证验证失败:', error);
                this.handleAuthError();
            }
        }, 5 * 60 * 1000);

        // 每30秒更新一次仪表盘数据（如果在仪表盘页面）
        setInterval(async () => {
            if (this.currentPage === 'dashboard') {
                try {
                    const stats = await window.ApiClient.get('/dashboard/stats');
                    if (stats.success) {
                        this.updateDashboardStats(stats.data);
                    }
                } catch (error) {
                    // 静默处理错误
                }
            }
        }, 30 * 1000);
    }

    /**
     * 处理导航变化事件
     * @param {object} event - 事件对象
     * @param {string} pageName - 页面名称
     * @param {string} title - 页面标题
     */
    async handleNavigationChange(event, pageName, title) {
        if (pageName !== this.currentPage) {
            await this.router.navigate(pageName);
        }
    }

    /**
     * 处理页面变化事件
     * @param {object} event - 事件对象
     * @param {string} pageName - 页面名称
     * @param {string} title - 页面标题
     */
    handlePageChange(event, pageName, title) {
        // 更新页面标题
        document.title = `${title} - 后台管理系统`;
        
        // 更新导航状态
        this.updateNavigationState(pageName);
    }

    /**
     * 更新导航状态
     * @param {string} pageName - 页面名称
     */
    updateNavigationState(pageName) {
        // 移除所有活跃状态
        document.querySelectorAll('.nav-item.active').forEach(item => {
            item.classList.remove('active');
        });

        // 添加当前页面的活跃状态
        const currentNavItem = document.querySelector(`[data-page="${pageName}"]`);
        if (currentNavItem) {
            currentNavItem.classList.add('active');
        }
    }

    /**
     * 处理用户登出事件
     * @param {object} event - 事件对象
     */
    async handleUserLogout(event) {
        try {
            // 调用登出API
            await window.ApiClient.post('/auth/logout');
        } catch (error) {
            console.error('登出API调用失败:', error);
        } finally {
            // 清除本地存储
            localStorage.removeItem('admin_token');
            
            // 重置用户状态
            this.state.user = null;
            this.state.permissions = [];
            
            // 显示登出成功消息
            window.Notification.success('已成功登出');
            
            // 重定向到登录页
            this.redirectToLogin();
        }
    }

    /**
     * 处理主题变化事件
     * @param {object} event - 事件对象
     * @param {string} theme - 主题名称
     */
    handleThemeChange(event, theme) {
        this.state.theme = theme;
        this.updateUIState();
        
        // 保存主题设置
        localStorage.setItem('admin_theme', theme);
    }

    /**
     * 处理侧边栏切换事件
     * @param {object} event - 事件对象
     * @param {boolean} collapsed - 是否折叠
     */
    handleSidebarToggle(event, collapsed) {
        this.state.sidebarCollapsed = collapsed;
        this.updateUIState();
        
        // 保存侧边栏状态
        localStorage.setItem('admin_sidebar_collapsed', collapsed);
    }

    /**
     * 处理窗口大小变化事件
     * @param {Event} event - 窗口事件
     */
    handleWindowResize(event) {
        // 响应式处理
        const width = window.innerWidth;
        
        if (width < 768) {
            // 移动端自动折叠侧边栏
            if (!this.state.sidebarCollapsed) {
                window.EventBus.emit('sidebar:toggle', true);
            }
        }
    }

    /**
     * 处理页面可见性变化事件
     * @param {Event} event - 可见性事件
     */
    handleVisibilityChange(event) {
        if (document.hidden) {
            // 页面隐藏时暂停定时任务
            console.log('页面隐藏，暂停定时任务');
        } else {
            // 页面显示时恢复定时任务
            console.log('页面显示，恢复定时任务');
        }
    }

    /**
     * 处理认证错误
     */
    handleAuthError() {
        // 清除认证信息
        localStorage.removeItem('admin_token');
        this.state.user = null;
        this.state.permissions = [];
        
        // 显示认证失效消息
        window.Notification.warning('登录已过期，请重新登录', {
            title: '认证失效',
            persistent: true
        });
        
        // 重定向到登录页
        this.redirectToLogin();
    }

    /**
     * 处理初始化错误
     * @param {Error} error - 错误对象
     */
    handleInitError(error) {
        // 隐藏加载状态
        this.hideInitialLoading();
        
        // 显示错误页面
        const appContainer = document.getElementById('app');
        if (appContainer) {
            // 安全地获取错误信息
            let errorMessage = '未知错误';
            try {
                if (error && typeof error === 'object') {
                    errorMessage = error.message || error.toString() || '未知错误';
                } else if (error) {
                    errorMessage = String(error);
                }
            } catch (e) {
                errorMessage = '错误信息获取失败';
            }
            
            appContainer.innerHTML = `
                <div class="init-error">
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h3>系统初始化失败</h3>
                        <p class="text-muted">${errorMessage}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-redo"></i> 重新加载
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 获取应用状态
     */
    getState() {
        return {
            initialized: this.initialized,
            currentPage: this.currentPage,
            user: this.state.user,
            theme: this.state.theme,
            sidebarCollapsed: this.state.sidebarCollapsed,
            components: Array.from(this.components.keys()),
            routes: Array.from(this.router?.routes.keys() || [])
        };
    }

    /**
     * 销毁应用程序
     */
    async destroy() {
        try {
            // 销毁所有组件
            for (const [name, component] of this.components) {
                if (component.destroy) {
                    await component.destroy();
                }
            }
            
            // 清除事件监听器
            window.removeEventListener('resize', this.handleWindowResize);
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            
            // 清除状态
            this.components.clear();
            this.initialized = false;
            
            console.log('应用程序已销毁');
            
        } catch (error) {
            console.error('应用程序销毁失败:', error);
        }
    }
}

// 创建全局应用实例
window.AdminApp = new AdminApp();

// 当DOM加载完成时初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.AdminApp.init();
    } catch (error) {
        console.error('应用程序启动失败:', error);
    }
});

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminApp;
}