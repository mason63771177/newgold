import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { TaskManagement } from './pages/TaskManagement';
import { TeamManagement } from './pages/TeamManagement';
import { RedPacketManagement } from './pages/RedPacketManagement';
import { WalletManagement } from './pages/WalletManagement';
import { RankingManagement } from './pages/RankingManagement';
import { SystemSettings } from './pages/SystemSettings';
import { BreadcrumbContainer } from './components/ui/breadcrumb';
import './App.css';

/**
 * 主应用组件
 */
function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  /**
   * 切换侧边栏折叠状态
   */
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <Router>
      <div className="flex h-screen bg-background">
        {/* 侧边栏 */}
        <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 头部 */}
          <Header 
            onToggleSidebar={toggleSidebar}
            onToggleTheme={toggleTheme}
          />
          
          {/* 页面内容 */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
            <div className="container mx-auto px-6 py-8">
              <BreadcrumbContainer />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/tasks" element={<TaskManagement />} />
                <Route path="/teams" element={<TeamManagement />} />
                <Route path="/redpackets" element={<RedPacketManagement />} />
                <Route path="/wallets" element={<WalletManagement />} />
                <Route path="/rankings" element={<RankingManagement />} />
                <Route path="/settings" element={<SystemSettings />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
