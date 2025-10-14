/**
 * 页面加载器组件 - PageLoader Component
 * 基于Context7 MCP标准的页面加载状态管理系统
 * 提供全局和局部加载状态显示功能
 */
class PageLoader extends BaseComponent {
    constructor() {
        super('PageLoader');
        this.config = null;
        this.loadingStates = new Map();
        this.defaultOptions = {
            type: 'spinner', // spinner, dots, bars, pulse
            size: 'medium', // small, medium, large
            overlay: true,
            message: '加载中...',
            timeout: 30000, // 30秒超时
            zIndex: 9999
        };
    }

    /**
     * 初始化页面加载器组件
     */
    async init() {
        await super.init();
        
        // 获取配置
        this.config = window.ConfigLoader.get('admin');
        
        if (!this.config) {
            throw new Error('管理配置未找到');
        }

        // 监听加载事件
        window.EventBus.on('loader:show', this.handleShowLoader);
        window.EventBus.on('loader:hide', this.handleHideLoader);
        window.EventBus.on('loader:update', this.handleUpdateLoader);
        window.EventBus.on('page:loading', this.handlePageLoading);
        window.EventBus.on('api:loading', this.handleApiLoading);
        
        console.log('页面加载器组件初始化完成');
    }

    /**
     * 挂载页面加载器组件
     * @param {HTMLElement} container - 容器元素
     */
    async mount(container = null) {
        // 创建全局加载器容器
        this.createGlobalLoader();
        
        await super.mount(container);
    }

    /**
     * 创建全局加载器容器
     */
    createGlobalLoader() {
        // 检查是否已存在
        let globalLoader = document.getElementById('global-loader');
        
        if (!globalLoader) {
            globalLoader = document.createElement('div');
            globalLoader.id = 'global-loader';
            globalLoader.className = 'page-loader global-loader';
            globalLoader.style.display = 'none';
            document.body.appendChild(globalLoader);
        }
        
        this.globalLoader = globalLoader;
    }

    /**
     * 显示加载器
     * @param {string} target - 目标元素选择器或ID
     * @param {object} options - 加载器选项
     */
    show(target = 'global', options = {}) {
        const config = { ...this.defaultOptions, ...options };
        const loaderId = this.generateLoaderId(target);
        
        // 保存加载状态
        this.loadingStates.set(loaderId, {
            target,
            config,
            startTime: Date.now(),
            timeout: null
        });

        // 创建或更新加载器
        this.createLoader(target, config, loaderId);
        
        // 设置超时
        if (config.timeout > 0) {
            const timeoutId = setTimeout(() => {
                this.hide(target);
                window.EventBus.emit('loader:timeout', target, loaderId);
            }, config.timeout);
            
            this.loadingStates.get(loaderId).timeout = timeoutId;
        }

        // 发布显示事件
        window.EventBus.emit('loader:shown', target, loaderId, config);
    }

    /**
     * 隐藏加载器
     * @param {string} target - 目标元素选择器或ID
     */
    hide(target = 'global') {
        const loaderId = this.generateLoaderId(target);
        const loadingState = this.loadingStates.get(loaderId);
        
        if (!loadingState) {
            return;
        }

        // 清除超时
        if (loadingState.timeout) {
            clearTimeout(loadingState.timeout);
        }

        // 移除加载器
        this.removeLoader(target, loaderId);
        
        // 清除状态
        this.loadingStates.delete(loaderId);

        // 发布隐藏事件
        const duration = Date.now() - loadingState.startTime;
        window.EventBus.emit('loader:hidden', target, loaderId, duration);
    }

    /**
     * 更新加载器消息
     * @param {string} target - 目标元素选择器或ID
     * @param {string} message - 新消息
     * @param {number} progress - 进度百分比 (0-100)
     */
    update(target = 'global', message, progress = null) {
        const loaderId = this.generateLoaderId(target);
        const loadingState = this.loadingStates.get(loaderId);
        
        if (!loadingState) {
            return;
        }

        // 更新配置
        if (message) {
            loadingState.config.message = message;
        }
        
        if (progress !== null) {
            loadingState.config.progress = Math.max(0, Math.min(100, progress));
        }

        // 更新显示
        this.updateLoader(target, loadingState.config, loaderId);
        
        // 发布更新事件
        window.EventBus.emit('loader:updated', target, loaderId, message, progress);
    }

    /**
     * 创建加载器
     * @param {string} target - 目标元素
     * @param {object} config - 配置选项
     * @param {string} loaderId - 加载器ID
     */
    createLoader(target, config, loaderId) {
        let container;
        
        if (target === 'global') {
            container = this.globalLoader;
        } else {
            const targetElement = typeof target === 'string' ? 
                document.querySelector(target) : target;
                
            if (!targetElement) {
                console.warn(`加载器目标元素未找到: ${target}`);
                return;
            }

            // 创建局部加载器容器
            container = targetElement.querySelector('.page-loader');
            
            if (!container) {
                container = document.createElement('div');
                container.className = 'page-loader local-loader';
                container.dataset.loaderId = loaderId;
                
                // 设置相对定位
                const originalPosition = getComputedStyle(targetElement).position;
                if (originalPosition === 'static') {
                    targetElement.style.position = 'relative';
                }
                
                targetElement.appendChild(container);
            }
        }

        // 设置加载器内容
        container.innerHTML = this.generateLoaderHTML(config);
        
        // 应用样式
        this.applyLoaderStyles(container, config);
        
        // 显示加载器
        container.style.display = 'flex';
        
        // 添加动画类
        container.classList.add('loader-show');
    }

    /**
     * 移除加载器
     * @param {string} target - 目标元素
     * @param {string} loaderId - 加载器ID
     */
    removeLoader(target, loaderId) {
        let container;
        
        if (target === 'global') {
            container = this.globalLoader;
        } else {
            const targetElement = typeof target === 'string' ? 
                document.querySelector(target) : target;
                
            if (targetElement) {
                container = targetElement.querySelector(`[data-loader-id="${loaderId}"]`);
            }
        }

        if (container) {
            // 添加隐藏动画
            container.classList.add('loader-hide');
            
            setTimeout(() => {
                if (target === 'global') {
                    container.style.display = 'none';
                    container.innerHTML = '';
                } else {
                    container.remove();
                }
            }, 300); // 动画持续时间
        }
    }

    /**
     * 更新加载器
     * @param {string} target - 目标元素
     * @param {object} config - 配置选项
     * @param {string} loaderId - 加载器ID
     */
    updateLoader(target, config, loaderId) {
        let container;
        
        if (target === 'global') {
            container = this.globalLoader;
        } else {
            const targetElement = typeof target === 'string' ? 
                document.querySelector(target) : target;
                
            if (targetElement) {
                container = targetElement.querySelector(`[data-loader-id="${loaderId}"]`);
            }
        }

        if (container) {
            // 更新消息
            const messageElement = container.querySelector('.loader-message');
            if (messageElement && config.message) {
                messageElement.textContent = config.message;
            }
            
            // 更新进度条
            const progressElement = container.querySelector('.loader-progress-bar');
            if (progressElement && config.progress !== undefined) {
                progressElement.style.width = `${config.progress}%`;
            }
            
            // 更新进度文本
            const progressText = container.querySelector('.loader-progress-text');
            if (progressText && config.progress !== undefined) {
                progressText.textContent = `${Math.round(config.progress)}%`;
            }
        }
    }

    /**
     * 生成加载器HTML
     * @param {object} config - 配置选项
     */
    generateLoaderHTML(config) {
        let loaderContent = '';
        
        // 生成加载动画
        switch (config.type) {
            case 'spinner':
                loaderContent = '<div class="loader-spinner"></div>';
                break;
            case 'dots':
                loaderContent = `
                    <div class="loader-dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                `;
                break;
            case 'bars':
                loaderContent = `
                    <div class="loader-bars">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                `;
                break;
            case 'pulse':
                loaderContent = '<div class="loader-pulse"></div>';
                break;
            default:
                loaderContent = '<div class="loader-spinner"></div>';
        }

        // 添加消息
        let messageHTML = '';
        if (config.message) {
            messageHTML = `<div class="loader-message">${config.message}</div>`;
        }

        // 添加进度条
        let progressHTML = '';
        if (config.progress !== undefined) {
            progressHTML = `
                <div class="loader-progress">
                    <div class="loader-progress-bar" style="width: ${config.progress}%"></div>
                </div>
                <div class="loader-progress-text">${Math.round(config.progress)}%</div>
            `;
        }

        return `
            <div class="loader-content">
                <div class="loader-animation ${config.size}">
                    ${loaderContent}
                </div>
                ${messageHTML}
                ${progressHTML}
            </div>
        `;
    }

    /**
     * 应用加载器样式
     * @param {HTMLElement} container - 容器元素
     * @param {object} config - 配置选项
     */
    applyLoaderStyles(container, config) {
        // 设置z-index
        container.style.zIndex = config.zIndex;
        
        // 设置覆盖层
        if (config.overlay) {
            container.classList.add('with-overlay');
        } else {
            container.classList.remove('with-overlay');
        }
        
        // 设置尺寸类
        container.classList.add(`loader-${config.size}`);
    }

    /**
     * 生成加载器ID
     * @param {string} target - 目标元素
     */
    generateLoaderId(target) {
        return `loader-${target.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    }

    /**
     * 处理显示加载器事件
     * @param {object} event - 事件对象
     * @param {string} target - 目标元素
     * @param {object} options - 选项
     */
    handleShowLoader(event, target, options) {
        this.show(target, options);
    }

    /**
     * 处理隐藏加载器事件
     * @param {object} event - 事件对象
     * @param {string} target - 目标元素
     */
    handleHideLoader(event, target) {
        this.hide(target);
    }

    /**
     * 处理更新加载器事件
     * @param {object} event - 事件对象
     * @param {string} target - 目标元素
     * @param {string} message - 消息
     * @param {number} progress - 进度
     */
    handleUpdateLoader(event, target, message, progress) {
        this.update(target, message, progress);
    }

    /**
     * 处理页面加载事件
     * @param {object} event - 事件对象
     * @param {string} pageName - 页面名称
     * @param {boolean} loading - 是否加载中
     */
    handlePageLoading(event, pageName, loading) {
        if (loading) {
            this.show('global', {
                message: `正在加载 ${pageName}...`,
                type: 'spinner'
            });
        } else {
            this.hide('global');
        }
    }

    /**
     * 处理API加载事件
     * @param {object} event - 事件对象
     * @param {string} apiName - API名称
     * @param {boolean} loading - 是否加载中
     */
    handleApiLoading(event, apiName, loading) {
        const target = `api-${apiName}`;
        
        if (loading) {
            this.show(target, {
                message: `正在处理请求...`,
                type: 'dots',
                size: 'small'
            });
        } else {
            this.hide(target);
        }
    }

    /**
     * 检查是否正在加载
     * @param {string} target - 目标元素
     */
    isLoading(target = 'global') {
        const loaderId = this.generateLoaderId(target);
        return this.loadingStates.has(loaderId);
    }

    /**
     * 获取所有加载状态
     */
    getAllLoadingStates() {
        return Array.from(this.loadingStates.entries()).map(([id, state]) => ({
            id,
            target: state.target,
            duration: Date.now() - state.startTime,
            config: state.config
        }));
    }

    /**
     * 清除所有加载器
     */
    clearAll() {
        const targets = Array.from(this.loadingStates.keys());
        
        targets.forEach(loaderId => {
            const state = this.loadingStates.get(loaderId);
            if (state) {
                this.hide(state.target);
            }
        });
    }

    /**
     * 组件销毁前清理
     */
    async beforeDestroy() {
        // 清除所有加载器
        this.clearAll();
        
        // 移除事件监听器
        window.EventBus.off('loader:show', this.handleShowLoader);
        window.EventBus.off('loader:hide', this.handleHideLoader);
        window.EventBus.off('loader:update', this.handleUpdateLoader);
        window.EventBus.off('page:loading', this.handlePageLoading);
        window.EventBus.off('api:loading', this.handleApiLoading);
        
        // 移除全局加载器
        if (this.globalLoader && this.globalLoader.parentNode) {
            this.globalLoader.parentNode.removeChild(this.globalLoader);
        }
        
        await super.beforeDestroy();
    }

    /**
     * 获取加载器状态
     */
    getState() {
        return {
            activeLoaders: this.loadingStates.size,
            loadingStates: this.getAllLoadingStates()
        };
    }
}

// 创建全局实例
window.PageLoader = new PageLoader();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageLoader;
}