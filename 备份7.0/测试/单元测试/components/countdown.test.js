/**
 * 倒计时组件单元测试
 * 测试168小时倒计时功能的各种场景
 */

const { JSDOM } = require('jsdom');

// 模拟DOM环境
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="countdown-display">168:00:00</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <div id="countdown-status">激活中</div>
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

// 模拟倒计时相关函数
class CountdownComponent {
  constructor() {
    this.totalHours = 168;
    this.startTime = null;
    this.endTime = null;
    this.intervalId = null;
    this.callbacks = {
      onUpdate: null,
      onComplete: null
    };
  }

  /**
   * 启动倒计时
   * @param {number} remainingSeconds - 剩余秒数
   */
  start(remainingSeconds = null) {
    const now = Date.now();
    
    if (remainingSeconds !== null) {
      this.startTime = now - (this.totalHours * 3600 - remainingSeconds) * 1000;
    } else {
      this.startTime = now;
    }
    
    this.endTime = this.startTime + this.totalHours * 3600 * 1000;
    
    // 保存到localStorage
    localStorage.setItem('countdown_start', this.startTime.toString());
    localStorage.setItem('countdown_end', this.endTime.toString());
    
    this.updateDisplay();
    this.intervalId = setInterval(() => this.updateDisplay(), 1000);
    
    return this;
  }

  /**
   * 停止倒计时
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    return this;
  }

  /**
   * 从localStorage恢复倒计时
   */
  restore() {
    const startTime = localStorage.getItem('countdown_start');
    const endTime = localStorage.getItem('countdown_end');
    
    if (startTime && endTime) {
      this.startTime = parseInt(startTime);
      this.endTime = parseInt(endTime);
      
      const now = Date.now();
      if (now < this.endTime) {
        this.updateDisplay();
        this.intervalId = setInterval(() => this.updateDisplay(), 1000);
        return true;
      }
    }
    
    return false;
  }

  /**
   * 更新显示
   */
  updateDisplay() {
    const now = Date.now();
    const remaining = Math.max(0, this.endTime - now);
    const remainingSeconds = Math.floor(remaining / 1000);
    
    if (remainingSeconds <= 0) {
      this.onCountdownComplete();
      return;
    }
    
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    
    const timeString = `${hours.toString().padStart(3, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新显示元素
    const displayElement = document.getElementById('countdown-display');
    if (displayElement) {
      displayElement.textContent = timeString;
    }
    
    // 更新进度条
    const progress = ((this.totalHours * 3600 - remainingSeconds) / (this.totalHours * 3600)) * 100;
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${progress.toFixed(1)}%`;
    }
    
    // 更新状态
    this.updateStatus(remainingSeconds);
    
    // 触发回调
    if (this.callbacks.onUpdate) {
      this.callbacks.onUpdate(remainingSeconds, progress);
    }
  }

  /**
   * 更新状态显示
   */
  updateStatus(remainingSeconds) {
    const statusElement = document.getElementById('countdown-status');
    if (!statusElement) return;
    
    const hours = Math.floor(remainingSeconds / 3600);
    
    if (hours > 120) {
      statusElement.textContent = '激活中';
      statusElement.className = 'status-active';
    } else if (hours > 24) {
      statusElement.textContent = '倒计时进行中';
      statusElement.className = 'status-progress';
    } else if (hours > 0) {
      statusElement.textContent = '即将结束';
      statusElement.className = 'status-warning';
    } else {
      statusElement.textContent = '倒计时结束';
      statusElement.className = 'status-complete';
    }
  }

  /**
   * 倒计时完成处理
   */
  onCountdownComplete() {
    this.stop();
    
    const displayElement = document.getElementById('countdown-display');
    if (displayElement) {
      displayElement.textContent = '000:00:00';
    }
    
    const statusElement = document.getElementById('countdown-status');
    if (statusElement) {
      statusElement.textContent = '挑战完成';
      statusElement.className = 'status-complete';
    }
    
    // 清除localStorage
    localStorage.removeItem('countdown_start');
    localStorage.removeItem('countdown_end');
    
    // 触发完成回调
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete();
    }
  }

  /**
   * 获取剩余时间（秒）
   */
  getRemainingSeconds() {
    if (!this.endTime) return 0;
    const now = Date.now();
    return Math.max(0, Math.floor((this.endTime - now) / 1000));
  }

  /**
   * 获取进度百分比
   */
  getProgress() {
    if (!this.startTime || !this.endTime) return 0;
    const now = Date.now();
    const total = this.endTime - this.startTime;
    const elapsed = now - this.startTime;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  /**
   * 设置回调函数
   */
  onUpdate(callback) {
    this.callbacks.onUpdate = callback;
    return this;
  }

  onComplete(callback) {
    this.callbacks.onComplete = callback;
    return this;
  }

  /**
   * 重置倒计时
   */
  reset() {
    this.stop();
    this.startTime = null;
    this.endTime = null;
    localStorage.removeItem('countdown_start');
    localStorage.removeItem('countdown_end');
    
    // 重置显示
    const displayElement = document.getElementById('countdown-display');
    if (displayElement) {
      displayElement.textContent = '168:00:00';
    }
    
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = '0%';
    }
    
    const statusElement = document.getElementById('countdown-status');
    if (statusElement) {
      statusElement.textContent = '未开始';
      statusElement.className = 'status-inactive';
    }
    
    return this;
  }
}

// 测试用例
describe('倒计时组件测试', () => {
  let countdown;

  beforeEach(() => {
    countdown = new CountdownComponent();
    localStorage.clear();
    
    // 重置DOM
    document.getElementById('countdown-display').textContent = '168:00:00';
    document.querySelector('.progress-fill').style.width = '0%';
    document.getElementById('countdown-status').textContent = '激活中';
  });

  afterEach(() => {
    if (countdown) {
      countdown.stop();
    }
  });

  describe('基础功能测试', () => {
    test('应该能够创建倒计时实例', () => {
      expect(countdown).toBeDefined();
      expect(countdown.totalHours).toBe(168);
    });

    test('应该能够启动倒计时', () => {
      countdown.start();
      
      expect(countdown.startTime).toBeDefined();
      expect(countdown.endTime).toBeDefined();
      expect(countdown.intervalId).toBeDefined();
    });

    test('应该能够停止倒计时', () => {
      countdown.start();
      const intervalId = countdown.intervalId;
      
      countdown.stop();
      
      expect(countdown.intervalId).toBeNull();
    });

    test('应该能够重置倒计时', () => {
      countdown.start();
      countdown.reset();
      
      expect(countdown.startTime).toBeNull();
      expect(countdown.endTime).toBeNull();
      expect(countdown.intervalId).toBeNull();
      expect(document.getElementById('countdown-display').textContent).toBe('168:00:00');
    });
  });

  describe('时间计算测试', () => {
    test('应该正确计算剩余时间', () => {
      const remainingSeconds = 3600; // 1小时
      countdown.start(remainingSeconds);
      
      const calculated = countdown.getRemainingSeconds();
      expect(calculated).toBeCloseTo(remainingSeconds, -2); // 允许2秒误差
    });

    test('应该正确计算进度百分比', () => {
      const halfTime = 168 * 3600 / 2; // 84小时
      countdown.start(halfTime);
      
      const progress = countdown.getProgress();
      expect(progress).toBeCloseTo(50, 1); // 允许1%误差
    });

    test('倒计时结束时剩余时间应为0', () => {
      countdown.start(1); // 1秒后结束
      
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(countdown.getRemainingSeconds()).toBe(0);
          resolve();
        }, 1500);
      });
    });
  });

  describe('显示更新测试', () => {
    test('应该正确格式化时间显示', () => {
      const remainingSeconds = 3661; // 1小时1分1秒
      countdown.start(remainingSeconds);
      
      // 手动触发更新
      countdown.updateDisplay();
      
      const display = document.getElementById('countdown-display').textContent;
      expect(display).toMatch(/001:01:0[01]/); // 允许1秒误差
    });

    test('应该正确更新进度条', () => {
      const halfTime = 168 * 3600 / 2;
      countdown.start(halfTime);
      countdown.updateDisplay();
      
      const progressWidth = document.querySelector('.progress-fill').style.width;
      expect(parseFloat(progressWidth)).toBeCloseTo(50, 1);
    });

    test('应该根据剩余时间更新状态', () => {
      // 测试不同时间段的状态
      const testCases = [
        { remaining: 150 * 3600, expectedClass: 'status-active' },
        { remaining: 50 * 3600, expectedClass: 'status-progress' },
        { remaining: 5 * 3600, expectedClass: 'status-warning' },
        { remaining: 0, expectedClass: 'status-complete' }
      ];

      testCases.forEach(({ remaining, expectedClass }) => {
        countdown.start(remaining);
        countdown.updateDisplay();
        
        const statusElement = document.getElementById('countdown-status');
        expect(statusElement.className).toBe(expectedClass);
      });
    });
  });

  describe('持久化测试', () => {
    test('应该能够保存倒计时状态到localStorage', () => {
      countdown.start();
      
      expect(localStorage.getItem('countdown_start')).toBeDefined();
      expect(localStorage.getItem('countdown_end')).toBeDefined();
    });

    test('应该能够从localStorage恢复倒计时', () => {
      // 先启动倒计时
      countdown.start();
      const originalStart = countdown.startTime;
      const originalEnd = countdown.endTime;
      
      // 创建新实例并恢复
      const newCountdown = new CountdownComponent();
      const restored = newCountdown.restore();
      
      expect(restored).toBe(true);
      expect(newCountdown.startTime).toBe(originalStart);
      expect(newCountdown.endTime).toBe(originalEnd);
      
      newCountdown.stop();
    });

    test('过期的倒计时不应该被恢复', () => {
      // 设置一个已过期的倒计时
      const pastTime = Date.now() - 1000;
      localStorage.setItem('countdown_start', (pastTime - 168 * 3600 * 1000).toString());
      localStorage.setItem('countdown_end', pastTime.toString());
      
      const restored = countdown.restore();
      expect(restored).toBe(false);
    });
  });

  describe('回调函数测试', () => {
    test('应该在更新时触发onUpdate回调', (done) => {
      let callbackCalled = false;
      
      countdown.onUpdate((remainingSeconds, progress) => {
        callbackCalled = true;
        expect(remainingSeconds).toBeGreaterThan(0);
        expect(progress).toBeGreaterThanOrEqual(0);
        done();
      });
      
      countdown.start();
      countdown.updateDisplay();
    });

    test('应该在完成时触发onComplete回调', (done) => {
      countdown.onComplete(() => {
        expect(countdown.getRemainingSeconds()).toBe(0);
        done();
      });
      
      countdown.start(1); // 1秒后完成
    });
  });

  describe('边界情况测试', () => {
    test('应该处理负数剩余时间', () => {
      countdown.start(-1000);
      countdown.updateDisplay();
      
      expect(countdown.getRemainingSeconds()).toBe(0);
      expect(document.getElementById('countdown-display').textContent).toBe('000:00:00');
    });

    test('应该处理非常大的剩余时间', () => {
      const largeTime = 999 * 3600; // 999小时
      countdown.start(largeTime);
      countdown.updateDisplay();
      
      const display = document.getElementById('countdown-display').textContent;
      expect(display).toMatch(/999:00:0[01]/);
    });

    test('应该处理DOM元素不存在的情况', () => {
      // 移除DOM元素
      document.getElementById('countdown-display').remove();
      document.querySelector('.progress-fill').remove();
      document.getElementById('countdown-status').remove();
      
      // 不应该抛出错误
      expect(() => {
        countdown.start();
        countdown.updateDisplay();
      }).not.toThrow();
    });

    test('应该处理localStorage不可用的情况', () => {
      // 模拟localStorage异常
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => { throw new Error('Storage full'); };
      
      expect(() => {
        countdown.start();
      }).not.toThrow();
      
      // 恢复localStorage
      localStorage.setItem = originalSetItem;
    });
  });

  describe('性能测试', () => {
    test('更新显示应该在合理时间内完成', () => {
      countdown.start();
      
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        countdown.updateDisplay();
      }
      const endTime = performance.now();
      
      const avgTime = (endTime - startTime) / 100;
      expect(avgTime).toBeLessThan(5); // 平均每次更新应少于5ms
    });

    test('应该能够处理频繁的启动停止操作', () => {
      expect(() => {
        for (let i = 0; i < 50; i++) {
          countdown.start();
          countdown.stop();
        }
      }).not.toThrow();
    });
  });
});

module.exports = CountdownComponent;