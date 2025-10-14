/**
 * 加载状态优化工具
 * 添加加载指示器和进度提示
 */

class LoadingOptimization {
    constructor() {
        this.loadingStates = new Map();
        this.progressBars = new Map();
        this.skeletonScreens = new Map();
        this.loadingOverlays = new Map();
        this.init();
    }

    /**
     * 初始化加载优化
     */
    init() {
        this.createLoadingStyles();
        this.setupGlobalLoading();
        this.interceptNetworkRequests();
        this.setupPageLoadingIndicator();
        this.createSkeletonScreens();
        console.log('加载状态优化已初始化');
    }

    /**
     * 创建加载样式
     */
    createLoadingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 全局加载样式 */
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(2px);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            
            .loading-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            /* 加载指示器 */
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .loading-dots {
                display: flex;
                gap: 4px;
            }
            
            .loading-dots .dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #007bff;
                animation: loading-dots 1.4s ease-in-out infinite both;
            }
            
            .loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
            .loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }
            .loading-dots .dot:nth-child(3) { animation-delay: 0s; }
            
            /* 进度条 */
            .progress-bar {
                width: 100%;
                height: 4px;
                background: #f0f0f0;
                border-radius: 2px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #007bff, #0056b3);
                border-radius: 2px;
                transition: width 0.3s ease;
                position: relative;
            }
            
            .progress-bar-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: progress-shine 2s infinite;
            }
            
            /* 骨架屏 */
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
                border-radius: 4px;
            }
            
            .skeleton-text {
                height: 16px;
                margin-bottom: 8px;
            }
            
            .skeleton-text:last-child {
                width: 60%;
            }
            
            .skeleton-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }
            
            .skeleton-button {
                height: 36px;
                width: 100px;
                border-radius: 6px;
            }
            
            .skeleton-card {
                height: 200px;
                border-radius: 8px;
                margin-bottom: 16px;
            }
            
            /* 按钮加载状态 */
            .btn-loading {
                position: relative;
                color: transparent !important;
                pointer-events: none;
            }
            
            .btn-loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 16px;
                height: 16px;
                margin: -8px 0 0 -8px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            /* 页面加载进度条 */
            .page-loading-bar {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: #007bff;
                transform: translateX(-100%);
                transition: transform 0.3s ease;
                z-index: 10000;
            }
            
            .page-loading-bar.loading {
                animation: page-loading 2s ease-in-out infinite;
            }
            
            /* 内容加载状态 */
            .content-loading {
                min-height: 200px;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                gap: 16px;
                color: #666;
            }
            
            .content-loading .loading-text {
                font-size: 14px;
            }
            
            /* 列表加载更多 */
            .load-more {
                text-align: center;
                padding: 20px;
                border-top: 1px solid #eee;
            }
            
            .load-more.loading {
                opacity: 0.6;
                pointer-events: none;
            }
            
            /* 动画定义 */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes loading-dots {
                0%, 80%, 100% {
                    transform: scale(0);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes progress-shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            @keyframes page-loading {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
            }
            
            /* 响应式优化 */
            @media (max-width: 768px) {
                .loading-overlay {
                    backdrop-filter: none;
                }
                
                .loading-spinner {
                    width: 32px;
                    height: 32px;
                    border-width: 3px;
                }
                
                .content-loading {
                    min-height: 150px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 设置全局加载
     */
    setupGlobalLoading() {
        // 创建全局加载覆盖层
        const overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text" style="margin-top: 16px; color: white; font-size: 14px;">加载中...</div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // 全局加载方法
        window.LoadingManager = {
            /**
             * 显示全局加载
             * @param {string} text - 加载文本
             */
            show: (text = '加载中...') => {
                const overlay = document.getElementById('global-loading-overlay');
                const textElement = overlay.querySelector('.loading-text');
                if (textElement) {
                    textElement.textContent = text;
                }
                overlay.classList.add('show');
            },
            
            /**
             * 隐藏全局加载
             */
            hide: () => {
                const overlay = document.getElementById('global-loading-overlay');
                overlay.classList.remove('show');
            },
            
            /**
             * 设置加载文本
             * @param {string} text - 加载文本
             */
            setText: (text) => {
                const overlay = document.getElementById('global-loading-overlay');
                const textElement = overlay.querySelector('.loading-text');
                if (textElement) {
                    textElement.textContent = text;
                }
            }
        };
    }

    /**
     * 拦截网络请求
     */
    interceptNetworkRequests() {
        let activeRequests = 0;
        
        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            activeRequests++;
            this.updateNetworkLoadingState(activeRequests > 0);
            
            try {
                const response = await originalFetch.apply(this, args);
                return response;
            } finally {
                activeRequests--;
                this.updateNetworkLoadingState(activeRequests > 0);
            }
        }.bind(this);
        
        // 拦截XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(...args) {
            this._url = args[1];
            return originalXHROpen.apply(this, args);
        };
        
        XMLHttpRequest.prototype.send = function(...args) {
            activeRequests++;
            this.updateNetworkLoadingState(activeRequests > 0);
            
            const onComplete = () => {
                activeRequests--;
                this.updateNetworkLoadingState(activeRequests > 0);
            };
            
            this.addEventListener('load', onComplete);
            this.addEventListener('error', onComplete);
            this.addEventListener('abort', onComplete);
            
            return originalXHRSend.apply(this, args);
        }.bind(this);
    }

    /**
     * 更新网络加载状态
     * @param {boolean} loading - 是否加载中
     */
    updateNetworkLoadingState(loading) {
        const pageLoadingBar = document.getElementById('page-loading-bar');
        if (pageLoadingBar) {
            if (loading) {
                pageLoadingBar.classList.add('loading');
            } else {
                pageLoadingBar.classList.remove('loading');
            }
        }
    }

    /**
     * 设置页面加载指示器
     */
    setupPageLoadingIndicator() {
        // 创建页面加载进度条
        const progressBar = document.createElement('div');
        progressBar.id = 'page-loading-bar';
        progressBar.className = 'page-loading-bar';
        document.body.appendChild(progressBar);
        
        // 页面加载完成后隐藏
        if (document.readyState === 'loading') {
            progressBar.classList.add('loading');
            
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    progressBar.classList.remove('loading');
                }, 500);
            });
        }
    }

    /**
     * 创建骨架屏
     */
    createSkeletonScreens() {
        // 为常见内容区域创建骨架屏模板
        const skeletonTemplates = {
            card: `
                <div class="skeleton skeleton-card"></div>
            `,
            list: `
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
            `,
            profile: `
                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <div class="skeleton skeleton-avatar"></div>
                    <div style="flex: 1;">
                        <div class="skeleton skeleton-text" style="width: 120px;"></div>
                        <div class="skeleton skeleton-text" style="width: 80px;"></div>
                    </div>
                </div>
            `,
            button: `
                <div class="skeleton skeleton-button"></div>
            `
        };
        
        // 全局骨架屏方法
        window.SkeletonManager = {
            /**
             * 显示骨架屏
             * @param {string} selector - 目标选择器
             * @param {string} type - 骨架屏类型
             */
            show: (selector, type = 'list') => {
                const element = document.querySelector(selector);
                if (element) {
                    element.innerHTML = skeletonTemplates[type] || skeletonTemplates.list;
                    element.classList.add('skeleton-container');
                }
            },
            
            /**
             * 隐藏骨架屏
             * @param {string} selector - 目标选择器
             * @param {string} content - 真实内容
             */
            hide: (selector, content = '') => {
                const element = document.querySelector(selector);
                if (element) {
                    element.classList.remove('skeleton-container');
                    if (content) {
                        element.innerHTML = content;
                    }
                }
            },
            
            /**
             * 创建自定义骨架屏
             * @param {string} name - 模板名称
             * @param {string} template - 模板HTML
             */
            addTemplate: (name, template) => {
                skeletonTemplates[name] = template;
            }
        };
    }

    /**
     * 显示按钮加载状态
     * @param {HTMLElement|string} button - 按钮元素或选择器
     * @param {boolean} loading - 是否加载中
     * @param {string} loadingText - 加载文本
     */
    setButtonLoading(button, loading, loadingText = '') {
        const element = typeof button === 'string' ? document.querySelector(button) : button;
        if (!element) return;
        
        if (loading) {
            element.disabled = true;
            element.classList.add('btn-loading');
            if (loadingText) {
                element.dataset.originalText = element.textContent;
                element.textContent = loadingText;
            }
        } else {
            element.disabled = false;
            element.classList.remove('btn-loading');
            if (element.dataset.originalText) {
                element.textContent = element.dataset.originalText;
                delete element.dataset.originalText;
            }
        }
    }

    /**
     * 创建进度条
     * @param {string} selector - 目标选择器
     * @param {number} progress - 进度百分比 (0-100)
     * @returns {Object} 进度条控制器
     */
    createProgressBar(selector, progress = 0) {
        const container = document.querySelector(selector);
        if (!container) return null;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
        `;
        
        container.appendChild(progressBar);
        
        const controller = {
            /**
             * 设置进度
             * @param {number} value - 进度值 (0-100)
             */
            setProgress: (value) => {
                const fill = progressBar.querySelector('.progress-bar-fill');
                fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
            },
            
            /**
             * 增加进度
             * @param {number} increment - 增加值
             */
            increment: (increment) => {
                const fill = progressBar.querySelector('.progress-bar-fill');
                const currentWidth = parseFloat(fill.style.width) || 0;
                const newWidth = Math.min(100, currentWidth + increment);
                fill.style.width = `${newWidth}%`;
            },
            
            /**
             * 完成进度
             */
            complete: () => {
                controller.setProgress(100);
                setTimeout(() => {
                    progressBar.style.opacity = '0';
                    setTimeout(() => {
                        progressBar.remove();
                    }, 300);
                }, 500);
            },
            
            /**
             * 移除进度条
             */
            remove: () => {
                progressBar.remove();
            }
        };
        
        this.progressBars.set(selector, controller);
        return controller;
    }

    /**
     * 显示内容加载状态
     * @param {string} selector - 目标选择器
     * @param {string} text - 加载文本
     * @param {string} type - 加载类型
     */
    showContentLoading(selector, text = '加载中...', type = 'spinner') {
        const element = document.querySelector(selector);
        if (!element) return;
        
        let loadingHTML = '';
        switch (type) {
            case 'dots':
                loadingHTML = `
                    <div class="loading-dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                `;
                break;
            case 'spinner':
            default:
                loadingHTML = '<div class="loading-spinner"></div>';
                break;
        }
        
        element.innerHTML = `
            <div class="content-loading">
                ${loadingHTML}
                <div class="loading-text">${text}</div>
            </div>
        `;
        
        this.loadingStates.set(selector, {
            originalContent: element.dataset.originalContent || '',
            isLoading: true
        });
    }

    /**
     * 隐藏内容加载状态
     * @param {string} selector - 目标选择器
     * @param {string} content - 新内容
     */
    hideContentLoading(selector, content = '') {
        const element = document.querySelector(selector);
        if (!element) return;
        
        const state = this.loadingStates.get(selector);
        if (state && state.isLoading) {
            element.innerHTML = content || state.originalContent;
            this.loadingStates.delete(selector);
        }
    }

    /**
     * 创建加载更多按钮
     * @param {string} selector - 目标选择器
     * @param {Function} loadMoreCallback - 加载更多回调
     * @returns {Object} 加载更多控制器
     */
    createLoadMore(selector, loadMoreCallback) {
        const container = document.querySelector(selector);
        if (!container) return null;
        
        const loadMoreBtn = document.createElement('div');
        loadMoreBtn.className = 'load-more';
        loadMoreBtn.innerHTML = `
            <button class="btn btn-outline-primary" type="button">
                加载更多
            </button>
        `;
        
        container.appendChild(loadMoreBtn);
        
        const button = loadMoreBtn.querySelector('button');
        button.addEventListener('click', async () => {
            loadMoreBtn.classList.add('loading');
            button.innerHTML = `
                <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 8px; display: inline-block;"></div>
                加载中...
            `;
            
            try {
                const hasMore = await loadMoreCallback();
                if (!hasMore) {
                    loadMoreBtn.innerHTML = '<div style="color: #999; font-size: 14px;">没有更多内容了</div>';
                } else {
                    button.innerHTML = '加载更多';
                    loadMoreBtn.classList.remove('loading');
                }
            } catch (error) {
                button.innerHTML = '加载失败，点击重试';
                loadMoreBtn.classList.remove('loading');
                console.error('加载更多失败:', error);
            }
        });
        
        return {
            /**
             * 重置状态
             */
            reset: () => {
                button.innerHTML = '加载更多';
                loadMoreBtn.classList.remove('loading');
            },
            
            /**
             * 设置完成状态
             */
            setComplete: () => {
                loadMoreBtn.innerHTML = '<div style="color: #999; font-size: 14px;">没有更多内容了</div>';
            },
            
            /**
             * 移除按钮
             */
            remove: () => {
                loadMoreBtn.remove();
            }
        };
    }

    /**
     * 优化现有加载状态
     */
    optimizeExistingLoading() {
        // 为现有按钮添加加载状态支持
        const buttons = document.querySelectorAll('button, .btn, input[type="submit"]');
        buttons.forEach(button => {
            const originalClick = button.onclick;
            if (originalClick) {
                button.onclick = async function(e) {
                    this.setButtonLoading(button, true);
                    try {
                        await originalClick.call(button, e);
                    } finally {
                        this.setButtonLoading(button, false);
                    }
                }.bind(this);
            }
        });
        
        // 为表单添加提交加载状态
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitBtn = form.querySelector('input[type="submit"], button[type="submit"], .submit-btn');
                if (submitBtn) {
                    this.setButtonLoading(submitBtn, true, '提交中...');
                    
                    // 如果是AJAX表单，需要手动恢复状态
                    setTimeout(() => {
                        this.setButtonLoading(submitBtn, false);
                    }, 3000);
                }
            });
        });
    }

    /**
     * 生成加载优化报告
     * @returns {Object} 优化报告
     */
    generateLoadingReport() {
        return {
            timestamp: new Date().toISOString(),
            activeLoadingStates: this.loadingStates.size,
            activeProgressBars: this.progressBars.size,
            optimizations: [
                '全局加载覆盖层',
                '网络请求拦截',
                '页面加载进度条',
                '骨架屏支持',
                '按钮加载状态',
                '内容加载指示器',
                '加载更多组件'
            ],
            recommendations: [
                '合理使用骨架屏提升用户体验',
                '避免过度的加载动画',
                '为长时间操作提供进度反馈',
                '优化网络请求减少加载时间'
            ]
        };
    }
}

// 自动初始化加载优化
document.addEventListener('DOMContentLoaded', () => {
    window.loadingOptimization = new LoadingOptimization();
    
    // 优化现有加载状态
    setTimeout(() => {
        window.loadingOptimization.optimizeExistingLoading();
    }, 1000);
    
    console.log('加载状态优化已启动');
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingOptimization;
}