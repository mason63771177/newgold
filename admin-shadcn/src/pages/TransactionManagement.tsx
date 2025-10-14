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
  Download,
  RefreshCw,
  Eye,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import { transactionManagementAPI } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { globalApiCache } from '@/hooks/useApiCache';

/**
 * 交易管理页面
 * 提供交易记录查看、状态管理、重试等功能
 */
const TransactionManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    totalAmount: 0,
    totalFees: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  // const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // 筛选和分页状态
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // 防抖处理搜索关键词，避免频繁API调用
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  /**
   * 加载交易统计数据
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const cacheKey = globalApiCache.generateKey('/api/admin/transactions/stats');
      const response = await globalApiCache.withCache(
        () => transactionManagementAPI.getStatistics(),
        cacheKey
      );
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
   * 加载交易列表
   */
  const loadTransactions = async () => {
    try {
      const response = await transactionManagementAPI.getTransactions({
        page: currentPage,
        pageSize,
        status: filters.status,
        type: filters.type,
        dateRange: filters.dateRange,
        search: debouncedSearchTerm // 使用防抖后的搜索关键词
      });
      if (response.success) {
        if (Array.isArray(response.data)) {
          setTransactions(response.data);
          setTotalPages(1);
        } else {
          setTransactions((response.data as any).records || []);
          setTotalPages((response.data as any).totalPages || 1);
        }
      }
    } catch (error) {
      console.error('加载交易列表失败:', error);
    }
  };

  /**
   * 查看交易详情
   */
  const viewTransactionDetail = async (transactionId: string) => {
    try {
      const response = await transactionManagementAPI.getTransactionDetail(transactionId);
      if (response.success) {
        // setSelectedTransaction(response.data);
        alert('交易详情已加载');
      }
    } catch (error) {
      console.error('加载交易详情失败:', error);
      alert('加载详情失败');
    }
  };

  /**
   * 更新交易状态
   */
  const updateTransactionStatus = async (transactionId: string, status: string) => {
    try {
      const response = await transactionManagementAPI.updateTransactionStatus(transactionId, status);
      if (response.success) {
        loadTransactions();
        loadStatistics();
        alert('状态更新成功');
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('状态更新失败');
    }
  };

  /**
   * 重试交易
   */
  const retryTransaction = async (transactionId: string) => {
    try {
      const response = await transactionManagementAPI.retryTransaction(transactionId);
      if (response.success) {
        loadTransactions();
        loadStatistics();
        alert('交易重试成功');
      }
    } catch (error) {
      console.error('重试交易失败:', error);
      alert('重试失败');
    }
  };

  /**
   * 导出交易记录
   */
  const exportTransactions = async () => {
    try {
      const response = await transactionManagementAPI.exportTransactions(filters);
      if (response.success) {
        alert('导出成功');
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败');
    }
  };

  /**
   * 获取交易状态颜色
   */
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  /**
   * 获取交易类型颜色
   */
  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      deposit: 'bg-blue-100 text-blue-800',
      withdraw: 'bg-orange-100 text-orange-800',
      transfer: 'bg-purple-100 text-purple-800',
      reward: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  // 页面初始加载时获取统计数据
  useEffect(() => {
    loadStatistics();
  }, []);

  // 当页码、筛选条件或防抖搜索关键词变化时重新加载交易列表
  useEffect(() => {
    loadTransactions();
  }, [currentPage, filters.status, filters.type, filters.dateRange, debouncedSearchTerm]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">交易管理</h1>
          <p className="text-muted-foreground">
            查看和管理所有交易记录
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadStatistics} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="mr-2 h-4 w-4" />
            导出记录
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总交易数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              成功: {statistics.successfulTransactions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">交易金额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAmount.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              USDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败交易</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.failedTransactions}</div>
            <p className="text-xs text-muted-foreground">
              需要处理
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">
              手续费: {statistics.totalFees.toFixed(4)} USDT
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 交易列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>交易记录</CardTitle>
              <CardDescription>
                查看和管理所有交易记录
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索交易..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({...filters, type: value})}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="类型筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="deposit">充值</SelectItem>
                  <SelectItem value="withdraw">提现</SelectItem>
                  <SelectItem value="transfer">转账</SelectItem>
                  <SelectItem value="reward">奖励</SelectItem>
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
                <TableHead>用户</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>手续费</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>交易哈希</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{transaction.username || transaction.userId}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {transaction.amount?.toFixed(4)} USDT
                  </TableCell>
                  <TableCell className="font-mono">
                    {transaction.fee?.toFixed(4)} USDT
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {transaction.txHash ? (
                      <span>{transaction.txHash.slice(0, 10)}...</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewTransactionDetail(transaction.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {transaction.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryTransaction(transaction.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {transaction.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTransactionStatus(transaction.id, 'success')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTransactionStatus(transaction.id, 'cancelled')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页 */}
          <div className="flex items-center justify-between mt-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionManagement;