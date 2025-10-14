/**
 * WebSocket 连接管理器
 * 负责建立和维护与服务器的WebSocket连接
 */
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.statusElement = null;
        this.messageHandlers = new Map();
        this.init();
    }

    /**
     * 初始化WebSocket管理器
     */
    init() {
        this.createStatusElement();
        this.connect();
    }

    /**
     * 创建状态显示元素
     */
    createStatusElement() {
        this.statusElement = document.createElement('div');
        this.statusElement.className = 'websocket-status disconnected';
        this.statusElement.textContent = '连接中...';
        document.body.appendChild(this.statusElement);
    }

    /**
     * 建立WebSocket连接
     */
    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            this.ws = new WebSocket(wsUrl);
            this.updateStatus('connecting', '连接中...');

            this.ws.onopen = () => {
                this.onOpen();
            };

            this.ws.onmessage = (event) => {
                this.onMessage(event);
            };

            this.ws.onclose = () => {
                this.onClose();
            };

            this.ws.onerror = (error) => {
                this.onError(error);
            };

        } catch (error) {
            console.error('WebSocket连接失败:', error);
            this.updateStatus('disconnected', '连接失败');
            this.scheduleReconnect();
        }
    }

    /**
     * 连接成功处理
     */
    onOpen() {
        console.log('WebSocket连接已建立');
        this.reconnectAttempts = 0;
        this.updateStatus('connected', '已连接');
    }

    /**
     * 消息接收处理
     */
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('收到WebSocket消息:', data);
            
            // 触发对应的消息处理器
            if (this.messageHandlers.has(data.type)) {
                this.messageHandlers.get(data.type)(data);
            }
            
            // 触发全局消息事件
            window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
            
        } catch (error) {
            console.error('解析WebSocket消息失败:', error);
        }
    }

    /**
     * 连接关闭处理
     */
    onClose() {
        console.log('WebSocket连接已关闭');
        this.updateStatus('disconnected', '连接断开');
        this.scheduleReconnect();
    }

    /**
     * 连接错误处理
     */
    onError(error) {
        console.error('WebSocket错误:', error);
        this.updateStatus('disconnected', '连接错误');
    }

    /**
     * 更新连接状态显示
     */
    updateStatus(status, text) {
        if (this.statusElement) {
            this.statusElement.className = `websocket-status ${status}`;
            this.statusElement.textContent = text;
        }
    }

    /**
     * 安排重连
     */
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`${this.reconnectInterval / 1000}秒后尝试第${this.reconnectAttempts}次重连...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.log('已达到最大重连次数，停止重连');
            this.updateStatus('disconnected', '连接失败');
        }
    }

    /**
     * 发送消息
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        } else {
            console.warn('WebSocket未连接，无法发送消息');
            return false;
        }
    }

    /**
     * 注册消息处理器
     */
    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    /**
     * 移除消息处理器
     */
    offMessage(type) {
        this.messageHandlers.delete(type);
    }

    /**
     * 关闭连接
     */
    close() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.statusElement) {
            this.statusElement.remove();
        }
    }
}

// 全局WebSocket管理器实例
let wsManager = null;

// 页面加载完成后初始化WebSocket
document.addEventListener('DOMContentLoaded', () => {
    // 只在需要WebSocket的页面初始化
    if (document.querySelector('[data-websocket="true"]') || 
        window.location.pathname.includes('wallet') ||
        window.location.pathname.includes('dashboard')) {
        wsManager = new WebSocketManager();
    }
});

// 页面卸载时关闭连接
window.addEventListener('beforeunload', () => {
    if (wsManager) {
        wsManager.close();
    }
});

// 导出WebSocket管理器
window.WebSocketManager = WebSocketManager;
window.wsManager = wsManager;