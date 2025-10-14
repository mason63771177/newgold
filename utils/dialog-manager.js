/**
 * 对话框管理工具类
 * 统一管理各种类型的对话框和提示信息
 */
class DialogManager {
  constructor() {
    this.dialogQueue = [];
    this.currentDialog = null;
    this.isProcessing = false;
  }

  /**
   * 显示对话框
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {Array} buttons - 按钮配置数组
   * @param {string} type - 对话框类型
   * @param {Object} options - 额外选项
   */
  showDialog(title, message, buttons = null, type = 'info', options = {}) {
    const dialog = {
      id: Date.now() + Math.random(),
      title,
      message,
      buttons: buttons || [{ text: '确定', action: 'close' }],
      type,
      options: {
        closable: true,
        backdrop: true,
        timeout: null,
        ...options
      }
    };

    this.dialogQueue.push(dialog);
    this.processQueue();
    
    return dialog.id;
  }

  /**
   * 显示成功对话框
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {Array} buttons - 按钮配置
   */
  showSuccess(title, message, buttons = null) {
    return this.showDialog(title, message, buttons, 'success');
  }

  /**
   * 显示错误对话框
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {Array} buttons - 按钮配置
   */
  showError(title, message, buttons = null) {
    return this.showDialog(title, message, buttons, 'error');
  }

  /**
   * 显示警告对话框
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {Array} buttons - 按钮配置
   */
  showWarning(title, message, buttons = null) {
    return this.showDialog(title, message, buttons, 'warning');
  }

  /**
   * 显示确认对话框
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {Function} onConfirm - 确认回调
   * @param {Function} onCancel - 取消回调
   */
  showConfirm(title, message, onConfirm, onCancel = null) {
    const buttons = [
      { text: '确定', action: onConfirm || 'close', style: 'primary' },
      { text: '取消', action: onCancel || 'close', style: 'secondary' }
    ];
    return this.showDialog(title, message, buttons, 'confirm');
  }

  /**
   * 显示加载对话框
   * @param {string} message - 加载消息
   * @param {number} timeout - 超时时间（毫秒）
   */
  showLoading(message = '加载中...', timeout = null) {
    return this.showDialog('', message, null, 'loading', {
      closable: false,
      backdrop: false,
      timeout
    });
  }

  /**
   * 显示输入对话框
   * @param {string} title - 标题
   * @param {string} message - 消息内容
   * @param {string} placeholder - 输入框占位符
   * @param {Function} onConfirm - 确认回调
   * @param {Function} onCancel - 取消回调
   */
  showInput(title, message, placeholder = '', onConfirm, onCancel = null) {
    const dialog = {
      id: Date.now() + Math.random(),
      title,
      message,
      type: 'input',
      placeholder,
      buttons: [
        { text: '确定', action: onConfirm || 'close', style: 'primary' },
        { text: '取消', action: onCancel || 'close', style: 'secondary' }
      ],
      options: {
        closable: true,
        backdrop: true
      }
    };

    this.dialogQueue.push(dialog);
    this.processQueue();
    
    return dialog.id;
  }

  /**
   * 显示Toast提示
   * @param {string} message - 提示消息
   * @param {string} type - 提示类型
   * @param {number} duration - 显示时长（毫秒）
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration
    };

    this.createToastElement(toast);
    
    // 自动移除
    setTimeout(() => {
      this.removeToast(toast.id);
    }, duration);

    return toast.id;
  }

  /**
   * 处理对话框队列
   */
  processQueue() {
    if (this.isProcessing || this.dialogQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const dialog = this.dialogQueue.shift();
    this.currentDialog = dialog;
    
    this.createDialogElement(dialog);
  }

  /**
   * 创建对话框DOM元素
   * @param {Object} dialog - 对话框配置
   */
  createDialogElement(dialog) {
    // 移除现有对话框
    this.removeCurrentDialog();

    const dialogEl = document.createElement('div');
    dialogEl.className = `dialog-overlay dialog-${dialog.type}`;
    dialogEl.id = `dialog-${dialog.id}`;

    const dialogContent = this.generateDialogHTML(dialog);
    dialogEl.innerHTML = dialogContent;

    // 添加事件监听
    this.attachDialogEvents(dialogEl, dialog);

    document.body.appendChild(dialogEl);

    // 添加显示动画
    setTimeout(() => {
      dialogEl.classList.add('show');
    }, 10);

    // 设置超时自动关闭
    if (dialog.options.timeout) {
      setTimeout(() => {
        this.closeDialog(dialog.id);
      }, dialog.options.timeout);
    }
  }

  /**
   * 生成对话框HTML
   * @param {Object} dialog - 对话框配置
   */
  generateDialogHTML(dialog) {
    const iconMap = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ',
      confirm: '?',
      loading: '⟳',
      input: '✎'
    };

    const icon = iconMap[dialog.type] || iconMap.info;
    const showTitle = dialog.title && dialog.type !== 'loading';
    const showButtons = dialog.buttons && dialog.type !== 'loading';
    const isInput = dialog.type === 'input';

    return `
      <div class="dialog-content">
        <div class="dialog-header">
          ${showTitle ? `<h3 class="dialog-title">${dialog.title}</h3>` : ''}
          ${dialog.options.closable ? '<button class="dialog-close" data-action="close">×</button>' : ''}
        </div>
        <div class="dialog-body">
          <div class="dialog-icon">${icon}</div>
          <div class="dialog-message">${dialog.message}</div>
          ${isInput ? `<input type="text" class="dialog-input" placeholder="${dialog.placeholder || ''}" />` : ''}
        </div>
        ${showButtons ? `
          <div class="dialog-footer">
            ${dialog.buttons.map(btn => `
              <button class="dialog-btn dialog-btn-${btn.style || 'default'}" 
                      data-action="${typeof btn.action === 'function' ? 'callback' : btn.action}"
                      data-callback-id="${typeof btn.action === 'function' ? this.registerCallback(btn.action) : ''}">
                ${btn.text}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 创建Toast DOM元素
   * @param {Object} toast - Toast配置
   */
  createToastElement(toast) {
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${toast.type}`;
    toastEl.id = `toast-${toast.id}`;
    toastEl.textContent = toast.message;

    // 获取或创建Toast容器
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    container.appendChild(toastEl);

    // 添加显示动画
    setTimeout(() => {
      toastEl.classList.add('show');
    }, 10);
  }

  /**
   * 附加对话框事件
   * @param {HTMLElement} dialogEl - 对话框元素
   * @param {Object} dialog - 对话框配置
   */
  attachDialogEvents(dialogEl, dialog) {
    // 点击背景关闭
    if (dialog.options.backdrop) {
      dialogEl.addEventListener('click', (e) => {
        if (e.target === dialogEl) {
          this.closeDialog(dialog.id);
        }
      });
    }

    // 按钮点击事件
    dialogEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const callbackId = btn.dataset.callbackId;

      if (action === 'close') {
        this.closeDialog(dialog.id);
      } else if (action === 'callback' && callbackId) {
        const callback = this.getCallback(callbackId);
        if (callback) {
          const input = dialogEl.querySelector('.dialog-input');
          const inputValue = input ? input.value : null;
          callback(inputValue);
        }
        this.closeDialog(dialog.id);
      }
    });

    // ESC键关闭
    if (dialog.options.closable) {
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeDialog(dialog.id);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    }
  }

  /**
   * 关闭对话框
   * @param {string} dialogId - 对话框ID
   */
  closeDialog(dialogId) {
    const dialogEl = document.getElementById(`dialog-${dialogId}`);
    if (!dialogEl) return;

    dialogEl.classList.add('hide');
    
    setTimeout(() => {
      if (dialogEl.parentNode) {
        dialogEl.parentNode.removeChild(dialogEl);
      }
      
      if (this.currentDialog && this.currentDialog.id === dialogId) {
        this.currentDialog = null;
        this.isProcessing = false;
        this.processQueue(); // 处理下一个对话框
      }
    }, 300);
  }

  /**
   * 移除当前对话框
   */
  removeCurrentDialog() {
    const existingDialog = document.querySelector('.dialog-overlay');
    if (existingDialog) {
      existingDialog.remove();
    }
  }

  /**
   * 移除Toast
   * @param {string} toastId - Toast ID
   */
  removeToast(toastId) {
    const toastEl = document.getElementById(`toast-${toastId}`);
    if (!toastEl) return;

    toastEl.classList.add('hide');
    
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 300);
  }

  /**
   * 注册回调函数
   * @param {Function} callback - 回调函数
   */
  registerCallback(callback) {
    const id = Date.now() + Math.random();
    this.callbacks = this.callbacks || {};
    this.callbacks[id] = callback;
    return id;
  }

  /**
   * 获取回调函数
   * @param {string} callbackId - 回调ID
   */
  getCallback(callbackId) {
    return this.callbacks && this.callbacks[callbackId];
  }

  /**
   * 清空所有对话框
   */
  clearAll() {
    this.dialogQueue = [];
    this.removeCurrentDialog();
    this.currentDialog = null;
    this.isProcessing = false;
  }
}

// 创建全局实例
const dialogManager = new DialogManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DialogManager, dialogManager };
} else if (typeof window !== 'undefined') {
  window.DialogManager = DialogManager;
  window.dialogManager = dialogManager;
}