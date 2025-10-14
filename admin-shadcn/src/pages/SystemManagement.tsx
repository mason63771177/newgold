import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  Server, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  Shield,
  DollarSign,
  Users,
  Clock,
  Bell,
  Settings,
  Eye
} from 'lucide-react';
import { systemAPI } from '@/services/api';

// 定义接口
interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  lastUpdated: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  systemUptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  networkTraffic: number;
}

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  module: string;
  userId?: string;
}

interface SystemAlert {
  id: string;
  type: 'system' | 'security' | 'performance' | 'business';
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

/**
 * 系统管理组件
 * 功能：系统配置、监控、日志管理和告警
 */
const SystemManagement: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    systemUptime: '0天',
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    networkTraffic: 0
  });
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载系统配置
  const loadConfigs = async () => {
    try {
      const response = await systemAPI.getConfigs();
      setConfigs(response.data || []);
    } catch (error) {
      console.error('加载系统配置失败:', error);
      // 使用模拟数据作为后备
      setConfigs([
        {
          id: '1',
          key: 'app.name',
          value: 'Gold7 Game',
          description: '应用程序名称',
          type: 'string',
          category: 'basic',
          lastUpdated: '2024-01-20 16:30:00'
        },
        {
          id: '2',
          key: 'app.version',
          value: '1.0.0',
          description: '应用程序版本',
          type: 'string',
          category: 'basic',
          lastUpdated: '2024-01-20 16:30:00'
        },
        {
          id: '3',
          key: 'redpacket.enabled',
          value: 'true',
          description: '红包功能开关',
          type: 'boolean',
          category: 'feature',
          lastUpdated: '2024-01-20 16:30:00'
        },
        {
          id: '4',
          key: 'redpacket.times',
          value: '["09:00", "12:00", "20:00"]',
          description: '红包发放时间',
          type: 'json',
          category: 'feature',
          lastUpdated: '2024-01-20 16:30:00'
        },
        {
          id: '5',
          key: 'task.max_daily',
          value: '10',
          description: '每日最大任务数',
          type: 'number',
          category: 'task',
          lastUpdated: '2024-01-20 16:30:00'
        },
        {
          id: '6',
          key: 'wallet.min_withdraw',
          value: '10',
          description: '最小提现金额',
          type: 'number',
          category: 'wallet',
          lastUpdated: '2024-01-20 16:30:00'
        },
        {
          id: '7',
          key: 'security.login_attempts',
          value: '5',
          description: '最大登录尝试次数',
          type: 'number',
          category: 'security',
          lastUpdated: '2024-01-20 16:30:00'
        },
        {
          id: '8',
          key: 'notification.enabled',
          value: 'true',
          description: '通知功能开关',
          type: 'boolean',
          category: 'notification',
          lastUpdated: '2024-01-20 16:30:00'
        }
      ]);
    }
  };

  // 加载系统统计
  const loadSystemStats = async () => {
    try {
      const response = await systemAPI.getStats();
      setSystemStats(response.data || systemStats);
    } catch (error) {
      console.error('加载系统统计失败:', error);
      // 使用模拟数据
      setSystemStats({
        totalUsers: 1250,
        activeUsers: 856,
        totalTransactions: 15420,
        systemUptime: '15天 8小时',
        memoryUsage: 68.5,
        cpuUsage: 45.2,
        diskUsage: 72.8,
        networkTraffic: 1024.5
      });
    }
  };

  // 加载系统日志
  const loadSystemLogs = async () => {
    try {
      const response = await systemAPI.getLogs();
      setSystemLogs(response.data || []);
    } catch (error) {
      console.error('加载系统日志失败:', error);
      // 使用模拟数据
      setSystemLogs([
        {
          id: '1',
          level: 'info',
          message: '用户 user001 成功登录',
          timestamp: '2024-01-20 16:30:15',
          module: 'auth',
          userId: 'U001'
        },
        {
          id: '2',
          level: 'warning',
          message: '红包抢夺并发量过高',
          timestamp: '2024-01-20 16:25:30',
          module: 'redpacket'
        },
        {
          id: '3',
          level: 'error',
          message: '数据库连接超时',
          timestamp: '2024-01-20 16:20:45',
          module: 'database'
        },
        {
          id: '4',
          level: 'info',
          message: '系统配置更新成功',
          timestamp: '2024-01-20 16:15:20',
          module: 'system'
        },
        {
          id: '5',
          level: 'debug',
          message: 'API调用统计: /api/users - 1250次',
          timestamp: '2024-01-20 16:10:10',
          module: 'api'
        }
      ]);
    }
  };

  // 加载系统告警
  const loadSystemAlerts = async () => {
    try {
      const response = await systemAPI.getAlerts();
      setSystemAlerts(response.data || []);
    } catch (error) {
      console.error('加载系统告警失败:', error);
      // 使用模拟数据
      setSystemAlerts([
        {
          id: '1',
          type: 'performance',
          level: 'high',
          title: 'CPU使用率过高',
          message: 'CPU使用率达到85%，建议检查系统负载',
          timestamp: '2024-01-20 16:30:00',
          resolved: false
        },
        {
          id: '2',
          type: 'security',
          level: 'medium',
          title: '异常登录尝试',
          message: '检测到来自异常IP的多次登录尝试',
          timestamp: '2024-01-20 16:25:00',
          resolved: false
        },
        {
          id: '3',
          type: 'business',
          level: 'low',
          title: '红包余额不足',
          message: '红包池余额低于预警线',
          timestamp: '2024-01-20 16:20:00',
          resolved: true
        }
      ]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadConfigs(),
        loadSystemStats(),
        loadSystemLogs(),
        loadSystemAlerts()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // 解决告警
  const handleResolveAlert = async (alertId: string) => {
    try {
      await systemAPI.resolveAlert(alertId);
      await loadSystemAlerts();
    } catch (error) {
      console.error('解决告警失败:', error);
    }
  };

  // 获取日志级别样式
  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">错误</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">警告</Badge>;
      case 'info':
        return <Badge variant="default">信息</Badge>;
      case 'debug':
        return <Badge variant="outline">调试</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // 获取告警级别样式
  const getAlertLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">严重</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">高</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">中</Badge>;
      case 'low':
        return <Badge variant="outline">低</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // 获取告警类型图标
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Server className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'performance':
        return <Activity className="w-4 h-4" />;
      case 'business':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // 格式化配置值显示
  const formatConfigValue = (config: SystemConfig) => {
    if (config.type === 'boolean') {
      return config.value === 'true' ? '启用' : '禁用';
    } else if (config.type === 'json') {
      try {
        return JSON.stringify(JSON.parse(config.value), null, 2);
      } catch {
        return config.value;
      }
    }
    return config.value;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系统管理</h1>
          <p className="text-muted-foreground">
            系统配置、监控、日志管理和告警处理
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 系统统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              活跃用户: {systemStats.activeUsers.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统运行时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemStats.systemUptime}</div>
            <p className="text-xs text-muted-foreground">
              稳定运行中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU使用率</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${systemStats.cpuUsage > 80 ? 'text-red-600' : systemStats.cpuUsage > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
              {systemStats.cpuUsage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              内存: {systemStats.memoryUsage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">磁盘使用率</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${systemStats.diskUsage > 90 ? 'text-red-600' : systemStats.diskUsage > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
              {systemStats.diskUsage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              网络流量: {systemStats.networkTraffic.toFixed(1)} MB/s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 系统告警 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            系统告警
          </CardTitle>
          <CardDescription>
            系统运行状态告警和异常提醒
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemAlerts.filter(alert => !alert.resolved).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                系统运行正常，暂无告警
              </div>
            ) : (
              <div className="space-y-3">
                {systemAlerts.filter(alert => !alert.resolved).map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${alert.level === 'critical' || alert.level === 'high' ? 'border-red-200 bg-red-50' : alert.level === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertTypeIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-medium">
                            {alert.title}
                            {getAlertLevelBadge(alert.level)}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {alert.message}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {alert.timestamp}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        解决
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 系统配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            系统配置
          </CardTitle>
          <CardDescription>
            系统参数配置和功能开关管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>配置项</TableHead>
                    <TableHead>当前值</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>最后更新</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.key}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {formatConfigValue(config)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {config.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{config.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {config.lastUpdated}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => console.log('查看配置:', config)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 系统日志 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            系统日志
          </CardTitle>
          <CardDescription>
            系统运行日志和操作记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>级别</TableHead>
                  <TableHead>模块</TableHead>
                  <TableHead>消息</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {getLogLevelBadge(log.level)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.module}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {log.message}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.userId || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemManagement;