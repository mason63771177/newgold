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
            script.src = `./i18n/lang/${lang}.js`;
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    // 根据语言代码获取全局变量
                    const varName = lang.replace('-', '');
                    const translations = window[varName];
                    
                    if (translations) {
                        this.translations[lang] = translations;
                        resolve(translations);
                    } else {
                        reject(new Error(`Language pack ${lang} not found`));
                    }
                };
                
                script.onerror = () => {
                    reject(new Error(`Failed to load language pack: ${lang}`));
                };
                
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error(`Error loading language ${lang}:`, error);
            if (lang !== this.fallbackLang) {
                console.warn(`Falling back to ${this.fallbackLang}`);
            }
        }
    }
    
    async setLanguage(lang) {
        if (lang === this.currentLang) return;
        
        // 保存语言偏好
        localStorage.setItem('gold7_language', lang);
        this.currentLang = lang;
        
        // 加载新语言包（如果尚未加载）
        if (!this.translations[lang]) {
            await this.loadLanguage(lang);
        }
        
        // 应用翻译
        this.applyTranslations();
        
        // 触发语言切换事件
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
    }
    
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        // 尝试从当前语言获取翻译
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                value = null;
                break;
            }
        }
        
        // 如果当前语言没有找到，尝试回退语言
        if (value === null && this.currentLang !== this.fallbackLang) {
            value = this.translations[this.fallbackLang];
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    value = null;
                    break;
                }
            }
        }
        
        // 如果仍然没有找到，返回key本身
        if (value === null) {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }
        
        // 参数替换
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] || match;
            });
        }
        
        return value;
    }
    
    applyTranslations() {
        // 查找所有带有 data-i18n 属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
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
        
        // 更新页面标题
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
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

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}