/**
 * API客户端 - API Client
 * 基于Context7 MCP标准的API管理系统
 * 提供统一的API调用接口、错误处理和缓存机制
 */
class ApiClient {
    constructor() {
        this.config = null;
        this.baseURL = '';
        this.defaultHeaders = {};
        this.interceptors = {
            request: [],
            response: []
        };
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.initialized = false;
    }

    /**
     * 初始化API客户端
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            // 等待配置加载完成
            if (!window.ConfigLoader.has('api')) {
                throw new Error('API配置未加载');
            }

            this.config = window.ConfigLoader.get('api');
            this.baseURL = this.config.baseURL;
            
            // 设置默认请求头
            this.defaultHeaders = {
                'Content-Type': 'application/json',
                ...this.config.security.headers
            };

            // 添加CSRF令牌
            if (this.config.security.csrf.enabled) {
                await this.refreshCSRFToken();
            }

            this.initialized = true;
            console.log('API客户端初始化完成');
            
        } catch (error) {
            console.error('API客户端初始化失败:', error);
            throw error;
        }
    }

    /**
     * 发送HTTP请求
     * @param {string} method - HTTP方法
     * @param {string} endpoint - API端点
     * @param {object} options - 请求选项
     */
    async request(method, endpoint, options = {}) {
        if (!this.initialized) {
            await this.init();
        }

        const {
            data = null,
            params = {},
            headers = {},
            cache = false,
            timeout = this.config.timeout,
            retries = this.config.retries
        } = options;

        // 构建完整URL
        const url = this.buildURL(endpoint, params);
        
        // 检查缓存
        if (cache && method === 'GET') {
            const cached = this.getFromCache(url);
            if (cached) {
                return cached;
            }
        }

        // 检查是否有相同的待处理请求
        const requestKey = `${method}:${url}`;
        if (this.pendingRequests.has(requestKey)) {
            return this.pendingRequests.get(requestKey);
        }

        // 创建请求Promise
        const requestPromise = this.executeRequest(method, url, {
            data,
            headers: { ...this.defaultHeaders, ...headers },
            timeout,
            retries
        });

        // 存储待处理请求
        this.pendingRequests.set(requestKey, requestPromise);

        try {
            const response = await requestPromise;
            
            // 缓存GET请求结果
            if (cache && method === 'GET') {
                this.setCache(url, response);
            }

            return response;
            
        } finally {
            // 清除待处理请求
            this.pendingRequests.delete(requestKey);
        }
    }

    /**
     * 执行HTTP请求
     * @param {string} method - HTTP方法
     * @param {string} url - 完整URL
     * @param {object} options - 请求选项
     */
    async executeRequest(method, url, options) {
        const { data, headers, timeout, retries } = options;
        
        let lastError;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // 应用请求拦截器
                const requestConfig = await this.applyRequestInterceptors({
                    method,
                    url,
                    headers,
                    data
                });

                // 创建AbortController用于超时控制
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                // 发送请求
                const response = await fetch(requestConfig.url, {
                    method: requestConfig.method,
                    headers: requestConfig.headers,
                    body: requestConfig.data ? JSON.stringify(requestConfig.data) : null,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // 应用响应拦截器
                const processedResponse = await this.applyResponseInterceptors(response);
                
                return processedResponse;
                
            } catch (error) {
                lastError = error;
                
                // 如果是最后一次尝试或不可重试的错误，直接抛出
                if (attempt === retries || !this.isRetryableError(error)) {
                    break;
                }

                // 等待后重试
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }

        throw this.createApiError(lastError, url);
    }

    /**
     * 应用请求拦截器
     * @param {object} config - 请求配置
     */
    async applyRequestInterceptors(config) {
        let processedConfig = { ...config };
        
        for (const interceptor of this.interceptors.request) {
            processedConfig = await interceptor(processedConfig);
        }
        
        return processedConfig;
    }

    /**
     * 应用响应拦截器
     * @param {Response} response - 响应对象
     */
    async applyResponseInterceptors(response) {
        let processedResponse = response;
        
        for (const interceptor of this.interceptors.response) {
            processedResponse = await interceptor(processedResponse);
        }

        // 解析响应数据
        if (processedResponse.ok) {
            const contentType = processedResponse.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await processedResponse.json();
                return this.normalizeResponse(data);
            } else {
                return {
                    success: true,
                    data: await processedResponse.text(),
                    message: 'Success'
                };
            }
        } else {
            throw new Error(`HTTP ${processedResponse.status}: ${processedResponse.statusText}`);
        }
    }

    /**
     * 标准化响应格式
     * @param {object} data - 响应数据
     */
    normalizeResponse(data) {
        // 如果已经是标准格式，直接返回
        if (data.hasOwnProperty('success') && data.hasOwnProperty('data')) {
            return data;
        }

        // 转换为标准格式
        return {
            success: true,
            data: data,
            message: 'Success'
        };
    }

    /**
     * 构建完整URL
     * @param {string} endpoint - API端点
     * @param {object} params - 查询参数
     */
    buildURL(endpoint, params = {}) {
        let url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
        }
        
        return url;
    }

    /**
     * GET请求
     * @param {string} endpoint - API端点
     * @param {object} options - 请求选项
     */
    async get(endpoint, options = {}) {
        return this.request('GET', endpoint, options);
    }

    /**
     * POST请求
     * @param {string} endpoint - API端点
     * @param {object} data - 请求数据
     * @param {object} options - 请求选项
     */
    async post(endpoint, data = null, options = {}) {
        return this.request('POST', endpoint, { ...options, data });
    }

    /**
     * PUT请求
     * @param {string} endpoint - API端点
     * @param {object} data - 请求数据
     * @param {object} options - 请求选项
     */
    async put(endpoint, data = null, options = {}) {
        return this.request('PUT', endpoint, { ...options, data });
    }

    /**
     * DELETE请求
     * @param {string} endpoint - API端点
     * @param {object} options - 请求选项
     */
    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, options);
    }

    /**
     * 添加请求拦截器
     * @param {function} interceptor - 拦截器函数
     */
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
    }

    /**
     * 添加响应拦截器
     * @param {function} interceptor - 拦截器函数
     */
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
    }

    /**
     * 刷新CSRF令牌
     */
    async refreshCSRFToken() {
        try {
            const response = await fetch(`${this.baseURL}/csrf-token`);
            const data = await response.json();
            
            if (data.token) {
                this.defaultHeaders['X-CSRF-Token'] = data.token;
            }
        } catch (error) {
            console.warn('获取CSRF令牌失败:', error);
        }
    }

    /**
     * 缓存管理
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.config.cache.ttl) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * 错误处理
     */
    isRetryableError(error) {
        if (error && error.name === 'AbortError') {
            return false; // 超时错误不重试
        }
        
        // 安全地检查错误信息
        let errorMessage = '';
        try {
            if (error && typeof error === 'object') {
                errorMessage = error.message || error.toString() || '';
            } else if (error) {
                errorMessage = String(error);
            }
        } catch (e) {
            errorMessage = '';
        }
        
        if (errorMessage.includes('HTTP 4')) {
            return false; // 4xx错误不重试
        }
        
        return true;
    }

    createApiError(error, url) {
        // 安全地获取错误信息
        let errorMessage = '未知错误';
        try {
            if (error && typeof error === 'object') {
                errorMessage = error.message || error.toString() || '未知错误';
            } else if (error) {
                errorMessage = String(error);
            }
        } catch (e) {
            errorMessage = '未知错误';
        }
        
        const apiError = new Error(`API请求失败: ${errorMessage}`);
        apiError.originalError = error;
        apiError.url = url;
        apiError.timestamp = new Date().toISOString();
        return apiError;
    }

    /**
     * 工具方法
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取API状态
     */
    getStatus() {
        return {
            initialized: this.initialized,
            baseURL: this.baseURL,
            cacheSize: this.cache.size,
            pendingRequests: this.pendingRequests.size
        };
    }
}

// 创建全局实例
window.ApiClient = new ApiClient();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}