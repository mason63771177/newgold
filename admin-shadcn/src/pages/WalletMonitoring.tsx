import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Wallet,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { walletMonitoringAPI } from '@/services/api';

/**
 * 钱包监控管理页面
 * 提供钱包余额监控、告警管理、趋势分析等功能
 */
const WalletMonitoring: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalWallets: 0,
    activeWallets: 0,
    totalBalance: 0,
    alertCount: 0,
    lowBalanceCount: 0,
    highRiskCount: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  // const [monitoringConfig, setMonitoringConfig] = useState({
  //   lowBalanceThreshold: 0.1,
  //   highBalanceThreshold: 1000,
  //   alertEnabled: true,
  //   checkInterval: 300
  // });

  // 筛选和分页状态
  const [alertFilter, setAlertFilter] = useState({
    status: 'all',
    level: 'all',
    dateRange: 'all'
  });
  const [currentPage] = useState(1);
  const [pageSize] = useState(10);

  /**
   * 加载监控统计数据
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await walletMonitoringAPI.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载告警列表
   */
  const loadAlerts = async () => {
    try {
      const response = await walletMonitoringAPI.getAlerts({
        page: currentPage,
        pageSize,
        ...alertFilter
      });
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('加载告警列表失败:', error);
    }
  };

  /**
   * 加载监控配置
   */
  const loadConfig = async () => {
    try {
      const response = await walletMonitoringAPI.getMonitoringConfig();
      if (response.success) {
        // setMonitoringConfig(response.data);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // /**
  //  * 更新监控配置
  //  */
  // const updateConfig = async (config: any) => {
  //   try {
  //     const response = await walletMonitoringAPI.updateMonitoringConfig(config);
  //     if (response.success) {
  //       setMonitoringConfig(config);
  //       alert('配置更新成功');
  //     }
  //   } catch (error) {
  //     console.error('更新配置失败:', error);
  //     alert('配置更新失败');
  //   }
  // };

  /**
   * 处理告警
   */
  const handleAlert = async (alertId: string, action: string) => {
    try {
      if (action === 'resolve') {
        const response = await walletMonitoringAPI.resolveAlert(alertId);
        if (response.success) {
          loadAlerts();
          alert('告警已解决');
        }
      } else {
        // 对于其他操作，暂时只显示提示
        alert(`操作 ${action} 暂未实现`);
      }
    } catch (error) {
      console.error('处理告警失败:', error);
      alert('操作失败');
    }
  };

  /**
   * 获取告警级别颜色
   */
  const getAlertLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  /**
   * 获取告警状态颜色
   */
  const getAlertStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800',
      ignored: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadStatistics();
    loadAlerts();
    loadConfig();
  }, [currentPage, alertFilter]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">钱包监控管理</h1>
          <p className="text-muted-foreground">
            监控钱包余额变化，管理告警信息
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadStatistics} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            监控配置
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总钱包数</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalWallets}</div>
            <p className="text-xs text-muted-foreground">
              活跃钱包: {statistics.activeWallets}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总余额</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalBalance.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              ETH
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">告警数量</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.alertCount}</div>
            <p className="text-xs text-muted-foreground">
              待处理告警
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">风险钱包</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.highRiskCount}</div>
            <p className="text-xs text-muted-foreground">
              低余额: {statistics.lowBalanceCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 告警列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>告警列表</CardTitle>
              <CardDescription>
                查看和处理钱包监控告警
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={alertFilter.status}
                onValueChange={(value) => setAlertFilter({...alertFilter, status: value})}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                  <SelectItem value="ignored">已忽略</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={alertFilter.level}
                onValueChange={(value) => setAlertFilter({...alertFilter, level: value})}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="级别筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部级别</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="critical">严重</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>钱包地址</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>级别</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(alert.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {alert.walletAddress?.slice(0, 10)}...
                  </TableCell>
                  <TableCell>{alert.type}</TableCell>
                  <TableCell>
                    <Badge className={getAlertLevelColor(alert.level)}>
                      {alert.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAlertStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {alert.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAlert(alert.id, 'resolve')}
                        disabled={alert.status === 'resolved'}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAlert(alert.id, 'ignore')}
                        disabled={alert.status === 'ignored'}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletMonitoring;