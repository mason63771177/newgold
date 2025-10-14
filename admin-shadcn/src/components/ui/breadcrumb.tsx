import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// 面包屑项目类型定义
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

// 面包屑组件属性
interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

/**
 * 面包屑导航组件
 * 显示当前页面的导航路径
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />,
  className = ''
}) => {
  const location = useLocation();

  // 根据当前路径自动生成面包屑
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: '首页',
        href: '/',
        icon: <Home className="h-4 w-4" />
      }
    ];

    // 路径映射
    const pathMap: { [key: string]: string } = {
      'dashboard': '仪表板',
      'users': '用户管理',
      'orders': '订单管理',
      'products': '产品管理',
      'settings': '系统设置'
    };

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = pathMap[segment] || segment;
      
      breadcrumbs.push({
        label,
        href: index === pathSegments.length - 1 ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  return (
    <nav className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="flex items-center">
              {separator}
            </span>
          )}
          <div className="flex items-center space-x-1">
            {item.icon && (
              <span className="flex items-center">
                {item.icon}
              </span>
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">
                {item.label}
              </span>
            )}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
};

/**
 * 面包屑容器组件
 * 提供标准的面包屑布局
 */
export const BreadcrumbContainer: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`mb-6 ${className}`}>
      <Breadcrumb />
      {children}
    </div>
  );
};