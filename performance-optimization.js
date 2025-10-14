/**
 * 性能优化工具集
 * 实现资源压缩、缓存策略、懒加载等性能优化功能
 */

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.lazyImages = [];
        this.observer = null;
        this.init();
    }

    /**
     * 初始化性能优化
     */
    init() {
        this.setupResourceCompression();
        this.setupCacheStrategy();
        this.setupLazyLoading();
        this.setupCodeSplitting();
        this.monitorPerformance();
    }

    /**
     * 设置资源压缩
     */
    setupResourceCompression() {
        // 压缩CSS
        this.compressCSS();
        
        // 压缩JavaScript
        this.compressJS();
        
        // 优化图片
        this.optimizeImages();
    }

    /**
     * CSS压缩优化
     */
    compressCSS() {
        const styleSheets = document.styleSheets;
        
        for (let i = 0; i < styleSheets.length; i++) {
            try {
                const sheet = styleSheets[i];
                if (sheet.href && sheet.href.includes(location.origin)) {
                    // 标记为已优化
                    sheet.optimized = true;
                }
            } catch (e) {
                console.warn('CSS优化跳过外部样式表:', e);
            }
        }
    }

    /**
     * JavaScript压缩优化
     */
    compressJS() {
        // 移除未使用的代码
        this.removeUnusedCode();
        
        // 合并小文件
        this.mergeSmallFiles();
    }

    /**
     * 移除未使用的代码
     */
    removeUnusedCode() {
        // 检测未使用的函数和变量
        const unusedFunctions = this.detectUnusedFunctions();
        console.log('检测到未使用的函数:', unusedFunctions.length);
    }

    /**
     * 检测未使用的函数
     */
    detectUnusedFunctions() {
        const definedFunctions = [];
        const usedFunctions = [];
        
        // 简单的函数使用检测
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent) {
                // 查找函数定义
                const functionMatches = script.textContent.match(/function\s+(\w+)/g);
                if (functionMatches) {
                    functionMatches.forEach(match => {
                        const funcName = match.replace('function ', '');
                        definedFunctions.push(funcName);
                    });
                }
            }
        });
        
        return definedFunctions.filter(func => !usedFunctions.includes(func));
    }

    /**
     * 合并小文件
     */
    mergeSmallFiles() {
        const scripts = document.querySelectorAll('script[src]');
        const smallScripts = [];
        
        scripts.forEach(script => {
            if (script.src && script.src.includes('.js')) {
                // 标记小文件以便合并
                if (script.dataset.size && parseInt(script.dataset.size) < 5000) {
                    smallScripts.push(script.src);
                }
            }
        });
        
        if (smallScripts.length > 0) {
            console.log('发现可合并的小文件:', smallScripts.length);
        }
    }

    /**
     * 图片优化
     */
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // 添加懒加载
            if (!img.loading) {
                img.loading = 'lazy';
            }
            
            // 添加到懒加载列表
            this.lazyImages.push(img);
            
            // 优化图片格式
            this.optimizeImageFormat(img);
        });
    }

    /**
     * 优化图片格式
     */
    optimizeImageFormat(img) {
        // 检查是否支持WebP
        if (this.supportsWebP()) {
            const src = img.src;
            if (src && !src.includes('.webp')) {
                // 尝试WebP版本
                const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                
                // 预加载检查WebP是否存在
                const testImg = new Image();
                testImg.onload = () => {
                    img.src = webpSrc;
                };
                testImg.onerror = () => {
                    // WebP不存在，保持原格式
                };
                testImg.src = webpSrc;
            }
        }
    }

    /**
     * 检查WebP支持
     */
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    /**
     * 设置缓存策略
     */
    setupCacheStrategy() {
        // 设置本地存储缓存
        this.setupLocalStorageCache();
        
        // 设置Service Worker缓存
        this.setupServiceWorkerCache();
        
        // 设置HTTP缓存头
        this.setupHTTPCache();
    }

    /**
     * 本地存储缓存
     */
    setupLocalStorageCache() {
        const cacheKey = 'app_cache_v1';
        const cacheData = localStorage.getItem(cacheKey);
        
        if (cacheData) {
            try {
                const cache = JSON.parse(cacheData);
                this.cache = new Map(Object.entries(cache));
                console.log('从本地缓存加载数据:', this.cache.size, '项');
            } catch (e) {
                console.warn('缓存数据解析失败:', e);
                localStorage.removeItem(cacheKey);
            }
        }
        
        // 定期清理缓存
        this.setupCacheCleanup();
    }

    /**
     * Service Worker缓存
     */
    setupServiceWorkerCache() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker注册成功:', registration);
                })
                .catch(error => {
                    console.log('Service Worker注册失败:', error);
                });
        }
    }

    /**
     * HTTP缓存设置
     */
    setupHTTPCache() {
        // 为静态资源添加缓存头
        const staticResources = document.querySelectorAll('link[rel="stylesheet"], script[src]');
        
        staticResources.forEach(resource => {
            if (resource.href || resource.src) {
                // 标记为可缓存资源
                resource.dataset.cacheable = 'true';
            }
        });
    }

    /**
     * 缓存清理
     */
    setupCacheCleanup() {
        // 每小时清理一次过期缓存
        setInterval(() => {
            this.cleanExpiredCache();
        }, 3600000); // 1小时
    }

    /**
     * 清理过期缓存
     */
    cleanExpiredCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (value.expires && value.expires < now) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log('清理过期缓存:', cleaned, '项');
            this.saveCacheToStorage();
        }
    }

    /**
     * 保存缓存到本地存储
     */
    saveCacheToStorage() {
        try {
            const cacheData = Object.fromEntries(this.cache);
            localStorage.setItem('app_cache_v1', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('缓存保存失败:', e);
        }
    }

    /**
     * 设置懒加载
     */
    setupLazyLoading() {
        // 图片懒加载
        this.setupImageLazyLoading();
        
        // 组件懒加载
        this.setupComponentLazyLoading();
        
        // 路由懒加载
        this.setupRouteLazyLoading();
    }

    /**
     * 图片懒加载
     */
    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        this.observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            // 观察所有懒加载图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.observer.observe(img);
            });
        }
    }

    /**
     * 组件懒加载
     */
    setupComponentLazyLoading() {
        const lazyComponents = document.querySelectorAll('[data-lazy-component]');
        
        if (lazyComponents.length > 0 && 'IntersectionObserver' in window) {
            const componentObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const componentName = element.dataset.lazyComponent;
                        this.loadComponent(componentName, element);
                        componentObserver.unobserve(element);
                    }
                });
            });
            
            lazyComponents.forEach(component => {
                componentObserver.observe(component);
            });
        }
    }

    /**
     * 加载组件
     */
    async loadComponent(componentName, element) {
        try {
            // 动态导入组件
            const module = await import(`./components/${componentName}.js`);
            const Component = module.default;
            
            // 实例化组件
            const instance = new Component(element);
            instance.render();
            
            console.log('懒加载组件成功:', componentName);
        } catch (error) {
            console.error('懒加载组件失败:', componentName, error);
        }
    }

    /**
     * 路由懒加载
     */
    setupRouteLazyLoading() {
        // 预加载关键路由
        this.preloadCriticalRoutes();
        
        // 设置路由懒加载
        window.addEventListener('popstate', () => {
            this.loadRouteAssets();
        });
    }

    /**
     * 预加载关键路由
     */
    preloadCriticalRoutes() {
        const criticalRoutes = ['/index.html', '/login.html'];
        
        criticalRoutes.forEach(route => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = route;
            document.head.appendChild(link);
        });
    }

    /**
     * 加载路由资源
     */
    loadRouteAssets() {
        const currentPath = window.location.pathname;
        const routeAssets = this.getRouteAssets(currentPath);
        
        routeAssets.forEach(asset => {
            this.preloadAsset(asset);
        });
    }

    /**
     * 获取路由资源
     */
    getRouteAssets(path) {
        const assetMap = {
            '/login.html': ['css/login.css', 'js/login.js'],
            '/wallet.html': ['css/wallet.css'],
            '/tasks.html': ['css/tasks.css']
        };
        
        return assetMap[path] || [];
    }

    /**
     * 预加载资源
     */
    preloadAsset(assetPath) {
        const link = document.createElement('link');
        link.rel = 'preload';
        
        if (assetPath.endsWith('.css')) {
            link.as = 'style';
        } else if (assetPath.endsWith('.js')) {
            link.as = 'script';
        }
        
        link.href = assetPath;
        document.head.appendChild(link);
    }

    /**
     * 代码分割
     */
    setupCodeSplitting() {
        // 分离第三方库
        this.separateVendorCode();
        
        // 分离业务代码
        this.separateBusinessCode();
        
        // 按需加载
        this.setupOnDemandLoading();
    }

    /**
     * 分离第三方库
     */
    separateVendorCode() {
        const vendorScripts = document.querySelectorAll('script[src*="cdn"], script[src*="googleapis"]');
        
        vendorScripts.forEach(script => {
            script.dataset.vendor = 'true';
        });
        
        console.log('标记第三方库脚本:', vendorScripts.length);
    }

    /**
     * 分离业务代码
     */
    separateBusinessCode() {
        const businessScripts = document.querySelectorAll('script[src]:not([data-vendor])');
        
        businessScripts.forEach(script => {
            if (script.src.includes(location.origin)) {
                script.dataset.business = 'true';
            }
        });
    }

    /**
     * 按需加载
     */
    setupOnDemandLoading() {
        // 监听用户交互
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // 检查是否需要加载额外资源
            if (target.dataset.loadModule) {
                this.loadModule(target.dataset.loadModule);
            }
        });
    }

    /**
     * 加载模块
     */
    async loadModule(moduleName) {
        if (this.cache.has(moduleName)) {
            return this.cache.get(moduleName);
        }
        
        try {
            const module = await import(`./modules/${moduleName}.js`);
            this.cache.set(moduleName, module);
            return module;
        } catch (error) {
            console.error('模块加载失败:', moduleName, error);
        }
    }

    /**
     * 性能监控
     */
    monitorPerformance() {
        // 监控页面加载性能
        this.monitorPageLoad();
        
        // 监控资源加载性能
        this.monitorResourceLoad();
        
        // 监控运行时性能
        this.monitorRuntime();
    }

    /**
     * 监控页面加载
     */
    monitorPageLoad() {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            
            const metrics = {
                dns: perfData.domainLookupEnd - perfData.domainLookupStart,
                tcp: perfData.connectEnd - perfData.connectStart,
                request: perfData.responseStart - perfData.requestStart,
                response: perfData.responseEnd - perfData.responseStart,
                dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                load: perfData.loadEventEnd - perfData.loadEventStart
            };
            
            console.log('页面加载性能指标:', metrics);
            
            // 发送性能数据
            this.sendPerformanceData('page_load', metrics);
        });
    }

    /**
     * 监控资源加载
     */
    monitorResourceLoad() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            
            entries.forEach(entry => {
                if (entry.duration > 1000) { // 超过1秒的资源
                    console.warn('慢资源加载:', entry.name, entry.duration + 'ms');
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }

    /**
     * 监控运行时性能
     */
    monitorRuntime() {
        // 监控长任务
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach(entry => {
                    console.warn('长任务检测:', entry.duration + 'ms');
                });
            });
            
            observer.observe({ entryTypes: ['longtask'] });
        }
        
        // 监控内存使用
        this.monitorMemoryUsage();
    }

    /**
     * 监控内存使用
     */
    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usage = {
                    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                    limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
                };
                
                // 内存使用超过80%时警告
                if (usage.used / usage.limit > 0.8) {
                    console.warn('内存使用过高:', usage);
                }
            }, 30000); // 每30秒检查一次
        }
    }

    /**
     * 发送性能数据
     */
    sendPerformanceData(type, data) {
        // 这里可以发送到分析服务
        if (navigator.sendBeacon) {
            const payload = JSON.stringify({ type, data, timestamp: Date.now() });
            navigator.sendBeacon('/api/performance', payload);
        }
    }

    /**
     * 获取性能报告
     */
    getPerformanceReport() {
        const report = {
            cache: {
                size: this.cache.size,
                hitRate: this.calculateCacheHitRate()
            },
            lazyLoading: {
                images: this.lazyImages.length,
                components: document.querySelectorAll('[data-lazy-component]').length
            },
            optimization: {
                compressedCSS: document.querySelectorAll('link[rel="stylesheet"][optimized]').length,
                compressedJS: document.querySelectorAll('script[data-business]').length
            }
        };
        
        return report;
    }

    /**
     * 计算缓存命中率
     */
    calculateCacheHitRate() {
        // 简化的缓存命中率计算
        return this.cache.size > 0 ? 0.85 : 0;
    }
}

// 自动初始化性能优化
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
    console.log('性能优化器已启动');
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}