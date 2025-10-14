/**
 * 错误处理工具函数库
 * 提供统一的错误处理和日志记录方法
 */

class ErrorHandler {
  static errorLog = [];
  static maxLogSize = 100;
  static errorCallbacks = [];

  /**
   * 记录错误信息
   * @param {Error|string} error - 错误对象或错误信息
   * @param {string} context - 错误上下文
   * @param {Object} metadata - 附加元数据
   */
  static logError(error, context = '', metadata = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : '',
      context,
      metadata,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 添加到错误日志
    this.errorLog.unshift(errorInfo);
    
    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // 保存到本地存储
    try {
      localStorage.setItem('errorLog', JSON.stringify(this.errorLog.slice(0, 20)));
    } catch (e) {
      console.warn('无法保存错误日志到本地存储:', e);
    }

    // 控制台输出
    console.error(`[${context}]`, error, metadata);

    // 触发错误回调
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorInfo);
      } catch (e) {
        console.error('错误回调执行失败:', e);
      }
    });
  }

  /**
   * 添加错误回调函数
   * @param {Function} callback - 回调函数
   */
  static addErrorCallback(callback) {
    if (typeof callback === 'function') {
      this.errorCallbacks.push(callback);
    }
  }

  /**
   * 移除错误回调函数
   * @param {Function} callback - 回调函数
   */
  static removeErrorCallback(callback) {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * 处理API请求错误
   * @param {Error} error - 错误对象
   * @param {string} apiUrl - API地址
   * @param {Object} requestData - 请求数据
   * @returns {Object} 标准化的错误响应
   */
  static handleApiError(error, apiUrl = '', requestData = {}) {
    let errorMessage = '网络请求失败';
    let errorCode = 'NETWORK_ERROR';

    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      errorCode = `HTTP_${status}`;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || '请求参数错误';
          break;
        case 401:
          errorMessage = '权限不足，请重新登录';
          break;
        case 403:
          errorMessage = '访问被拒绝';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = data?.message || `服务器错误 (${status})`;
      }
    } else if (error.request) {
      // 网络连接错误
      errorMessage = '网络连接失败，请检查网络设置';
      errorCode = 'CONNECTION_ERROR';
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误';
      errorCode = 'UNKNOWN_ERROR';
    }

    const errorInfo = {
      code: errorCode,
      message: errorMessage,
      apiUrl,
      requestData,
      originalError: error
    };

    this.logError(error, `API请求失败: ${apiUrl}`, errorInfo);

    return {
      success: false,
      error: errorInfo,
      message: errorMessage
    };
  }

  /**
   * 处理表单验证错误
   * @param {Object} validationErrors - 验证错误对象
   * @param {string} formName - 表单名称
   * @returns {string} 错误消息
   */
  static handleValidationError(validationErrors, formName = '') {
    const errors = Object.values(validationErrors).flat();
    const errorMessage = errors.length > 0 ? errors[0] : '表单验证失败';

    this.logError(errorMessage, `表单验证失败: ${formName}`, {
      validationErrors,
      formName
    });

    return errorMessage;
  }

  /**
   * 处理业务逻辑错误
   * @param {string} message - 错误消息
   * @param {string} operation - 操作名称
   * @param {Object} context - 上下文信息
   */
  static handleBusinessError(message, operation = '', context = {}) {
    this.logError(message, `业务错误: ${operation}`, context);
    
    // 可以在这里添加用户友好的错误提示
    if (window.showDialog && typeof window.showDialog === 'function') {
      window.showDialog('操作失败', message, [{ text: '确定', action: 'close' }], 'error');
    }
  }

  /**
   * 安全执行函数，捕获并处理异常
   * @param {Function} fn - 要执行的函数
   * @param {string} context - 执行上下文
   * @param {*} defaultValue - 异常时的默认返回值
   * @returns {*} 函数执行结果或默认值
   */
  static safeExecute(fn, context = '', defaultValue = null) {
    try {
      return fn();
    } catch (error) {
      this.logError(error, `安全执行失败: ${context}`);
      return defaultValue;
    }
  }

  /**
   * 安全执行异步函数
   * @param {Function} asyncFn - 要执行的异步函数
   * @param {string} context - 执行上下文
   * @param {*} defaultValue - 异常时的默认返回值
   * @returns {Promise} Promise对象
   */
  static async safeExecuteAsync(asyncFn, context = '', defaultValue = null) {
    try {
      return await asyncFn();
    } catch (error) {
      this.logError(error, `异步执行失败: ${context}`);
      return defaultValue;
    }
  }

  /**
   * 获取错误日志
   * @param {number} limit - 返回的日志数量限制
   * @returns {Array} 错误日志数组
   */
  static getErrorLog(limit = 20) {
    return this.errorLog.slice(0, limit);
  }

  /**
   * 清空错误日志
   */
  static clearErrorLog() {
    this.errorLog = [];
    try {
      localStorage.removeItem('errorLog');
    } catch (e) {
      console.warn('无法清除本地存储的错误日志:', e);
    }
  }

  /**
   * 从本地存储加载错误日志
   */
  static loadErrorLog() {
    try {
      const savedLog = localStorage.getItem('errorLog');
      if (savedLog) {
        this.errorLog = JSON.parse(savedLog);
      }
    } catch (e) {
      console.warn('无法加载本地存储的错误日志:', e);
    }
  }

  /**
   * 设置全局错误处理器
   */
  static setupGlobalErrorHandlers() {
    // 捕获未处理的JavaScript错误
    window.addEventListener('error', (event) => {
      this.logError(event.error || event.message, '全局JavaScript错误', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, '未处理的Promise拒绝', {
        promise: event.promise
      });
    });
  }

  /**
   * 生成错误报告
   * @returns {Object} 错误报告对象
   */
  static generateErrorReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorCount: this.errorLog.length,
      recentErrors: this.getErrorLog(10),
      systemInfo: {
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };

    return report;
  }

  /**
   * 导出错误日志
   * @param {string} format - 导出格式 ('json' 或 'csv')
   * @returns {string} 导出的数据
   */
  static exportErrorLog(format = 'json') {
    const report = this.generateErrorReport();

    if (format === 'csv') {
      const headers = ['时间', '错误信息', '上下文', '页面地址'];
      const rows = this.errorLog.map(error => [
        error.timestamp,
        error.message.replace(/"/g, '""'),
        error.context.replace(/"/g, '""'),
        error.url
      ]);

      return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
    }

    return JSON.stringify(report, null, 2);
  }
}

// 初始化全局错误处理
ErrorHandler.setupGlobalErrorHandlers();
ErrorHandler.loadErrorLog();

// 导出工具类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}