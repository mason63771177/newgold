class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.heartbeatInterval = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.init();
  }

  init() {
    this.connect();
    this.setupMessageHandlers();
  }

  connect() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('未找到认证token，无法连接WebSocket');
        return;
      }

      const wsUrl = `ws://localhost:3000/ws?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onclose = this.onClose.bind(this);
      this.ws.onerror = this.onError.bind(this);

    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.scheduleReconnect();
    }
  }

  onOpen(event) {
    console.log('WebSocket连接已建立');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    
    // 触发连接成功事件
    this.emit('connected');
  }

  onMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('收到WebSocket消息:', data);
      
      // 处理不同类型的消息
      switch (data.type) {
        case 'countdown_update':
          this.handleCountdownUpdate(data.data);
          break;
        case 'redpacket_start':
          this.handleRedpacketStart(data.data);
          break;
        case 'redpacket_end':
          this.handleRedpacketEnd(data.data);
          break;
        case 'task_complete':
          this.handleTaskComplete(data.data);
          break;
        case 'notification':
          this.handleNotification(data.data);
          break;
        case 'pong':
          // 心跳响应，不需要处理
          break;
        default:
          console.log('未知消息类型:', data.type);
      }
      
      // 触发通用消息事件
      this.emit('message', data);
      
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  }

  onClose(event) {
    console.log('WebSocket连接已关闭:', event.code, event.reason);
    this.isConnected = false;
    this.stopHeartbeat();
    
    // 触发断开连接事件
    this.emit('disconnected');
    
    // 尝试重连
    if (event.code !== 1000) { // 非正常关闭
      this.scheduleReconnect();
    }
  }

  onError(event) {
    console.error('WebSocket错误:', event);
    this.emit('error', event);
  }

  // 重连机制
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数已达上限');
      return;
    }

    this.reconnectAttempts++;
    console.log(`${this.reconnectInterval / 1000}秒后尝试第${this.reconnectAttempts}次重连...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // 心跳机制
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, 30000); // 每30秒发送一次心跳
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 发送消息
  send(type, data = {}) {
    if (!this.isConnected || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      const message = JSON.stringify({ type, data });
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('发送WebSocket消息失败:', error);
      return false;
    }
  }

  // 设置消息处理器
  setupMessageHandlers() {
    // 倒计时更新处理
    this.on('countdown_update', (data) => {
      this.updateCountdownDisplay(data);
    });

    // 红包开始处理
    this.on('redpacket_start', (data) => {
      this.showRedpacketStartNotification(data);
      this.updateRedpacketButton(true);
    });

    // 红包结束处理
    this.on('redpacket_end', (data) => {
      this.showRedpacketEndNotification(data);
      this.updateRedpacketButton(false);
    });

    // 任务完成处理
    this.on('task_complete', (data) => {
      this.showTaskCompleteNotification(data);
      this.refreshTaskList();
      this.refreshWalletBalance();
    });

    // 通知处理
    this.on('notification', (data) => {
      this.showNotification(data);
    });
  }

  // 更新倒计时显示
  updateCountdownDisplay(data) {
    const countdownElements = document.querySelectorAll('.countdown-display');
    countdownElements.forEach(element => {
      if (data.isActive) {
        element.textContent = `红包进行中 ${data.activeRemainingTime}秒`;
        element.classList.add('active');
      } else {
        const hours = Math.floor(data.remainingTime / 3600);
        const minutes = Math.floor((data.remainingTime % 3600) / 60);
        const seconds = data.remainingTime % 60;
        element.textContent = `下次红包 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        element.classList.remove('active');
      }
    });
  }

  // 显示红包开始通知
  showRedpacketStartNotification(data) {
    this.showNotification({
      title: '红包活动开始！',
      message: data.message || '快来抢红包！',
      type: 'success'
    });
  }

  // 显示红包结束通知
  showRedpacketEndNotification(data) {
    this.showNotification({
      title: '红包活动结束',
      message: data.message || '红包活动已结束',
      type: 'info'
    });
  }

  // 显示任务完成通知
  showTaskCompleteNotification(data) {
    this.showNotification({
      title: '任务完成！',
      message: `${data.message}，获得奖励 ${data.reward} USDT`,
      type: 'success'
    });
  }

  // 更新红包按钮状态
  updateRedpacketButton(isActive) {
    const redpacketButtons = document.querySelectorAll('.redpacket-btn');
    redpacketButtons.forEach(button => {
      if (isActive) {
        button.classList.add('active');
        button.textContent = '抢红包';
        button.disabled = false;
      } else {
        button.classList.remove('active');
        button.textContent = '抢红包';
        button.disabled = true;
      }
    });
  }

  // 显示通知
  showNotification(data) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${data.type || 'info'}`;
    notification.innerHTML = `
      <div class="notification-content">
        <h4>${data.title}</h4>
        <p>${data.message}</p>
      </div>
      <button class="notification-close">&times;</button>
    `;

    // 添加到页面
    document.body.appendChild(notification);

    // 添加关闭事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });

    // 自动关闭
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // 刷新任务列表
  refreshTaskList() {
    if (typeof window.refreshTasks === 'function') {
      window.refreshTasks();
    }
  }

  // 刷新钱包余额
  refreshWalletBalance() {
    if (typeof window.refreshWallet === 'function') {
      window.refreshWallet();
    }
  }

  // 事件监听器
  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event).push(handler);
  }

  // 触发事件
  emit(event, data) {
    if (this.messageHandlers.has(event)) {
      this.messageHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`事件处理器错误 (${event}):`, error);
        }
      });
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, '主动断开连接');
    }
    this.stopHeartbeat();
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// 创建全局WebSocket客户端实例
window.wsClient = new WebSocketClient();

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebSocketClient;
}