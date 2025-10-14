/**
 * 状态管理工具类
 * 集中管理应用状态的保存、加载和同步
 */
class StateManager {
  /**
   * 保存状态到本地存储
   * @param {string} key - 存储键名
   * @param {any} data - 要保存的数据
   */
  static saveState(key, data) {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error(`保存状态失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 从本地存储加载状态
   * @param {string} key - 存储键名
   * @param {any} defaultValue - 默认值
   */
  static loadState(key, defaultValue = null) {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return defaultValue;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error(`加载状态失败 [${key}]:`, error);
      return defaultValue;
    }
  }

  /**
   * 批量保存多个状态
   * @param {Object} stateMap - 状态映射对象 {key: value}
   */
  static saveBatchStates(stateMap) {
    const results = {};
    for (const [key, value] of Object.entries(stateMap)) {
      results[key] = this.saveState(key, value);
    }
    return results;
  }

  /**
   * 批量加载多个状态
   * @param {Array} keys - 键名数组
   * @param {Object} defaults - 默认值映射
   */
  static loadBatchStates(keys, defaults = {}) {
    const results = {};
    for (const key of keys) {
      results[key] = this.loadState(key, defaults[key] || null);
    }
    return results;
  }

  /**
   * 删除指定状态
   * @param {string} key - 存储键名
   */
  static removeState(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`删除状态失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 清空所有状态
   */
  static clearAllStates() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('清空状态失败:', error);
      return false;
    }
  }

  /**
   * 检查状态是否存在
   * @param {string} key - 存储键名
   */
  static hasState(key) {
    return localStorage.getItem(key) !== null;
  }

  /**
   * 获取所有状态键名
   */
  static getAllStateKeys() {
    return Object.keys(localStorage);
  }

  /**
   * 获取状态存储大小（字节）
   */
  static getStorageSize() {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  /**
   * 监听状态变化
   * @param {Function} callback - 回调函数
   */
  static onStateChange(callback) {
    window.addEventListener('storage', callback);
  }

  /**
   * 移除状态变化监听
   * @param {Function} callback - 回调函数
   */
  static offStateChange(callback) {
    window.removeEventListener('storage', callback);
  }

  /**
   * 导出所有状态数据
   */
  static exportStates() {
    const states = {};
    for (const key of this.getAllStateKeys()) {
      states[key] = this.loadState(key);
    }
    return states;
  }

  /**
   * 导入状态数据
   * @param {Object} states - 状态数据对象
   * @param {boolean} overwrite - 是否覆盖现有数据
   */
  static importStates(states, overwrite = false) {
    const results = {};
    for (const [key, value] of Object.entries(states)) {
      if (!overwrite && this.hasState(key)) {
        results[key] = { success: false, reason: 'exists' };
        continue;
      }
      results[key] = { success: this.saveState(key, value) };
    }
    return results;
  }

  /**
   * 创建状态备份
   * @param {string} backupKey - 备份键名
   */
  static createBackup(backupKey = `backup_${Date.now()}`) {
    const allStates = this.exportStates();
    return this.saveState(backupKey, allStates);
  }

  /**
   * 从备份恢复状态
   * @param {string} backupKey - 备份键名
   * @param {boolean} clearCurrent - 是否清空当前状态
   */
  static restoreFromBackup(backupKey, clearCurrent = false) {
    const backup = this.loadState(backupKey);
    if (!backup) {
      return { success: false, reason: 'backup_not_found' };
    }

    if (clearCurrent) {
      this.clearAllStates();
    }

    return {
      success: true,
      results: this.importStates(backup, true)
    };
  }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateManager;
} else if (typeof window !== 'undefined') {
  window.StateManager = StateManager;
}