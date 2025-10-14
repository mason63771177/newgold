/**
 * 移动端适配优化工具
 * 改进响应式布局和触控体验
 */

class MobileOptimization {
    constructor() {
        this.deviceInfo = {};
        this.touchHandlers = new Map();
        this.resizeHandlers = new Set();
        this.orientationHandlers = new Set();
        this.init();
    }

    /**
     * 初始化移动端优化
     */
    init() {
        this.detectDevice();
        this.setupViewport();
        this.optimizeTouch();
        this.optimizeLayout();
        this.setupEventListeners();
        this.preventZoom();
        this.optimizeScrolling();
        console.log('移动端优化已初始化');
    }

    /**
     * 检测设备信息
     */
    detectDevice() {
        const userAgent = navigator.userAgent;
        
        this.deviceInfo = {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isAndroid: /Android/.test(userAgent),
            isTablet: /iPad|Android(?=.*\bMobile\b)/.test(userAgent) || 
                     (window.screen.width >= 768 && window.screen.height >= 1024),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: window.orientation || 0,
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };

        // 添加设备类名到body
        const classesToAdd = [
            this.deviceInfo.isMobile ? 'mobile' : 'desktop',
            this.deviceInfo.isIOS ? 'ios' : null,
            this.deviceInfo.isAndroid ? 'android' : null,
            this.deviceInfo.isTablet ? 'tablet' : 'phone',
            this.deviceInfo.hasTouch ? 'touch' : 'no-touch'
        ].filter(cls => cls !== null && cls !== '');
        
        document.body.classList.add(...classesToAdd);

        console.log('设备信息:', this.deviceInfo);
    }

    /**
     * 设置视口
     */
    setupViewport() {
        // 确保视口meta标签存在且正确
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        // 设置视口内容
        const viewportContent = [
            'width=device-width',
            'initial-scale=1.0',
            'maximum-scale=1.0',
            'user-scalable=no',
            'viewport-fit=cover'
        ].join(', ');

        viewport.content = viewportContent;

        // 添加CSS变量支持
        this.setCSSVariables();
    }

    /**
     * 设置CSS变量
     */
    setCSSVariables() {
        const root = document.documentElement;
        
        // 设备尺寸变量
        root.style.setProperty('--screen-width', `${this.deviceInfo.screenWidth}px`);
        root.style.setProperty('--screen-height', `${this.deviceInfo.screenHeight}px`);
        root.style.setProperty('--pixel-ratio', this.deviceInfo.pixelRatio);
        
        // 安全区域变量（iOS刘海屏支持）
        if (this.deviceInfo.isIOS) {
            root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
            root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
            root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
            root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
        }

        // 动态视口高度（解决移动端地址栏问题）
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            root.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100); // 延迟执行，等待方向改变完成
        });
    }

    /**
     * 优化触控体验
     */
    optimizeTouch() {
        if (!this.deviceInfo.hasTouch) return;

        // 添加触控样式
        this.addTouchStyles();
        
        // 优化点击延迟
        this.optimizeClickDelay();
        
        // 添加触控反馈
        this.addTouchFeedback();
        
        // 优化滚动
        this.optimizeTouchScroll();
    }

    /**
     * 添加触控样式
     */
    addTouchStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 移动端优化样式 */
            * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                user-select: none;
            }
            
            input, textarea, [contenteditable] {
                -webkit-user-select: text;
                user-select: text;
            }
            
            /* 按钮触控优化 */
            button, .btn, [role="button"] {
                min-height: 44px;
                min-width: 44px;
                touch-action: manipulation;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            
            /* 触控反馈效果 */
            .touch-feedback {
                position: relative;
                overflow: hidden;
            }
            
            .touch-feedback::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
                pointer-events: none;
                z-index: 1;
            }
            
            .touch-feedback.active::before {
                width: 200px;
                height: 200px;
            }
            
            /* 滚动优化 */
            .scroll-container {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
            }
            
            /* 表单优化 */
            input, textarea, select {
                font-size: 16px; /* 防止iOS缩放 */
                border-radius: 0; /* 移除iOS默认圆角 */
                -webkit-appearance: none;
                appearance: none;
            }
            
            /* 响应式布局 */
            .container {
                padding-left: max(16px, env(safe-area-inset-left));
                padding-right: max(16px, env(safe-area-inset-right));
            }
            
            .full-height {
                height: 100vh;
                height: calc(var(--vh, 1vh) * 100);
            }
            
            /* 底部导航安全区域 */
            .bottom-nav {
                padding-bottom: max(16px, env(safe-area-inset-bottom));
            }
            
            /* 媒体查询 */
            @media (max-width: 768px) {
                .desktop-only {
                    display: none !important;
                }
                
                .mobile-hidden {
                    display: none !important;
                }
                
                /* 字体大小调整 */
                body {
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                h1 { font-size: 24px; }
                h2 { font-size: 20px; }
                h3 { font-size: 18px; }
                h4 { font-size: 16px; }
                
                /* 间距调整 */
                .section {
                    padding: 16px;
                    margin-bottom: 16px;
                }
                
                /* 按钮调整 */
                .btn {
                    padding: 12px 20px;
                    font-size: 16px;
                    border-radius: 8px;
                }
                
                /* 表格响应式 */
                .table-responsive {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                
                table {
                    min-width: 600px;
                }
            }
            
            @media (max-width: 480px) {
                /* 小屏幕优化 */
                .container {
                    padding-left: 12px;
                    padding-right: 12px;
                }
                
                .section {
                    padding: 12px;
                    margin-bottom: 12px;
                }
                
                .btn {
                    padding: 10px 16px;
                    font-size: 14px;
                }
            }
            
            /* 横屏优化 */
            @media (orientation: landscape) and (max-height: 500px) {
                .landscape-hidden {
                    display: none !important;
                }
                
                .full-height {
                    height: 100vh;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * 优化点击延迟
     */
    optimizeClickDelay() {
        // 使用touchstart和touchend模拟快速点击
        let touchStartTime = 0;
        let touchStartTarget = null;
        
        document.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchStartTarget = e.target;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            // 如果触控时间短且目标一致，触发快速点击
            if (touchDuration < 200 && e.target === touchStartTarget) {
                const clickableElement = e.target.closest('button, .btn, [role="button"], a, input[type="button"], input[type="submit"]');
                if (clickableElement && !clickableElement.disabled) {
                    e.preventDefault();
                    
                    // 添加触控反馈
                    this.addTouchFeedbackEffect(clickableElement, e);
                    
                    // 延迟触发点击，给用户视觉反馈时间
                    setTimeout(() => {
                        clickableElement.click();
                    }, 50);
                }
            }
        }, { passive: false });
    }

    /**
     * 添加触控反馈
     */
    addTouchFeedback() {
        // 为所有可点击元素添加触控反馈类
        const clickableElements = document.querySelectorAll('button, .btn, [role="button"], a');
        clickableElements.forEach(element => {
            if (!element.classList.contains('touch-feedback')) {
                element.classList.add('touch-feedback');
            }
        });
    }

    /**
     * 添加触控反馈效果
     * @param {HTMLElement} element - 目标元素
     * @param {TouchEvent} event - 触控事件
     */
    addTouchFeedbackEffect(element, event) {
        element.classList.add('active');
        
        // 移除反馈效果
        setTimeout(() => {
            element.classList.remove('active');
        }, 300);
        
        // 添加震动反馈（如果支持）
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    /**
     * 优化触控滚动
     */
    optimizeTouchScroll() {
        // 为滚动容器添加优化类
        const scrollContainers = document.querySelectorAll('.scroll-container, .overflow-auto, .overflow-y-auto');
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.scrollBehavior = 'smooth';
        });
        
        // 防止过度滚动
        document.addEventListener('touchmove', (e) => {
            const target = e.target.closest('.scroll-container, .overflow-auto, .overflow-y-auto');
            if (!target) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * 优化布局
     */
    optimizeLayout() {
        // 修复现有布局问题
        this.fixLayoutIssues();
        
        // 优化表格显示
        this.optimizeTables();
        
        // 优化模态框
        this.optimizeModals();
        
        // 优化导航
        this.optimizeNavigation();
    }

    /**
     * 修复布局问题
     */
    fixLayoutIssues() {
        // 修复固定定位元素
        const fixedElements = document.querySelectorAll('[style*="position: fixed"], .fixed');
        fixedElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.position === 'fixed') {
                // 确保固定元素不会被虚拟键盘影响
                element.style.transform = 'translateZ(0)';
            }
        });
        
        // 修复全屏容器
        const fullHeightElements = document.querySelectorAll('.full-height, [style*="height: 100vh"]');
        fullHeightElements.forEach(element => {
            element.classList.add('full-height');
        });
    }

    /**
     * 优化表格
     */
    optimizeTables() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            // 如果表格没有响应式包装器，添加一个
            if (!table.closest('.table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    /**
     * 优化模态框
     */
    optimizeModals() {
        const modals = document.querySelectorAll('.modal, .dialog, .popup');
        modals.forEach(modal => {
            // 确保模态框在移动端正确显示
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.zIndex = '9999';
            
            // 添加关闭手势
            this.addSwipeToClose(modal);
        });
    }

    /**
     * 添加滑动关闭功能
     * @param {HTMLElement} modal - 模态框元素
     */
    addSwipeToClose(modal) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        modal.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });
        
        modal.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // 向下滑动时添加视觉反馈
            if (deltaY > 0) {
                modal.style.transform = `translateY(${deltaY * 0.5}px)`;
                modal.style.opacity = Math.max(0.5, 1 - deltaY / 300);
            }
        }, { passive: true });
        
        modal.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const deltaY = currentY - startY;
            isDragging = false;
            
            // 如果滑动距离超过阈值，关闭模态框
            if (deltaY > 100) {
                modal.style.transform = 'translateY(100%)';
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.style.display = 'none';
                    modal.style.transform = '';
                    modal.style.opacity = '';
                }, 300);
            } else {
                // 恢复原位
                modal.style.transform = '';
                modal.style.opacity = '';
            }
        }, { passive: true });
    }

    /**
     * 优化导航
     */
    optimizeNavigation() {
        const navElements = document.querySelectorAll('.nav, .navigation, .bottom-nav');
        navElements.forEach(nav => {
            // 添加安全区域支持
            if (nav.classList.contains('bottom-nav') || 
                window.getComputedStyle(nav).bottom === '0px') {
                nav.classList.add('bottom-nav');
            }
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 方向改变监听
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // 窗口大小改变监听
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // 虚拟键盘监听（iOS）
        if (this.deviceInfo.isIOS) {
            this.setupKeyboardListeners();
        }
    }

    /**
     * 处理方向改变
     */
    handleOrientationChange() {
        this.deviceInfo.orientation = window.orientation || 0;
        
        // 更新CSS变量
        this.setCSSVariables();
        
        // 触发自定义事件
        this.orientationHandlers.forEach(handler => {
            try {
                handler(this.deviceInfo.orientation);
            } catch (error) {
                console.error('方向改变处理器错误:', error);
            }
        });
        
        console.log('设备方向已改变:', this.deviceInfo.orientation);
    }

    /**
     * 处理窗口大小改变
     */
    handleResize() {
        // 更新设备信息
        this.deviceInfo.screenWidth = window.screen.width;
        this.deviceInfo.screenHeight = window.screen.height;
        
        // 更新CSS变量
        this.setCSSVariables();
        
        // 触发自定义事件
        this.resizeHandlers.forEach(handler => {
            try {
                handler(this.deviceInfo);
            } catch (error) {
                console.error('窗口大小改变处理器错误:', error);
            }
        });
    }

    /**
     * 设置键盘监听器（iOS）
     */
    setupKeyboardListeners() {
        let initialViewportHeight = window.innerHeight;
        
        const handleViewportChange = () => {
            const currentHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            if (heightDifference > 150) {
                // 键盘显示
                document.body.classList.add('keyboard-open');
                document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`);
            } else {
                // 键盘隐藏
                document.body.classList.remove('keyboard-open');
                document.documentElement.style.removeProperty('--keyboard-height');
            }
        };
        
        window.addEventListener('resize', handleViewportChange);
        
        // 输入框焦点事件
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea, select')) {
                setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    }

    /**
     * 防止缩放
     */
    preventZoom() {
        // 防止双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        // 防止手势缩放
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    /**
     * 优化滚动
     */
    optimizeScrolling() {
        // 平滑滚动
        if ('scrollBehavior' in document.documentElement.style) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }
        
        // 滚动性能优化
        let ticking = false;
        
        const updateScrollPosition = () => {
            // 更新滚动相关的UI
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        }, { passive: true });
    }

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 添加方向改变监听器
     * @param {Function} handler - 处理函数
     */
    onOrientationChange(handler) {
        this.orientationHandlers.add(handler);
    }

    /**
     * 移除方向改变监听器
     * @param {Function} handler - 处理函数
     */
    offOrientationChange(handler) {
        this.orientationHandlers.delete(handler);
    }

    /**
     * 添加窗口大小改变监听器
     * @param {Function} handler - 处理函数
     */
    onResize(handler) {
        this.resizeHandlers.add(handler);
    }

    /**
     * 移除窗口大小改变监听器
     * @param {Function} handler - 处理函数
     */
    offResize(handler) {
        this.resizeHandlers.delete(handler);
    }

    /**
     * 获取设备信息
     * @returns {Object} 设备信息
     */
    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    /**
     * 检查是否为移动设备
     * @returns {boolean} 是否为移动设备
     */
    isMobile() {
        return this.deviceInfo.isMobile;
    }

    /**
     * 检查是否支持触控
     * @returns {boolean} 是否支持触控
     */
    hasTouch() {
        return this.deviceInfo.hasTouch;
    }

    /**
     * 生成移动端优化报告
     * @returns {Object} 优化报告
     */
    generateOptimizationReport() {
        return {
            timestamp: new Date().toISOString(),
            deviceInfo: this.deviceInfo,
            optimizations: [
                '视口配置优化',
                '触控体验优化',
                '响应式布局优化',
                '滚动性能优化',
                '键盘适配优化',
                '安全区域支持'
            ],
            recommendations: [
                '定期测试不同设备和屏幕尺寸',
                '使用真机测试触控体验',
                '监控移动端性能指标',
                '关注新设备的适配需求'
            ]
        };
    }
}

// 自动初始化移动端优化
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimization = new MobileOptimization();
    console.log('移动端优化已启动');
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimization;
}