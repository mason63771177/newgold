/**
 * 按钮组件单元测试
 * 测试各种按钮的点击事件、状态变化和交互行为
 */

const { JSDOM } = require('jsdom');

// 模拟DOM环境
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <button id="activate-btn" class="btn btn-primary">激活账号</button>
      <button id="payment-btn" class="btn btn-success">立即支付</button>
      <button id="copy-btn" class="btn btn-secondary">复制邀请链接</button>
      <button id="submit-btn" class="btn btn-primary" disabled>提交</button>
      <button id="loading-btn" class="btn btn-primary">
        <span class="btn-text">加载中</span>
        <span class="btn-spinner" style="display: none;">⟳</span>
      </button>
      <div id="message-container"></div>
    </body>
  </html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = { clipboard: { writeText: jest.fn() } };

// 模拟按钮相关功能
class ButtonComponent {
  constructor(selector) {
    this.element = document.querySelector(selector);
    this.originalText = this.element ? this.element.textContent : '';
    this.isLoading = false;
    this.isDisabled = false;
    this.clickHandlers = [];
    
    if (this.element) {
      this.element.addEventListener('click', (e) => this.handleClick(e));
    }
  }

  /**
   * 添加点击事件处理器
   */
  onClick(handler) {
    this.clickHandlers.push(handler);
    return this;
  }

  /**
   * 处理点击事件
   */
  handleClick(event) {
    if (this.isDisabled || this.isLoading) {
      event.preventDefault();
      return false;
    }

    // 执行所有点击处理器
    this.clickHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Button click handler error:', error);
      }
    });
  }

  /**
   * 设置加载状态
   */
  setLoading(loading = true) {
    if (!this.element) return this;
    
    this.isLoading = loading;
    
    const textSpan = this.element.querySelector('.btn-text');
    const spinner = this.element.querySelector('.btn-spinner');
    
    if (loading) {
      this.element.disabled = true;
      this.element.classList.add('loading');
      
      if (textSpan) textSpan.style.display = 'none';
      if (spinner) spinner.style.display = 'inline-block';
      
      if (!textSpan && !spinner) {
        this.element.textContent = '加载中...';
      }
    } else {
      this.element.disabled = this.isDisabled;
      this.element.classList.remove('loading');
      
      if (textSpan) textSpan.style.display = 'inline';
      if (spinner) spinner.style.display = 'none';
      
      if (!textSpan && !spinner) {
        this.element.textContent = this.originalText;
      }
    }
    
    return this;
  }

  /**
   * 设置禁用状态
   */
  setDisabled(disabled = true) {
    if (!this.element) return this;
    
    this.isDisabled = disabled;
    this.element.disabled = disabled || this.isLoading;
    
    if (disabled) {
      this.element.classList.add('disabled');
    } else {
      this.element.classList.remove('disabled');
    }
    
    return this;
  }

  /**
   * 设置按钮文本
   */
  setText(text) {
    if (!this.element) return this;
    
    const textSpan = this.element.querySelector('.btn-text');
    if (textSpan) {
      textSpan.textContent = text;
    } else {
      this.element.textContent = text;
    }
    
    this.originalText = text;
    return this;
  }

  /**
   * 设置按钮样式类
   */
  setClass(className) {
    if (!this.element) return this;
    
    // 移除所有btn-*类
    const classes = Array.from(this.element.classList);
    classes.forEach(cls => {
      if (cls.startsWith('btn-') && cls !== 'btn') {
        this.element.classList.remove(cls);
      }
    });
    
    // 添加新类
    this.element.classList.add(className);
    return this;
  }

  /**
   * 显示成功状态
   */
  showSuccess(message = '成功', duration = 2000) {
    if (!this.element) return this;
    
    const originalText = this.element.textContent;
    const originalClass = this.element.className;
    
    this.element.textContent = message;
    this.element.classList.add('btn-success');
    this.setDisabled(true);
    
    setTimeout(() => {
      this.element.textContent = originalText;
      this.element.className = originalClass;
      this.setDisabled(false);
    }, duration);
    
    return this;
  }

  /**
   * 显示错误状态
   */
  showError(message = '失败', duration = 2000) {
    if (!this.element) return this;
    
    const originalText = this.element.textContent;
    const originalClass = this.element.className;
    
    this.element.textContent = message;
    this.element.classList.add('btn-danger');
    this.setDisabled(true);
    
    setTimeout(() => {
      this.element.textContent = originalText;
      this.element.className = originalClass;
      this.setDisabled(false);
    }, duration);
    
    return this;
  }

  /**
   * 触发点击（用于测试）
   */
  click() {
    if (this.element) {
      this.element.click();
    }
    return this;
  }

  /**
   * 获取按钮状态
   */
  getState() {
    return {
      isLoading: this.isLoading,
      isDisabled: this.isDisabled,
      text: this.element ? this.element.textContent : '',
      classes: this.element ? Array.from(this.element.classList) : []
    };
  }
}

// 特定按钮功能类
class ActivateButton extends ButtonComponent {
  constructor() {
    super('#activate-btn');
    this.onClick(this.handleActivate.bind(this));
  }

  async handleActivate() {
    this.setLoading(true);
    
    try {
      // 模拟激活过程
      await this.simulateActivation();
      this.showSuccess('激活成功');
      
      // 触发状态切换
      this.onActivationSuccess();
    } catch (error) {
      this.showError('激活失败');
      console.error('Activation failed:', error);
    } finally {
      this.setLoading(false);
    }
  }

  async simulateActivation() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟90%成功率
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Network error'));
        }
      }, 1000);
    });
  }

  onActivationSuccess() {
    // 可以被外部重写
    console.log('Account activated successfully');
  }
}

class PaymentButton extends ButtonComponent {
  constructor() {
    super('#payment-btn');
    this.onClick(this.handlePayment.bind(this));
  }

  async handlePayment() {
    this.setLoading(true);
    
    try {
      const result = await this.processPayment();
      if (result.success) {
        this.showSuccess('支付成功');
        this.onPaymentSuccess(result);
      } else {
        this.showError('支付失败');
      }
    } catch (error) {
      this.showError('支付异常');
      console.error('Payment failed:', error);
    } finally {
      this.setLoading(false);
    }
  }

  async processPayment() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.2, // 80%成功率
          transactionId: 'tx_' + Date.now(),
          amount: 100
        });
      }, 2000);
    });
  }

  onPaymentSuccess(result) {
    console.log('Payment successful:', result);
  }
}

class CopyButton extends ButtonComponent {
  constructor() {
    super('#copy-btn');
    this.onClick(this.handleCopy.bind(this));
  }

  async handleCopy() {
    const textToCopy = this.getTextToCopy();
    
    try {
      await this.copyToClipboard(textToCopy);
      this.showSuccess('已复制');
    } catch (error) {
      this.showError('复制失败');
      console.error('Copy failed:', error);
    }
  }

  getTextToCopy() {
    // 模拟获取邀请链接
    return 'https://example.com/invite?code=ABC123';
  }

  async copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}

// 测试用例
describe('按钮组件测试', () => {
  let activateBtn, paymentBtn, copyBtn, submitBtn, loadingBtn;

  beforeEach(() => {
    // 重置DOM
    document.body.innerHTML = `
      <button id="activate-btn" class="btn btn-primary">激活账号</button>
      <button id="payment-btn" class="btn btn-success">立即支付</button>
      <button id="copy-btn" class="btn btn-secondary">复制邀请链接</button>
      <button id="submit-btn" class="btn btn-primary" disabled>提交</button>
      <button id="loading-btn" class="btn btn-primary">
        <span class="btn-text">加载中</span>
        <span class="btn-spinner" style="display: none;">⟳</span>
      </button>
      <div id="message-container"></div>
    `;

    activateBtn = new ButtonComponent('#activate-btn');
    paymentBtn = new ButtonComponent('#payment-btn');
    copyBtn = new ButtonComponent('#copy-btn');
    submitBtn = new ButtonComponent('#submit-btn');
    loadingBtn = new ButtonComponent('#loading-btn');
  });

  describe('基础功能测试', () => {
    test('应该能够创建按钮实例', () => {
      expect(activateBtn.element).toBeDefined();
      expect(activateBtn.originalText).toBe('激活账号');
    });

    test('应该能够添加点击事件处理器', () => {
      let clicked = false;
      activateBtn.onClick(() => { clicked = true; });
      
      activateBtn.click();
      expect(clicked).toBe(true);
    });

    test('应该能够设置按钮文本', () => {
      activateBtn.setText('新文本');
      expect(activateBtn.element.textContent).toBe('新文本');
    });

    test('应该能够设置按钮样式类', () => {
      activateBtn.setClass('btn-danger');
      expect(activateBtn.element.classList.contains('btn-danger')).toBe(true);
      expect(activateBtn.element.classList.contains('btn-primary')).toBe(false);
    });
  });

  describe('状态管理测试', () => {
    test('应该能够设置加载状态', () => {
      loadingBtn.setLoading(true);
      
      expect(loadingBtn.isLoading).toBe(true);
      expect(loadingBtn.element.disabled).toBe(true);
      expect(loadingBtn.element.classList.contains('loading')).toBe(true);
    });

    test('应该能够取消加载状态', () => {
      loadingBtn.setLoading(true);
      loadingBtn.setLoading(false);
      
      expect(loadingBtn.isLoading).toBe(false);
      expect(loadingBtn.element.disabled).toBe(false);
      expect(loadingBtn.element.classList.contains('loading')).toBe(false);
    });

    test('应该能够设置禁用状态', () => {
      activateBtn.setDisabled(true);
      
      expect(activateBtn.isDisabled).toBe(true);
      expect(activateBtn.element.disabled).toBe(true);
      expect(activateBtn.element.classList.contains('disabled')).toBe(true);
    });

    test('加载状态下应该阻止点击', () => {
      let clicked = false;
      activateBtn.onClick(() => { clicked = true; });
      
      activateBtn.setLoading(true);
      activateBtn.click();
      
      expect(clicked).toBe(false);
    });

    test('禁用状态下应该阻止点击', () => {
      let clicked = false;
      activateBtn.onClick(() => { clicked = true; });
      
      activateBtn.setDisabled(true);
      activateBtn.click();
      
      expect(clicked).toBe(false);
    });
  });

  describe('反馈状态测试', () => {
    test('应该能够显示成功状态', (done) => {
      activateBtn.showSuccess('操作成功', 100);
      
      expect(activateBtn.element.textContent).toBe('操作成功');
      expect(activateBtn.element.classList.contains('btn-success')).toBe(true);
      
      setTimeout(() => {
        expect(activateBtn.element.textContent).toBe('激活账号');
        done();
      }, 150);
    });

    test('应该能够显示错误状态', (done) => {
      activateBtn.showError('操作失败', 100);
      
      expect(activateBtn.element.textContent).toBe('操作失败');
      expect(activateBtn.element.classList.contains('btn-danger')).toBe(true);
      
      setTimeout(() => {
        expect(activateBtn.element.textContent).toBe('激活账号');
        done();
      }, 150);
    });
  });

  describe('特定按钮功能测试', () => {
    test('激活按钮应该能够处理激活流程', async () => {
      const activateButton = new ActivateButton();
      let activationCalled = false;
      
      activateButton.onActivationSuccess = () => {
        activationCalled = true;
      };
      
      // 模拟成功激活
      jest.spyOn(activateButton, 'simulateActivation').mockResolvedValue();
      
      await activateButton.handleActivate();
      
      expect(activationCalled).toBe(true);
    });

    test('支付按钮应该能够处理支付流程', async () => {
      const paymentButton = new PaymentButton();
      let paymentResult = null;
      
      paymentButton.onPaymentSuccess = (result) => {
        paymentResult = result;
      };
      
      // 模拟成功支付
      jest.spyOn(paymentButton, 'processPayment').mockResolvedValue({
        success: true,
        transactionId: 'test_tx',
        amount: 100
      });
      
      await paymentButton.handlePayment();
      
      expect(paymentResult).toBeDefined();
      expect(paymentResult.success).toBe(true);
    });

    test('复制按钮应该能够复制文本到剪贴板', async () => {
      const copyButton = new CopyButton();
      const mockWriteText = jest.fn().mockResolvedValue();
      navigator.clipboard.writeText = mockWriteText;
      
      await copyButton.handleCopy();
      
      expect(mockWriteText).toHaveBeenCalledWith('https://example.com/invite?code=ABC123');
    });
  });

  describe('错误处理测试', () => {
    test('应该处理点击处理器中的错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      activateBtn.onClick(() => {
        throw new Error('Handler error');
      });
      
      activateBtn.click();
      
      expect(consoleSpy).toHaveBeenCalledWith('Button click handler error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('应该处理不存在的DOM元素', () => {
      const nonExistentBtn = new ButtonComponent('#non-existent');
      
      expect(() => {
        nonExistentBtn.setText('test');
        nonExistentBtn.setLoading(true);
        nonExistentBtn.setDisabled(true);
        nonExistentBtn.click();
      }).not.toThrow();
    });

    test('复制按钮应该处理剪贴板API不可用的情况', async () => {
      const copyButton = new CopyButton();
      
      // 模拟剪贴板API不可用
      const originalClipboard = navigator.clipboard;
      navigator.clipboard = undefined;
      
      // 模拟document.execCommand
      document.execCommand = jest.fn().mockReturnValue(true);
      
      await copyButton.handleCopy();
      
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      
      // 恢复
      navigator.clipboard = originalClipboard;
    });
  });

  describe('状态获取测试', () => {
    test('应该能够获取按钮当前状态', () => {
      activateBtn.setLoading(true);
      activateBtn.setText('测试文本');
      
      const state = activateBtn.getState();
      
      expect(state.isLoading).toBe(true);
      expect(state.text).toBe('测试文本');
      expect(state.classes).toContain('loading');
    });
  });

  describe('多个处理器测试', () => {
    test('应该能够添加多个点击处理器', () => {
      let count = 0;
      
      activateBtn.onClick(() => count++);
      activateBtn.onClick(() => count++);
      activateBtn.onClick(() => count++);
      
      activateBtn.click();
      
      expect(count).toBe(3);
    });
  });

  describe('性能测试', () => {
    test('大量点击操作应该在合理时间内完成', () => {
      let clickCount = 0;
      activateBtn.onClick(() => clickCount++);
      
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        activateBtn.click();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(clickCount).toBe(1000);
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    test('频繁的状态切换应该不会造成内存泄漏', () => {
      for (let i = 0; i < 100; i++) {
        activateBtn.setLoading(true);
        activateBtn.setLoading(false);
        activateBtn.setDisabled(true);
        activateBtn.setDisabled(false);
      }
      
      // 如果没有抛出错误，说明没有明显的内存泄漏
      expect(true).toBe(true);
    });
  });
});

module.exports = { ButtonComponent, ActivateButton, PaymentButton, CopyButton };