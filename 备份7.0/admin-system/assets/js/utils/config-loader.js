/**
 * 配置加载器 - Config Loader
 * 基于Context7 MCP标准的配置管理系统
 * 负责加载和管理所有配置文件
 */
class ConfigLoader {
    constructor() {
        this.configs = new Map();
        this.loadPromises = new Map();
        this.initialized = false;
    }

    /**
     * 初始化配置加载器
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            // 并行加载所有配置文件
            const configPromises = [
                this.loadConfig('admin', './config/admin-config.json'),
                this.loadConfig('theme', './config/theme-config.json'),
                this.loadConfig('api', './config/api-config.json')
            ];

            await Promise.all(configPromises);
            
            // 应用主题配置
            this.applyThemeConfig();
            
            this.initialized = true;
            console.log('配置加载器初始化完成');
            
        } catch (error) {
            console.error('配置加载器初始化失败:', error);
            throw new Error('配置文件加载失败');
        }
    }

    /**
     * 加载单个配置文件
     * @param {string} name - 配置名称
     * @param {string} url - 配置文件URL
     */
    async loadConfig(name, url) {
        // 避免重复加载
        if (this.loadPromises.has(name)) {
            return this.loadPromises.get(name);
        }

        const loadPromise = this.fetchConfig(url);
        this.loadPromises.set(name, loadPromise);

        try {
            const config = await loadPromise;
            this.configs.set(name, config);
            console.log(`配置文件 ${name} 加载成功`);
            return config;
        } catch (error) {
            console.error(`配置文件 ${name} 加载失败:`, error);
            this.loadPromises.delete(name);
            throw error;
        }
    }

    /**
     * 获取配置文件内容
     * @param {string} url - 配置文件URL
     */
    async fetchConfig(url) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * 获取配置
     * @param {string} name - 配置名称
     * @param {string} path - 配置路径（可选）
     */
    get(name, path = null) {
        const config = this.configs.get(name);
        
        if (!config) {
            console.warn(`配置 ${name} 不存在`);
            return null;
        }

        if (!path) {
            return config;
        }

        // 支持点号路径访问，如 'layout.sidebar.width'
        return this.getNestedValue(config, path);
    }

    /**
     * 获取嵌套值
     * @param {object} obj - 对象
     * @param {string} path - 路径
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    /**
     * 设置配置值
     * @param {string} name - 配置名称
     * @param {string} path - 配置路径
     * @param {any} value - 配置值
     */
    set(name, path, value) {
        const config = this.configs.get(name);
        
        if (!config) {
            console.warn(`配置 ${name} 不存在`);
            return false;
        }

        this.setNestedValue(config, path, value);
        return true;
    }

    /**
     * 设置嵌套值
     * @param {object} obj - 对象
     * @param {string} path - 路径
     * @param {any} value - 值
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * 应用主题配置
     */
    applyThemeConfig() {
        const themeConfig = this.get('theme');
        if (!themeConfig) {
            console.warn('主题配置不存在');
            return;
        }

        const root = document.documentElement;
        
        // 应用颜色变量
        if (themeConfig.colors) {
            this.applyCSSVariables(root, themeConfig.colors, 'color');
        }

        // 应用字体变量
        if (themeConfig.typography) {
            this.applyCSSVariables(root, themeConfig.typography, 'font');
        }

        // 应用间距变量
        if (themeConfig.spacing) {
            this.applyCSSVariables(root, themeConfig.spacing, 'spacing');
        }

        // 应用其他样式变量
        ['borderRadius', 'shadows', 'breakpoints'].forEach(key => {
            if (themeConfig[key]) {
                this.applyCSSVariables(root, themeConfig[key], this.kebabCase(key));
            }
        });

        console.log('主题配置应用完成');
    }

    /**
     * 应用CSS变量
     * @param {HTMLElement} element - 目标元素
     * @param {object} variables - 变量对象
     * @param {string} prefix - 前缀
     */
    applyCSSVariables(element, variables, prefix) {
        Object.entries(variables).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                // 递归处理嵌套对象
                this.applyCSSVariables(element, value, `${prefix}-${this.kebabCase(key)}`);
            } else {
                // 设置CSS变量
                const cssVarName = `--${prefix}-${this.kebabCase(key)}`;
                element.style.setProperty(cssVarName, value);
            }
        });
    }

    /**
     * 转换为kebab-case
     * @param {string} str - 字符串
     */
    kebabCase(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * 重新加载配置
     * @param {string} name - 配置名称（可选）
     */
    async reload(name = null) {
        if (name) {
            // 重新加载指定配置
            this.loadPromises.delete(name);
            const url = this.getConfigUrl(name);
            if (url) {
                await this.loadConfig(name, url);
                if (name === 'theme') {
                    this.applyThemeConfig();
                }
            }
        } else {
            // 重新加载所有配置
            this.configs.clear();
            this.loadPromises.clear();
            this.initialized = false;
            await this.init();
        }
    }

    /**
     * 获取配置文件URL
     * @param {string} name - 配置名称
     */
    getConfigUrl(name) {
        const urls = {
            'admin': './config/admin-config.json',
            'theme': './config/theme-config.json',
            'api': './config/api-config.json'
        };
        return urls[name];
    }

    /**
     * 获取所有配置名称
     */
    getConfigNames() {
        return Array.from(this.configs.keys());
    }

    /**
     * 检查配置是否存在
     * @param {string} name - 配置名称
     */
    has(name) {
        return this.configs.has(name);
    }

    /**
     * 获取配置状态
     */
    getStatus() {
        return {
            initialized: this.initialized,
            loadedConfigs: this.getConfigNames(),
            totalConfigs: Object.keys({
                'admin': './config/admin-config.json',
                'theme': './config/theme-config.json',
                'api': './config/api-config.json'
            }).length
        };
    }

    /**
     * 导出配置（用于调试）
     */
    exportConfigs() {
        const exported = {};
        this.configs.forEach((config, name) => {
            exported[name] = config;
        });
        return exported;
    }
}

// 创建全局实例
window.ConfigLoader = new ConfigLoader();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
}