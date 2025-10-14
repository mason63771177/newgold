/**
 * 路由守卫组件
 * 用于保护需要权限的路由
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isTokenExpired, hasPermission, hasRole } from '../utils/auth';

/**
 * 受保护的路由组件
 * @param {object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @param {string|array} props.requiredPermissions - 需要的权限
 * @param {string|array} props.requiredRoles - 需要的角色
 * @param {string} props.redirectTo - 重定向路径
 * @returns {React.ReactNode} 路由组件
 */
const ProtectedRoute = ({ 
  children, 
  requiredPermissions = null, 
  requiredRoles = null,
  redirectTo = '/login' 
}) => {
  const location = useLocation();

  // 检查是否已登录
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 检查token是否过期
  if (isTokenExpired()) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 检查权限
  if (requiredPermissions && !hasPermission(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 检查角色
  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;