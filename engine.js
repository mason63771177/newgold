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
            console.error(`Failed to load language pack: ${lang}`, error);
            // 使用文本配置作为后备
            this.texts[lang] = this.textsConfig;
        }
    }

    /**
     * 获取翻译文本
     * @param {string} key - 文本键，支持点分隔的嵌套结构
     * @param {object} params - 参数对象，用于文本插值
     * @returns {string} 翻译后的文本
     */
    t(key, params = {}) {
        // 缓存机制提高性能
        const cacheKey = `${this.currentLang}:${key}:${JSON.stringify(params)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let text = this.getNestedValue(this.texts[this.currentLang], key);
        
        // 如果当前语言没有找到，尝试使用中文作为后备
        if (!text && this.currentLang !== 'zh-CN') {
            text = this.getNestedValue(this.texts['zh-CN'], key);
        }
        
        // 如果还是没找到，返回键名
        if (!text) {
            console.warn(`Translation not found for key: ${key}`);
            text = key;
        }

        // 参数插值
        if (params && Object.keys(params).length > 0) {
            text = this.interpolate(text, params);
        }
        
        this.cache.set(cacheKey, text);
        return text;
    }

    /**
     * 获取嵌套对象的值
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    /**
     * 文本插值处理
     */
    interpolate(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * 切换语言
     */
    async switchLanguage(lang) {
        if (lang === this.currentLang) {
            return;
        }

        try {
            await this.loadLanguage(lang);
            this.currentLang = lang;
            localStorage.setItem('app_language', lang);
            
            // 清空缓存
            this.cache.clear();
            
            // 重新渲染页面
            this.renderPage();
            
            // 通知观察者
            this.notifyObservers('languageChanged', lang);
            
            console.log(`Language switched to: ${lang}`);
        } catch (error) {
            console.error(`Failed to switch language to ${lang}:`, error);
            throw error;
        }
    }

    /**
     * 自动扫描并替换页面中的文本
     */
    renderPage() {
        // 替换HTML中的 {{key}} 模板
        this.replaceHTMLTexts();
        
        // 替换属性中的文本（如title, placeholder等）
        this.replaceAttributes();
        
        // 触发自定义事件，通知其他组件更新
        this.triggerCustomEvents();
    }

    /**
     * 替换HTML文本内容
     */
    replaceHTMLTexts() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim() && node.textContent.includes('{{')) {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            const originalText = textNode.textContent;
            const newText = originalText.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                return this.t(key.trim());
            });
            
            if (newText !== originalText) {
                textNode.textContent = newText;
            }
        });
    }

    /**
     * 替换元素属性中的文本
     */
    replaceAttributes() {
        const attributesToReplace = ['title', 'placeholder', 'alt', 'aria-label'];
        
        attributesToReplace.forEach(attr => {
            const elements = document.querySelectorAll(`[${attr}*="{{"]`);
            elements.forEach(element => {
                const originalValue = element.getAttribute(attr);
                const newValue = originalValue.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                    return this.t(key.trim());
                });
                
                if (newValue !== originalValue) {
                    element.setAttribute(attr, newValue);
                }
            });
        });
    }

    /**
     * 触发自定义事件
     */
    triggerCustomEvents() {
        // 触发语言更新事件，让其他组件可以监听并更新
        const event = new CustomEvent('i18nUpdated', {
            detail: { language: this.currentLang }
        });
        document.dispatchEvent(event);
    }

    /**
     * 设置DOM变化监听器
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            if (node.textContent && node.textContent.includes('{{')) {
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
            { code: 'zh-CN', name: '简体中文' },
            { code: 'en-US', name: 'English' },
            { code: 'ja-JP', name: '日本語' }
        ];
    }

    /**
     * 获取当前语言
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
    }
}

// 创建全局实例
window.i18n = new I18nEngine();

// 提供全局函数
window.$t = (key, params) => window.i18n.t(key, params);

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nEngine;
}