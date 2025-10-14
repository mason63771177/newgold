import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  CheckSquare,
  Users2,
  Gift,
  Wallet,
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * 侧边栏组件 - 提供导航菜单和折叠功能
 */
export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: '仪表盘', path: '/' },
    { icon: Users, label: '用户管理', path: '/users' },
    { icon: CheckSquare, label: '任务管理', path: '/tasks' },
    { icon: Users2, label: '团队管理', path: '/teams' },
    { icon: Gift, label: '红包管理', path: '/redpackets' },
    { icon: Wallet, label: '钱包管理', path: '/wallets' },
    { icon: Trophy, label: '排行榜管理', path: '/rankings' },
    { icon: Settings, label: '系统设置', path: '/settings' },
  ];

  /**
   * 检查当前路径是否为活动状态
   */
  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`bg-card border-r transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-foreground">管理系统</h1>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors group ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  }`}
                >
                  <item.icon 
                    size={20} 
                    className={`${
                      isActive 
                        ? 'text-primary-foreground' 
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`} 
                  />
                  {!isCollapsed && (
                    <span className={`ml-3 text-sm font-medium ${
                      isActive 
                        ? 'text-primary-foreground' 
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};