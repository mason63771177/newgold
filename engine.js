/**
 * 新一代国际化引擎
 * 特点：自动化、高性能、易扩展
 */
class I18nEngine {
    constructor() {
        this.currentLang = 'zh-CN';
        this.texts = {};
        this.cache = new Map();
        this.observers = [];
        this.isInitialized = false;
    }

    /**
     * 初始化国际化引擎
     */
    async init(defaultLang = 'zh-CN') {
        this.currentLang = localStorage.getItem('i18n-lang') || defaultLang;
        
        try {
            // 加载文本配置
            await this.loadTexts();
            
            // 加载当前语言包
            await this.loadLanguage(this.currentLang);
            
            // 设置全局函数
            window.$t = (key, params) => this.t(key, params);
            
            // 渲染页面
            this.renderPage();
            
            // 设置DOM变化监听
            this.setupMutationObserver();
            
            console.log(`I18n engine initialized with language: ${this.currentLang}`);
        } catch (error) {
            console.error('Failed to initialize i18n engine:', error);
        }
    }

    /**
     * 加载文本配置
     */
    async loadTexts() {
        try {
            // 在浏览器环境中，通过script标签加载
            if (typeof window !== 'undefined') {
                // 动态加载texts.js
                if (!window.TEXTS) {
                    const script = document.createElement('script');
                    script.src = 'i18n/texts.js';
                    document.head.appendChild(script);
                    
                    // 等待脚本加载完成
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                    });
                }
                this.textsConfig = window.TEXTS;
            } else {
                // Node.js环境
                this.textsConfig = require('./texts.js');
            }
        } catch (error) {
            console.error('Failed to load texts configuration:', error);
            this.textsConfig = {};
        }
    }

    /**
     * 加载语言包
     */
    async loadLanguage(lang) {
        if (this.texts[lang]) {
            return; // 已加载
        }

        try {
            if (typeof window !== 'undefined') {
                // 浏览器环境：动态加载语言包
                const script = document.createElement('script');
                script.src = `i18n/lang/${lang}.js`;
                document.head.appendChild(script);
                
                await new Promise((resolve, reject) => {
                    script.onload = () => {
                        // 根据语言代码获取对应的全局变量
                        const langVar = lang.replace('-', '');
                        this.texts[lang] = window[langVar] || this.textsConfig;
                        resolve();
                    };
                    script.onerror = reject;
                });
            } else {
                // Node.js环境
                this.texts[lang] = require(`./lang/${lang}.js`);
            }
        } catch (error) {
            console.warn(`Failed to load language pack for ${lang}:`, error);
            // 使用默认文本配置作为回退
            this.texts[lang] = this.textsConfig || {};
        }
    }

    /**
     * 获取翻译文本
     */
    t(key, params = {}) {
        // 检查缓存
        const cacheKey = `${this.currentLang}:${key}:${JSON.stringify(params)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // 获取文本
        let text = this.getNestedValue(this.texts[this.currentLang], key);
        
        // 如果没有找到，尝试使用默认语言
        if (!text && this.currentLang !== 'zh-CN') {
            text = this.getNestedValue(this.texts['zh-CN'], key);
        }
        
        // 如果还是没有找到，返回key本身
        if (!text) {
            text = key;
        }
        
        // 参数插值
        text = this.interpolate(text, params);
        
        // 缓存结果
        this.cache.set(cacheKey, text);
        
        return text;
    }

    /**
     * 获取嵌套对象的值
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * 参数插值
     */
    interpolate(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => params[key] || match);
    }

    /**
     * 切换语言
     */
    async switchLanguage(lang) {
        if (lang === this.currentLang) {
            return;
        }

        try {
            // 加载新语言包
            await this.loadLanguage(lang);
            
            // 更新当前语言
            this.currentLang = lang;
            
            // 保存到localStorage
            localStorage.setItem('i18n-lang', lang);
            
            // 清除缓存
            this.clearCache();
            
            // 重新渲染页面
            this.renderPage();
            
            // 通知观察者
            this.notifyObservers('languageChanged', { language: lang });
            
            console.log(`Language switched to: ${lang}`);
        } catch (error) {
            console.error(`Failed to switch language to ${lang}:`, error);
        }
    }

    /**
     * 渲染页面
     */
    renderPage() {
        if (typeof document === 'undefined') {
            return; // 非浏览器环境
        }

        this.replaceHTMLTexts();
        this.replaceAttributes();
        this.triggerCustomEvents();
    }

    /**
     * 替换HTML中的文本
     */
    replaceHTMLTexts() {
        // 查找所有带有data-i18n属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = element.getAttribute('data-i18n-params');
            
            let parsedParams = {};
            if (params) {
                try {
                    parsedParams = JSON.parse(params);
                } catch (error) {
                    console.warn('Invalid i18n params:', params);
                }
            }
            
            const translatedText = this.t(key, parsedParams);
            
            // 根据元素类型设置文本
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'email' || element.type === 'password')) {
                element.placeholder = translatedText;
            } else {
                element.textContent = translatedText;
            }
        });
    }

    /**
     * 替换属性中的文本
     */
    replaceAttributes() {
        const elements = document.querySelectorAll('[data-i18n-attr]');
        
        elements.forEach(element => {
            const attrConfig = element.getAttribute('data-i18n-attr');
            
            try {
                const config = JSON.parse(attrConfig);
                
                Object.keys(config).forEach(attr => {
                    const key = config[attr];
                    const translatedText = this.t(key);
                    element.setAttribute(attr, translatedText);
                });
            } catch (error) {
                console.warn('Invalid i18n attribute config:', attrConfig);
            }
        });
    }

    /**
     * 触发自定义事件
     */
    triggerCustomEvents() {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('i18nRendered', {
                detail: { language: this.currentLang }
            }));
        }
    }

    /**
     * 设置DOM变化监听
     */
    setupMutationObserver() {
        if (typeof window === 'undefined' || !window.MutationObserver) {
            return;
        }

        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查新添加的节点是否包含需要翻译的元素
                            if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                                shouldUpdate = true;
                            }
                            
                            // 检查子元素
                            if (node.querySelectorAll && node.querySelectorAll('[data-i18n]').length > 0) {
                                shouldUpdate = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldUpdate) {
                // 延迟执行，避免频繁更新
                setTimeout(() => this.renderPage(), 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 添加观察者
     */
    addObserver(callback) {
        this.observers.push(callback);
    }

    /**
     * 通知观察者
     */
    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Observer callback error:', error);
            }
        });
    }

    /**
     * 获取支持的语言列表
     */
    getSupportedLanguages() {
        return [
            { code: 'zh-CN', name: '中文' },
            { code: 'en-US', name: 'English' }
        ];
    }

    /**
     * 获取当前语言
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }
}

// 创建全局实例
window.i18n = new I18nEngine();

// 页面加载完成后初始化
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.i18n.init();
    });
}

// 导出模块（用于Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nEngine;
}