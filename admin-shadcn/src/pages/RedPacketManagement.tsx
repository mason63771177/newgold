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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Gift,
  DollarSign,
  Users,
  Activity,
  Calendar
} from 'lucide-react';
import { redPacketAPI } from '../services/api';
import type { RedPacketConfig, RedPacketStats, RedPacketRecord } from '../services/api.d';

/**
 * 红包管理页面
 * 提供红包配置查看、创建、编辑、删除等功能
 */
const RedPacketManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<RedPacketStats>({
    totalConfigs: 0,
    activeConfigs: 0,
    totalAmount: 0,
    claimedAmount: 0
  });
  const [configs, setConfigs] = useState<RedPacketConfig[]>([]);
  const [records, setRecords] = useState<RedPacketRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'configs' | 'records'>('configs');

  // 筛选和分页状态
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * 加载红包统计数据
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await redPacketAPI.getStats();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('加载红包统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载红包配置列表
   */
  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await redPacketAPI.getConfigs();
      if (response.success) {
        setConfigs(response.data || []);
        setTotalPages(Math.ceil((response.data?.length || 0) / pageSize));
      }
    } catch (error) {
      console.error('加载红包配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载红包记录列表
   */
  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await redPacketAPI.getRecords();
      if (response.success) {
        setRecords(response.data || []);
      }
    } catch (error) {
      console.error('加载红包记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除红包配置
   */
  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('确定要删除这个红包配置吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await redPacketAPI.deleteConfig(configId);
      if (response.success) {
        await loadConfigs();
        await loadStatistics();
      }
    } catch (error) {
      console.error('删除红包配置失败:', error);
    }
  };

  /**
   * 获取红包状态徽章
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">进行中</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">已完成</Badge>;
      case 'paused':
        return <Badge variant="secondary">已暂停</Badge>;
      case 'expired':
        return <Badge variant="destructive">已过期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  /**
   * 处理状态筛选
   */
  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status });
    setCurrentPage(1);
  };

  /**
   * 格式化时间
   */
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadStatistics();
    if (activeTab === 'configs') {
      loadConfigs();
    } else {
      loadRecords();
    }
  }, [activeTab, currentPage, filters]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">红包管理</h1>
          <p className="text-muted-foreground">
            管理红包配置和查看领取记录
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadStatistics} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            创建红包
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总配置数</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalConfigs}</div>
            <p className="text-xs text-muted-foreground">
              活跃: {statistics.activeConfigs}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总金额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAmount.toFixed(4)} USDT</div>
            <p className="text-xs text-muted-foreground">
              已发放红包总额
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已领取</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.claimedAmount.toFixed(4)} USDT</div>
            <p className="text-xs text-muted-foreground">
              领取率: {statistics.totalAmount > 0 ? ((statistics.claimedAmount / statistics.totalAmount) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃配置</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeConfigs}</div>
            <p className="text-xs text-muted-foreground">
              正在进行的红包
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 标签页切换 */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'configs' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('configs')}
        >
          红包配置
        </Button>
        <Button
          variant={activeTab === 'records' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('records')}
        >
          领取记录
        </Button>
      </div>

      {/* 红包配置列表 */}
      {activeTab === 'configs' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>红包配置</CardTitle>
                <CardDescription>
                  查看和管理红包配置
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索红包名称..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={filters.status} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="paused">已暂停</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">加载中...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>配置ID</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead>总金额</TableHead>
                      <TableHead>红包数量</TableHead>
                      <TableHead>单个范围</TableHead>
                      <TableHead>时间范围</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.id}</TableCell>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell>{config.totalAmount.toFixed(4)} USDT</TableCell>
                        <TableCell>{config.count}</TableCell>
                        <TableCell>
                          {config.minAmount.toFixed(4)} - {config.maxAmount.toFixed(4)} USDT
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{formatDateTime(config.startTime)}</div>
                          <div className="text-muted-foreground">至 {formatDateTime(config.endTime)}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(config.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteConfig(config.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {configs.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                没有找到符合条件的红包配置
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 领取记录列表 */}
      {activeTab === 'records' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>领取记录</CardTitle>
                <CardDescription>
                  查看用户红包领取记录
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">加载中...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>记录ID</TableHead>
                      <TableHead>用户ID</TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>领取金额</TableHead>
                      <TableHead>领取时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell>{record.userId}</TableCell>
                        <TableCell className="font-medium">{record.username}</TableCell>
                        <TableCell>{record.amount.toFixed(4)} USDT</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(record.claimedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {records.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                没有找到红包领取记录
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          第 {currentPage} 页，共 {totalPages} 页
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RedPacketManagement;