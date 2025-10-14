/**
 * 基础组件 - Base Component
 * 基于Context7 MCP标准的组件系统
 * 提供组件生命周期、状态管理和事件处理
 */
class BaseComponent {
    constructor(name, element = null) {
        this.name = name;
        this.element = element;
        this.state = {};
        this.props = {};
        this.children = new Map();
        this.parent = null;
        this.mounted = false;
        this.destroyed = false;
        this.eventListeners = [];
        this.id = this.generateId();
        
        // 绑定方法上下文
        this.bindMethods();
        
        // 注册组件
        BaseComponent.registerComponent(this);
    }

    /**
     * 生成组件ID
     */
    generateId() {
        return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 绑定方法上下文
     */
    bindMethods() {
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        methods.forEach(method => {
            if (typeof this[method] === 'function' && method !== 'constructor') {
                this[method] = this[method].bind(this);
            }
        });
    }

    /**
     * 初始化组件
     * @param {object} props - 组件属性
     */
    async init(props = {}) {
        if (this.destroyed) {
            throw new Error(`组件 ${this.name} 已被销毁，无法初始化`);
        }

        this.props = { ...this.props, ...props };
        
        try {
            // 调用生命周期钩子
            await this.beforeInit();
            await this.onCreate();
            await this.afterInit();
            
            console.log(`组件 ${this.name} 初始化完成`);
            
        } catch (error) {
            console.error(`组件 ${this.name} 初始化失败:`, error);
            throw error;
        }
    }

    /**
     * 挂载组件到DOM
     * @param {HTMLElement} container - 容器元素
     */
    async mount(container = null) {
        if (this.mounted) {
            console.warn(`组件 ${this.name} 已经挂载`);
            return;
        }

        if (this.destroyed) {
            throw new Error(`组件 ${this.name} 已被销毁，无法挂载`);
        }

        try {
            // 设置容器
            if (container) {
                this.element = container;
            }

            if (!this.element) {
                throw new Error(`组件 ${this.name} 缺少挂载容器`);
            }

            // 调用生命周期钩子
            await this.beforeMount();
            await this.render();
            await this.afterMount();
            
            this.mounted = true;
            
            // 发布挂载事件
            window.EventBus.emit('component:mount', this.name, this);
            
            console.log(`组件 ${this.name} 挂载完成`);
            
        } catch (error) {
            console.error(`组件 ${this.name} 挂载失败:`, error);
            throw error;
        }
    }

    /**
     * 卸载组件
     */
    async unmount() {
        if (!this.mounted) {
            return;
        }

        try {
            // 调用生命周期钩子
            await this.beforeUnmount();
            
            // 清理事件监听器
            this.removeAllEventListeners();
            
            // 卸载子组件
            for (const child of this.children.values()) {
                await child.unmount();
            }
            
            // 清理DOM
            if (this.element && this.element.parentNode) {
                this.element.innerHTML = '';
            }
            
            await this.afterUnmount();
            
            this.mounted = false;
            
            // 发布卸载事件
            window.EventBus.emit('component:unmount', this.name, this);
            
            console.log(`组件 ${this.name} 卸载完成`);
            
        } catch (error) {
            console.error(`组件 ${this.name} 卸载失败:`, error);
        }
    }

    /**
     * 销毁组件
     */
    async destroy() {
        if (this.destroyed) {
            return;
        }

        try {
            // 先卸载
            await this.unmount();
            
            // 调用销毁钩子
            await this.beforeDestroy();
            
            // 清理引用
            this.element = null;
            this.parent = null;
            this.children.clear();
            this.state = {};
            this.props = {};
            
            await this.afterDestroy();
            
            this.destroyed = true;
            
            // 从注册表中移除
            BaseComponent.unregisterComponent(this);
            
            console.log(`组件 ${this.name} 销毁完成`);
            
        } catch (error) {
            console.error(`组件 ${this.name} 销毁失败:`, error);
        }
    }

    /**
     * 渲染组件
     */
    async render() {
        if (!this.element) {
            throw new Error(`组件 ${this.name} 缺少渲染容器`);
        }

        const html = await this.template();
        this.element.innerHTML = html;
        
        // 绑定事件
        await this.bindEvents();
        
        // 渲染子组件
        await this.renderChildren();
    }

    /**
     * 更新组件
     * @param {object} newProps - 新属性
     * @param {object} newState - 新状态
     */
    async update(newProps = {}, newState = {}) {
        if (!this.mounted || this.destroyed) {
            return;
        }

        const oldProps = { ...this.props };
        const oldState = { ...this.state };
        
        // 更新属性和状态
        this.props = { ...this.props, ...newProps };
        this.state = { ...this.state, ...newState };
        
        try {
            // 检查是否需要更新
            const shouldUpdate = await this.shouldUpdate(oldProps, oldState);
            
            if (shouldUpdate) {
                await this.beforeUpdate(oldProps, oldState);
                await this.render();
                await this.afterUpdate(oldProps, oldState);
                
                console.log(`组件 ${this.name} 更新完成`);
            }
            
        } catch (error) {
            console.error(`组件 ${this.name} 更新失败:`, error);
            
            // 回滚状态
            this.props = oldProps;
            this.state = oldState;
            
            throw error;
        }
    }

    /**
     * 设置状态
     * @param {object} newState - 新状态
     */
    async setState(newState) {
        await this.update({}, newState);
    }

    /**
     * 设置属性
     * @param {object} newProps - 新属性
     */
    async setProps(newProps) {
        await this.update(newProps, {});
    }

    /**
     * 添加事件监听器
     * @param {string} selector - 选择器
     * @param {string} event - 事件类型
     * @param {function} handler - 事件处理器
     * @param {object} options - 选项
     */
    addEventListener(selector, event, handler, options = {}) {
        if (!this.element) {
            return;
        }

        const elements = selector === 'self' ? [this.element] : this.element.querySelectorAll(selector);
        
        elements.forEach(el => {
            el.addEventListener(event, handler, options);
            
            // 记录监听器以便清理
            this.eventListeners.push({
                element: el,
                event,
                handler,
                options
            });
        });
    }

    /**
     * 移除所有事件监听器
     */
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        
        this.eventListeners = [];
    }

    /**
     * 添加子组件
     * @param {string} name - 子组件名称
     * @param {BaseComponent} component - 子组件实例
     */
    addChild(name, component) {
        component.parent = this;
        this.children.set(name, component);
    }

    /**
     * 移除子组件
     * @param {string} name - 子组件名称
     */
    async removeChild(name) {
        const child = this.children.get(name);
        if (child) {
            await child.destroy();
            this.children.delete(name);
        }
    }

    /**
     * 获取子组件
     * @param {string} name - 子组件名称
     */
    getChild(name) {
        return this.children.get(name);
    }

    /**
     * 渲染子组件
     */
    async renderChildren() {
        for (const child of this.children.values()) {
            if (!child.mounted) {
                const childContainer = this.element.querySelector(`[data-component="${child.name}"]`);
                if (childContainer) {
                    await child.mount(childContainer);
                }
            }
        }
    }

    // ==================== 生命周期钩子 ====================

    async beforeInit() {
        // 初始化前钩子
    }

    async onCreate() {
        // 创建钩子
    }

    async afterInit() {
        // 初始化后钩子
    }

    async beforeMount() {
        // 挂载前钩子
    }

    async afterMount() {
        // 挂载后钩子
    }

    async beforeUpdate(oldProps, oldState) {
        // 更新前钩子
    }

    async afterUpdate(oldProps, oldState) {
        // 更新后钩子
    }

    async shouldUpdate(oldProps, oldState) {
        // 是否应该更新
        return true;
    }

    async beforeUnmount() {
        // 卸载前钩子
    }

    async afterUnmount() {
        // 卸载后钩子
    }

    async beforeDestroy() {
        // 销毁前钩子
    }

    async afterDestroy() {
        // 销毁后钩子
    }

    // ==================== 抽象方法 ====================

    async template() {
        // 返回组件模板HTML
        return '<div>Base Component</div>';
    }

    async bindEvents() {
        // 绑定组件事件
    }

    // ==================== 静态方法 ====================

    static components = new Map();

    /**
     * 初始化组件系统
     */
    static init() {
        console.log('组件系统初始化完成');
    }

    /**
     * 注册组件
     * @param {BaseComponent} component - 组件实例
     */
    static registerComponent(component) {
        this.components.set(component.id, component);
    }

    /**
     * 注销组件
     * @param {BaseComponent} component - 组件实例
     */
    static unregisterComponent(component) {
        this.components.delete(component.id);
    }

    /**
     * 获取组件
     * @param {string} id - 组件ID
     */
    static getComponent(id) {
        return this.components.get(id);
    }

    /**
     * 获取所有组件
     */
    static getAllComponents() {
        return Array.from(this.components.values());
    }

    /**
     * 按名称查找组件
     * @param {string} name - 组件名称
     */
    static findComponentsByName(name) {
        return Array.from(this.components.values()).filter(c => c.name === name);
    }

    /**
     * 销毁所有组件
     */
    static async destroyAllComponents() {
        const components = Array.from(this.components.values());
        
        for (const component of components) {
            await component.destroy();
        }
        
        this.components.clear();
    }

    /**
     * 获取组件统计信息
     */
    static getStats() {
        const components = Array.from(this.components.values());
        
        return {
            total: components.length,
            mounted: components.filter(c => c.mounted).length,
            destroyed: components.filter(c => c.destroyed).length,
            byName: components.reduce((acc, c) => {
                acc[c.name] = (acc[c.name] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// 设置全局引用
window.BaseComponent = BaseComponent;

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseComponent;
}