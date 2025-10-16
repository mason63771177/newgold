/**
 * 浏览器兼容性处理脚本
 * 确保跨浏览器的一致性体验
 */

(function() {
    'use strict';
    
    // 浏览器检测
    const BrowserDetector = {
        isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
        isFirefox: /Firefox/.test(navigator.userAgent),
        isSafari: /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor),
        isEdge: /Edge/.test(navigator.userAgent),
        isIE: /Trident/.test(navigator.userAgent)
    };
    
    // 页面跳转优化器
    const NavigationOptimizer = {
        // 防止重复跳转的标志
        redirectFlags: {},
        
        /**
         * 优化页面跳转，减少闪烁
         * @param {string} url - 目标URL
         * @param {string} key - 跳转标识键
         * @param {number} delay - 延迟时间（毫秒）
         */
        smoothRedirect: function(url, key, delay = 50) {
            // 防止重复跳转
            if (this.redirectFlags[key]) {
                return false;
            }
            this.redirectFlags[key] = true;
            
            // 检查是否已在目标页面
            const currentHref = window.location.href;
            const currentPath = window.location.pathname;
            
            if (currentHref.includes(url) || currentPath.endsWith(url)) {
                console.log(`已在目标页面 ${url}，无需跳转`);
                return false;
            }
            
            // 根据浏览器类型调整延迟
            let adjustedDelay = delay;
            if (BrowserDetector.isSafari) {
                adjustedDelay = delay + 50; // Safari需要更长延迟
            } else if (BrowserDetector.isFirefox) {
                adjustedDelay = delay + 30; // Firefox需要适中延迟
            }
            
            console.log(`准备跳转到 ${url}，延迟 ${adjustedDelay}ms`);
            
            setTimeout(() => {
                window.location.href = url;
            }, adjustedDelay);
            
            return true;
        },
        
        /**
         * 重置跳转标志
         * @param {string} key - 跳转标识键
         */
        resetRedirectFlag: function(key) {
            delete this.redirectFlags[key];
        }
    };
    
    // 页面状态管理器
    const PageStateManager = {
        // 页面状态缓存
        stateCache: {},
        
        /**
         * 检查页面状态
         * @param {string} pageType - 页面类型 ('index', 'login')
         * @returns {boolean} 是否在指定页面
         */
        isOnPage: function(pageType) {
            const currentPath = window.location.pathname;
            const currentHref = window.location.href;
            
            switch (pageType) {
                case 'index':
                    return currentPath.endsWith('/') || 
                           currentPath.endsWith('/newgold/') ||
                           currentPath.endsWith('index.html') ||
                           currentHref.includes('index.html');
                           
                case 'login':
                    return currentPath.endsWith('login.html') ||
                           currentHref.includes('login.html');
                           
                default:
                    return false;
            }
        },
        
        /**
         * 缓存页面状态
         * @param {string} key - 缓存键
         * @param {any} value - 缓存值
         */
        cacheState: function(key, value) {
            this.stateCache[key] = {
                value: value,
                timestamp: Date.now()
            };
        },
        
        /**
         * 获取缓存的页面状态
         * @param {string} key - 缓存键
         * @param {number} maxAge - 最大缓存时间（毫秒）
         * @returns {any} 缓存值或null
         */
        getCachedState: function(key, maxAge = 5000) {
            const cached = this.stateCache[key];
            if (!cached) return null;
            
            if (Date.now() - cached.timestamp > maxAge) {
                delete this.stateCache[key];
                return null;
            }
            
            return cached.value;
        }
    };
    
    // DOM 就绪状态检查器
    const DOMReadyChecker = {
        /**
         * 确保DOM完全就绪后执行回调
         * @param {Function} callback - 回调函数
         */
        whenReady: function(callback) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                // DOM已就绪，立即执行
                callback();
            }
        }
    };
    
    // 将工具暴露到全局
    window.BrowserCompatibility = {
        BrowserDetector,
        NavigationOptimizer,
        PageStateManager,
        DOMReadyChecker
    };
    
    console.log('浏览器兼容性模块已加载', {
        browser: Object.keys(BrowserDetector).find(key => BrowserDetector[key]) || 'unknown',
        userAgent: navigator.userAgent
    });
    
})();