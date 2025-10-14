/**
 * 通知组件 - Notification Component
 * 基于Context7 MCP标准的通知系统
 * 提供成功、警告、错误、信息等类型的通知功能
 */
class Notification extends BaseComponent {
    constructor() {
        super('Notification');
        this.config = null;
        this.notifications = new Map();
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 5000; // 5秒
        this.positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];
        this.currentPosition = 'top-right';
    }

    /**
     * 初始化通知组件
     */
    async init() {
        await super.init();
        
        // 获取配置
        this.config = window.ConfigLoader.get('admin');
        
        if (!this.config) {
            throw new Error('管理配置未找到');
        }

        // 从配置中获取通知设置
        if (this.config.notifications) {
            this.maxNotifications = this.config.notifications.maxNotifications || 5;
            this.defaultDuration = this.config.notifications.defaultDuration || 5000;
            this.currentPosition = this.config.notifications.position || 'top-right';
        }

        // 监听通知事件
        window.EventBus.on('notification:show', this.handleShowNotification);
        window.EventBus.on('notification:hide', this.handleHideNotification);
        window.EventBus.on('notification:clear', this.handleClearNotifications);
        window.EventBus.on('notification:position', this.handleChangePosition);
        
        // 监听系统事件
        window.EventBus.on('api:success', this.handleApiSuccess);
        window.EventBus.on('api:error', this.handleApiError);
        window.EventBus.on('form:success', this.handleFormSuccess);
        window.EventBus.on('form:error', this.handleFormError);
        
        console.log('通知组件初始化完成');
    }

    /**
     * 挂载通知组件
     * @param {HTMLElement} container - 容器元素
     */
    async mount(container = null) {
        // 创建通知容器
        this.createNotificationContainer();
        
        await super.mount(container);
    }

    /**
     * 创建通知容器
     */
    createNotificationContainer() {
        // 检查是否已存在
        let container = document.getElementById('notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = `notification-container position-${this.currentPosition}`;
            document.body.appendChild(container);
        }
        
        this.container = container;
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 (success, warning, error, info)
     * @param {object} options - 选项
     */
    show(message, type = 'info', options = {}) {
        const config = {
            id: this.generateNotificationId(),
            message,
            type,
            title: options.title || null,
            duration: options.duration !== undefined ? options.duration : this.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || [],
            icon: options.icon || this.getDefaultIcon(type),
            closable: options.closable !== false,
            html: options.html || false,
            onClick: options.onClick || null,
            onClose: options.onClose || null,
            className: options.className || '',
            timestamp: Date.now()
        };

        // 检查通知数量限制
        this.checkNotificationLimit();
        
        // 创建通知元素
        const notificationElement = this.createNotificationElement(config);
        
        // 保存通知状态
        this.notifications.set(config.id, {
            config,
            element: notificationElement,
            timer: null
        });

        // 添加到容器
        this.container.appendChild(notificationElement);
        
        // 触发显示动画
        setTimeout(() => {
            notificationElement.classList.add('notification-show');
        }, 10);

        // 设置自动隐藏
        if (config.duration > 0 && !config.persistent) {
            this.setAutoHide(config.id, config.duration);
        }

        // 发布显示事件
        window.EventBus.emit('notification:shown', config.id, config);
        
        return config.id;
    }

    /**
     * 隐藏通知
     * @param {string} notificationId - 通知ID
     */
    hide(notificationId) {
        const notification = this.notifications.get(notificationId);
        
        if (!notification) {
            return;
        }

        // 清除定时器
        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        // 执行关闭回调
        if (notification.config.onClose) {
            notification.config.onClose(notificationId, notification.config);
        }

        // 添加隐藏动画
        notification.element.classList.add('notification-hide');
        
        setTimeout(() => {
            // 移除元素
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            // 清除状态
            this.notifications.delete(notificationId);
            
            // 发布隐藏事件
            window.EventBus.emit('notification:hidden', notificationId);
        }, 300); // 动画持续时间
    }

    /**
     * 创建通知元素
     * @param {object} config - 通知配置
     */
    createNotificationElement(config) {
        const element = document.createElement('div');
        element.className = `notification notification-${config.type} ${config.className}`;
        element.dataset.notificationId = config.id;

        // 构建HTML内容
        let html = `
            <div class="notification-content">
                ${config.icon ? `<div class="notification-icon"><i class="${config.icon}"></i></div>` : ''}
                <div class="notification-body">
                    ${config.title ? `<div class="notification-title">${config.title}</div>` : ''}
                    <div class="notification-message">
                        ${config.html ? config.message : this.escapeHtml(config.message)}
                    </div>
                </div>
                ${config.closable ? '<button class="notification-close" type="button"><i class="fas fa-times"></i></button>' : ''}
            </div>
        `;

        // 添加操作按钮
        if (config.actions && config.actions.length > 0) {
            html += '<div class="notification-actions">';
            
            config.actions.forEach(action => {
                html += `
                    <button class="notification-action btn btn-sm btn-${action.type || 'secondary'}" 
                            data-action="${action.action}">
                        ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                        ${action.text}
                    </button>
                `;
            });
            
            html += '</div>';
        }

        element.innerHTML = html;

        // 绑定事件
        this.bindNotificationEvents(element, config);

        return element;
    }

    /**
     * 绑定通知事件
     * @param {HTMLElement} element - 通知元素
     * @param {object} config - 通知配置
     */
    bindNotificationEvents(element, config) {
        // 关闭按钮事件
        const closeButton = element.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide(config.id);
            });
        }

        // 操作按钮事件
        const actionButtons = element.querySelectorAll('.notification-action');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const actionName = button.dataset.action;
                const action = config.actions.find(a => a.action === actionName);
                
                if (action && action.handler) {
                    action.handler(config.id, config, actionName);
                }
                
                // 如果操作设置为自动关闭
                if (action && action.autoClose !== false) {
                    this.hide(config.id);
                }
            });
        });

        // 点击事件
        if (config.onClick) {
            element.addEventListener('click', (e) => {
                config.onClick(config.id, config, e);
            });
        }
    }

    /**
     * 设置自动隐藏
     * @param {string} notificationId - 通知ID
     * @param {number} duration - 持续时间
     */
    setAutoHide(notificationId, duration) {
        const notification = this.notifications.get(notificationId);
        
        if (!notification) {
            return;
        }

        notification.timer = setTimeout(() => {
            this.hide(notificationId);
        }, duration);
    }

    /**
     * 检查通知数量限制
     */
    checkNotificationLimit() {
        const notificationCount = this.notifications.size;
        
        if (notificationCount >= this.maxNotifications) {
            // 移除最旧的通知
            const oldestId = Array.from(this.notifications.keys())[0];
            this.hide(oldestId);
        }
    }

    /**
     * 获取默认图标
     * @param {string} type - 通知类型
     */
    getDefaultIcon(type) {
        const iconMap = {
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle',
            info: 'fas fa-info-circle'
        };
        
        return iconMap[type] || iconMap.info;
    }

    /**
     * 生成通知ID
     */
    generateNotificationId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 转义HTML
     * @param {string} text - 文本内容
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 更改通知位置
     * @param {string} position - 新位置
     */
    changePosition(position) {
        if (!this.positions.includes(position)) {
            console.warn(`无效的通知位置: ${position}`);
            return;
        }

        this.currentPosition = position;
        
        if (this.container) {
            this.container.className = `notification-container position-${position}`;
        }

        // 发布位置变更事件
        window.EventBus.emit('notification:position-changed', position);
    }

    /**
     * 清除所有通知
     * @param {string} type - 可选，指定类型
     */
    clearAll(type = null) {
        const notificationIds = Array.from(this.notifications.keys());
        
        notificationIds.forEach(id => {
            const notification = this.notifications.get(id);
            
            if (!type || notification.config.type === type) {
                this.hide(id);
            }
        });
    }

    /**
     * 便捷方法 - 成功通知
     * @param {string} message - 消息
     * @param {object} options - 选项
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * 便捷方法 - 警告通知
     * @param {string} message - 消息
     * @param {object} options - 选项
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * 便捷方法 - 错误通知
     * @param {string} message - 消息
     * @param {object} options - 选项
     */
    error(message, options = {}) {
        return this.show(message, 'error', {
            duration: 0, // 错误通知默认不自动消失
            persistent: true,
            ...options
        });
    }

    /**
     * 便捷方法 - 信息通知
     * @param {string} message - 消息
     * @param {object} options - 选项
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * 处理显示通知事件
     * @param {object} event - 事件对象
     * @param {string} message - 消息
     * @param {string} type - 类型
     * @param {object} options - 选项
     */
    handleShowNotification(event, message, type, options) {
        this.show(message, type, options);
    }

    /**
     * 处理隐藏通知事件
     * @param {object} event - 事件对象
     * @param {string} notificationId - 通知ID
     */
    handleHideNotification(event, notificationId) {
        this.hide(notificationId);
    }

    /**
     * 处理清除通知事件
     * @param {object} event - 事件对象
     * @param {string} type - 类型
     */
    handleClearNotifications(event, type) {
        this.clearAll(type);
    }

    /**
     * 处理更改位置事件
     * @param {object} event - 事件对象
     * @param {string} position - 位置
     */
    handleChangePosition(event, position) {
        this.changePosition(position);
    }

    /**
     * 处理API成功事件
     * @param {object} event - 事件对象
     * @param {object} response - 响应数据
     * @param {string} action - 操作名称
     */
    handleApiSuccess(event, response, action) {
        if (response && response.message) {
            this.success(response.message, {
                title: '操作成功'
            });
        }
    }

    /**
     * 处理API错误事件
     * @param {object} event - 事件对象
     * @param {object} error - 错误信息
     * @param {string} action - 操作名称
     */
    handleApiError(event, error, action) {
        // 安全地获取错误信息
        let message = '操作失败，请稍后重试';
        try {
            if (error && typeof error === 'object') {
                message = error.message || error.toString() || '操作失败，请稍后重试';
            } else if (error) {
                message = String(error);
            }
        } catch (e) {
            message = '操作失败，请稍后重试';
        }
        
        this.error(message, {
            title: '操作失败',
            actions: [
                {
                    text: '重试',
                    type: 'primary',
                    action: 'retry',
                    handler: () => {
                        window.EventBus.emit('api:retry', action, error);
                    }
                }
            ]
        });
    }

    /**
     * 处理表单成功事件
     * @param {object} event - 事件对象
     * @param {string} formName - 表单名称
     * @param {object} data - 表单数据
     */
    handleFormSuccess(event, formName, data) {
        this.success('表单提交成功', {
            title: '提交成功'
        });
    }

    /**
     * 处理表单错误事件
     * @param {object} event - 事件对象
     * @param {string} formName - 表单名称
     * @param {object} errors - 错误信息
     */
    handleFormError(event, formName, errors) {
        let message = '表单验证失败';
        
        if (Array.isArray(errors)) {
            message = errors.join(', ');
        } else if (errors) {
            // 安全地获取错误信息
            try {
                if (typeof errors === 'object') {
                    message = errors.message || errors.toString() || '表单验证失败';
                } else {
                    message = String(errors);
                }
            } catch (e) {
                message = '表单验证失败';
            }
        }
            
        this.error(message, {
            title: '表单错误'
        });
    }

    /**
     * 获取所有通知
     */
    getAllNotifications() {
        return Array.from(this.notifications.entries()).map(([id, notification]) => ({
            id,
            config: notification.config,
            age: Date.now() - notification.config.timestamp
        }));
    }

    /**
     * 获取指定类型的通知数量
     * @param {string} type - 通知类型
     */
    getNotificationCount(type = null) {
        if (!type) {
            return this.notifications.size;
        }
        
        return Array.from(this.notifications.values())
            .filter(notification => notification.config.type === type).length;
    }

    /**
     * 组件销毁前清理
     */
    async beforeDestroy() {
        // 清除所有通知
        this.clearAll();
        
        // 移除事件监听器
        window.EventBus.off('notification:show', this.handleShowNotification);
        window.EventBus.off('notification:hide', this.handleHideNotification);
        window.EventBus.off('notification:clear', this.handleClearNotifications);
        window.EventBus.off('notification:position', this.handleChangePosition);
        window.EventBus.off('api:success', this.handleApiSuccess);
        window.EventBus.off('api:error', this.handleApiError);
        window.EventBus.off('form:success', this.handleFormSuccess);
        window.EventBus.off('form:error', this.handleFormError);
        
        // 移除容器
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        await super.beforeDestroy();
    }

    /**
     * 获取通知状态
     */
    getState() {
        return {
            totalNotifications: this.notifications.size,
            position: this.currentPosition,
            maxNotifications: this.maxNotifications,
            notifications: this.getAllNotifications()
        };
    }
}

// 创建全局实例
window.Notification = new Notification();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Notification;
}