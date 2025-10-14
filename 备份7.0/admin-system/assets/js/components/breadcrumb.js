/**
 * 面包屑导航组件 - Breadcrumb Component
 * 基于Context7 MCP标准的面包屑导航系统
 * 提供页面路径导航和层级显示功能
 */
class Breadcrumb extends BaseComponent {
    constructor() {
        super('Breadcrumb');
        this.config = null;
        this.currentPath = [];
        this.pageMap = new Map();
    }

    /**
     * 初始化面包屑组件
     */
    async init() {
        await super.init();
        
        // 获取配置
        this.config = window.ConfigLoader.get('admin');
        
        if (!this.config) {
            throw new Error('管理配置未找到');
        }

        // 构建页面映射
        this.buildPageMap();
        
        // 监听页面变化事件
        window.EventBus.on('page:change', this.handlePageChange);
        window.EventBus.on('navigation:change', this.handleNavigationChange);
        
        console.log('面包屑组件初始化完成');
    }

    /**
     * 挂载面包屑组件
     */
    async mount() {
        this.element = document.getElementById('breadcrumb');
        
        if (!this.element) {
            throw new Error('面包屑DOM元素未找到');
        }

        await super.mount();
        
        // 设置初始面包屑
        this.updateBreadcrumb('dashboard');
    }

    /**
     * 构建页面映射
     */
    buildPageMap() {
        this.pageMap.clear();
        
        // 添加根页面
        this.pageMap.set('dashboard', {
            title: '仪表盘',
            icon: 'fas fa-tachometer-alt',
            parent: null,
            path: ['dashboard']
        });

        // 遍历导航配置构建页面映射
        if (this.config.navigation && this.config.navigation.sections) {
            for (const section of this.config.navigation.sections) {
                this.buildSectionPageMap(section.items, null);
            }
        }

        // 添加页面配置中的页面信息
        if (this.config.pages) {
            Object.entries(this.config.pages).forEach(([pageId, pageConfig]) => {
                if (!this.pageMap.has(pageId)) {
                    this.pageMap.set(pageId, {
                        title: pageConfig.title || pageId,
                        icon: pageConfig.icon || 'fas fa-file',
                        parent: pageConfig.parent || null,
                        path: this.buildPagePath(pageId, pageConfig.parent)
                    });
                }
            });
        }
    }

    /**
     * 构建分组页面映射
     * @param {Array} items - 导航项数组
     * @param {string} parent - 父页面ID
     */
    buildSectionPageMap(items, parent = null) {
        if (!items) return;
        
        for (const item of items) {
            // 添加当前页面
            this.pageMap.set(item.page, {
                title: item.title,
                icon: item.icon,
                parent: parent,
                path: this.buildPagePath(item.page, parent)
            });
            
            // 递归处理子页面
            if (item.children && item.children.length > 0) {
                this.buildSectionPageMap(item.children, item.page);
            }
        }
    }

    /**
     * 构建页面路径
     * @param {string} pageId - 页面ID
     * @param {string} parent - 父页面ID
     */
    buildPagePath(pageId, parent = null) {
        const path = [];
        
        if (parent && this.pageMap.has(parent)) {
            path.push(...this.pageMap.get(parent).path);
        }
        
        path.push(pageId);
        return path;
    }

    /**
     * 渲染面包屑模板
     */
    async template() {
        if (this.currentPath.length === 0) {
            return '<span class="breadcrumb-item">首页</span>';
        }

        let html = '';
        
        for (let i = 0; i < this.currentPath.length; i++) {
            const pageId = this.currentPath[i];
            const pageInfo = this.pageMap.get(pageId);
            const isLast = i === this.currentPath.length - 1;
            
            if (!pageInfo) {
                continue;
            }

            if (i > 0) {
                html += '<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>';
            }

            if (isLast) {
                // 当前页面，不可点击
                html += `
                    <span class="breadcrumb-item current">
                        <i class="${pageInfo.icon}"></i>
                        <span class="breadcrumb-text">${pageInfo.title}</span>
                    </span>
                `;
            } else {
                // 父级页面，可点击
                html += `
                    <a href="#" class="breadcrumb-item clickable" data-page="${pageId}">
                        <i class="${pageInfo.icon}"></i>
                        <span class="breadcrumb-text">${pageInfo.title}</span>
                    </a>
                `;
            }
        }
        
        return html;
    }

    /**
     * 绑定面包屑事件
     */
    async bindEvents() {
        // 面包屑点击事件
        this.addEventListener('.breadcrumb-item.clickable', 'click', this.handleBreadcrumbClick);
    }

    /**
     * 处理面包屑点击事件
     * @param {Event} event - 点击事件
     */
    handleBreadcrumbClick(event) {
        event.preventDefault();
        
        const pageId = event.currentTarget.dataset.page;
        
        if (pageId) {
            // 发布页面切换事件
            window.EventBus.emit('navigation:change', pageId);
        }
    }

    /**
     * 处理页面变化事件
     * @param {object} event - 事件对象
     * @param {string} pageName - 页面名称
     */
    handlePageChange(event, pageName) {
        this.updateBreadcrumb(pageName);
    }

    /**
     * 处理导航变化事件
     * @param {object} event - 事件对象
     * @param {string} pageName - 页面名称
     * @param {string} title - 页面标题
     */
    handleNavigationChange(event, pageName, title) {
        this.updateBreadcrumb(pageName, title);
    }

    /**
     * 更新面包屑导航
     * @param {string} pageName - 页面名称
     * @param {string} customTitle - 自定义标题
     */
    async updateBreadcrumb(pageName, customTitle = null) {
        const pageInfo = this.pageMap.get(pageName);
        
        if (!pageInfo) {
            // 如果页面信息不存在，创建默认信息
            this.currentPath = [pageName];
            
            // 动态添加页面信息
            this.pageMap.set(pageName, {
                title: customTitle || this.formatPageTitle(pageName),
                icon: 'fas fa-file',
                parent: null,
                path: [pageName]
            });
        } else {
            this.currentPath = [...pageInfo.path];
            
            // 如果有自定义标题，更新页面信息
            if (customTitle && customTitle !== pageInfo.title) {
                pageInfo.title = customTitle;
            }
        }

        // 重新渲染面包屑
        if (this.mounted) {
            await this.render();
        }

        // 发布面包屑更新事件
        window.EventBus.emit('breadcrumb:update', this.currentPath, pageName);
    }

    /**
     * 格式化页面标题
     * @param {string} pageName - 页面名称
     */
    formatPageTitle(pageName) {
        // 将页面名称转换为可读标题
        const titleMap = {
            'dashboard': '仪表盘',
            'users': '用户管理',
            'wallet': '钱包管理',
            'transactions': '交易记录',
            'tasks': '任务管理',
            'red-packets': '红包管理',
            'teams': '团队管理',
            'system-monitoring': '系统监控',
            'data-backup': '数据备份',
            'settings': '系统设置'
        };

        return titleMap[pageName] || pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * 添加自定义页面
     * @param {string} pageId - 页面ID
     * @param {object} pageInfo - 页面信息
     */
    addPage(pageId, pageInfo) {
        const info = {
            title: pageInfo.title || pageId,
            icon: pageInfo.icon || 'fas fa-file',
            parent: pageInfo.parent || null,
            path: this.buildPagePath(pageId, pageInfo.parent)
        };
        
        this.pageMap.set(pageId, info);
    }

    /**
     * 移除页面
     * @param {string} pageId - 页面ID
     */
    removePage(pageId) {
        this.pageMap.delete(pageId);
    }

    /**
     * 获取当前路径
     */
    getCurrentPath() {
        return [...this.currentPath];
    }

    /**
     * 获取当前页面信息
     */
    getCurrentPageInfo() {
        const currentPageId = this.currentPath[this.currentPath.length - 1];
        return this.pageMap.get(currentPageId);
    }

    /**
     * 获取页面信息
     * @param {string} pageId - 页面ID
     */
    getPageInfo(pageId) {
        return this.pageMap.get(pageId);
    }

    /**
     * 获取所有页面
     */
    getAllPages() {
        return Array.from(this.pageMap.entries()).map(([id, info]) => ({
            id,
            ...info
        }));
    }

    /**
     * 重新构建页面映射
     */
    async rebuild() {
        // 重新加载配置
        await window.ConfigLoader.reload('admin');
        this.config = window.ConfigLoader.get('admin');
        
        // 重新构建页面映射
        this.buildPageMap();
        
        // 重新渲染当前面包屑
        if (this.mounted && this.currentPath.length > 0) {
            const currentPage = this.currentPath[this.currentPath.length - 1];
            await this.updateBreadcrumb(currentPage);
        }
    }

    /**
     * 组件销毁前清理
     */
    async beforeDestroy() {
        // 移除事件监听器
        window.EventBus.off('page:change', this.handlePageChange);
        window.EventBus.off('navigation:change', this.handleNavigationChange);
        
        await super.beforeDestroy();
    }

    /**
     * 获取面包屑状态
     */
    getState() {
        return {
            currentPath: this.currentPath,
            totalPages: this.pageMap.size,
            currentPageInfo: this.getCurrentPageInfo()
        };
    }
}

// 创建全局实例
window.Breadcrumb = new Breadcrumb();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breadcrumb;
}