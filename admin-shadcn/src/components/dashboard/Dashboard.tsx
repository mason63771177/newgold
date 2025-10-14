import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { 
  userAPI, 
  walletAPI, 
  transactionManagementAPI, 
  systemAPI 
} from '@/services/api';

// 接口定义
interface DashboardStats {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    growthRate: number;
    activeGrowthRate: number;
  } | null;
  walletStats: {
    totalBalance: number;
    balanceGrowthRate: number;
  } | null;
  transactionStats: {
    todayTransactions: number;
    transactionGrowthRate: number;
  } | null;
  systemStats: any | null;
  recentUsers: any[];
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  trend: 'up' | 'down';
  loading: boolean;
}

// 统计卡片组件
const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, trend, loading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground flex items-center">
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {change}
            </span>
            <span className="ml-1">较上月</span>
          </p>
        </>
      )}
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStats>({
    userStats: null,
    walletStats: null,
    transactionStats: null,
    systemStats: null,
    recentUsers: []
  });

  /**
   * 加载仪表盘数据
   */
  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // 并行请求所有数据
      const [userStatsRes, walletStatsRes, transactionStatsRes, systemStatsRes, usersRes] = await Promise.all([
        userAPI.getUserStats().catch((err: any) => ({ success: false, error: err })),
        walletAPI.getWalletStats().catch((err: any) => ({ success: false, error: err })),
        transactionManagementAPI.getTransactionStats().catch((err: any) => ({ success: false, error: err })),
        systemAPI.getSystemStatus().catch((err: any) => ({ success: false, error: err })),
        userAPI.getUsers({ limit: 5, sort: 'createdAt', order: 'desc' }).catch((err: any) => ({ success: false, error: err }))
      ]);

      setDashboardData({
        userStats: userStatsRes.success ? userStatsRes.data : null,
        walletStats: walletStatsRes.success ? walletStatsRes.data : null,
        transactionStats: transactionStatsRes.success ? transactionStatsRes.data : null,
        systemStats: systemStatsRes.success ? systemStatsRes.data : null,
        recentUsers: usersRes.success ? usersRes.data : []
      });

    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  // 格式化数字显示
  const formatNumber = (num: number | undefined | null): string => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // 格式化货币显示
  const formatCurrency = (amount: number | undefined | null): string => {
    if (!amount && amount !== 0) return '0 USDT';
    return `${amount.toLocaleString()} USDT`;
  };

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadDashboardData}
                className="ml-auto"
              >
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片区域 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总用户数"
          value={formatNumber(dashboardData.userStats?.totalUsers)}
          change={`+${dashboardData.userStats?.growthRate || 0}%`}
          icon={Users}
          trend="up"
          loading={loading}
        />
        <StatCard
          title="钱包总余额"
          value={formatCurrency(dashboardData.walletStats?.totalBalance)}
          change={`+${dashboardData.walletStats?.balanceGrowthRate || 0}%`}
          icon={DollarSign}
          trend="up"
          loading={loading}
        />
        <StatCard
          title="活跃用户"
          value={formatNumber(dashboardData.userStats?.activeUsers)}
          change={`+${dashboardData.userStats?.activeGrowthRate || 0}%`}
          icon={Activity}
          trend="up"
          loading={loading}
        />
        <StatCard
          title="今日交易"
          value={formatNumber(dashboardData.transactionStats?.todayTransactions)}
          change={`+${dashboardData.transactionStats?.transactionGrowthRate || 0}%`}
          icon={TrendingUp}
          trend="up"
          loading={loading}
        />
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>数据概览</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              图表组件开发中...
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>
              最新的用户活动记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">加载中...</span>
                </div>
              ) : dashboardData.recentUsers.length > 0 ? (
                dashboardData.recentUsers.slice(0, 5).map((user: any, index: number) => (
                  <div key={user.id || index} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.username || user.name || '未知用户'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email || '无邮箱'}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? '活跃' : '非活跃'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">
                  暂无用户数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};