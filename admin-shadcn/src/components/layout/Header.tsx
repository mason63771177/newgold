import React, { useState } from 'react';
import { Bell, Search, User, Moon, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo, logout } from '../../utils/auth';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
}

/**
 * 顶部导航栏组件
 * @param onToggleSidebar - 切换侧边栏的回调函数
 * @param onToggleTheme - 切换主题的回调函数
 */
export const Header: React.FC<HeaderProps> = ({ onToggleTheme }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userInfo = getUserInfo();

  /**
   * 处理用户登出
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-card border-b px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 搜索框 */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="搜索..."
              className="pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center space-x-4">
          {/* 主题切换 */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Moon size={20} />
          </button>

          {/* 通知 */}
          <button className="p-2 rounded-lg hover:bg-accent transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* 用户菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User size={16} className="text-primary-foreground" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{userInfo?.username || '管理员'}</p>
                <p className="text-xs text-muted-foreground">{userInfo?.email || 'admin@example.com'}</p>
              </div>
            </button>

            {/* 用户下拉菜单 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Settings size={16} className="mr-2" />
                    设置
                  </button>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                  >
                    <LogOut size={16} className="mr-2" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};