import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  RefreshCw, 
  Settings,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield
} from 'lucide-react';

/**
 * API监控管理页面组件
 * 提供API调用统计、速率限制管理、性能分析等功能
 */
const ApiMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // 模拟API统计数据
  const [apiStats, setApiStats] = useState({
    totalRequests: 125847,
    successRate: 99.2,
    avgResponseTime: 245,
    errorCount: 1006,
    rateLimitHits: 23,
    activeConnections: 156
  });

  // 模拟API端点数据
  const [apiEndpoints, setApiEndpoints] = useState([
    {
      id: 1,
      endpoint: '/api/v1/users',
      method: 'GET',
      requests: 45623,
      successRate: 99.8,
      avgResponseTime: 120,
      errors: 91,
      status: 'healthy'
    },
    {
      id: 2,
      endpoint: '/api/v1/wallets',
      method: 'POST',
      requests: 32145,
      successRate: 98.5,
      avgResponseTime: 340,
      errors: 482,
      status: 'warning'
    },
    {
      id: 3,
      endpoint: '/api/v1/transactions',
      method: 'GET',
      requests: 28934,
      successRate: 99.9,
      avgResponseTime: 89,
      errors: 29,
      status: 'healthy'
    },
    {
      id: 4,
      endpoint: '/api/v1/redpackets',
      method: 'POST',
      requests: 19145,
      successRate: 97.2,
      avgResponseTime: 567,
      errors: 536,
      status: 'critical'
    }
  ]);

  // 模拟速率限制规则
  const [rateLimitRules, setRateLimitRules] = useState([
    {
      id: 1,
      name: '用户API限制',
      endpoint: '/api/v1/users/*',
      limit: 1000,
      window: '1小时',
      currentUsage: 756,
      status: 'active'
    },
    {
      id: 2,
      name: '钱包操作限制',
      endpoint: '/api/v1/wallets/*',
      limit: 500,
      window: '1小时',
      currentUsage: 423,
      status: 'active'
    },
    {
      id: 3,
      name: '交易查询限制',
      endpoint: '/api/v1/transactions/*',
      limit: 2000,
      window: '1小时',
      currentUsage: 1834,
      status: 'warning'
    }
  ]);

  // 模拟性能指标
  const [performanceMetrics, setPerformanceMetrics] = useState([
    {
      time: '00:00',
      requests: 1250,
      responseTime: 234,
      errorRate: 0.8
    },
    {
      time: '04:00',
      requests: 890,
      responseTime: 198,
      errorRate: 0.5
    },
    {
      time: '08:00',
      requests: 2340,
      responseTime: 267,
      errorRate: 1.2
    },
    {
      time: '12:00',
      requests: 3450,
      responseTime: 312,
      errorRate: 1.8
    },
    {
      time: '16:00',
      requests: 2890,
      responseTime: 289,
      errorRate: 1.1
    },
    {
      time: '20:00',
      requests: 1980,
      responseTime: 245,
      errorRate: 0.9
    }
  ]);

  /**
   * 刷新数据
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    // 模拟API调用
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  /**
   * 获取状态徽章变体
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API监控管理</h1>
          <p className="text-muted-foreground">
            监控API调用统计、管理速率限制、分析性能指标
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1小时</SelectItem>
              <SelectItem value="24h">24小时</SelectItem>
              <SelectItem value="7d">7天</SelectItem>
              <SelectItem value="30d">30天</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            配置
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总请求数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiStats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12.5% 较昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +0.3% 较昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiStats.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -15ms 较昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错误数量</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiStats.errorCount}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -23 较昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">限流触发</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiStats.rateLimitHits}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +5 较昨日
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃连接</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiStats.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              实时连接数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">API端点</TabsTrigger>
          <TabsTrigger value="ratelimit">速率限制</TabsTrigger>
          <TabsTrigger value="performance">性能分析</TabsTrigger>
        </TabsList>

        {/* API端点监控 */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API端点监控</CardTitle>
              <CardDescription>
                查看各API端点的调用统计和性能指标
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 搜索和筛选 */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="搜索API端点..."
                    className="max-w-sm"
                  />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="healthy">健康</SelectItem>
                      <SelectItem value="warning">警告</SelectItem>
                      <SelectItem value="critical">严重</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* API端点表格 */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>端点</TableHead>
                      <TableHead>方法</TableHead>
                      <TableHead>请求数</TableHead>
                      <TableHead>成功率</TableHead>
                      <TableHead>平均响应时间</TableHead>
                      <TableHead>错误数</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiEndpoints.map((endpoint) => (
                      <TableRow key={endpoint.id}>
                        <TableCell className="font-mono text-sm">
                          {endpoint.endpoint}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{endpoint.method}</Badge>
                        </TableCell>
                        <TableCell>{endpoint.requests.toLocaleString()}</TableCell>
                        <TableCell>{endpoint.successRate}%</TableCell>
                        <TableCell>{endpoint.avgResponseTime}ms</TableCell>
                        <TableCell>{endpoint.errors}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(endpoint.status)}`} />
                            <Badge variant={getStatusVariant(endpoint.status)}>
                              {endpoint.status === 'healthy' ? '健康' : 
                               endpoint.status === 'warning' ? '警告' : '严重'}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 速率限制管理 */}
        <TabsContent value="ratelimit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>速率限制规则</CardTitle>
              <CardDescription>
                管理API速率限制规则和监控使用情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Input
                    placeholder="搜索限制规则..."
                    className="max-w-sm"
                  />
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    添加规则
                  </Button>
                </div>

                <div className="space-y-4">
                  {rateLimitRules.map((rule) => (
                    <Card key={rule.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{rule.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {rule.endpoint}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span>限制: {rule.limit} 请求/{rule.window}</span>
                              <Badge variant={rule.status === 'warning' ? 'secondary' : 'default'}>
                                {rule.status === 'active' ? '活跃' : '警告'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-sm text-muted-foreground">
                              使用情况: {rule.currentUsage}/{rule.limit}
                            </div>
                            <Progress 
                              value={(rule.currentUsage / rule.limit) * 100} 
                              className="w-32"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 性能分析 */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>性能趋势分析</CardTitle>
              <CardDescription>
                查看API性能指标的历史趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    性能数据每5分钟更新一次，显示过去{selectedTimeRange}的趋势
                  </AlertDescription>
                </Alert>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>请求数</TableHead>
                      <TableHead>平均响应时间</TableHead>
                      <TableHead>错误率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceMetrics.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell>{metric.time}</TableCell>
                        <TableCell>{metric.requests.toLocaleString()}</TableCell>
                        <TableCell>{metric.responseTime}ms</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{metric.errorRate}%</span>
                            {metric.errorRate > 1.5 && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiMonitoring;