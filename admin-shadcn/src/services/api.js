/**
 * API服务配置
 * 提供与后端API的统一接口
 */

// API基础配置
const API_BASE_URL = 'http://localhost:3001/api';

// 获取存储的token
const getToken = () => {
  return localStorage.getItem('admin_token');
};

// 通用请求函数
const request = async (url, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// 用户管理API
export const userAPI = {
  // 获取用户列表
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取用户统计
  getUserStats: () => request('/admin/users/stats'),
  
  // 获取单个用户详情
  getUserById: (id) => request(`/admin/users/${id}`),
  
  // 更新用户状态
  updateUserStatus: (id, status) => 
    request(`/user/status`, {
      method: 'PUT',
      body: JSON.stringify({ userId: id, status }),
    }),
  
  // 删除用户
  deleteUser: (id) => 
    request(`/admin/users/${id}`, {
      method: 'DELETE',
    }),
};

// 任务管理API
export const taskAPI = {
  // 获取任务列表
  getTasks: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/tasks${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取任务统计
  getTaskStats: () => request('/tasks/status'),
  
  // 更新任务
  updateTask: (id, taskData) => 
    request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }),
  
  // 删除任务
  deleteTask: (id) => 
    request(`/tasks/${id}`, { method: 'DELETE' }),
  
  // 获取任务记录
  getTaskRecords: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/tasks/records${queryString ? `?${queryString}` : ''}`);
  },
};

// 红包管理API
export const redPacketAPI = {
  // 获取红包配置
  getRedpacketConfig: () => request('/redpacket/status'),
  
  // 更新红包配置
  updateRedpacketConfig: (config) => 
    request('/redpacket/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  
  // 获取红包统计
  getRedpacketStats: () => request('/redpacket/status'),
  
  // 获取红包记录
  getRedpacketRecords: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/redpacket/records${queryString ? `?${queryString}` : ''}`);
  },
  
  // 触发红包
  triggerRedpacket: () => 
    request('/redpacket/grab', {
      method: 'POST',
    }),
};

// 团队管理API
export const teamAPI = {
  // 获取团队统计
  getTeamStats: () => request('/team/info'),
  
  // 获取团队列表
  getTeams: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/team/members${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取团队成员
  getTeamMembers: (teamId) => request(`/team/members`),
  
  // 获取邀请记录
  getInviteRecords: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/team/invite${queryString ? `?${queryString}` : ''}`);
  },
};

// 钱包管理API
export const walletAPI = {
  // 获取钱包统计
  getWalletStats: () => request('/admin/transactions/stats'),
  
  // 获取钱包列表
  getWallets: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/wallet/list${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取钱包详情
  getWalletById: (id) => request(`/wallet/${id}`),
  
  // 更新钱包状态
  updateWalletStatus: (id, status) => 
    request(`/wallet/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  // 获取钱包余额
  getWalletBalance: (address) => request(`/wallet/balance/${address}`),
  
  // 获取钱包交易记录
  getWalletTransactions: (address, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/wallet/transactions/${address}${queryString ? `?${queryString}` : ''}`);
  },
};

// 排行榜管理API
export const rankingAPI = {
  // 获取排行榜数据
  getRankings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/ranking${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取排行榜统计
  getRankingStats: () => request('/ranking'),
};

// 系统设置API
export const systemAPI = {
  // 获取系统配置
  getSystemConfig: () => request('/admin/system/config'),
  
  // 更新系统配置
  updateSystemConfig: (config) => 
    request('/admin/system/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  
  // 获取系统状态
  getSystemStatus: () => request('/admin/system/status'),
  
  // 获取系统日志
  getSystemLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/system/logs${queryString ? `?${queryString}` : ''}`);
  },
};

// 认证API
export const authAPI = {
  // 管理员登录
  login: (credentials) => 
    request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  // 获取验证码
  getCaptcha: () => request('/admin/captcha'),
  
  // 验证token
  verify: () => request('/admin/verify'),
  
  // 登出
  logout: () => 
    request('/admin/logout', {
      method: 'POST',
    }),
};

// 资金归集管理API
export const fundCollectionAPI = {
  // 获取归集统计
  getStatistics: () => request('/admin/fund-collection/statistics'),
  
  // 获取归集历史
  getHistory: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/fund-collection/history${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取可归集钱包
  getConsolidatableWallets: () => request('/admin/fund-collection/consolidatable-wallets'),
  
  // 获取自动归集配置
  getAutoConfig: () => request('/admin/fund-collection/auto-config'),
  
  // 更新自动归集配置
  updateAutoConfig: (config) => 
    request('/admin/fund-collection/auto-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  
  // 执行手动归集
  executeCollection: (data) => 
    request('/admin/fund-collection/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 地址管理API
export const addressManagementAPI = {
  // 获取地址列表
  getAddresses: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/addresses${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取地址统计
  getAddressStats: () => request('/admin/addresses/stats'),
  
  // 添加地址到白名单
  addToWhitelist: (address) => 
    request('/admin/addresses/whitelist', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),
  
  // 从白名单移除地址
  removeFromWhitelist: (address) => 
    request(`/admin/addresses/whitelist/${address}`, {
      method: 'DELETE',
    }),
  
  // 获取白名单
  getWhitelist: () => request('/admin/addresses/whitelist'),
};

// 钱包监控API
export const walletMonitoringAPI = {
  // 获取监控统计
  getMonitoringStats: () => request('/admin/wallet-monitoring/stats'),
  
  // 获取余额趋势
  getBalanceTrends: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/wallet-monitoring/balance-trends${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取监控警报
  getAlerts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/wallet-monitoring/alerts${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取监控配置
  getMonitoringConfig: () => request('/admin/wallet-monitoring/config'),
  
  // 更新监控配置
  updateMonitoringConfig: (config) => 
    request('/admin/wallet-monitoring/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  
  // 解决警报
  resolveAlert: (alertId) => 
    request(`/admin/wallet-monitoring/alerts/${alertId}/resolve`, {
      method: 'PUT',
    }),
};

// 交易管理API
export const transactionManagementAPI = {
  // 获取交易列表
  getTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/transactions${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取交易统计
  getTransactionStats: () => request('/admin/transactions/stats'),
  
  // 获取交易详情
  getTransactionById: (id) => request(`/admin/transactions/${id}`),
  
  // 更新交易状态
  updateTransactionStatus: (id, status) => 
    request(`/admin/transactions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  // 导出交易记录
  exportTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/transactions/export${queryString ? `?${queryString}` : ''}`);
  },
};

// 监控管理API
export const monitoringAPI = {
  // 获取系统监控数据
  getSystemMonitoring: () => request('/admin/monitoring/system'),
  
  // 获取业务监控数据
  getBusinessMonitoring: () => request('/admin/monitoring/business'),
  
  // 获取性能监控数据
  getPerformanceMonitoring: () => request('/admin/monitoring/performance'),
  
  // 获取监控警报
  getMonitoringAlerts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/admin/monitoring/alerts${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取监控配置
  getMonitoringConfig: () => request('/admin/monitoring/config'),
  
  // 更新监控配置
  updateMonitoringConfig: (config) => 
    request('/admin/monitoring/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
};

// 导出默认配置
export default {
  userAPI,
  taskAPI,
  redPacketAPI,
  teamAPI,
  walletAPI,
  rankingAPI,
  systemAPI,
  authAPI,
  fundCollectionAPI,
  addressManagementAPI,
  walletMonitoringAPI,
  transactionManagementAPI,
  monitoringAPI,
};