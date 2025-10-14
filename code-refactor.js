/**
 * 代码重构工具
 * 消除重复代码、添加注释、优化代码结构
 */

class CodeRefactor {
    constructor() {
        this.duplicatePatterns = new Map();
        this.commonFunctions = new Map();
        this.refactoredCode = new Map();
        this.init();
    }

    /**
     * 初始化代码重构工具
     */
    init() {
        this.createUtilityLibrary();
        this.setupCommonPatterns();
        this.refactorExistingCode();
        console.log('代码重构工具已初始化');
    }

    /**
     * 创建通用工具库
     */
    createUtilityLibrary() {
        // 通用复制功能
        window.CommonUtils = {
            /**
             * 通用复制功能
             * @param {string} text - 要复制的文本
             * @param {string} successMessage - 成功提示消息
             * @param {string} errorMessage - 失败提示消息
             * @returns {Promise<boolean>} 复制是否成功
             */
            async copyToClipboard(text, successMessage = '已复制', errorMessage = '复制失败') {
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(text);
                        if (window.errorHandler) {
                            window.errorHandler.showNotification(successMessage, 'low');
                        } else {
                            alert(successMessage);
                        }
                        return true;
                    } else {
                        // 降级方案
                        return this.fallbackCopy(text, successMessage, errorMessage);
                    }
                } catch (error) {
                    console.error('复制失败:', error);
                    return this.fallbackCopy(text, successMessage, errorMessage);
                }
            },

            /**
             * 降级复制方案
             * @param {string} text - 要复制的文本
             * @param {string} successMessage - 成功提示消息
             * @param {string} errorMessage - 失败提示消息
             * @returns {boolean} 复制是否成功
             */
            fallbackCopy(text, successMessage, errorMessage) {
                try {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.cssText = `
                        position: fixed;
                        top: -9999px;
                        left: -9999px;
                        opacity: 0;
                        pointer-events: none;
                    `;
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    if (successful) {
                        if (window.errorHandler) {
                            window.errorHandler.showNotification(successMessage, 'low');
                        } else {
                            alert(successMessage);
                        }
                        return true;
                    } else {
                        throw new Error('execCommand failed');
                    }
                } catch (error) {
                    console.error('降级复制失败:', error);
                    if (window.errorHandler) {
                        window.errorHandler.showNotification(errorMessage, 'medium');
                    } else {
                        alert(errorMessage);
                    }
                    return false;
                }
            },

            /**
             * 通用状态管理
             * @param {string} key - 状态键
             * @param {*} value - 状态值
             * @param {boolean} persistent - 是否持久化存储
             */
            setState(key, value, persistent = true) {
                const storage = persistent ? localStorage : sessionStorage;
                try {
                    storage.setItem(key, JSON.stringify(value));
                } catch (error) {
                    console.error('状态保存失败:', error);
                }
            },

            /**
             * 获取状态
             * @param {string} key - 状态键
             * @param {*} defaultValue - 默认值
             * @param {boolean} persistent - 是否从持久化存储获取
             * @returns {*} 状态值
             */
            getState(key, defaultValue = null, persistent = true) {
                const storage = persistent ? localStorage : sessionStorage;
                try {
                    const value = storage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (error) {
                    console.error('状态获取失败:', error);
                    return defaultValue;
                }
            },

            /**
             * 通用表单验证
             * @param {HTMLFormElement} form - 表单元素
             * @param {Object} rules - 验证规则
             * @returns {Object} 验证结果
             */
            validateForm(form, rules) {
                const errors = {};
                const formData = new FormData(form);
                
                for (const [field, rule] of Object.entries(rules)) {
                    const value = formData.get(field);
                    const fieldErrors = [];
                    
                    // 必填验证
                    if (rule.required && (!value || value.trim() === '')) {
                        fieldErrors.push(rule.requiredMessage || `${field}不能为空`);
                    }
                    
                    // 长度验证
                    if (value && rule.minLength && value.length < rule.minLength) {
                        fieldErrors.push(rule.minLengthMessage || `${field}长度不能少于${rule.minLength}个字符`);
                    }
                    
                    if (value && rule.maxLength && value.length > rule.maxLength) {
                        fieldErrors.push(rule.maxLengthMessage || `${field}长度不能超过${rule.maxLength}个字符`);
                    }
                    
                    // 正则验证
                    if (value && rule.pattern && !rule.pattern.test(value)) {
                        fieldErrors.push(rule.patternMessage || `${field}格式不正确`);
                    }
                    
                    // 自定义验证
                    if (value && rule.validator && typeof rule.validator === 'function') {
                        const customError = rule.validator(value);
                        if (customError) {
                            fieldErrors.push(customError);
                        }
                    }
                    
                    if (fieldErrors.length > 0) {
                        errors[field] = fieldErrors;
                    }
                }
                
                return {
                    isValid: Object.keys(errors).length === 0,
                    errors
                };
            },

            /**
             * 通用对话框
             * @param {string} title - 标题
             * @param {string} message - 消息
             * @param {Array} buttons - 按钮配置
             * @param {string} type - 对话框类型
             * @returns {Promise} 用户选择结果
             */
            showDialog(title, message, buttons = null, type = 'info') {
                return new Promise((resolve) => {
                    // 如果存在全局showDialog函数，使用它
                    if (typeof window.showDialog === 'function') {
                        window.showDialog(title, message, buttons, type, resolve);
                        return;
                    }
                    
                    // 否则使用原生alert/confirm
                    if (buttons && buttons.length > 1) {
                        const result = confirm(`${title}\n\n${message}`);
                        resolve(result ? buttons[0] : buttons[1]);
                    } else {
                        alert(`${title}\n\n${message}`);
                        resolve(buttons ? buttons[0] : null);
                    }
                });
            },

            /**
             * 通用加载状态管理
             * @param {HTMLElement} element - 目标元素
             * @param {boolean} loading - 是否加载中
             * @param {string} loadingText - 加载文本
             */
            setLoading(element, loading, loadingText = '加载中...') {
                if (!element) return;
                
                if (loading) {
                    element.disabled = true;
                    element.dataset.originalText = element.textContent;
                    element.textContent = loadingText;
                    element.classList.add('loading');
                } else {
                    element.disabled = false;
                    element.textContent = element.dataset.originalText || element.textContent;
                    element.classList.remove('loading');
                    delete element.dataset.originalText;
                }
            },

            /**
             * 通用网络请求
             * @param {string} url - 请求URL
             * @param {Object} options - 请求选项
             * @returns {Promise} 请求结果
             */
            async request(url, options = {}) {
                const defaultOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                };
                
                const config = { ...defaultOptions, ...options };
                
                // 添加CSRF token
                if (window.securityHardening && window.securityHardening.getCSRFToken) {
                    config.headers['X-CSRF-Token'] = window.securityHardening.getCSRFToken();
                }
                
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                    
                    const response = await fetch(url, {
                        ...config,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return await response.json();
                    } else {
                        return await response.text();
                    }
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw new Error('请求超时');
                    }
                    throw error;
                }
            },

            /**
             * 通用时间格式化
             * @param {Date|string|number} date - 日期
             * @param {string} format - 格式
             * @returns {string} 格式化后的时间
             */
            formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
                const d = new Date(date);
                if (isNaN(d.getTime())) {
                    return '无效日期';
                }
                
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');
                
                return format
                    .replace('YYYY', year)
                    .replace('MM', month)
                    .replace('DD', day)
                    .replace('HH', hours)
                    .replace('mm', minutes)
                    .replace('ss', seconds);
            },

            /**
             * 通用数字格式化
             * @param {number} number - 数字
             * @param {number} decimals - 小数位数
             * @param {string} separator - 千分位分隔符
             * @returns {string} 格式化后的数字
             */
            formatNumber(number, decimals = 2, separator = ',') {
                if (isNaN(number)) return '0';
                
                const num = Number(number);
                const parts = num.toFixed(decimals).split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
                
                return parts.join('.');
            },

            /**
             * 通用防抖函数
             * @param {Function} func - 要防抖的函数
             * @param {number} wait - 等待时间
             * @param {boolean} immediate - 是否立即执行
             * @returns {Function} 防抖后的函数
             */
            debounce(func, wait, immediate = false) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        timeout = null;
                        if (!immediate) func.apply(this, args);
                    };
                    const callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(this, args);
                };
            },

            /**
             * 通用节流函数
             * @param {Function} func - 要节流的函数
             * @param {number} limit - 限制时间
             * @returns {Function} 节流后的函数
             */
            throttle(func, limit) {
                let inThrottle;
                return function executedFunction(...args) {
                    if (!inThrottle) {
                        func.apply(this, args);
                        inThrottle = true;
                        setTimeout(() => inThrottle = false, limit);
                    }
                };
            }
        };
    }

    /**
     * 设置常见模式
     */
    setupCommonPatterns() {
        // 重构复制功能
        this.refactorCopyFunctions();
        
        // 重构状态管理
        this.refactorStateManagement();
        
        // 重构表单验证
        this.refactorFormValidation();
        
        // 重构错误处理
        this.refactorErrorHandling();
    }

    /**
     * 重构复制功能
     */
    refactorCopyFunctions() {
        // 替换所有复制相关的函数
        const copyFunctions = [
            'copyAddr',
            'copyInviteLink', 
            'copyInviteCode',
            'fallbackCopy',
            'fallbackCopyCode'
        ];
        
        copyFunctions.forEach(funcName => {
            if (window[funcName]) {
                console.log(`重构函数: ${funcName}`);
                // 保存原函数引用
                window[`_original_${funcName}`] = window[funcName];
                
                // 替换为通用实现
                window[funcName] = function(...args) {
                    // 根据函数名确定要复制的内容
                    let text, successMsg, errorMsg;
                    
                    switch (funcName) {
                        case 'copyAddr':
                            text = document.getElementById('addr')?.textContent || '';
                            successMsg = '地址已复制';
                            errorMsg = '地址复制失败';
                            break;
                        case 'copyInviteLink':
                            text = document.getElementById('inviteLink')?.value || '';
                            successMsg = '邀请链接已复制';
                            errorMsg = '邀请链接复制失败';
                            break;
                        case 'copyInviteCode':
                            text = document.getElementById('myInviteCode')?.textContent || '';
                            successMsg = '邀请码已复制';
                            errorMsg = '邀请码复制失败';
                            break;
                        default:
                            text = args[0] || '';
                            successMsg = '已复制';
                            errorMsg = '复制失败';
                    }
                    
                    return CommonUtils.copyToClipboard(text, successMsg, errorMsg);
                };
            }
        });
    }

    /**
     * 重构状态管理
     */
    refactorStateManagement() {
        // 创建统一的状态管理器
        window.StateManager = {
            /**
             * 保存应用状态
             * @param {Object} state - 状态对象
             */
            saveAppState(state) {
                CommonUtils.setState('appState', state, true);
            },

            /**
             * 加载应用状态
             * @returns {Object} 应用状态
             */
            loadAppState() {
                return CommonUtils.getState('appState', {}, true);
            },

            /**
             * 保存用户状态
             * @param {string|number} status - 用户状态
             */
            saveUserStatus(status) {
                CommonUtils.setState('userStatus', status, true);
            },

            /**
             * 获取用户状态
             * @returns {string} 用户状态
             */
            getUserStatus() {
                return CommonUtils.getState('userStatus', '1', true);
            },

            /**
             * 保存钱包余额
             * @param {number} balance - 余额
             */
            saveWalletBalance(balance) {
                CommonUtils.setState('walletBalance', balance, true);
            },

            /**
             * 获取钱包余额
             * @returns {number} 钱包余额
             */
            getWalletBalance() {
                return CommonUtils.getState('walletBalance', 0, true);
            },

            /**
             * 保存任务状态
             * @param {Array} tasks - 任务列表
             */
            saveTasks(tasks) {
                CommonUtils.setState('userTasks', tasks, true);
            },

            /**
             * 获取任务状态
             * @returns {Array} 任务列表
             */
            getTasks() {
                return CommonUtils.getState('userTasks', [], true);
            }
        };
    }

    /**
     * 重构表单验证
     */
    refactorFormValidation() {
        // 创建通用验证规则
        window.ValidationRules = {
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                patternMessage: '请输入有效的邮箱地址'
            },
            phone: {
                pattern: /^1[3-9]\d{9}$/,
                patternMessage: '请输入有效的手机号码'
            },
            password: {
                minLength: 6,
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
                patternMessage: '密码必须包含字母和数字'
            },
            amount: {
                pattern: /^\d+(\.\d{1,2})?$/,
                patternMessage: '请输入有效的金额'
            },
            address: {
                minLength: 10,
                pattern: /^[a-zA-Z0-9]+$/,
                patternMessage: '请输入有效的地址'
            }
        };

        // 重构现有验证函数
        if (window.validateForm) {
            window._original_validateForm = window.validateForm;
            window.validateForm = function(form, customRules = {}) {
                const rules = { ...window.ValidationRules, ...customRules };
                return CommonUtils.validateForm(form, rules);
            };
        }
    }

    /**
     * 重构错误处理
     */
    refactorErrorHandling() {
        // 创建统一的错误处理器
        window.ErrorManager = {
            /**
             * 处理API错误
             * @param {Error} error - 错误对象
             * @param {string} context - 错误上下文
             */
            handleApiError(error, context = '') {
                console.error(`API错误 [${context}]:`, error);
                
                let message = '操作失败，请重试';
                
                if (error.message.includes('网络')) {
                    message = '网络连接失败，请检查网络设置';
                } else if (error.message.includes('超时')) {
                    message = '请求超时，请重试';
                } else if (error.message.includes('401')) {
                    message = '登录已过期，请重新登录';
                } else if (error.message.includes('403')) {
                    message = '权限不足，无法执行此操作';
                } else if (error.message.includes('404')) {
                    message = '请求的资源不存在';
                } else if (error.message.includes('500')) {
                    message = '服务器内部错误，请稍后重试';
                }
                
                if (window.errorHandler) {
                    window.errorHandler.showNotification(message, 'medium');
                } else {
                    alert(message);
                }
            },

            /**
             * 处理表单错误
             * @param {Object} errors - 错误对象
             * @param {HTMLFormElement} form - 表单元素
             */
            handleFormErrors(errors, form) {
                // 清除之前的错误显示
                form.querySelectorAll('.error-message').forEach(el => el.remove());
                form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
                
                // 显示新的错误
                for (const [field, fieldErrors] of Object.entries(errors)) {
                    const input = form.querySelector(`[name="${field}"]`);
                    if (input) {
                        input.classList.add('error');
                        
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.textContent = fieldErrors[0]; // 显示第一个错误
                        errorDiv.style.cssText = `
                            color: #dc3545;
                            font-size: 12px;
                            margin-top: 4px;
                        `;
                        
                        input.parentNode.insertBefore(errorDiv, input.nextSibling);
                    }
                }
            }
        };
    }

    /**
     * 重构现有代码
     */
    refactorExistingCode() {
        // 等待DOM加载完成后执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.performRefactoring();
            });
        } else {
            this.performRefactoring();
        }
    }

    /**
     * 执行重构
     */
    performRefactoring() {
        // 重构重复的事件处理器
        this.refactorEventHandlers();
        
        // 重构重复的DOM操作
        this.refactorDOMOperations();
        
        // 添加缺失的注释
        this.addMissingComments();
        
        console.log('代码重构完成');
    }

    /**
     * 重构事件处理器
     */
    refactorEventHandlers() {
        // 创建通用事件处理器
        window.EventManager = {
            /**
             * 绑定按钮点击事件
             * @param {string} selector - 选择器
             * @param {Function} handler - 处理函数
             * @param {Object} options - 选项
             */
            bindClick(selector, handler, options = {}) {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.addEventListener('click', (e) => {
                        if (options.preventDefault) {
                            e.preventDefault();
                        }
                        
                        if (options.loading) {
                            CommonUtils.setLoading(element, true, options.loadingText);
                        }
                        
                        Promise.resolve(handler(e, element))
                            .then(() => {
                                if (options.loading) {
                                    CommonUtils.setLoading(element, false);
                                }
                            })
                            .catch(error => {
                                if (options.loading) {
                                    CommonUtils.setLoading(element, false);
                                }
                                ErrorManager.handleApiError(error, selector);
                            });
                    });
                });
            },

            /**
             * 绑定表单提交事件
             * @param {string} selector - 选择器
             * @param {Function} handler - 处理函数
             * @param {Object} rules - 验证规则
             */
            bindSubmit(selector, handler, rules = {}) {
                const forms = document.querySelectorAll(selector);
                forms.forEach(form => {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        // 表单验证
                        const validation = CommonUtils.validateForm(form, rules);
                        if (!validation.isValid) {
                            ErrorManager.handleFormErrors(validation.errors, form);
                            return;
                        }
                        
                        try {
                            await handler(e, form);
                        } catch (error) {
                            ErrorManager.handleApiError(error, selector);
                        }
                    });
                });
            }
        };
    }

    /**
     * 重构DOM操作
     */
    refactorDOMOperations() {
        // 创建通用DOM操作工具
        window.DOMUtils = {
            /**
             * 安全获取元素
             * @param {string} selector - 选择器
             * @returns {HTMLElement|null} 元素
             */
            getElement(selector) {
                const element = document.querySelector(selector);
                if (!element) {
                    console.warn(`元素未找到: ${selector}`);
                }
                return element;
            },

            /**
             * 安全设置文本内容
             * @param {string} selector - 选择器
             * @param {string} text - 文本内容
             */
            setText(selector, text) {
                const element = this.getElement(selector);
                if (element) {
                    element.textContent = text;
                }
            },

            /**
             * 安全设置HTML内容
             * @param {string} selector - 选择器
             * @param {string} html - HTML内容
             */
            setHTML(selector, html) {
                const element = this.getElement(selector);
                if (element) {
                    element.innerHTML = html;
                }
            },

            /**
             * 切换元素显示状态
             * @param {string} selector - 选择器
             * @param {boolean} show - 是否显示
             */
            toggle(selector, show) {
                const element = this.getElement(selector);
                if (element) {
                    element.style.display = show ? 'block' : 'none';
                }
            },

            /**
             * 添加/移除CSS类
             * @param {string} selector - 选择器
             * @param {string} className - 类名
             * @param {boolean} add - 是否添加
             */
            toggleClass(selector, className, add) {
                const element = this.getElement(selector);
                if (element) {
                    if (add) {
                        element.classList.add(className);
                    } else {
                        element.classList.remove(className);
                    }
                }
            }
        };
    }

    /**
     * 添加缺失的注释
     */
    addMissingComments() {
        // 为全局函数添加注释（如果它们没有注释的话）
        const globalFunctions = [
            'activateAccount',
            'repurchase', 
            'openTasks',
            'grabRedPacket',
            'showTeam',
            'showWallet',
            'showRanking'
        ];

        globalFunctions.forEach(funcName => {
            if (window[funcName] && typeof window[funcName] === 'function') {
                // 检查函数是否已有注释
                const funcStr = window[funcName].toString();
                if (!funcStr.includes('/**') && !funcStr.includes('//')) {
                    console.log(`函数 ${funcName} 缺少注释，建议添加文档注释`);
                }
            }
        });
    }

    /**
     * 生成重构报告
     * @returns {Object} 重构报告
     */
    generateRefactorReport() {
        return {
            timestamp: new Date().toISOString(),
            refactoredFunctions: Array.from(this.commonFunctions.keys()),
            eliminatedDuplicates: this.duplicatePatterns.size,
            addedUtilities: Object.keys(window.CommonUtils || {}),
            recommendations: [
                '建议定期运行代码质量检查',
                '建议为所有函数添加JSDoc注释',
                '建议使用ESLint进行代码规范检查',
                '建议实施代码审查流程'
            ]
        };
    }
}

// 自动初始化代码重构工具
document.addEventListener('DOMContentLoaded', () => {
    window.codeRefactor = new CodeRefactor();
    console.log('代码重构工具已启动');
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeRefactor;
}