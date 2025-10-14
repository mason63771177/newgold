/**
 * 认证工具函数
 * 提供token管理、权限验证等功能
 */

// Token存储键名
const TOKEN_KEY = 'adminToken';
const USER_INFO_KEY = 'adminUser';

/**
 * 获取存储的token
 * @returns {string|null} token值
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 设置token
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 移除token
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};

/**
 * 获取用户信息
 * @returns {object|null} 用户信息对象
 */
export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

/**
 * 设置用户信息
 * @param {object} userInfo - 用户信息对象
 */
export const setUserInfo = (userInfo) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

/**
 * 检查token是否过期
 * @returns {boolean} token是否过期
 */
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;
  
  try {
    // 解析JWT token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Token解析失败:', error);
    return true;
  }
};

/**
 * 检查用户权限
 * @param {string|array} requiredPermissions - 需要的权限
 * @returns {boolean} 是否有权限
 */
export const hasPermission = (requiredPermissions) => {
  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.permissions) return false;
  
  const userPermissions = userInfo.permissions;
  
  // 如果是字符串，转换为数组
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  // 检查是否有所需权限
  return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * 检查用户角色
 * @param {string|array} requiredRoles - 需要的角色
 * @returns {boolean} 是否有角色
 */
export const hasRole = (requiredRoles) => {
  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.role) return false;
  
  const userRole = userInfo.role;
  
  // 如果是字符串，转换为数组
  const roles = Array.isArray(requiredRoles) 
    ? requiredRoles 
    : [requiredRoles];
  
  // 检查是否有所需角色
  return roles.includes(userRole);
};

/**
 * 登出用户
 */
export const logout = () => {
  removeToken();
  // 重定向到登录页
  window.location.href = '/login';
};

/**
 * 权限常量
 */
export const PERMISSIONS = {
  // 用户管理
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  // 任务管理
  TASK_VIEW: 'task:view',
  TASK_EDIT: 'task:edit',
  TASK_DELETE: 'task:delete',
  
  // 团队管理
  TEAM_VIEW: 'team:view',
  TEAM_EDIT: 'team:edit',
  
  // 红包管理
  REDPACKET_VIEW: 'redpacket:view',
  REDPACKET_EDIT: 'redpacket:edit',
  REDPACKET_TRIGGER: 'redpacket:trigger',
  
  // 钱包管理
  WALLET_VIEW: 'wallet:view',
  WALLET_EDIT: 'wallet:edit',
  
  // 系统管理
  SYSTEM_VIEW: 'system:view',
  SYSTEM_EDIT: 'system:edit',
  
  // 权限管理
  PERMISSION_VIEW: 'permission:view',
  PERMISSION_EDIT: 'permission:edit',
};

/**
 * 角色常量
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};