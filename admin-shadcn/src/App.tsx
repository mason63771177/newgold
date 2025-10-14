import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import UserManagement from './pages/UserManagement';
import TaskManagement from './pages/TaskManagement';
import TeamManagement from './pages/TeamManagement';
import RedPacketManagement from './pages/RedPacketManagement';
import WalletManagement from './pages/WalletManagement';
import RankingManagement from './pages/RankingManagement';
import { SystemSettings } from './pages/SystemSettings';
import PermissionManagement from './pages/PermissionManagement';
import FundCollection from './pages/FundCollection';
import AddressManagement from './pages/AddressManagement';
import WalletMonitoring from './pages/WalletMonitoring';
import TransactionManagement from './pages/TransactionManagement';
import RealtimeCommunication from './pages/RealtimeCommunication';
import ApiMonitoring from './pages/ApiMonitoring';
import FeeManagement from './pages/FeeManagement';
import SystemConfig from './pages/SystemConfig';
import BlockchainIntegration from './pages/BlockchainIntegration';
import DataQuality from './pages/DataQuality';
import { BreadcrumbContainer } from './components/ui/breadcrumb';
import './App.css';

// 模拟权限检查组件
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredPermission?: string }> = ({ 
  children, 
  requiredPermission 
}) => {
  // 这里应该实现真实的权限检查逻辑
  return <>{children}</>;
};

// 模拟未授权页面组件
const Unauthorized: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">访问被拒绝</h1>
        <p className="text-gray-600 mt-2">您没有权限访问此页面</p>
      </div>
    </div>
  );
};

/**
 * 主应用组件
 */
function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 从localStorage恢复侧边栏状态
  useEffect(() => {
    const savedState = localStorage.getItem('admin_sidebar_collapsed');
    if (savedState) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // 切换侧边栏状态
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('admin_sidebar_collapsed', JSON.stringify(newState));
  };

  // 切换主题（占位函数）
  const toggleTheme = () => {
    // 主题切换逻辑
  };

  return (
    <Router>
      <div className="app">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <div className="main-wrapper">
          <Header onToggleSidebar={toggleSidebar} onToggleTheme={toggleTheme} />
          <main className="content">
            <BreadcrumbContainer />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={
                <ProtectedRoute requiredPermission="USER_MANAGEMENT">
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute requiredPermission="TASK_MANAGEMENT">
                  <TaskManagement />
                </ProtectedRoute>
              } />
              <Route path="/teams" element={
                <ProtectedRoute requiredPermission="TEAM_MANAGEMENT">
                  <TeamManagement />
                </ProtectedRoute>
              } />
              <Route path="/redpackets" element={
                <ProtectedRoute requiredPermission="REDPACKET_MANAGEMENT">
                  <RedPacketManagement />
                </ProtectedRoute>
              } />
              <Route path="/permissions" element={
                <ProtectedRoute requiredPermission="PERMISSION_MANAGEMENT">
                  <PermissionManagement />
                </ProtectedRoute>
              } />
              <Route path="/wallets" element={
                <ProtectedRoute requiredPermission="WALLET_MANAGEMENT">
                  <WalletManagement />
                </ProtectedRoute>
              } />
              <Route path="/rankings" element={
                <ProtectedRoute requiredPermission="RANKING_MANAGEMENT">
                  <RankingManagement />
                </ProtectedRoute>
              } />
              <Route path="/fund-collection" element={
                <ProtectedRoute requiredPermission="FUND_MANAGEMENT">
                  <FundCollection />
                </ProtectedRoute>
              } />
              <Route path="/address-management" element={
                <ProtectedRoute requiredPermission="ADDRESS_MANAGEMENT">
                  <AddressManagement />
                </ProtectedRoute>
              } />
              <Route path="/wallet-monitoring" element={
                <ProtectedRoute requiredPermission="WALLET_MONITORING">
                  <WalletMonitoring />
                </ProtectedRoute>
              } />
              <Route path="/transaction-management" element={
                <ProtectedRoute requiredPermission="TRANSACTION_MANAGEMENT">
                  <TransactionManagement />
                </ProtectedRoute>
              } />
              <Route path="/realtime-communication" element={
                <ProtectedRoute requiredPermission="SYSTEM_MANAGEMENT">
                  <RealtimeCommunication />
                </ProtectedRoute>
              } />
              <Route path="/api-monitoring" element={
                <ProtectedRoute requiredPermission="SYSTEM_MANAGEMENT">
                  <ApiMonitoring />
                </ProtectedRoute>
              } />
              <Route path="/fee-management" element={
                <ProtectedRoute requiredPermission="SYSTEM_MANAGEMENT">
                  <FeeManagement />
                </ProtectedRoute>
              } />
              <Route path="/system-config" element={
                <ProtectedRoute requiredPermission="SYSTEM_MANAGEMENT">
                  <SystemConfig />
                </ProtectedRoute>
              } />
              <Route path="/blockchain-integration" element={
                <ProtectedRoute requiredPermission="SYSTEM_MANAGEMENT">
                  <BlockchainIntegration />
                </ProtectedRoute>
              } />
              <Route path="/data-quality" element={
                <ProtectedRoute requiredPermission="SYSTEM_MANAGEMENT">
                  <DataQuality />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute requiredPermission="SYSTEM_SETTINGS">
                  <SystemSettings />
                </ProtectedRoute>
              } />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
