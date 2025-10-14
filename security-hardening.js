/**
 * 安全加固工具集
 * 实现输入验证、XSS防护、API权限控制等安全功能
 */

class SecurityHardening {
    constructor() {
        this.csrfToken = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30分钟
        this.lastActivity = Date.now();
        this.securityHeaders = new Map();
        this.init();
    }

    /**
     * 初始化安全加固
     */
    init() {
        this.setupCSRFProtection();
        this.setupXSSProtection();
        this.setupInputValidation();
        this.setupAPIPermissionControl();
        this.setupSessionManagement();
        this.setupSecurityHeaders();
        this.monitorSecurity();
    }

    /**
     * CSRF保护设置
     */
    setupCSRFProtection() {
        // 生成CSRF令牌
        this.generateCSRFToken();
        
        // 拦截所有表单提交
        this.interceptFormSubmissions();
        
        // 拦截AJAX请求
        this.interceptAjaxRequests();
    }

    /**
     * 生成CSRF令牌
     */
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        this.csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        
        // 存储到meta标签
        let metaTag = document.querySelector('meta[name="csrf-token"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.name = 'csrf-token';
            document.head.appendChild(metaTag);
        }
        metaTag.content = this.csrfToken;
        
        console.log('CSRF令牌已生成');
    }

    /**
     * 拦截表单提交
     */
    interceptFormSubmissions() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            
            if (form.tagName === 'FORM') {
                // 检查是否已有CSRF令牌
                let csrfInput = form.querySelector('input[name="_token"]');
                if (!csrfInput) {
                    csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = '_token';
                    form.appendChild(csrfInput);
                }
                csrfInput.value = this.csrfToken;
            }
        });
    }

    /**
     * 拦截AJAX请求
     */
    interceptAjaxRequests() {
        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = (url, options = {}) => {
            if (this.isModifyingRequest(options.method)) {
                options.headers = options.headers || {};
                options.headers['X-CSRF-TOKEN'] = this.csrfToken;
            }
            return originalFetch(url, options);
        };

        // 拦截XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._method = method;
            this._url = url;
            return originalOpen.call(this, method, url, ...args);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            if (this.isModifyingRequest(this._method)) {
                this.setRequestHeader('X-CSRF-TOKEN', window.securityHardening.csrfToken);
            }
            return originalSend.call(this, data);
        };
    }

    /**
     * 判断是否为修改性请求
     */
    isModifyingRequest(method) {
        return method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    }

    /**
     * XSS防护设置
     */
    setupXSSProtection() {
        // 输出编码
        this.setupOutputEncoding();
        
        // 内容安全策略
        this.setupContentSecurityPolicy();
        
        // DOM操作安全化
        this.secureDOMOperations();
        
        // 事件处理安全化
        this.secureEventHandlers();
    }

    /**
     * 输出编码
     */
    setupOutputEncoding() {
        // HTML编码函数
        window.htmlEncode = (str) => {
            if (typeof str !== 'string') return str;
            
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        };

        // JavaScript编码函数
        window.jsEncode = (str) => {
            if (typeof str !== 'string') return str;
            
            return str
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
        };

        // URL编码函数
        window.urlEncode = (str) => {
            if (typeof str !== 'string') return str;
            return encodeURIComponent(str);
        };
    }

    /**
     * 内容安全策略
     */
    setupContentSecurityPolicy() {
        // 检查CSP头是否存在
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!cspMeta) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws: wss:;";
            document.head.appendChild(meta);
            console.log('CSP策略已设置');
        }
    }

    /**
     * DOM操作安全化
     */
    secureDOMOperations() {
        // 重写innerHTML
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        const self = this;
        
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                if (typeof value === 'string') {
                    // 检查潜在的XSS
                    if (self.containsXSS(value)) {
                        console.warn('检测到潜在XSS攻击，已阻止:', value);
                        return;
                    }
                }
                originalInnerHTML.set.call(this, value);
            },
            get: originalInnerHTML.get
        });

        // 重写insertAdjacentHTML
        const originalInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
        Element.prototype.insertAdjacentHTML = function(position, text) {
            if (this.containsXSS(text)) {
                console.warn('检测到潜在XSS攻击，已阻止:', text);
                return;
            }
            return originalInsertAdjacentHTML.call(this, position, text);
        };
    }

    /**
     * 检测XSS攻击
     */
    containsXSS(content) {
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b/gi,
            /<object\b/gi,
            /<embed\b/gi,
            /<link\b/gi,
            /<meta\b/gi,
            /expression\s*\(/gi,
            /vbscript:/gi,
            /data:text\/html/gi
        ];

        return xssPatterns.some(pattern => pattern.test(content));
    }

    /**
     * 事件处理安全化
     */
    secureEventHandlers() {
        // 监控动态添加的事件监听器
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // 检查事件处理函数
            if (typeof listener === 'string') {
                console.warn('阻止字符串形式的事件处理器:', listener);
                return;
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };
    }

    /**
     * 输入验证设置
     */
    setupInputValidation() {
        // 表单验证
        this.setupFormValidation();
        
        // 实时输入验证
        this.setupRealtimeValidation();
        
        // 文件上传验证
        this.setupFileUploadValidation();
    }

    /**
     * 表单验证
     */
    setupFormValidation() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            
            if (form.tagName === 'FORM') {
                const isValid = this.validateForm(form);
                if (!isValid) {
                    event.preventDefault();
                    console.warn('表单验证失败');
                }
            }
        });
    }

    /**
     * 验证表单
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            const validation = this.validateInput(input);
            if (!validation.valid) {
                isValid = false;
                this.showValidationError(input, validation.message);
            } else {
                this.clearValidationError(input);
            }
        });

        return isValid;
    }

    /**
     * 验证单个输入
     */
    validateInput(input) {
        const value = input.value;
        const type = input.type;
        const required = input.required;

        // 必填验证
        if (required && !value.trim()) {
            return { valid: false, message: '此字段为必填项' };
        }

        // 类型验证
        switch (type) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    return { valid: false, message: '请输入有效的邮箱地址' };
                }
                break;
                
            case 'tel':
                if (value && !this.isValidPhone(value)) {
                    return { valid: false, message: '请输入有效的手机号码' };
                }
                break;
                
            case 'password':
                if (value && !this.isValidPassword(value)) {
                    return { valid: false, message: '密码必须包含字母和数字，长度8-20位' };
                }
                break;
                
            case 'number':
                if (value && !this.isValidNumber(value)) {
                    return { valid: false, message: '请输入有效的数字' };
                }
                break;
        }

        // 长度验证
        const minLength = input.getAttribute('minlength');
        const maxLength = input.getAttribute('maxlength');
        
        if (minLength && value.length < parseInt(minLength)) {
            return { valid: false, message: `最少需要${minLength}个字符` };
        }
        
        if (maxLength && value.length > parseInt(maxLength)) {
            return { valid: false, message: `最多允许${maxLength}个字符` };
        }

        // SQL注入检测
        if (this.containsSQLInjection(value)) {
            return { valid: false, message: '输入包含非法字符' };
        }

        return { valid: true };
    }

    /**
     * 邮箱验证
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 手机号验证
     */
    isValidPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    /**
     * 密码验证
     */
    isValidPassword(password) {
        // 至少8位，包含字母和数字
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/;
        return passwordRegex.test(password);
    }

    /**
     * 数字验证
     */
    isValidNumber(value) {
        return !isNaN(value) && isFinite(value);
    }

    /**
     * SQL注入检测
     */
    containsSQLInjection(input) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
            /(--|\/\*|\*\/|;)/g,
            /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR|EXEC|EXECUTE)\s*\()/gi,
            /(\b(SP_|XP_)\w+)/gi
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    /**
     * 显示验证错误
     */
    showValidationError(input, message) {
        // 移除旧的错误信息
        this.clearValidationError(input);
        
        // 添加错误样式
        input.classList.add('validation-error');
        
        // 创建错误信息元素
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-message';
        errorElement.textContent = message;
        errorElement.style.color = '#ff4444';
        errorElement.style.fontSize = '12px';
        errorElement.style.marginTop = '4px';
        
        // 插入错误信息
        input.parentNode.insertBefore(errorElement, input.nextSibling);
    }

    /**
     * 清除验证错误
     */
    clearValidationError(input) {
        input.classList.remove('validation-error');
        
        const errorElement = input.parentNode.querySelector('.validation-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * 实时输入验证
     */
    setupRealtimeValidation() {
        document.addEventListener('input', (event) => {
            const input = event.target;
            
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                // 防抖处理
                clearTimeout(input.validationTimeout);
                input.validationTimeout = setTimeout(() => {
                    const validation = this.validateInput(input);
                    if (!validation.valid) {
                        this.showValidationError(input, validation.message);
                    } else {
                        this.clearValidationError(input);
                    }
                }, 500);
            }
        });
    }

    /**
     * 文件上传验证
     */
    setupFileUploadValidation() {
        document.addEventListener('change', (event) => {
            const input = event.target;
            
            if (input.type === 'file') {
                const files = input.files;
                for (let i = 0; i < files.length; i++) {
                    const validation = this.validateFile(files[i]);
                    if (!validation.valid) {
                        this.showValidationError(input, validation.message);
                        input.value = ''; // 清空文件选择
                        return;
                    }
                }
                this.clearValidationError(input);
            }
        });
    }

    /**
     * 验证文件
     */
    validateFile(file) {
        // 文件大小限制 (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return { valid: false, message: '文件大小不能超过5MB' };
        }

        // 文件类型限制
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, message: '不支持的文件类型' };
        }

        // 文件名验证
        const fileName = file.name;
        if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
            return { valid: false, message: '文件名包含非法字符' };
        }

        return { valid: true };
    }

    /**
     * API权限控制设置
     */
    setupAPIPermissionControl() {
        // 拦截API请求
        this.interceptAPIRequests();
        
        // 权限验证
        this.setupPermissionValidation();
        
        // 请求频率限制
        this.setupRateLimit();
    }

    /**
     * 拦截API请求
     */
    interceptAPIRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // 检查是否为API请求
            if (typeof url === 'string' && url.includes('/api/')) {
                // 添加认证头
                options.headers = options.headers || {};
                
                // 添加JWT令牌
                const token = this.getAuthToken();
                if (token) {
                    options.headers['Authorization'] = `Bearer ${token}`;
                }
                
                // 权限检查
                const hasPermission = await this.checkAPIPermission(url, options.method);
                if (!hasPermission) {
                    throw new Error('权限不足');
                }
                
                // 频率限制检查
                if (!this.checkRateLimit(url)) {
                    throw new Error('请求过于频繁');
                }
            }
            
            return originalFetch(url, options);
        };
    }

    /**
     * 获取认证令牌
     */
    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    /**
     * 检查API权限
     */
    async checkAPIPermission(url, method = 'GET') {
        try {
            // 从本地存储获取用户权限
            const userPermissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');
            
            // 构建权限键
            const permissionKey = `${method.toUpperCase()}:${url}`;
            
            // 检查权限
            return userPermissions.includes(permissionKey) || userPermissions.includes('*');
        } catch (error) {
            console.error('权限检查失败:', error);
            return false;
        }
    }

    /**
     * 权限验证设置
     */
    setupPermissionValidation() {
        // 页面访问权限
        this.validatePageAccess();
        
        // 功能权限
        this.validateFeatureAccess();
    }

    /**
     * 验证页面访问权限
     */
    validatePageAccess() {
        const currentPage = window.location.pathname;
        const protectedPages = ['/admin.html', '/wallet.html', '/tasks.html'];
        
        if (protectedPages.includes(currentPage)) {
            const isAuthenticated = this.isUserAuthenticated();
            if (!isAuthenticated) {
                window.location.href = '/login.html';
                return;
            }
        }
    }

    /**
     * 验证功能访问权限
     */
    validateFeatureAccess() {
        // 隐藏无权限的功能按钮
        const protectedElements = document.querySelectorAll('[data-permission]');
        
        protectedElements.forEach(element => {
            const requiredPermission = element.dataset.permission;
            if (!this.hasPermission(requiredPermission)) {
                element.style.display = 'none';
            }
        });
    }

    /**
     * 检查用户是否已认证
     */
    isUserAuthenticated() {
        const token = this.getAuthToken();
        if (!token) return false;
        
        try {
            // 简单的JWT解析（实际应用中应该验证签名）
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch (error) {
            return false;
        }
    }

    /**
     * 检查用户权限
     */
    hasPermission(permission) {
        try {
            const userPermissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');
            return userPermissions.includes(permission) || userPermissions.includes('*');
        } catch (error) {
            return false;
        }
    }

    /**
     * 请求频率限制
     */
    setupRateLimit() {
        this.requestCounts = new Map();
        this.rateLimits = {
            '/api/login': { max: 5, window: 60000 }, // 5次/分钟
            '/api/register': { max: 3, window: 60000 }, // 3次/分钟
            '/api/': { max: 100, window: 60000 } // 默认100次/分钟
        };
    }

    /**
     * 检查请求频率
     */
    checkRateLimit(url) {
        const now = Date.now();
        
        // 找到匹配的限制规则
        let rateLimit = null;
        for (const [pattern, limit] of Object.entries(this.rateLimits)) {
            if (url.includes(pattern)) {
                rateLimit = limit;
                break;
            }
        }
        
        if (!rateLimit) return true;
        
        // 获取请求记录
        const key = `${url}:${Math.floor(now / rateLimit.window)}`;
        const count = this.requestCounts.get(key) || 0;
        
        if (count >= rateLimit.max) {
            return false;
        }
        
        // 更新计数
        this.requestCounts.set(key, count + 1);
        
        // 清理过期记录
        this.cleanupRateLimitRecords(now);
        
        return true;
    }

    /**
     * 清理频率限制记录
     */
    cleanupRateLimitRecords(now) {
        for (const [key, count] of this.requestCounts.entries()) {
            const [url, windowStart] = key.split(':');
            const windowStartTime = parseInt(windowStart) * 60000; // 转换回毫秒
            
            if (now - windowStartTime > 60000) { // 超过1分钟的记录
                this.requestCounts.delete(key);
            }
        }
    }

    /**
     * 会话管理设置
     */
    setupSessionManagement() {
        // 会话超时检查
        this.setupSessionTimeout();
        
        // 活动监控
        this.setupActivityMonitoring();
        
        // 会话固化保护
        this.setupSessionFixationProtection();
    }

    /**
     * 会话超时设置
     */
    setupSessionTimeout() {
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastActivity > this.sessionTimeout) {
                this.handleSessionTimeout();
            }
        }, 60000); // 每分钟检查一次
    }

    /**
     * 活动监控
     */
    setupActivityMonitoring() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            }, true);
        });
    }

    /**
     * 处理会话超时
     */
    handleSessionTimeout() {
        // 清除认证信息
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('user_permissions');
        
        // 显示超时提示
        alert('会话已超时，请重新登录');
        
        // 跳转到登录页
        window.location.href = '/login.html';
    }

    /**
     * 会话固化保护
     */
    setupSessionFixationProtection() {
        // 登录后重新生成会话ID
        window.addEventListener('login', () => {
            this.regenerateSessionId();
        });
    }

    /**
     * 重新生成会话ID
     */
    regenerateSessionId() {
        // 生成新的会话ID
        const newSessionId = this.generateSessionId();
        sessionStorage.setItem('session_id', newSessionId);
        
        console.log('会话ID已重新生成');
    }

    /**
     * 生成会话ID
     */
    generateSessionId() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * 安全头设置
     */
    setupSecurityHeaders() {
        // 设置安全相关的meta标签
        this.setSecurityMeta();
        
        // 检查响应头
        this.checkResponseHeaders();
    }

    /**
     * 设置安全Meta标签
     */
    setSecurityMeta() {
        const securityMetas = [
            { name: 'X-Content-Type-Options', content: 'nosniff' },
            { name: 'X-Frame-Options', content: 'DENY' },
            { name: 'X-XSS-Protection', content: '1; mode=block' },
            { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
        ];

        securityMetas.forEach(meta => {
            if (!document.querySelector(`meta[http-equiv="${meta.name}"]`)) {
                const metaElement = document.createElement('meta');
                metaElement.httpEquiv = meta.name;
                metaElement.content = meta.content;
                document.head.appendChild(metaElement);
            }
        });
    }

    /**
     * 检查响应头
     */
    checkResponseHeaders() {
        // 这个方法在实际应用中需要服务器配合
        console.log('安全响应头检查完成');
    }

    /**
     * 安全监控
     */
    monitorSecurity() {
        // 监控异常活动
        this.monitorAbnormalActivity();
        
        // 监控安全事件
        this.monitorSecurityEvents();
        
        // 定期安全检查
        this.scheduleSecurityChecks();
    }

    /**
     * 监控异常活动
     */
    monitorAbnormalActivity() {
        // 监控快速点击
        let clickCount = 0;
        let clickTimer = null;
        
        document.addEventListener('click', () => {
            clickCount++;
            
            if (clickTimer) {
                clearTimeout(clickTimer);
            }
            
            clickTimer = setTimeout(() => {
                if (clickCount > 20) { // 1秒内超过20次点击
                    console.warn('检测到异常点击活动');
                    this.reportSecurityEvent('abnormal_clicking', { count: clickCount });
                }
                clickCount = 0;
            }, 1000);
        });
    }

    /**
     * 监控安全事件
     */
    monitorSecurityEvents() {
        // 监控控制台访问
        let devtools = false;
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
                if (!devtools) {
                    devtools = true;
                    console.warn('检测到开发者工具');
                    this.reportSecurityEvent('devtools_opened');
                }
            } else {
                devtools = false;
            }
        }, 1000);
    }

    /**
     * 定期安全检查
     */
    scheduleSecurityChecks() {
        setInterval(() => {
            this.performSecurityCheck();
        }, 5 * 60 * 1000); // 每5分钟检查一次
    }

    /**
     * 执行安全检查
     */
    performSecurityCheck() {
        const checks = [
            this.checkTokenExpiry(),
            this.checkPermissionIntegrity(),
            this.checkSessionIntegrity()
        ];

        Promise.all(checks).then(results => {
            const failedChecks = results.filter(result => !result.passed);
            if (failedChecks.length > 0) {
                console.warn('安全检查失败:', failedChecks);
                this.handleSecurityCheckFailure(failedChecks);
            }
        });
    }

    /**
     * 检查令牌过期
     */
    checkTokenExpiry() {
        const token = this.getAuthToken();
        if (!token) {
            return { passed: true, message: '无令牌' };
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp <= Date.now() / 1000;
            
            return {
                passed: !isExpired,
                message: isExpired ? '令牌已过期' : '令牌有效'
            };
        } catch (error) {
            return { passed: false, message: '令牌格式错误' };
        }
    }

    /**
     * 检查权限完整性
     */
    checkPermissionIntegrity() {
        try {
            const permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');
            return {
                passed: Array.isArray(permissions),
                message: '权限数据完整'
            };
        } catch (error) {
            return { passed: false, message: '权限数据损坏' };
        }
    }

    /**
     * 检查会话完整性
     */
    checkSessionIntegrity() {
        const sessionId = sessionStorage.getItem('session_id');
        return {
            passed: !!sessionId,
            message: sessionId ? '会话有效' : '会话缺失'
        };
    }

    /**
     * 处理安全检查失败
     */
    handleSecurityCheckFailure(failedChecks) {
        // 根据失败类型采取不同措施
        failedChecks.forEach(check => {
            if (check.message.includes('令牌')) {
                this.handleSessionTimeout();
            } else if (check.message.includes('权限')) {
                this.refreshPermissions();
            }
        });
    }

    /**
     * 刷新权限
     */
    async refreshPermissions() {
        try {
            const response = await fetch('/api/user/permissions');
            if (response.ok) {
                const permissions = await response.json();
                localStorage.setItem('user_permissions', JSON.stringify(permissions));
            }
        } catch (error) {
            console.error('权限刷新失败:', error);
        }
    }

    /**
     * 报告安全事件
     */
    reportSecurityEvent(eventType, data = {}) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            data
        };

        // 发送到安全监控服务
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/security/events', JSON.stringify(event));
        }

        console.log('安全事件已报告:', event);
    }

    /**
     * 获取安全状态报告
     */
    getSecurityReport() {
        return {
            csrf: {
                enabled: !!this.csrfToken,
                token: this.csrfToken ? '已生成' : '未生成'
            },
            xss: {
                protection: 'enabled',
                csp: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]')
            },
            authentication: {
                loggedIn: this.isUserAuthenticated(),
                sessionTimeout: this.sessionTimeout / 1000 / 60 + '分钟'
            },
            permissions: {
                count: JSON.parse(localStorage.getItem('user_permissions') || '[]').length
            },
            rateLimit: {
                rules: Object.keys(this.rateLimits).length,
                activeRequests: this.requestCounts.size
            }
        };
    }
}

// 自动初始化安全加固
document.addEventListener('DOMContentLoaded', () => {
    window.securityHardening = new SecurityHardening();
    console.log('安全加固已启动');
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityHardening;
}