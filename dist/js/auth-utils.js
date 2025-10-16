/**
 * 认证工具模块
 * 提供统一的用户认证状态管理功能
 * 解决登录状态判断不一致的问题
 */

// 存储键名常量
const STORAGE_KEYS = {
  TOKEN: 'token',           // 主要token键名
  AUTH_TOKEN: 'authToken',  // 备用token键名
  CURRENT_USER: 'currentUser',
  USER_EMAIL: 'userEmail'
};

/**
 * Token管理工具
 */
const TokenManager = {
  /**
   * 获取认证token
   * 优先使用'token'，如果不存在则使用'authToken'
   * @returns {string|null} token字符串或null
   */
  getToken() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && token !== 'demo-token') {
      return token;
    }
    
    const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (authToken && authToken !== 'demo-token') {
      return authToken;
    }
    
    return null;
  },

  /**
   * 设置认证token
   * 同时设置到两个键名以保持兼容性
   * @param {string} token - JWT token
   */
  setToken(token) {
    if (!token) {
      console.warn('AuthUtils: 尝试设置空token');
      return;
    }
    
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    console.log('AuthUtils: Token已设置');
  },

  /**
   * 清除认证token
   */
  removeToken() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log('AuthUtils: Token已清除');
  },

  /**
   * 检查token是否有效（基本格式验证）
   * @param {string} token - 要检查的token
   * @returns {boolean} 是否有效
   */
  isTokenValid(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // 排除测试token - 但GitHub Pages模式下的token应该被认为有效
    if (token === 'demo-token' || token === 'mock-token-1' || token.startsWith('test-token-') || token.startsWith('github-pages-token-') || token.startsWith('mock_token_')) {
      return true; // 测试环境和GitHub Pages环境下认为有效
    }
    
    // JWT token基本格式检查（三段式，用.分隔）
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // 检查每部分是否为base64格式
    try {
      parts.forEach(part => {
        if (part.length === 0) throw new Error('Empty part');
        // 简单的base64格式检查
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      });
      return true;
    } catch (error) {
      console.warn('AuthUtils: Token格式无效', error.message);
      return false;
    }
  }
};

/**
 * 用户信息管理工具
 */
const UserManager = {
  /**
   * 获取当前用户信息
   * @returns {Object|null} 用户信息对象或null
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!userStr) {
        return null;
      }
      
      const user = JSON.parse(userStr);
      
      // 验证用户对象的基本结构
      if (!user || typeof user !== 'object') {
        console.warn('AuthUtils: 用户信息格式无效');
        return null;
      }
      
      // 检查必要字段
      if (!user.email && !user.id) {
        console.warn('AuthUtils: 用户信息缺少必要字段');
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('AuthUtils: 解析用户信息失败', error);
      return null;
    }
  },

  /**
   * 设置当前用户信息
   * @param {Object} user - 用户信息对象
   */
  setCurrentUser(user) {
    if (!user || typeof user !== 'object') {
      console.warn('AuthUtils: 尝试设置无效的用户信息');
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      
      // 同时保存用户邮箱（兼容性）
      if (user.email) {
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
      }
      
      console.log('AuthUtils: 用户信息已设置', user.email || user.id);
    } catch (error) {
      console.error('AuthUtils: 保存用户信息失败', error);
    }
  },

  /**
   * 清除当前用户信息
   */
  removeCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    console.log('AuthUtils: 用户信息已清除');
  }
};

/**
 * 认证状态检查工具
 */
const AuthChecker = {
  /**
   * 检查用户是否已登录
   * 同时检查用户信息和token的存在及有效性
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    // 检查用户信息
    const user = UserManager.getCurrentUser();
    if (!user) {
      console.log('AuthUtils: 用户信息不存在，未登录');
      return false;
    }
    
    // 检查token
    const token = TokenManager.getToken();
    if (!token) {
      console.log('AuthUtils: Token不存在，未登录');
      return false;
    }
    
    // 检查token有效性
    if (!TokenManager.isTokenValid(token)) {
      console.log('AuthUtils: Token无效，未登录');
      return false;
    }
    
    console.log('AuthUtils: 用户已登录', user.email || user.id);
    return true;
  },

  /**
   * 检查登录状态并返回详细信息
   * @returns {Object} 登录状态详情
   */
  getLoginStatus() {
    const user = UserManager.getCurrentUser();
    const token = TokenManager.getToken();
    const tokenValid = token ? TokenManager.isTokenValid(token) : false;
    
    return {
      isLoggedIn: !!(user && token && tokenValid),
      hasUser: !!user,
      hasToken: !!token,
      tokenValid: tokenValid,
      user: user,
      token: token
    };
  }
};

/**
 * 认证操作工具
 */
const AuthActions = {
  /**
   * 完整的登录操作
   * @param {Object} user - 用户信息
   * @param {string} token - JWT token
   */
  login(user, token) {
    if (!user || !token) {
      console.error('AuthUtils: 登录参数不完整');
      return false;
    }
    
    try {
      UserManager.setCurrentUser(user);
      TokenManager.setToken(token);
      console.log('AuthUtils: 登录成功', user.email || user.id);
      return true;
    } catch (error) {
      console.error('AuthUtils: 登录操作失败', error);
      return false;
    }
  },

  /**
   * 完整的登出操作
   */
  logout() {
    try {
      UserManager.removeCurrentUser();
      TokenManager.removeToken();
      console.log('AuthUtils: 登出成功');
      return true;
    } catch (error) {
      console.error('AuthUtils: 登出操作失败', error);
      return false;
    }
  },

  /**
   * 重定向到登录页面
   */
  redirectToLogin() {
    console.log('AuthUtils: 重定向到登录页面');
    window.location.href = 'login.html';
  },

  /**
   * 重定向到主页
   */
  redirectToHome() {
    console.log('AuthUtils: 重定向到主页');
    window.location.href = 'index.html';
  }
};

/**
 * 主要的认证工具对象
 * 提供所有认证相关的功能
 */
const AuthUtils = {
  // Token管理
  getToken: TokenManager.getToken,
  setToken: TokenManager.setToken,
  removeToken: TokenManager.removeToken,
  isTokenValid: TokenManager.isTokenValid,
  
  // 用户信息管理
  getCurrentUser: UserManager.getCurrentUser,
  setCurrentUser: UserManager.setCurrentUser,
  removeCurrentUser: UserManager.removeCurrentUser,
  
  // 认证状态检查
  isLoggedIn: AuthChecker.isLoggedIn,
  getLoginStatus: AuthChecker.getLoginStatus,
  
  // 认证操作
  login: AuthActions.login,
  logout: AuthActions.logout,
  redirectToLogin: AuthActions.redirectToLogin,
  redirectToHome: AuthActions.redirectToHome,
  
  // 调试信息
  debug() {
    const status = AuthChecker.getLoginStatus();
    console.group('AuthUtils Debug Info');
    console.log('登录状态:', status.isLoggedIn);
    console.log('用户信息存在:', status.hasUser);
    console.log('Token存在:', status.hasToken);
    console.log('Token有效:', status.tokenValid);
    console.log('用户信息:', status.user);
    console.log('Token:', status.token ? status.token.substring(0, 20) + '...' : null);
    console.groupEnd();
    return status;
  }
};

// 导出认证工具
if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境
  module.exports = AuthUtils;
} else {
  // 浏览器环境
  window.AuthUtils = AuthUtils;
}

console.log('AuthUtils: 认证工具模块已加载');