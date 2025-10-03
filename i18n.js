/**
 * 国际化核心功能
 * 支持多语言切换和文本替换
 */
class I18n {
    constructor() {
        this.currentLang = 'zh-CN';
        this.translations = {};
        this.fallbackLang = 'zh-CN';
        
        // 从localStorage获取用户语言偏好
        const savedLang = localStorage.getItem('gold7_language');
        if (savedLang) {
            this.currentLang = savedLang;
        } else {
            // 检测浏览器语言
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('en')) {
                this.currentLang = 'en-US';
            }
        }
        
        this.init();
    }
    
    async init() {
        try {
            // 加载当前语言包
            await this.loadLanguage(this.currentLang);
            
            // 如果当前语言不是回退语言，也加载回退语言包
            if (this.currentLang !== this.fallbackLang) {
                await this.loadLanguage(this.fallbackLang);
            }
            
            // 应用翻译
            this.applyTranslations();
            
            // 触发语言加载完成事件
            window.dispatchEvent(new CustomEvent('i18nLoaded', { 
                detail: { language: this.currentLang } 
            }));
        } catch (error) {
            console.error('I18n initialization failed:', error);
        }
    }
    
    async loadLanguage(lang) {
        try {
            // 动态加载语言包 JS 文件
            const script = document.createElement('script');
            script.src = `i18n/${lang}.js`;
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    // 语言包加载后，从全局变量获取翻译数据
                    const langData = window[lang.replace('-', '')];
                    if (langData) {
                        this.translations[lang] = langData;
                        resolve();
                    } else {
                        reject(new Error(`Language data not found for ${lang}`));
                    }
                };
                
                script.onerror = () => {
                    reject(new Error(`Failed to load language file: ${lang}.js`));
                };
                
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error(`Failed to load language ${lang}:`, error);
            // 如果加载失败，使用空对象作为回退
            if (!this.translations[lang]) {
                this.translations[lang] = {};
            }
        }
    }
    
    async setLanguage(lang) {
        if (lang === this.currentLang) {
            return;
        }
        
        // 加载新语言包（如果还没加载）
        if (!this.translations[lang]) {
            await this.loadLanguage(lang);
        }
        
        this.currentLang = lang;
        localStorage.setItem('gold7_language', lang);
        
        // 重新应用翻译
        this.applyTranslations();
        
        // 触发语言切换事件
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
    }
    
    t(key, params = {}) {
        let text = this.getTranslation(key, this.currentLang);
        
        // 如果当前语言没有找到，尝试回退语言
        if (!text && this.currentLang !== this.fallbackLang) {
            text = this.getTranslation(key, this.fallbackLang);
        }
        
        // 如果还是没找到，返回 key 本身
        if (!text) {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }
        
        // 参数替换
        return this.interpolate(text, params);
    }
    
    getTranslation(key, lang) {
        const translations = this.translations[lang];
        if (!translations) {
            return null;
        }
        
        // 支持嵌套键名，如 'user.name'
        const keys = key.split('.');
        let result = translations;
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return null;
            }
        }
        
        return typeof result === 'string' ? result : null;
    }
    
    interpolate(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params.hasOwnProperty(key) ? params[key] : match;
        });
    }
    
    applyTranslations() {
        // 查找所有带有 data-i18n 属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const paramsAttr = element.getAttribute('data-i18n-params');
            
            let params = {};
            if (paramsAttr) {
                try {
                    params = JSON.parse(paramsAttr);
                } catch (e) {
                    console.warn('Invalid i18n params:', paramsAttr);
                }
            }
            
            const translation = this.t(key, params);
            
            // 根据元素类型设置文本
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.type === 'submit' || element.type === 'button') {
                    element.value = translation;
                } else {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });
    }
    
    getCurrentLanguage() {
        return this.currentLang;
    }
    
    getAvailableLanguages() {
        return [
            { code: 'zh-CN', name: '中文' },
            { code: 'en-US', name: 'English' }
        ];
    }
}

// 创建全局实例
window.i18n = new I18n();

// 导出供 Node.js 使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}