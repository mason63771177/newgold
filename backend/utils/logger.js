/**
 * 简单的日志工具
 * 提供基本的日志记录功能
 */

const logger = {
    /**
     * 记录信息日志
     * @param {string} message - 日志消息
     * @param {Object} meta - 附加信息
     */
    info: (message, meta = {}) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO: ${message}`, meta);
    },

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {Object} meta - 附加信息
     */
    error: (message, meta = {}) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ERROR: ${message}`, meta);
    },

    /**
     * 记录警告日志
     * @param {string} message - 警告消息
     * @param {Object} meta - 附加信息
     */
    warn: (message, meta = {}) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] WARN: ${message}`, meta);
    },

    /**
     * 记录调试日志
     * @param {string} message - 调试消息
     * @param {Object} meta - 附加信息
     */
    debug: (message, meta = {}) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] DEBUG: ${message}`, meta);
    }
};

module.exports = logger;