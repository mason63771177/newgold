import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { DataTable } from './DataTable';
import { SalesChart, UserGrowthChart, DeviceChart } from './Charts';

/**
 * 统计卡片组件
 */
const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}> = ({ title, value, change, icon }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
};

/**
 * 模拟用户数据
 */
const mockUsers = [
  {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    role: '管理员',
    status: 'active' as const,
    lastLogin: '2024-01-15 10:30',
  },
  {
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    role: '编辑',
    status: 'active' as const,
    lastLogin: '2024-01-14 16:45',
  },
  {
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    role: '用户',
    status: 'inactive' as const,
    lastLogin: '2024-01-10 09:15',
  },
  {
    id: 4,
    name: '赵六',
    email: 'zhaoliu@example.com',
    role: '编辑',
    status: 'active' as const,
    lastLogin: '2024-01-15 14:20',
  },
];

/**
 * 仪表板主组件
 */
export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 统计卡片区域 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总用户数"
          value="2,350"
          change="+20.1% 较上月"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="订单数量"
          value="1,234"
          change="+15.3% 较上月"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="总收入"
          value="¥45,231"
          change="+12.5% 较上月"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="增长率"
          value="12.5%"
          change="+2.1% 较上月"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* 图表区域 */}
      <div className="grid gap-6 md:grid-cols-2">
        <SalesChart />
        <UserGrowthChart />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <DataTable title="用户管理" data={mockUsers} />
        </div>
        <DeviceChart />
      </div>

      {/* 最近活动 */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  新用户注册
                </p>
                <p className="text-sm text-muted-foreground">
                  2分钟前
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  订单完成
                </p>
                <p className="text-sm text-muted-foreground">
                  5分钟前
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  系统更新
                </p>
                <p className="text-sm text-muted-foreground">
                  1小时前
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};