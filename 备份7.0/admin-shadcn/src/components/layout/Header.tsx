import React from 'react';
import { Bell, Search, User, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
}

/**
 * 顶部导航栏组件
 * @param isDark - 是否为暗色主题
 * @param onThemeToggle - 切换主题的回调函数
 */
export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleTheme }) => {
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
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User size={16} className="text-primary-foreground" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">管理员</p>
              <p className="text-xs text-muted-foreground">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};