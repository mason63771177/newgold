/**
 * 事件总线 - Event Bus
 * 基于Context7 MCP标准的事件管理系统
 * 提供组件间通信、事件监听和发布机制
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.maxListeners = 100;
        this.initialized = false;
    }

    /**
     * 初始化事件总线
     */
    init() {
        if (this.initialized) {
            return;
        }

        // 绑定全局错误处理
        this.setupGlobalErrorHandling();
        
        this.initialized = true;
        console.log('事件总线初始化完成');
    }

    /**
     * 监听事件
     * @param {string} eventName - 事件名称
     * @param {function} callback - 回调函数
     * @param {object} options - 选项
     */
    on(eventName, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('回调函数必须是一个函数');
        }

        const { priority = 0, context = null } = options;

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listeners = this.events.get(eventName);
        
        // 检查监听器数量限制
        if (listeners.length >= this.maxListeners) {
            console.warn(`事件 ${eventName} 的监听器数量已达到上限 ${this.maxListeners}`);
        }

        const listener = {
            callback,
            priority,
            context,
            id: this.generateListenerId()
        };

        // 按优先级插入
        const insertIndex = listeners.findIndex(l => l.priority < priority);
        if (insertIndex === -1) {
            listeners.push(listener);
        } else {
            listeners.splice(insertIndex, 0, listener);
        }

        return listener.id;
    }

    /**
     * 监听事件（仅一次）
     * @param {string} eventName - 事件名称
     * @param {function} callback - 回调函数
     * @param {object} options - 选项
     */
    once(eventName, callback, options = {}) {
        const listenerId = this.on(eventName, (...args) => {
            this.off(eventName, listenerId);
            callback.apply(options.context, args);
        }, options);

        // 记录一次性监听器
        if (!this.onceEvents.has(eventName)) {
            this.onceEvents.set(eventName, new Set());
        }
        this.onceEvents.get(eventName).add(listenerId);

        return listenerId;
    }

    /**
     * 取消监听事件
     * @param {string} eventName - 事件名称
     * @param {string|function} listenerOrId - 监听器ID或回调函数
     */
    off(eventName, listenerOrId = null) {
        if (!this.events.has(eventName)) {
            return false;
        }

        const listeners = this.events.get(eventName);

        if (listenerOrId === null) {
            // 移除所有监听器
            this.events.delete(eventName);
            this.onceEvents.delete(eventName);
            return true;
        }

        let removed = false;

        if (typeof listenerOrId === 'string') {
            // 通过ID移除
            const index = listeners.findIndex(l => l.id === listenerOrId);
            if (index !== -1) {
                listeners.splice(index, 1);
                removed = true;
            }
        } else if (typeof listenerOrId === 'function') {
            // 通过回调函数移除
            const index = listeners.findIndex(l => l.callback === listenerOrId);
            if (index !== -1) {
                listeners.splice(index, 1);
                removed = true;
            }
        }

        // 清理空的事件数组
        if (listeners.length === 0) {
            this.events.delete(eventName);
        }

        // 清理一次性事件记录
        if (this.onceEvents.has(eventName)) {
            this.onceEvents.get(eventName).delete(listenerOrId);
            if (this.onceEvents.get(eventName).size === 0) {
                this.onceEvents.delete(eventName);
            }
        }

        return removed;
    }

    /**
     * 发布事件
     * @param {string} eventName - 事件名称
     * @param {...any} args - 事件参数
     */
    emit(eventName, ...args) {
        if (!this.events.has(eventName)) {
            return false;
        }

        const listeners = this.events.get(eventName);
        const results = [];

        // 创建事件对象
        const event = {
            name: eventName,
            timestamp: Date.now(),
            args,
            stopped: false,
            preventDefault: false
        };

        for (const listener of listeners) {
            try {
                // 检查事件是否被停止
                if (event.stopped) {
                    break;
                }

                // 调用监听器
                const result = listener.callback.apply(listener.context, [event, ...args]);
                results.push(result);

                // 如果返回Promise，处理异步结果
                if (result instanceof Promise) {
                    result.catch(error => {
                        console.error(`事件 ${eventName} 的异步监听器发生错误:`, error);
                        this.emit('error', error, eventName, listener);
                    });
                }

            } catch (error) {
                console.error(`事件 ${eventName} 的监听器发生错误:`, error);
                this.emit('error', error, eventName, listener);
            }
        }

        return results;
    }

    /**
     * 异步发布事件
     * @param {string} eventName - 事件名称
     * @param {...any} args - 事件参数
     */
    async emitAsync(eventName, ...args) {
        if (!this.events.has(eventName)) {
            return [];
        }

        const listeners = this.events.get(eventName);
        const results = [];

        // 创建事件对象
        const event = {
            name: eventName,
            timestamp: Date.now(),
            args,
            stopped: false,
            preventDefault: false
        };

        for (const listener of listeners) {
            try {
                // 检查事件是否被停止
                if (event.stopped) {
                    break;
                }

                // 调用监听器并等待结果
                const result = await listener.callback.apply(listener.context, [event, ...args]);
                results.push(result);

            } catch (error) {
                console.error(`事件 ${eventName} 的异步监听器发生错误:`, error);
                this.emit('error', error, eventName, listener);
            }
        }

        return results;
    }

    /**
     * 检查是否有监听器
     * @param {string} eventName - 事件名称
     */
    hasListeners(eventName) {
        return this.events.has(eventName) && this.events.get(eventName).length > 0;
    }

    /**
     * 获取监听器数量
     * @param {string} eventName - 事件名称
     */
    listenerCount(eventName) {
        return this.events.has(eventName) ? this.events.get(eventName).length : 0;
    }

    /**
     * 获取所有事件名称
     */
    eventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * 清除所有监听器
     */
    removeAllListeners() {
        this.events.clear();
        this.onceEvents.clear();
    }

    /**
     * 设置最大监听器数量
     * @param {number} max - 最大数量
     */
    setMaxListeners(max) {
        this.maxListeners = max;
    }

    /**
     * 生成监听器ID
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalErrorHandling() {
        // 监听全局错误事件
        this.on('error', (event, error, eventName, listener) => {
            console.group(`事件系统错误 - ${eventName}`);
            console.error('错误详情:', error);
            console.error('监听器信息:', listener);
            console.groupEnd();
        });

        // 监听应用级别的事件
        this.on('app:ready', () => {
            console.log('应用已就绪');
        });

        this.on('app:error', (event, error) => {
            console.error('应用错误:', error);
        });

        this.on('page:change', (event, pageName) => {
            console.log(`页面切换到: ${pageName}`);
        });

        this.on('component:mount', (event, componentName) => {
            console.log(`组件挂载: ${componentName}`);
        });

        this.on('component:unmount', (event, componentName) => {
            console.log(`组件卸载: ${componentName}`);
        });
    }

    /**
     * 创建命名空间事件
     * @param {string} namespace - 命名空间
     */
    namespace(namespace) {
        return {
            on: (eventName, callback, options) => {
                return this.on(`${namespace}:${eventName}`, callback, options);
            },
            once: (eventName, callback, options) => {
                return this.once(`${namespace}:${eventName}`, callback, options);
            },
            off: (eventName, listenerOrId) => {
                return this.off(`${namespace}:${eventName}`, listenerOrId);
            },
            emit: (eventName, ...args) => {
                return this.emit(`${namespace}:${eventName}`, ...args);
            },
            emitAsync: (eventName, ...args) => {
                return this.emitAsync(`${namespace}:${eventName}`, ...args);
            }
        };
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        const info = {
            totalEvents: this.events.size,
            totalListeners: 0,
            events: {}
        };

        this.events.forEach((listeners, eventName) => {
            info.totalListeners += listeners.length;
            info.events[eventName] = {
                listenerCount: listeners.length,
                listeners: listeners.map(l => ({
                    id: l.id,
                    priority: l.priority,
                    hasContext: !!l.context
                }))
            };
        });

        return info;
    }
}

// 创建全局实例
window.EventBus = new EventBus();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
}