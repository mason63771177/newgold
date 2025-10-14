/**
 * 模态框组件 - Modal Component
 * 基于Context7 MCP标准的模态框系统
 * 提供弹窗、确认对话框、表单对话框等功能
 */
class Modal extends BaseComponent {
    constructor() {
        super('Modal');
        this.config = null;
        this.modals = new Map();
        this.modalStack = [];
        this.backdrop = null;
        this.zIndexBase = 1050;
        this.defaultOptions = {
            size: 'medium', // small, medium, large, xl, fullscreen
            backdrop: true,
            keyboard: true,
            focus: true,
            closable: true,
            animation: 'fade', // fade, slide, zoom
            position: 'center' // center, top, bottom
        };
    }

    /**
     * 初始化模态框组件
     */
    async init() {
        await super.init();
        
        // 获取配置
        this.config = window.ConfigLoader.get('admin');
        
        if (!this.config) {
            throw new Error('管理配置未找到');
        }

        // 监听模态框事件
        window.EventBus.on('modal:show', this.handleShowModal);
        window.EventBus.on('modal:hide', this.handleHideModal);
        window.EventBus.on('modal:confirm', this.handleConfirmModal);
        window.EventBus.on('modal:alert', this.handleAlertModal);
        window.EventBus.on('modal:prompt', this.handlePromptModal);
        
        // 监听键盘事件
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        console.log('模态框组件初始化完成');
    }

    /**
     * 挂载模态框组件
     * @param {HTMLElement} container - 容器元素
     */
    async mount(container = null) {
        // 创建背景遮罩
        this.createBackdrop();
        
        await super.mount(container);
    }

    /**
     * 创建背景遮罩
     */
    createBackdrop() {
        if (!this.backdrop) {
            this.backdrop = document.createElement('div');
            this.backdrop.className = 'modal-backdrop';
            this.backdrop.style.display = 'none';
            document.body.appendChild(this.backdrop);
            
            // 绑定背景点击事件
            this.backdrop.addEventListener('click', this.handleBackdropClick.bind(this));
        }
    }

    /**
     * 显示模态框
     * @param {object} options - 模态框选项
     */
    show(options = {}) {
        const config = {
            id: this.generateModalId(),
            ...this.defaultOptions,
            ...options
        };

        // 验证必要参数
        if (!config.title && !config.content && !config.template) {
            throw new Error('模态框必须包含标题、内容或模板');
        }

        // 创建模态框元素
        const modalElement = this.createModalElement(config);
        
        // 保存模态框状态
        this.modals.set(config.id, {
            config,
            element: modalElement,
            isVisible: false
        });

        // 添加到DOM
        document.body.appendChild(modalElement);
        
        // 显示模态框
        this.showModal(config.id);
        
        // 发布显示事件
        window.EventBus.emit('modal:shown', config.id, config);
        
        return config.id;
    }

    /**
     * 隐藏模态框
     * @param {string} modalId - 模态框ID
     * @param {any} result - 返回结果
     */
    hide(modalId, result = null) {
        const modal = this.modals.get(modalId);
        
        if (!modal || !modal.isVisible) {
            return;
        }

        // 执行关闭前回调
        if (modal.config.onBeforeClose) {
            const shouldClose = modal.config.onBeforeClose(modalId, result);
            if (shouldClose === false) {
                return;
            }
        }

        // 隐藏模态框
        this.hideModal(modalId);
        
        // 执行关闭回调
        if (modal.config.onClose) {
            modal.config.onClose(modalId, result);
        }

        // 发布隐藏事件
        window.EventBus.emit('modal:hidden', modalId, result);
    }

    /**
     * 创建模态框元素
     * @param {object} config - 模态框配置
     */
    createModalElement(config) {
        const modal = document.createElement('div');
        modal.className = `modal modal-${config.size} modal-${config.animation} modal-${config.position}`;
        modal.dataset.modalId = config.id;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-hidden', 'true');

        // 构建模态框HTML
        let html = '<div class="modal-dialog" role="document">';
        html += '<div class="modal-content">';

        // 模态框头部
        if (config.title || config.closable) {
            html += '<div class="modal-header">';
            
            if (config.title) {
                html += `<h5 class="modal-title">${config.title}</h5>`;
            }
            
            if (config.closable) {
                html += `
                    <button type="button" class="modal-close" aria-label="关闭">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            html += '</div>';
        }

        // 模态框主体
        html += '<div class="modal-body">';
        
        if (config.template) {
            html += config.template;
        } else if (config.content) {
            html += config.content;
        }
        
        html += '</div>';

        // 模态框底部
        if (config.buttons && config.buttons.length > 0) {
            html += '<div class="modal-footer">';
            
            config.buttons.forEach(button => {
                html += `
                    <button type="button" 
                            class="btn btn-${button.type || 'secondary'} ${button.className || ''}"
                            data-action="${button.action || ''}"
                            ${button.disabled ? 'disabled' : ''}>
                        ${button.icon ? `<i class="${button.icon}"></i>` : ''}
                        ${button.text}
                    </button>
                `;
            });
            
            html += '</div>';
        }

        html += '</div></div>';
        modal.innerHTML = html;

        // 绑定事件
        this.bindModalEvents(modal, config);

        return modal;
    }

    /**
     * 绑定模态框事件
     * @param {HTMLElement} modal - 模态框元素
     * @param {object} config - 模态框配置
     */
    bindModalEvents(modal, config) {
        // 关闭按钮事件
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide(config.id);
            });
        }

        // 按钮事件
        const buttons = modal.querySelectorAll('.modal-footer .btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.dataset.action;
                const buttonConfig = config.buttons.find(b => b.action === action);
                
                if (buttonConfig && buttonConfig.handler) {
                    const result = buttonConfig.handler(config.id, config, e);
                    
                    // 如果处理器返回false，不关闭模态框
                    if (result !== false && buttonConfig.autoClose !== false) {
                        this.hide(config.id, result);
                    }
                } else if (action === 'close' || action === 'cancel') {
                    this.hide(config.id, false);
                } else if (action === 'confirm' || action === 'ok') {
                    this.hide(config.id, true);
                }
            });
        });

        // 表单提交事件
        const form = modal.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                if (config.onSubmit) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    const result = config.onSubmit(config.id, data, e);
                    
                    if (result !== false) {
                        this.hide(config.id, data);
                    }
                }
            });
        }
    }

    /**
     * 显示模态框
     * @param {string} modalId - 模态框ID
     */
    showModal(modalId) {
        const modal = this.modals.get(modalId);
        
        if (!modal) {
            return;
        }

        // 添加到模态框栈
        this.modalStack.push(modalId);
        
        // 设置z-index
        const zIndex = this.zIndexBase + this.modalStack.length * 10;
        modal.element.style.zIndex = zIndex;

        // 显示背景遮罩
        if (modal.config.backdrop) {
            this.backdrop.style.display = 'block';
            this.backdrop.style.zIndex = zIndex - 1;
            
            setTimeout(() => {
                this.backdrop.classList.add('show');
            }, 10);
        }

        // 显示模态框
        modal.element.style.display = 'block';
        modal.isVisible = true;
        
        setTimeout(() => {
            modal.element.classList.add('show');
            
            // 设置焦点
            if (modal.config.focus) {
                const focusElement = modal.element.querySelector('[autofocus]') ||
                                   modal.element.querySelector('input, textarea, select') ||
                                   modal.element.querySelector('.btn-primary') ||
                                   modal.element.querySelector('.modal-close');
                                   
                if (focusElement) {
                    focusElement.focus();
                }
            }
        }, 10);

        // 禁用页面滚动
        document.body.classList.add('modal-open');
    }

    /**
     * 隐藏模态框
     * @param {string} modalId - 模态框ID
     */
    hideModal(modalId) {
        const modal = this.modals.get(modalId);
        
        if (!modal) {
            return;
        }

        // 从模态框栈中移除
        const stackIndex = this.modalStack.indexOf(modalId);
        if (stackIndex > -1) {
            this.modalStack.splice(stackIndex, 1);
        }

        // 隐藏模态框
        modal.element.classList.remove('show');
        modal.isVisible = false;
        
        setTimeout(() => {
            modal.element.style.display = 'none';
            
            // 移除元素
            if (modal.element.parentNode) {
                modal.element.parentNode.removeChild(modal.element);
            }
            
            // 清除状态
            this.modals.delete(modalId);
        }, 300); // 动画持续时间

        // 如果没有其他模态框，隐藏背景遮罩
        if (this.modalStack.length === 0) {
            this.backdrop.classList.remove('show');
            
            setTimeout(() => {
                this.backdrop.style.display = 'none';
            }, 300);
            
            // 恢复页面滚动
            document.body.classList.remove('modal-open');
        }
    }

    /**
     * 处理背景点击事件
     * @param {Event} event - 点击事件
     */
    handleBackdropClick(event) {
        if (event.target === this.backdrop && this.modalStack.length > 0) {
            const topModalId = this.modalStack[this.modalStack.length - 1];
            const modal = this.modals.get(topModalId);
            
            if (modal && modal.config.backdrop === true) {
                this.hide(topModalId);
            }
        }
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeydown(event) {
        if (event.key === 'Escape' && this.modalStack.length > 0) {
            const topModalId = this.modalStack[this.modalStack.length - 1];
            const modal = this.modals.get(topModalId);
            
            if (modal && modal.config.keyboard) {
                this.hide(topModalId);
            }
        }
    }

    /**
     * 确认对话框
     * @param {string} message - 确认消息
     * @param {object} options - 选项
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const config = {
                title: options.title || '确认',
                content: message,
                size: 'small',
                buttons: [
                    {
                        text: options.cancelText || '取消',
                        type: 'secondary',
                        action: 'cancel'
                    },
                    {
                        text: options.confirmText || '确认',
                        type: options.confirmType || 'primary',
                        action: 'confirm'
                    }
                ],
                onClose: (modalId, result) => {
                    resolve(result === true);
                },
                ...options
            };
            
            this.show(config);
        });
    }

    /**
     * 警告对话框
     * @param {string} message - 警告消息
     * @param {object} options - 选项
     */
    alert(message, options = {}) {
        return new Promise((resolve) => {
            const config = {
                title: options.title || '提示',
                content: message,
                size: 'small',
                buttons: [
                    {
                        text: options.buttonText || '确定',
                        type: 'primary',
                        action: 'ok'
                    }
                ],
                onClose: () => {
                    resolve();
                },
                ...options
            };
            
            this.show(config);
        });
    }

    /**
     * 输入对话框
     * @param {string} message - 提示消息
     * @param {object} options - 选项
     */
    prompt(message, options = {}) {
        return new Promise((resolve) => {
            const inputId = `prompt-input-${Date.now()}`;
            const inputType = options.inputType || 'text';
            const placeholder = options.placeholder || '';
            const defaultValue = options.defaultValue || '';
            
            const config = {
                title: options.title || '输入',
                template: `
                    <div class="prompt-content">
                        <p>${message}</p>
                        <div class="form-group">
                            <input type="${inputType}" 
                                   id="${inputId}"
                                   class="form-control" 
                                   placeholder="${placeholder}"
                                   value="${defaultValue}"
                                   autofocus>
                        </div>
                    </div>
                `,
                size: 'small',
                buttons: [
                    {
                        text: options.cancelText || '取消',
                        type: 'secondary',
                        action: 'cancel'
                    },
                    {
                        text: options.confirmText || '确认',
                        type: 'primary',
                        action: 'confirm',
                        handler: (modalId) => {
                            const input = document.getElementById(inputId);
                            return input ? input.value : '';
                        }
                    }
                ],
                onClose: (modalId, result) => {
                    resolve(result === false ? null : result);
                },
                ...options
            };
            
            this.show(config);
        });
    }

    /**
     * 生成模态框ID
     */
    generateModalId() {
        return `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 处理显示模态框事件
     * @param {object} event - 事件对象
     * @param {object} options - 模态框选项
     */
    handleShowModal(event, options) {
        this.show(options);
    }

    /**
     * 处理隐藏模态框事件
     * @param {object} event - 事件对象
     * @param {string} modalId - 模态框ID
     * @param {any} result - 结果
     */
    handleHideModal(event, modalId, result) {
        this.hide(modalId, result);
    }

    /**
     * 处理确认模态框事件
     * @param {object} event - 事件对象
     * @param {string} message - 消息
     * @param {object} options - 选项
     */
    handleConfirmModal(event, message, options) {
        return this.confirm(message, options);
    }

    /**
     * 处理警告模态框事件
     * @param {object} event - 事件对象
     * @param {string} message - 消息
     * @param {object} options - 选项
     */
    handleAlertModal(event, message, options) {
        return this.alert(message, options);
    }

    /**
     * 处理输入模态框事件
     * @param {object} event - 事件对象
     * @param {string} message - 消息
     * @param {object} options - 选项
     */
    handlePromptModal(event, message, options) {
        return this.prompt(message, options);
    }

    /**
     * 获取当前显示的模态框
     */
    getCurrentModal() {
        if (this.modalStack.length === 0) {
            return null;
        }
        
        const topModalId = this.modalStack[this.modalStack.length - 1];
        return this.modals.get(topModalId);
    }

    /**
     * 关闭所有模态框
     */
    closeAll() {
        const modalIds = [...this.modalStack];
        modalIds.forEach(modalId => {
            this.hide(modalId);
        });
    }

    /**
     * 获取模态框数量
     */
    getModalCount() {
        return this.modals.size;
    }

    /**
     * 组件销毁前清理
     */
    async beforeDestroy() {
        // 关闭所有模态框
        this.closeAll();
        
        // 移除事件监听器
        window.EventBus.off('modal:show', this.handleShowModal);
        window.EventBus.off('modal:hide', this.handleHideModal);
        window.EventBus.off('modal:confirm', this.handleConfirmModal);
        window.EventBus.off('modal:alert', this.handleAlertModal);
        window.EventBus.off('modal:prompt', this.handlePromptModal);
        
        document.removeEventListener('keydown', this.handleKeydown);
        
        // 移除背景遮罩
        if (this.backdrop && this.backdrop.parentNode) {
            this.backdrop.parentNode.removeChild(this.backdrop);
        }
        
        // 恢复页面滚动
        document.body.classList.remove('modal-open');
        
        await super.beforeDestroy();
    }

    /**
     * 获取模态框状态
     */
    getState() {
        return {
            totalModals: this.modals.size,
            visibleModals: this.modalStack.length,
            modalStack: [...this.modalStack],
            currentModal: this.getCurrentModal()?.config || null
        };
    }
}

// 创建全局实例
window.Modal = new Modal();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
}