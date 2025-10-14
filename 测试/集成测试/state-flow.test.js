/**
 * 状态流转集成测试
 * 测试用户状态从1→2→3的完整业务流程
 */

const { JSDOM } = require('jsdom');

// 模拟完整的DOM环境
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="app">
        <div id="state-display">状态1</div>
        <div id="countdown-display">168:00:00</div>
        <div id="balance-display">0 USDT</div>
        <div id="task-progress">0/3</div>
        <button id="activate-btn">激活账号</button>
        <button id="payment-btn" style="display: none;">立即支付</button>
        <button id="grab-redpacket-btn" style="display: none;">抢红包</button>
        <div id="redpacket-status">红包未开启</div>
        <div id="team-info">团队人数: 0</div>
      </div>
    </body>
  </html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = {
  data: {},
  getItem: function(key) { return this.data[key] || null; },
  setItem: function(key, value) { this.data[key] = value; },
  removeItem: function(key) { delete this.data[key]; },
  clear: function() { this.data = {}; }
};

// 模拟WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 100);
  }
  
  send(data) {
    console.log('WebSocket send:', data);
  }
  
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
};

// 状态管理系统
class StateManager {
  constructor() {
    this.currentState = 1;
    this.userBalance = 0;
    this.countdownEndTime = null;
    this.taskProgress = { completed: 0, total: 3 };
    this.teamSize = 0;
    this.redpacketStatus = 'inactive';
    this.listeners = {};
  }

  /**
   * 添加状态变化监听器
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * 切换到指定状态
   */
  switchToState(newState, data = {}) {
    const oldState = this.currentState;
    this.currentState = newState;
    
    console.log(`状态切换: ${oldState} → ${newState}`);
    
    // 保存状态到localStorage
    localStorage.setItem('userState', newState.toString());
    localStorage.setItem('stateData', JSON.stringify(data));
    
    // 更新UI
    this.updateUI();
    
    // 触发状态变化事件
    this.emit('stateChanged', { oldState, newState, data });
    
    return this;
  }

  /**
   * 激活账号 (状态1 → 状态2)
   */
  async activateAccount() {
    if (this.currentState !== 1) {
      throw new Error('只能在状态1时激活账号');
    }

    try {
      // 模拟激活过程
      await this.simulateActivation();
      
      // 启动168小时倒计时
      this.startCountdown();
      
      // 切换到状态2
      this.switchToState(2, {
        activatedAt: Date.now(),
        countdownEndTime: this.countdownEndTime
      });
      
      this.emit('accountActivated');
      return true;
      
    } catch (error) {
      console.error('账号激活失败:', error);
      throw error;
    }
  }

  /**
   * 完成支付 (状态2 → 状态3)
   */
  async completePayment(amount = 100) {
    if (this.currentState !== 2) {
      throw new Error('只能在状态2时完成支付');
    }

    try {
      // 模拟支付过程
      const paymentResult = await this.simulatePayment(amount);
      
      if (paymentResult.success) {
        this.userBalance = amount;
        
        // 切换到状态3
        this.switchToState(3, {
          paymentAmount: amount,
          transactionId: paymentResult.transactionId,
          paidAt: Date.now()
        });
        
        this.emit('paymentCompleted', paymentResult);
        return paymentResult;
      } else {
        throw new Error('支付失败');
      }
      
    } catch (error) {
      console.error('支付失败:', error);
      throw error;
    }
  }

  /**
   * 完成挑战 (状态3保持，状态4已被移除)
   */
  async completeChallenge() {
    if (this.currentState !== 3) {
      throw new Error('只能在状态3时完成挑战');
    }

    try {
      // 检查倒计时是否结束
      if (!this.isCountdownExpired()) {
        throw new Error('168小时倒计时尚未结束');
      }

      // 检查任务完成情况
      if (this.taskProgress.completed < this.taskProgress.total) {
        throw new Error('任务尚未全部完成');
      }

      // 状态4已被移除，保持在状态3
      // 记录挑战完成信息但不切换状态
      this.stateData[3] = {
        ...this.stateData[3],
        challengeCompletedAt: Date.now(),
        finalBalance: this.userBalance,
        teamSize: this.teamSize
      };
      
      this.emit('challengeCompleted');
      return true;
      
    } catch (error) {
      console.error('挑战完成失败:', error);
      throw error;
    }
  }

  /**
   * 完成任务
   */
  completeTask(taskId) {
    if (this.taskProgress.completed < this.taskProgress.total) {
      this.taskProgress.completed++;
      this.updateUI();
      this.emit('taskCompleted', { taskId, progress: this.taskProgress });
    }
  }

  /**
   * 抢红包
   */
  async grabRedpacket() {
    if (this.currentState < 3) {
      throw new Error('需要在状态3或以上才能抢红包');
    }

    if (this.redpacketStatus !== 'active') {
      throw new Error('红包当前不可用');
    }

    try {
      const result = await this.simulateGrabRedpacket();
      
      if (result.success) {
        this.userBalance += result.amount;
        this.updateUI();
        this.emit('redpacketGrabbed', result);
      }
      
      return result;
      
    } catch (error) {
      console.error('抢红包失败:', error);
      throw error;
    }
  }

  /**
   * 启动倒计时
   */
  startCountdown() {
    this.countdownEndTime = Date.now() + 168 * 60 * 60 * 1000; // 168小时
    localStorage.setItem('countdownEndTime', this.countdownEndTime.toString());
  }

  /**
   * 检查倒计时是否过期
   */
  isCountdownExpired() {
    if (!this.countdownEndTime) return false;
    return Date.now() >= this.countdownEndTime;
  }

  /**
   * 更新UI显示
   */
  updateUI() {
    const stateDisplay = document.getElementById('state-display');
    const balanceDisplay = document.getElementById('balance-display');
    const taskProgress = document.getElementById('task-progress');
    const teamInfo = document.getElementById('team-info');
    const activateBtn = document.getElementById('activate-btn');
    const paymentBtn = document.getElementById('payment-btn');
    const grabBtn = document.getElementById('grab-redpacket-btn');

    // 更新状态显示
    if (stateDisplay) {
      stateDisplay.textContent = `状态${this.currentState}`;
    }

    // 更新余额显示
    if (balanceDisplay) {
      balanceDisplay.textContent = `${this.userBalance} USDT`;
    }

    // 更新任务进度
    if (taskProgress) {
      taskProgress.textContent = `${this.taskProgress.completed}/${this.taskProgress.total}`;
    }

    // 更新团队信息
    if (teamInfo) {
      teamInfo.textContent = `团队人数: ${this.teamSize}`;
    }

    // 更新按钮显示
    if (activateBtn) {
      activateBtn.style.display = this.currentState === 1 ? 'block' : 'none';
    }
    
    if (paymentBtn) {
      paymentBtn.style.display = this.currentState === 2 ? 'block' : 'none';
    }
    
    if (grabBtn) {
      grabBtn.style.display = this.currentState >= 3 ? 'block' : 'none';
    }
  }

  /**
   * 从localStorage恢复状态
   */
  restoreState() {
    const savedState = localStorage.getItem('userState');
    const savedData = localStorage.getItem('stateData');
    const savedCountdown = localStorage.getItem('countdownEndTime');

    if (savedState) {
      this.currentState = parseInt(savedState);
    }

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.paymentAmount) {
          this.userBalance = data.paymentAmount;
        }
      } catch (error) {
        console.error('恢复状态数据失败:', error);
      }
    }

    if (savedCountdown) {
      this.countdownEndTime = parseInt(savedCountdown);
    }

    this.updateUI();
  }

  /**
   * 重置状态
   */
  reset() {
    this.currentState = 1;
    this.userBalance = 0;
    this.countdownEndTime = null;
    this.taskProgress = { completed: 0, total: 3 };
    this.teamSize = 0;
    this.redpacketStatus = 'inactive';
    
    localStorage.clear();
    this.updateUI();
    
    this.emit('stateReset');
  }

  // 模拟方法
  async simulateActivation() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90%成功率
          resolve();
        } else {
          reject(new Error('激活服务暂时不可用'));
        }
      }, 1000);
    });
  }

  async simulatePayment(amount) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.2, // 80%成功率
          transactionId: 'tx_' + Date.now(),
          amount: amount
        });
      }, 2000);
    });
  }

  async simulateGrabRedpacket() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70%成功率
        resolve({
          success: success,
          amount: success ? Math.floor(Math.random() * 50) + 10 : 0, // 10-60 USDT
          message: success ? '恭喜获得红包' : '红包已被抢完'
        });
      }, 1500);
    });
  }
}

// 测试用例
describe('状态流转集成测试', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
    localStorage.clear();
    
    // 重置DOM
    document.getElementById('state-display').textContent = '状态1';
    document.getElementById('balance-display').textContent = '0 USDT';
    document.getElementById('task-progress').textContent = '0/3';
  });

  describe('完整状态流转测试', () => {
    test('应该能够完成完整的状态流转 1→2→3', async () => {
      const stateChanges = [];
      stateManager.on('stateChanged', (data) => {
        stateChanges.push(data.newState);
      });

      // 状态1 → 状态2: 激活账号
      expect(stateManager.currentState).toBe(1);
      await stateManager.activateAccount();
      expect(stateManager.currentState).toBe(2);

      // 状态2 → 状态3: 完成支付
      await stateManager.completePayment(100);
      expect(stateManager.currentState).toBe(3);
      expect(stateManager.userBalance).toBe(100);

      // 完成所有任务
      stateManager.completeTask(1);
      stateManager.completeTask(2);
      stateManager.completeTask(3);
      expect(stateManager.taskProgress.completed).toBe(3);

      // 模拟倒计时结束
      stateManager.countdownEndTime = Date.now() - 1000;

      // 状态3保持: 完成挑战（状态4已被移除）
      await stateManager.completeChallenge();
      expect(stateManager.currentState).toBe(3); // 保持在状态3

      expect(stateChanges).toEqual([2, 3]); // 移除状态4
    });

    test('应该在每个状态切换时正确更新UI', async () => {
      // 状态1 → 状态2
      await stateManager.activateAccount();
      expect(document.getElementById('state-display').textContent).toBe('状态2');
      expect(document.getElementById('activate-btn').style.display).toBe('none');
      expect(document.getElementById('payment-btn').style.display).toBe('block');

      // 状态2 → 状态3
      await stateManager.completePayment(100);
      expect(document.getElementById('state-display').textContent).toBe('状态3');
      expect(document.getElementById('balance-display').textContent).toBe('100 USDT');
      expect(document.getElementById('payment-btn').style.display).toBe('none');
      expect(document.getElementById('grab-redpacket-btn').style.display).toBe('block');
    });
  });

  describe('状态约束测试', () => {
    test('不应该允许跳过状态', async () => {
      // 尝试在状态1直接支付
      await expect(stateManager.completePayment(100)).rejects.toThrow('只能在状态2时完成支付');

      // 尝试在状态1直接完成挑战
      await expect(stateManager.completeChallenge()).rejects.toThrow('只能在状态3时完成挑战');
    });

    test('应该检查挑战完成的前置条件', async () => {
      // 到达状态3
      await stateManager.activateAccount();
      await stateManager.completePayment(100);

      // 尝试在倒计时未结束时完成挑战
      await expect(stateManager.completeChallenge()).rejects.toThrow('168小时倒计时尚未结束');

      // 模拟倒计时结束但任务未完成
      stateManager.countdownEndTime = Date.now() - 1000;
      await expect(stateManager.completeChallenge()).rejects.toThrow('任务尚未全部完成');
    });

    test('应该检查红包抢取的状态要求', async () => {
      // 在状态1和状态2时不能抢红包
      stateManager.redpacketStatus = 'active';
      
      await expect(stateManager.grabRedpacket()).rejects.toThrow('需要在状态3或以上才能抢红包');

      await stateManager.activateAccount();
      await expect(stateManager.grabRedpacket()).rejects.toThrow('需要在状态3或以上才能抢红包');
    });
  });

  describe('数据持久化测试', () => {
    test('应该能够保存和恢复状态', async () => {
      // 完成一些状态切换
      await stateManager.activateAccount();
      await stateManager.completePayment(100);

      // 创建新的状态管理器并恢复
      const newStateManager = new StateManager();
      newStateManager.restoreState();

      expect(newStateManager.currentState).toBe(3);
      expect(newStateManager.userBalance).toBe(100);
    });

    test('应该能够恢复倒计时状态', async () => {
      await stateManager.activateAccount();
      const originalEndTime = stateManager.countdownEndTime;

      // 创建新实例并恢复
      const newStateManager = new StateManager();
      newStateManager.restoreState();

      expect(newStateManager.countdownEndTime).toBe(originalEndTime);
    });
  });

  describe('事件系统测试', () => {
    test('应该在状态变化时触发相应事件', async () => {
      const events = [];
      
      stateManager.on('accountActivated', () => events.push('accountActivated'));
      stateManager.on('paymentCompleted', (data) => events.push(`paymentCompleted:${data.amount}`));
      stateManager.on('challengeCompleted', () => events.push('challengeCompleted'));
      stateManager.on('taskCompleted', (data) => events.push(`taskCompleted:${data.taskId}`));

      // 执行完整流程
      await stateManager.activateAccount();
      await stateManager.completePayment(100);
      
      stateManager.completeTask(1);
      stateManager.completeTask(2);
      stateManager.completeTask(3);
      
      stateManager.countdownEndTime = Date.now() - 1000;
      await stateManager.completeChallenge();

      expect(events).toContain('accountActivated');
      expect(events).toContain('paymentCompleted:100');
      expect(events).toContain('challengeCompleted');
      expect(events).toContain('taskCompleted:1');
      expect(events).toContain('taskCompleted:2');
      expect(events).toContain('taskCompleted:3');
    });
  });

  describe('红包系统集成测试', () => {
    test('应该能够在状态3时成功抢红包', async () => {
      // 到达状态3
      await stateManager.activateAccount();
      await stateManager.completePayment(100);
      
      stateManager.redpacketStatus = 'active';
      const originalBalance = stateManager.userBalance;

      // 模拟成功抢红包
      jest.spyOn(stateManager, 'simulateGrabRedpacket').mockResolvedValue({
        success: true,
        amount: 50,
        message: '恭喜获得红包'
      });

      const result = await stateManager.grabRedpacket();
      
      expect(result.success).toBe(true);
      expect(stateManager.userBalance).toBe(originalBalance + 50);
    });

    test('应该处理红包抢取失败的情况', async () => {
      await stateManager.activateAccount();
      await stateManager.completePayment(100);
      
      stateManager.redpacketStatus = 'active';
      const originalBalance = stateManager.userBalance;

      // 模拟抢红包失败
      jest.spyOn(stateManager, 'simulateGrabRedpacket').mockResolvedValue({
        success: false,
        amount: 0,
        message: '红包已被抢完'
      });

      const result = await stateManager.grabRedpacket();
      
      expect(result.success).toBe(false);
      expect(stateManager.userBalance).toBe(originalBalance);
    });
  });

  describe('任务系统集成测试', () => {
    test('应该能够跟踪任务完成进度', () => {
      const taskEvents = [];
      stateManager.on('taskCompleted', (data) => {
        taskEvents.push(data);
      });

      expect(stateManager.taskProgress.completed).toBe(0);

      stateManager.completeTask(1);
      expect(stateManager.taskProgress.completed).toBe(1);
      expect(document.getElementById('task-progress').textContent).toBe('1/3');

      stateManager.completeTask(2);
      stateManager.completeTask(3);
      expect(stateManager.taskProgress.completed).toBe(3);
      expect(document.getElementById('task-progress').textContent).toBe('3/3');

      expect(taskEvents).toHaveLength(3);
    });

    test('不应该允许超过最大任务数', () => {
      for (let i = 1; i <= 5; i++) {
        stateManager.completeTask(i);
      }

      expect(stateManager.taskProgress.completed).toBe(3);
    });
  });

  describe('错误处理和边界情况测试', () => {
    test('应该处理激活失败的情况', async () => {
      // 模拟激活失败
      jest.spyOn(stateManager, 'simulateActivation').mockRejectedValue(new Error('网络错误'));

      await expect(stateManager.activateAccount()).rejects.toThrow('网络错误');
      expect(stateManager.currentState).toBe(1); // 状态不应该改变
    });

    test('应该处理支付失败的情况', async () => {
      await stateManager.activateAccount();

      // 模拟支付失败
      jest.spyOn(stateManager, 'simulatePayment').mockResolvedValue({
        success: false,
        transactionId: null,
        amount: 0
      });

      await expect(stateManager.completePayment(100)).rejects.toThrow('支付失败');
      expect(stateManager.currentState).toBe(2); // 状态不应该改变
      expect(stateManager.userBalance).toBe(0); // 余额不应该改变
    });

    test('应该能够重置所有状态', () => {
      // 设置一些状态
      stateManager.currentState = 3;
      stateManager.userBalance = 100;
      stateManager.taskProgress.completed = 2;
      stateManager.teamSize = 5;

      const resetEvents = [];
      stateManager.on('stateReset', () => resetEvents.push('reset'));

      stateManager.reset();

      expect(stateManager.currentState).toBe(1);
      expect(stateManager.userBalance).toBe(0);
      expect(stateManager.taskProgress.completed).toBe(0);
      expect(stateManager.teamSize).toBe(0);
      expect(resetEvents).toContain('reset');
    });
  });

  describe('并发操作测试', () => {
    test('应该处理并发的状态切换请求', async () => {
      // 同时发起多个激活请求
      const promises = [
        stateManager.activateAccount(),
        stateManager.activateAccount(),
        stateManager.activateAccount()
      ];

      // 只有第一个应该成功，其他应该失败
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBe(1);
      expect(failed).toBe(2);
      expect(stateManager.currentState).toBe(2);
    });
  });

  describe('性能测试', () => {
    test('大量状态切换操作应该在合理时间内完成', async () => {
      const startTime = performance.now();

      // 执行多次完整流程（使用mock避免实际延迟）
      jest.spyOn(stateManager, 'simulateActivation').mockResolvedValue();
      jest.spyOn(stateManager, 'simulatePayment').mockResolvedValue({
        success: true,
        transactionId: 'test',
        amount: 100
      });

      for (let i = 0; i < 10; i++) {
        stateManager.reset();
        await stateManager.activateAccount();
        await stateManager.completePayment(100);
        
        stateManager.completeTask(1);
        stateManager.completeTask(2);
        stateManager.completeTask(3);
        
        stateManager.countdownEndTime = Date.now() - 1000;
        await stateManager.completeChallenge();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
  });
});

module.exports = StateManager;