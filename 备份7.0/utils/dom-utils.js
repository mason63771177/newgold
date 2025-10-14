/**
 * DOM操作工具函数库
 * 提供安全、高效的DOM操作方法
 */

class DOMUtils {
  /**
   * 安全获取DOM元素
   * @param {string} selector - CSS选择器
   * @param {Element} parent - 父元素，默认为document
   * @returns {Element|null} DOM元素或null
   */
  static safeGetElement(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.error(`获取元素失败: ${selector}`, error);
      return null;
    }
  }

  /**
   * 安全获取多个DOM元素
   * @param {string} selector - CSS选择器
   * @param {Element} parent - 父元素，默认为document
   * @returns {NodeList} DOM元素列表
   */
  static safeGetElements(selector, parent = document) {
    try {
      return parent.querySelectorAll(selector);
    } catch (error) {
      console.error(`获取元素列表失败: ${selector}`, error);
      return [];
    }
  }

  /**
   * 安全设置元素内容
   * @param {string|Element} element - 元素或选择器
   * @param {string} content - 内容
   * @param {boolean} isHTML - 是否为HTML内容
   */
  static safeSetContent(element, content, isHTML = false) {
    const el = typeof element === 'string' ? this.safeGetElement(element) : element;
    if (!el) return false;

    try {
      if (isHTML) {
        // 使用安全的HTML设置方法
        el.innerHTML = this.sanitizeHTML(content);
      } else {
        el.textContent = content;
      }
      return true;
    } catch (error) {
      console.error('设置元素内容失败:', error);
      return false;
    }
  }

  /**
   * 简单的HTML清理函数
   * @param {string} html - HTML字符串
   * @returns {string} 清理后的HTML
   */
  static sanitizeHTML(html) {
    // 移除潜在危险的标签和属性
    const dangerousTags = /<script[^>]*>[\s\S]*?<\/script>/gi;
    const dangerousAttrs = /on\w+\s*=\s*["'][^"']*["']/gi;
    
    return html
      .replace(dangerousTags, '')
      .replace(dangerousAttrs, '');
  }

  /**
   * 安全添加事件监听器
   * @param {string|Element} element - 元素或选择器
   * @param {string} event - 事件类型
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 事件选项
   */
  static safeAddEventListener(element, event, handler, options = {}) {
    const el = typeof element === 'string' ? this.safeGetElement(element) : element;
    if (!el || typeof handler !== 'function') return false;

    try {
      el.addEventListener(event, handler, options);
      return true;
    } catch (error) {
      console.error('添加事件监听器失败:', error);
      return false;
    }
  }

  /**
   * 批量添加事件监听器
   * @param {Array} eventConfigs - 事件配置数组
   */
  static addMultipleEventListeners(eventConfigs) {
    eventConfigs.forEach(config => {
      const { element, event, handler, options } = config;
      this.safeAddEventListener(element, event, handler, options);
    });
  }

  /**
   * 显示/隐藏元素
   * @param {string|Element} element - 元素或选择器
   * @param {boolean} show - 是否显示
   * @param {string} displayType - 显示类型，默认为'block'
   */
  static toggleDisplay(element, show, displayType = 'block') {
    const el = typeof element === 'string' ? this.safeGetElement(element) : element;
    if (!el) return false;

    el.style.display = show ? displayType : 'none';
    return true;
  }

  /**
   * 添加/移除CSS类
   * @param {string|Element} element - 元素或选择器
   * @param {string|Array} classes - CSS类名或类名数组
   * @param {boolean} add - 是否添加类，false为移除
   */
  static toggleClass(element, classes, add = true) {
    const el = typeof element === 'string' ? this.safeGetElement(element) : element;
    if (!el) return false;

    const classList = Array.isArray(classes) ? classes : [classes];
    
    classList.forEach(className => {
      if (add) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    });
    
    return true;
  }

  /**
   * 创建DOM元素
   * @param {string} tagName - 标签名
   * @param {Object} attributes - 属性对象
   * @param {string} content - 内容
   * @returns {Element} 创建的元素
   */
  static createElement(tagName, attributes = {}, content = '') {
    try {
      const element = document.createElement(tagName);
      
      // 设置属性
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else {
          element.setAttribute(key, value);
        }
      });
      
      // 设置内容
      if (content) {
        element.textContent = content;
      }
      
      return element;
    } catch (error) {
      console.error('创建元素失败:', error);
      return null;
    }
  }

  /**
   * 安全移除元素
   * @param {string|Element} element - 元素或选择器
   */
  static safeRemoveElement(element) {
    const el = typeof element === 'string' ? this.safeGetElement(element) : element;
    if (!el || !el.parentNode) return false;

    try {
      el.parentNode.removeChild(el);
      return true;
    } catch (error) {
      console.error('移除元素失败:', error);
      return false;
    }
  }

  /**
   * 获取元素的计算样式
   * @param {string|Element} element - 元素或选择器
   * @param {string} property - CSS属性名
   * @returns {string} 属性值
   */
  static getComputedStyle(element, property) {
    const el = typeof element === 'string' ? this.safeGetElement(element) : element;
    if (!el) return '';

    try {
      return window.getComputedStyle(el).getPropertyValue(property);
    } catch (error) {
      console.error('获取计算样式失败:', error);
      return '';
    }
  }

  /**
   * 等待DOM元素出现
   * @param {string} selector - CSS选择器
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<Element>} Promise对象
   */
  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = this.safeGetElement(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = this.safeGetElement(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`元素 ${selector} 在 ${timeout}ms 内未出现`));
      }, timeout);
    });
  }
}

// 导出工具类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMUtils;
} else if (typeof window !== 'undefined') {
  window.DOMUtils = DOMUtils;
}