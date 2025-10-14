/**
 * 导航组件 - Navigation Component
 * 基于Context7 MCP标准的导航系统
 * 处理侧边栏菜单的渲染、交互和状态管理
 */
class Navigation extends BaseComponent {
    constructor() {
        super('Navigation');
        this.config = null;
        this.currentPage = 'dashboard';
        this.collapsed = false;
        this.mobileMenuOpen = false;
    }

    /**
     * 初始化导航组件
     */
    async init() {
        await super.init();
        
        // 获取导航配置
        this.config = window.ConfigLoader.get('admin', 'navigation');
        
        if (!this.config) {
            throw new Error('导航配置未找到');
        }

        // 监听页面变化事件
        window.EventBus.on('page:change', this.handlePageChange);
        
        // 监听窗口大小变化
        window.addEventListener('resize', this.handleResize);
        
        console.log('导航组件初始化完成');
    }

    /**
     * 挂载导航组件
     */
    async mount() {
        // 获取导航相关元素
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');
        this.mainNav = document.getElementById('main-nav');

        if (!this.sidebar || !this.mainNav) {
            throw new Error('导航DOM元素未找到');
        }

        this.element = this.sidebar;
        
        await super.mount();
        
        // 初始化响应式状态
        this.handleResize();
    }

    /**
     * 渲染导航模板
     */
    async template() {
        if (!this.config || !this.config.sections) {
            return '<li class="nav-item">配置加载中...</li>';
        }

        let html = '';
        
        for (const section of this.config.sections) {
            html += this.renderSection(section);
        }
        
        return html;
    }

    /**
     * 渲染导航分组
     * @param {object} section - 分组配置
     */
    renderSection(section) {
        let html = '';
        
        if (section.items && section.items.length > 0) {
            for (const item of section.items) {
                html += this.renderNavItem(item);
            }
        }
        
        return html;
    }

    /**
     * 渲染导航项
     * @param {object} item - 导航项配置
     */
    renderNavItem(item) {
        const isActive = this.currentPage === item.page;
        const hasChildren = item.children && item.children.length > 0;
        
        let html = `
            <li class="nav-item ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}">
                <a href="#" class="nav-link" data-page="${item.page}" data-title="${item.title}">
                    <i class="${item.icon}"></i>
                    <span class="nav-text">${item.title}</span>
                    ${hasChildren ? '<i class="fas fa-chevron-down nav-arrow"></i>' : ''}
                </a>
        `;
        
        if (hasChildren) {
            html += '<ul class="nav-submenu">';
            for (const child of item.children) {
                const childActive = this.currentPage === child.page;
                html += `
                    <li class="nav-subitem ${childActive ? 'active' : ''}">
                        <a href="#" class="nav-sublink" data-page="${child.page}" data-title="${child.title}">
                            <i class="${child.icon}"></i>
                            <span class="nav-text">${child.title}</span>
                        </a>
                    </li>
                `;
            }
            html += '</ul>';
        }
        
        html += '</li>';
        
        return html;
    }

    /**
     * 绑定导航事件
     */
    async bindEvents() {
        // 导航链接点击事件
        this.addEventListener('.nav-link', 'click', this.handleNavClick);
        this.addEventListener('.nav-sublink', 'click', this.handleNavClick);
        
        // 侧边栏切换事件
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', this.toggleSidebar);
        }
        
        // 移动端菜单切换事件
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', this.toggleMobileMenu);
        }
        
        // 遮罩点击事件
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', this.closeMobileMenu);
        }
        
        // 子菜单展开/收起
        this.addEventListener('.nav-item.has-children > .nav-link', 'click', this.handleSubmenuToggle);
    }

    /**
     * 处理导航点击事件
     * @param {Event} event - 点击事件
     */
    handleNavClick(event) {
        event.preventDefault();
        
        const link = event.currentTarget;
        const page = link.dataset.page;
        const title = link.dataset.title;
        
        if (!page) {
            return;
        }

        // 如果是当前页面，不需要切换
        if (page === this.currentPage) {
            return;
        }

        // 发布页面切换事件
        window.EventBus.emit('navigation:change', page, title);
        
        // 在移动端关闭菜单
        if (this.isMobile()) {
            this.closeMobileMenu();
        }
    }

    /**
     * 处理子菜单切换
     * @param {Event} event - 点击事件
     */
    handleSubmenuToggle(event) {
        const navItem = event.currentTarget.parentElement;
        const isExpanded = navItem.classList.contains('expanded');
        
        // 收起其他展开的子菜单
        this.element.querySelectorAll('.nav-item.expanded').forEach(item => {
            if (item !== navItem) {
                item.classList.remove('expanded');
            }
        });
        
        // 切换当前子菜单
        navItem.classList.toggle('expanded', !isExpanded);
    }

    /**
     * 切换侧边栏状态
     */
    toggleSidebar() {
        this.collapsed = !this.collapsed;
        
        if (this.collapsed) {
            this.sidebar.classList.add('collapsed');
        } else {
            this.sidebar.classList.remove('collapsed');
        }
        
        // 保存状态到本地存储
        localStorage.setItem('sidebar-collapsed', this.collapsed);
        
        // 发布侧边栏状态变化事件
        window.EventBus.emit('sidebar:toggle', this.collapsed);
    }

    /**
     * 切换移动端菜单
     */
    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        
        if (this.mobileMenuOpen) {
            this.sidebar.classList.add('mobile-open');
            this.sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            this.closeMobileMenu();
        }
    }

    /**
     * 关闭移动端菜单
     */
    closeMobileMenu() {
        this.mobileMenuOpen = false;
        this.sidebar.classList.remove('mobile-open');
        this.sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * 处理页面变化
     * @param {object} event - 事件对象
     * @param {string} pageName - 页面名称
     */
    handlePageChange(event, pageName) {
        if (pageName === this.currentPage) {
            return;
        }

        // 更新当前页面
        const oldPage = this.currentPage;
        this.currentPage = pageName;
        
        // 更新导航状态
        this.updateActiveState(oldPage, pageName);
    }

    /**
     * 更新激活状态
     * @param {string} oldPage - 旧页面
     * @param {string} newPage - 新页面
     */
    updateActiveState(oldPage, newPage) {
        // 移除旧的激活状态
        this.element.querySelectorAll('.nav-item.active, .nav-subitem.active').forEach(item => {
            item.classList.remove('active');
        });
        
        // 添加新的激活状态
        const newActiveLink = this.element.querySelector(`[data-page="${newPage}"]`);
        if (newActiveLink) {
            const navItem = newActiveLink.closest('.nav-item, .nav-subitem');
            if (navItem) {
                navItem.classList.add('active');
                
                // 如果是子菜单项，展开父菜单
                const parentItem = navItem.closest('.nav-item.has-children');
                if (parentItem) {
                    parentItem.classList.add('expanded');
                }
            }
        }
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const isMobile = this.isMobile();
        
        if (isMobile) {
            // 移动端：关闭菜单，移除桌面端的collapsed状态
            this.closeMobileMenu();
            this.sidebar.classList.remove('collapsed');
        } else {
            // 桌面端：恢复collapsed状态
            const savedCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            this.collapsed = savedCollapsed;
            
            if (this.collapsed) {
                this.sidebar.classList.add('collapsed');
            } else {
                this.sidebar.classList.remove('collapsed');
            }
        }
    }

    /**
     * 检查是否为移动端
     */
    isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * 获取当前页面
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * 设置当前页面
     * @param {string} pageName - 页面名称
     */
    setCurrentPage(pageName) {
        if (pageName !== this.currentPage) {
            this.handlePageChange({}, pageName);
        }
    }

    /**
     * 获取导航配置
     */
    getConfig() {
        return this.config;
    }

    /**
     * 重新加载导航配置
     */
    async reloadConfig() {
        await window.ConfigLoader.reload('admin');
        this.config = window.ConfigLoader.get('admin', 'navigation');
        
        if (this.mounted) {
            await this.render();
        }
    }

    /**
     * 组件销毁前清理
     */
    async beforeDestroy() {
        // 移除事件监听器
        window.removeEventListener('resize', this.handleResize);
        window.EventBus.off('page:change', this.handlePageChange);
        
        // 清理DOM状态
        document.body.style.overflow = '';
        
        await super.beforeDestroy();
    }

    /**
     * 获取导航状态
     */
    getState() {
        return {
            currentPage: this.currentPage,
            collapsed: this.collapsed,
            mobileMenuOpen: this.mobileMenuOpen,
            isMobile: this.isMobile()
        };
    }
}

// 创建全局实例
window.Navigation = new Navigation();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
}