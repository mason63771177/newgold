/**
 * JavaScript性能优化模块
 * 提供事件委托、防抖节流、内存泄漏检查等性能优化功能
 */

class PerformanceOptimizer {
  constructor() {
    this.eventDelegates = new Map();
    this.timers = new Map();
    this.observers = new Set();
    this.memoryMonitor = null;
    
    this.init();
  }

  /**
   * 初始化性能优化器
   */
  init() {
    this.setupEventDelegation();
    this.setupMemoryMonitoring();
    this.setupPerformanceObserver();
    
    console.log('🚀 性能优化器已启动');
  }

  /* ========== 事件委托优化 ========== */

  /**
   * 设置事件委托
   */
  setupEventDelegation() {
    // 点击事件委托
    this.delegate(document.body, 'click', {
      '.btn, button, [role="button"]': this.handleButtonClick.bind(this),
      '.card, .touchable': this.handleCardClick.bind(this),
      '.ripple': this.handleRippleEffect.bind(this)
    });

    // 触摸事件委托
    this.delegate(document.body, 'touchstart', {
      '.touchable, .btn, button': this.handleTouchStart.bind(this)
    });

    this.delegate(document.body, 'touchend', {
      '.touchable, .btn, button': this.handleTouchEnd.bind(this)
    });

    // 滚动事件委托（节流处理）
    this.delegate(document, 'scroll', {
      '.scroll-container': this.throttle(this.handleScroll.bind(this), 16)
    }, { passive: true });
  }

  /**
   * 通用事件委托方法
   * @param {Element} container - 容器元素
   * @param {string} eventType - 事件类型
   * @param {Object} selectors - 选择器和处理函数映射
   * @param {Object} options - 事件选项
   */
  delegate(container, eventType, selectors, options = {}) {
    const handler = (event) => {
      for (const [selector, callback] of Object.entries(selectors)) {
        const target = event.target.closest(selector);
        if (target && container.contains(target)) {
          callback(event, target);
        }
      }
    };

    container.addEventListener(eventType, handler, options);
    
    // 存储委托信息用于清理
    const key = `${container.tagName}-${eventType}`;
    this.eventDelegates.set(key, { container, eventType, handler, options });
  }

  /**
   * 按钮点击处理
   */
  handleButtonClick(event, target) {
    // 添加点击反馈
    this.addClickFeedback(target);
    
    // 防止重复点击
    if (target.disabled || target.classList.contains('loading')) {
      event.preventDefault();
      return;
    }

    // 触觉反馈
    this.triggerHapticFeedback('light');
  }

  /**
   * 卡片点击处理
   */
  handleCardClick(event, target) {
    this.addClickFeedback(target, 'scale');
  }

  /**
   * 涟漪效果处理
   */
  handleRippleEffect(event, target) {
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.createRipple(target, x, y);
  }

  /**
   * 触摸开始处理
   */
  handleTouchStart(event, target) {
    target.classList.add('touching');
  }

  /**
   * 触摸结束处理
   */
  handleTouchEnd(event, target) {
    // 延迟移除触摸状态，保持视觉反馈
    setTimeout(() => {
      target.classList.remove('touching');
    }, 150);
  }

  /**
   * 滚动处理
   */
  handleScroll(event, target) {
    // 滚动性能优化
    this.optimizeScrollPerformance(target);
  }

  /* ========== 防抖节流处理 ========== */

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} delay - 延迟时间
   * @param {boolean} immediate - 是否立即执行
   */
  debounce(func, delay = 300, immediate = false) {
    let timeoutId;
    
    return function executedFunction(...args) {
      const later = () => {
        timeoutId = null;
        if (!immediate) func.apply(this, args);
      };

      const callNow = immediate && !timeoutId;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(later, delay);
      
      if (callNow) func.apply(this, args);
    };
  }

  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} limit - 时间限制
   */
  throttle(func, limit = 100) {
    let inThrottle;
    
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 请求动画帧节流
   * @param {Function} func - 要节流的函数
   */
  rafThrottle(func) {
    let rafId = null;
    
    return function executedFunction(...args) {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          func.apply(this, args);
          rafId = null;
        });
      }
    };
  }

  /* ========== 内存泄漏检查 ========== */

  /**
   * 设置内存监控
   */
  setupMemoryMonitoring() {
    if (!performance.memory) {
      console.warn('⚠️ 浏览器不支持内存监控');
      return;
    }

    // 每30秒检查一次内存使用情况
    this.memoryMonitor = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
  }

  /**
   * 检查内存使用情况
   */
  checkMemoryUsage() {
    const memory = performance.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
    const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
    
    const usagePercent = (usedMB / limitMB) * 100;
    
    console.log(`📊 内存使用: ${usedMB}MB / ${limitMB}MB (${usagePercent.toFixed(1)}%)`);
    
    // 内存使用超过80%时发出警告
    if (usagePercent > 80) {
      console.warn('⚠️ 内存使用过高，建议进行垃圾回收');
      this.suggestGarbageCollection();
    }
  }

  /**
   * 建议垃圾回收
   */
  suggestGarbageCollection() {
    // 清理未使用的事件监听器
    this.cleanupEventListeners();
    
    // 清理定时器
    this.cleanupTimers();
    
    // 清理观察者
    this.cleanupObservers();
    
    // 强制垃圾回收（仅在开发环境）
    if (window.gc && process.env.NODE_ENV === 'development') {
      window.gc();
    }
  }

  /**
   * 清理事件监听器
   */
  cleanupEventListeners() {
    // 移除已分离的DOM元素的事件监听器
    this.eventDelegates.forEach((delegate, key) => {
      if (!document.contains(delegate.container)) {
        delegate.container.removeEventListener(
          delegate.eventType, 
          delegate.handler, 
          delegate.options
        );
        this.eventDelegates.delete(key);
        console.log(`🧹 清理事件委托: ${key}`);
      }
    });
  }

  /**
   * 清理定时器
   */
  cleanupTimers() {
    this.timers.forEach((timer, key) => {
      if (timer.expired || !timer.active) {
        clearTimeout(timer.id);
        this.timers.delete(key);
        console.log(`🧹 清理定时器: ${key}`);
      }
    });
  }

  /**
   * 清理观察者
   */
  cleanupObservers() {
    this.observers.forEach(observer => {
      if (observer.disconnect) {
        observer.disconnect();
        console.log('🧹 清理观察者');
      }
    });
    this.observers.clear();
  }

  /* ========== 性能监控 ========== */

  /**
   * 设置性能观察者
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) {
      console.warn('⚠️ 浏览器不支持PerformanceObserver');
      return;
    }

    // 监控长任务
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.warn(`⚠️ 长任务检测: ${entry.duration.toFixed(2)}ms`);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.add(longTaskObserver);
    } catch (e) {
      console.warn('⚠️ 长任务监控不可用');
    }

    // 监控布局偏移
    try {
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.value > 0.1) {
            console.warn(`⚠️ 布局偏移: ${entry.value.toFixed(4)}`);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.add(clsObserver);
    } catch (e) {
      console.warn('⚠️ 布局偏移监控不可用');
    }
  }

  /* ========== 工具方法 ========== */

  /**
   * 添加点击反馈
   */
  addClickFeedback(element, type = 'opacity') {
    element.style.transition = 'all 150ms cubic-bezier(0.4, 0.0, 0.2, 1)';
    
    if (type === 'opacity') {
      element.style.opacity = '0.7';
    } else if (type === 'scale') {
      element.style.transform = 'scale(0.98)';
    }
    
    setTimeout(() => {
      element.style.opacity = '';
      element.style.transform = '';
    }, 150);
  }

  /**
   * 创建涟漪效果
   */
  createRipple(element, x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 600ms linear;
      left: ${x - 10}px;
      top: ${y - 10}px;
      width: 20px;
      height: 20px;
      pointer-events: none;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * 触觉反馈
   */
  triggerHapticFeedback(type = 'light') {
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [50, 100, 50]
      };
      
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }

  /**
   * 优化滚动性能
   */
  optimizeScrollPerformance(element) {
    // 使用 transform 而不是改变 top/left
    element.style.willChange = 'transform';
    
    // 滚动结束后清理
    clearTimeout(element.scrollTimeout);
    element.scrollTimeout = setTimeout(() => {
      element.style.willChange = 'auto';
    }, 150);
  }

  /**
   * 销毁优化器
   */
  destroy() {
    // 清理内存监控
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }
    
    // 清理所有资源
    this.cleanupEventListeners();
    this.cleanupTimers();
    this.cleanupObservers();
    
    console.log('🧹 性能优化器已销毁');
  }
}

// 添加涟漪动画样式
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(rippleStyle);

// 导出性能优化器
window.PerformanceOptimizer = PerformanceOptimizer;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  window.performanceOptimizer = new PerformanceOptimizer();
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (window.performanceOptimizer) {
    window.performanceOptimizer.destroy();
  }
});