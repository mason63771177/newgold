/**
 * 统一错误处理机制
 * 提供前端错误捕获、处理和用户友好的错误提示
 */

class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 100;
        this.reportEndpoint = '/api/errors';
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.init();
    }

    /**
     * 初始化错误处理器
     */
    init() {
        this.setupGlobalErrorHandlers();
        this.setupPromiseRejectionHandler();
        this.setupNetworkErrorHandler();
        this.setupCustomErrorTypes();
        this.createErrorUI();
        this.startErrorReporting();
    }

    /**
     * 设置全局错误处理器
     */
    setupGlobalErrorHandlers() {
        // JavaScript运行时错误
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error ? event.error.stack : null,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        });

        // 资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `资源加载失败: ${event.target.tagName}`,
                    source: event.target.src || event.target.href,
                    tagName: event.target.tagName,
                    timestamp: Date.now(),
                    url: window.location.href
                });
            }
        }, true);
    }

    /**
     * 设置Promise拒绝处理器
     */
    setupPromiseRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason ? event.reason.message || event.reason : '未处理的Promise拒绝',
                reason: event.reason,
                stack: event.reason && event.reason.stack,
                timestamp: Date.now(),
                url: window.location.href
            });
        });
    }

    /**
     * 设置网络错误处理器
     */
    setupNetworkErrorHandler() {
        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // 检查HTTP错误状态
                if (!response.ok) {
                    this.handleNetworkError({
                        type: 'http',
                        status: response.status,
                        statusText: response.statusText,
                        url: args[0],
                        method: args[1] ? args[1].method || 'GET' : 'GET'
                    });
                }
                
                return response;
            } catch (error) {
                this.handleNetworkError({
                    type: 'network',
                    message: error.message,
                    url: args[0],
                    method: args[1] ? args[1].method || 'GET' : 'GET',
                    error
                });
                throw error;
            }
        };

        // 拦截XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._method = method;
            this._url = url;
            return originalXHROpen.call(this, method, url, ...args);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            this.addEventListener('error', () => {
                window.errorHandler.handleNetworkError({
                    type: 'xhr',
                    message: '网络请求失败',
                    url: this._url,
                    method: this._method,
                    status: this.status,
                    statusText: this.statusText
                });
            });
            
            this.addEventListener('timeout', () => {
                window.errorHandler.handleNetworkError({
                    type: 'timeout',
                    message: '请求超时',
                    url: this._url,
                    method: this._method
                });
            });
            
            return originalXHRSend.call(this, data);
        };
    }

    /**
     * 设置自定义错误类型
     */
    setupCustomErrorTypes() {
        // 业务逻辑错误
        window.BusinessError = class extends Error {
            constructor(message, code, data) {
                super(message);
                this.name = 'BusinessError';
                this.code = code;
                this.data = data;
            }
        };

        // 验证错误
        window.ValidationError = class extends Error {
            constructor(message, field, value) {
                super(message);
                this.name = 'ValidationError';
                this.field = field;
                this.value = value;
            }
        };

        // 权限错误
        window.PermissionError = class extends Error {
            constructor(message, permission, resource) {
                super(message);
                this.name = 'PermissionError';
                this.permission = permission;
                this.resource = resource;
            }
        };

        // 网络错误
        window.NetworkError = class extends Error {
            constructor(message, status, url) {
                super(message);
                this.name = 'NetworkError';
                this.status = status;
                this.url = url;
            }
        };
    }

    /**
     * 处理错误
     */
    handleError(errorInfo) {
        // 添加到错误队列
        this.addToQueue(errorInfo);
        
        // 控制台输出
        this.logError(errorInfo);
        
        // 显示用户提示
        this.showUserNotification(errorInfo);
        
        // 尝试恢复
        this.attemptRecovery(errorInfo);
    }

    /**
     * 处理网络错误
     */
    handleNetworkError(errorInfo) {
        const networkError = {
            ...errorInfo,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.handleError(networkError);
    }

    /**
     * 添加到错误队列
     */
    addToQueue(errorInfo) {
        // 添加唯一ID
        errorInfo.id = this.generateErrorId();
        
        // 添加到队列
        this.errorQueue.push(errorInfo);
        
        // 限制队列大小
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
    }

    /**
     * 生成错误ID
     */
    generateErrorId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 控制台日志输出
     */
    logError(errorInfo) {
        const logLevel = this.getLogLevel(errorInfo);
        const message = `[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`;
        
        switch (logLevel) {
            case 'error':
                console.error(message, errorInfo);
                break;
            case 'warn':
                console.warn(message, errorInfo);
                break;
            case 'info':
                console.info(message, errorInfo);
                break;
            default:
                console.log(message, errorInfo);
        }
    }

    /**
     * 获取日志级别
     */
    getLogLevel(errorInfo) {
        switch (errorInfo.type) {
            case 'javascript':
            case 'promise':
                return 'error';
            case 'network':
            case 'http':
                return errorInfo.status >= 500 ? 'error' : 'warn';
            case 'resource':
                return 'warn';
            default:
                return 'info';
        }
    }

    /**
     * 显示用户通知
     */
    showUserNotification(errorInfo) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        const severity = this.getErrorSeverity(errorInfo);
        
        this.showNotification(userMessage, severity);
    }

    /**
     * 获取用户友好的错误消息
     */
    getUserFriendlyMessage(errorInfo) {
        switch (errorInfo.type) {
            case 'network':
                return '网络连接失败，请检查网络设置';
            case 'http':
                if (errorInfo.status === 404) {
                    return '请求的资源不存在';
                } else if (errorInfo.status === 403) {
                    return '权限不足，无法访问';
                } else if (errorInfo.status === 500) {
                    return '服务器内部错误，请稍后重试';
                } else if (errorInfo.status >= 400 && errorInfo.status < 500) {
                    return '请求参数错误';
                } else {
                    return '服务暂时不可用，请稍后重试';
                }
            case 'resource':
                return '资源加载失败，请刷新页面重试';
            case 'javascript':
                return '页面出现异常，请刷新页面';
            case 'promise':
                return '操作失败，请重试';
            default:
                return '发生未知错误，请联系技术支持';
        }
    }

    /**
     * 获取错误严重程度
     */
    getErrorSeverity(errorInfo) {
        switch (errorInfo.type) {
            case 'javascript':
            case 'promise':
                return 'high';
            case 'network':
            case 'http':
                return errorInfo.status >= 500 ? 'high' : 'medium';
            case 'resource':
                return 'medium';
            default:
                return 'low';
        }
    }

    /**
     * 创建错误UI
     */
    createErrorUI() {
        // 创建通知容器
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'error-notifications';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(this.notificationContainer);

        // 创建错误详情模态框
        this.createErrorModal();
    }

    /**
     * 创建错误模态框
     */
    createErrorModal() {
        const modal = document.createElement('div');
        modal.id = 'error-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10001;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">错误详情</h3>
                <button id="close-error-modal" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div id="error-details"></div>
            <div style="margin-top: 20px; text-align: right;">
                <button id="copy-error-info" style="margin-right: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">复制错误信息</button>
                <button id="report-error" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">报告错误</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // 绑定事件
        document.getElementById('close-error-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        this.errorModal = modal;
    }

    /**
     * 显示通知
     */
    showNotification(message, severity = 'medium') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${this.getSeverityColor(severity)};
            color: white;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
            position: relative;
        `;

        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
            </div>
        `;

        // 添加动画样式
        if (!document.getElementById('error-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'error-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // 关闭按钮事件
        const closeBtn = notification.querySelector('button');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(notification);
        });

        // 点击显示详情
        notification.addEventListener('click', () => {
            this.showErrorDetails(this.errorQueue[this.errorQueue.length - 1]);
        });

        this.notificationContainer.appendChild(notification);

        // 自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                this.removeNotification(notification);
            }
        }, severity === 'high' ? 10000 : 5000);
    }

    /**
     * 获取严重程度颜色
     */
    getSeverityColor(severity) {
        switch (severity) {
            case 'high':
                return '#dc3545';
            case 'medium':
                return '#fd7e14';
            case 'low':
                return '#17a2b8';
            default:
                return '#6c757d';
        }
    }

    /**
     * 移除通知
     */
    removeNotification(notification) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * 显示错误详情
     */
    showErrorDetails(errorInfo) {
        const detailsContainer = document.getElementById('error-details');
        
        detailsContainer.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>错误类型:</strong> ${errorInfo.type}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>错误消息:</strong> ${errorInfo.message}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>发生时间:</strong> ${new Date(errorInfo.timestamp).toLocaleString()}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>页面地址:</strong> ${errorInfo.url}
            </div>
            ${errorInfo.filename ? `<div style="margin-bottom: 15px;"><strong>文件:</strong> ${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}</div>` : ''}
            ${errorInfo.stack ? `<div style="margin-bottom: 15px;"><strong>堆栈跟踪:</strong><pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${errorInfo.stack}</pre></div>` : ''}
            ${errorInfo.status ? `<div style="margin-bottom: 15px;"><strong>HTTP状态:</strong> ${errorInfo.status} ${errorInfo.statusText || ''}</div>` : ''}
        `;

        // 绑定复制和报告按钮事件
        document.getElementById('copy-error-info').onclick = () => {
            this.copyErrorInfo(errorInfo);
        };

        document.getElementById('report-error').onclick = () => {
            this.reportError(errorInfo);
        };

        this.errorModal.style.display = 'block';
    }

    /**
     * 复制错误信息
     */
    async copyErrorInfo(errorInfo) {
        const errorText = JSON.stringify(errorInfo, null, 2);
        
        try {
            await navigator.clipboard.writeText(errorText);
            this.showNotification('错误信息已复制到剪贴板', 'low');
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = errorText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('错误信息已复制到剪贴板', 'low');
        }
    }

    /**
     * 报告错误
     */
    async reportError(errorInfo) {
        try {
            const response = await fetch(this.reportEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorInfo)
            });

            if (response.ok) {
                this.showNotification('错误报告已发送', 'low');
            } else {
                throw new Error('报告发送失败');
            }
        } catch (error) {
            this.showNotification('错误报告发送失败，请稍后重试', 'medium');
        }
    }

    /**
     * 尝试恢复
     */
    attemptRecovery(errorInfo) {
        switch (errorInfo.type) {
            case 'network':
                this.retryNetworkRequest(errorInfo);
                break;
            case 'resource':
                this.retryResourceLoad(errorInfo);
                break;
            case 'javascript':
                this.handleJavaScriptError(errorInfo);
                break;
        }
    }

    /**
     * 重试网络请求
     */
    async retryNetworkRequest(errorInfo) {
        if (errorInfo.retryCount >= this.retryAttempts) {
            return;
        }

        errorInfo.retryCount = (errorInfo.retryCount || 0) + 1;
        
        setTimeout(async () => {
            try {
                const response = await fetch(errorInfo.url);
                if (response.ok) {
                    this.showNotification('网络连接已恢复', 'low');
                } else {
                    this.retryNetworkRequest(errorInfo);
                }
            } catch (error) {
                this.retryNetworkRequest(errorInfo);
            }
        }, this.retryDelay * errorInfo.retryCount);
    }

    /**
     * 重试资源加载
     */
    retryResourceLoad(errorInfo) {
        if (errorInfo.retryCount >= this.retryAttempts) {
            return;
        }

        errorInfo.retryCount = (errorInfo.retryCount || 0) + 1;
        
        setTimeout(() => {
            const elements = document.querySelectorAll(`${errorInfo.tagName.toLowerCase()}[src="${errorInfo.source}"]`);
            elements.forEach(element => {
                element.src = errorInfo.source + '?retry=' + errorInfo.retryCount;
            });
        }, this.retryDelay * errorInfo.retryCount);
    }

    /**
     * 处理JavaScript错误
     */
    handleJavaScriptError(errorInfo) {
        // 检查是否为关键错误
        if (this.isCriticalError(errorInfo)) {
            this.showRecoveryOptions();
        }
    }

    /**
     * 判断是否为关键错误
     */
    isCriticalError(errorInfo) {
        const criticalPatterns = [
            /Cannot read property/,
            /is not defined/,
            /is not a function/,
            /Maximum call stack/
        ];

        return criticalPatterns.some(pattern => pattern.test(errorInfo.message));
    }

    /**
     * 显示恢复选项
     */
    showRecoveryOptions() {
        const recoveryModal = document.createElement('div');
        recoveryModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10002;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        recoveryModal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 8px; text-align: center; max-width: 400px;">
                <h3 style="color: #dc3545; margin-bottom: 20px;">页面出现严重错误</h3>
                <p style="margin-bottom: 30px;">为了确保正常使用，建议您选择以下恢复方式：</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="reload-page" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">刷新页面</button>
                    <button id="clear-cache" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">清除缓存</button>
                    <button id="continue-anyway" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">继续使用</button>
                </div>
            </div>
        `;

        document.body.appendChild(recoveryModal);

        // 绑定事件
        document.getElementById('reload-page').addEventListener('click', () => {
            window.location.reload();
        });

        document.getElementById('clear-cache').addEventListener('click', () => {
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                }).then(() => {
                    window.location.reload();
                });
            } else {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
            }
        });

        document.getElementById('continue-anyway').addEventListener('click', () => {
            document.body.removeChild(recoveryModal);
        });
    }

    /**
     * 开始错误报告
     */
    startErrorReporting() {
        // 定期发送错误报告
        setInterval(() => {
            this.sendErrorBatch();
        }, 30000); // 每30秒发送一次

        // 页面卸载时发送剩余错误
        window.addEventListener('beforeunload', () => {
            this.sendErrorBatch(true);
        });
    }

    /**
     * 批量发送错误
     */
    async sendErrorBatch(immediate = false) {
        if (this.errorQueue.length === 0) {
            return;
        }

        const errors = [...this.errorQueue];
        this.errorQueue = [];

        const payload = {
            errors,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: sessionStorage.getItem('session_id')
        };

        try {
            if (immediate && navigator.sendBeacon) {
                navigator.sendBeacon(this.reportEndpoint, JSON.stringify(payload));
            } else {
                await fetch(this.reportEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }
        } catch (error) {
            // 发送失败，重新加入队列
            this.errorQueue.unshift(...errors);
            console.warn('错误报告发送失败:', error);
        }
    }

    /**
     * 获取错误统计
     */
    getErrorStats() {
        const stats = {
            total: this.errorQueue.length,
            byType: {},
            bySeverity: {},
            recent: this.errorQueue.slice(-10)
        };

        this.errorQueue.forEach(error => {
            // 按类型统计
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // 按严重程度统计
            const severity = this.getErrorSeverity(error);
            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
        });

        return stats;
    }

    /**
     * 清除错误队列
     */
    clearErrorQueue() {
        this.errorQueue = [];
        console.log('错误队列已清空');
    }

    /**
     * 手动报告错误
     */
    reportManualError(message, type = 'manual', data = {}) {
        this.handleError({
            type,
            message,
            data,
            timestamp: Date.now(),
            url: window.location.href,
            manual: true
        });
    }
}

// 自动初始化错误处理器
document.addEventListener('DOMContentLoaded', () => {
    window.errorHandler = new ErrorHandler();
    console.log('错误处理器已启动');
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}