import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Search, TrendingUp, DollarSign, ArrowUpDown, RefreshCw, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { walletAPI } from '@/services/api';

// 定义接口
interface WalletRecord {
  id: string;
  userId: string;
  username: string;
  walletAddress: string;
  balance: number;
  frozenBalance: number;
  totalDeposit: number;
  totalWithdraw: number;
  lastActivity: string;
  status: string; // 改为string类型以匹配API
}

interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: string; // 改为string类型以匹配API
  amount: number;
  fee: number;
  status: string; // 改为string类型以匹配API
  txHash?: string;
  createdAt: string;
  completedAt?: string;
}

interface WithdrawRecord {
  id: string;
  username: string;
  walletAddress: string;
  toAddress: string;
  amount: number;
  fee: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  applyTime: string;
  processTime?: string;
  txHash?: string;
  remark?: string;
}

interface WalletStats {
  totalBalance: number;
  totalFrozen: number;
  totalDeposit: number;
  totalWithdraw: number;
  pendingWithdraw: number;
  activeWallets: number;
  totalWallets: number;
  totalWithdrawToday: number;
  pendingWithdraws: number;
  avgBalance: number;
}

/**
 * 钱包管理页面组件
 * 管理用户钱包地址、余额、提现记录
 */
const WalletManagement: React.FC = () => {
  // const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletInfos, setWalletInfos] = useState<WalletRecord[]>([
    {
      id: '1',
      userId: 'U001',
      username: 'user001',
      walletAddress: 'TXYzAbc123def456ghi789jkl012mno345pqr678',
      balance: 50.50,
      frozenBalance: 0,
      totalDeposit: 100.00, // 单次充值100USDT
      totalWithdraw: 49.50,
      lastActivity: '2024-01-20 14:25:00',
      status: 'active'
    },
    {
      id: '2',
      userId: 'U002',
      username: 'user002',
      walletAddress: 'TXYzDef456ghi789jkl012mno345pqr678stu901',
      balance: 180.25,
      frozenBalance: 0,
      totalDeposit: 200.00, // 2次充值，每次100USDT
      totalWithdraw: 19.75,
      lastActivity: '2024-01-20 11:40:00',
      status: 'active'
    },
    {
      id: '3',
      userId: 'U003',
      username: 'user003',
      walletAddress: 'TXYzGhi789jkl012mno345pqr678stu901vwx234',
      balance: 0.00,
      frozenBalance: 0,
      totalDeposit: 100.00, // 单次充值100USDT
      totalWithdraw: 100.00,
      lastActivity: '2024-01-19 08:30:00',
      status: 'frozen'
    },
    {
      id: '4',
      userId: 'U004',
      username: 'user004',
      walletAddress: 'TXYzJkl012mno345pqr678stu901vwx234yz567',
      balance: 220.00,
      frozenBalance: 0,
      totalDeposit: 300.00, // 3次充值，每次100USDT
      totalWithdraw: 80.00,
      lastActivity: '2024-01-20 16:10:00',
      status: 'active'
    },
    {
      id: '5',
      userId: 'U005',
      username: 'user005',
      walletAddress: 'TXYzMno345pqr678stu901vwx234yz567abc890',
      balance: 350.30,
      frozenBalance: 0,
      totalDeposit: 400.00, // 4次充值，每次100USDT
      totalWithdraw: 49.70,
      lastActivity: '2024-01-20 12:55:00',
      status: 'active'
    }
  ]);

  // 提现记录数据
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([
    {
      id: '1',
      username: 'user001',
      walletAddress: 'TXYzAbc123def456ghi789jkl012mno345pqr678',
      toAddress: 'TRX7NfcYkHGRGvyQcdsoCpb4D7KqiHLBZH',
      amount: 100.00,
      fee: 1.00,
      status: 'completed',
      applyTime: '2024-01-20 10:30:00',
      processTime: '2024-01-20 10:35:00',
      txHash: '0x1234567890abcdef1234567890abcdef12345678',
      remark: '提现成功'
    },
    {
      id: '2',
      username: 'user002',
      walletAddress: 'TXYzDef456ghi789jkl012mno345pqr678stu901',
      toAddress: 'TRX8OfcYkHGRGvyQcdsoCpb4D7KqiHLBZI',
      amount: 50.00,
      fee: 1.00,
      status: 'pending',
      applyTime: '2024-01-20 14:20:00',
      remark: '等待处理'
    },
    {
      id: '3',
      username: 'user003',
      walletAddress: 'TXYzGhi789jkl012mno345pqr678stu901vwx234',
      toAddress: 'TRX9PfcYkHGRGvyQcdsoCpb4D7KqiHLBZJ',
      amount: 200.00,
      fee: 1.00,
      status: 'processing',
      applyTime: '2024-01-20 13:15:00',
      remark: '处理中'
    },
    {
      id: '4',
      username: 'user004',
      walletAddress: 'TXYzJkl012mno345pqr678stu901vwx234yz567',
      toAddress: 'TRX0QfcYkHGRGvyQcdsoCpb4D7KqiHLBZK',
      amount: 75.00,
      fee: 1.00,
      status: 'failed',
      applyTime: '2024-01-20 09:45:00',
      processTime: '2024-01-20 09:50:00',
      remark: '网络异常，提现失败'
    },
    {
      id: '5',
      username: 'user005',
      walletAddress: 'TXYzMno345pqr678stu901vwx234yz567abc890',
      toAddress: 'TRX1RfcYkHGRGvyQcdsoCpb4D7KqiHLBZL',
      amount: 30.00,
      fee: 1.00,
      status: 'rejected',
      applyTime: '2024-01-20 08:30:00',
      processTime: '2024-01-20 08:35:00',
      remark: '风控拒绝'
    }
  ]);

  const [walletStats, setWalletStats] = useState<WalletStats>({
    totalBalance: 0,
    totalFrozen: 0,
    totalDeposit: 0,
    totalWithdraw: 0,
    pendingWithdraw: 0,
    activeWallets: 0,
    totalWallets: 156,
    totalWithdrawToday: 500.00,
    pendingWithdraws: 8,
    avgBalance: 100.00
  });
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState('all');

  // 加载钱包数据
  const loadWallets = async () => {
    try {
      const response = await walletAPI.getWallets();
      // setWallets(response.data || []);
      setWalletInfos(response.data || []);
    } catch (error) {
      console.error('加载钱包数据失败:', error);
      // 使用现有模拟数据作为后备
    }
  };

  // 加载交易记录
  const loadTransactions = async () => {
    try {
      const response = await walletAPI.getTransactions();
      setTransactions(response.data || []);
    } catch (error) {
      console.error('加载交易记录失败:', error);
      // 使用模拟数据作为后备
      setTransactions([
        {
          id: 'T001',
          userId: 'U001',
          username: 'user001',
          type: 'deposit',
          amount: 100.00,
          fee: 0,
          status: 'completed',
          txHash: '0xabc123...',
          createdAt: '2024-01-15 10:00:00',
          completedAt: '2024-01-15 10:05:00'
        }
      ]);
    }
  };

  // 加载钱包统计
  const loadWalletStats = async () => {
    try {
      const response = await walletAPI.getStats();
      setWalletStats((response.data as WalletStats) || walletStats);
    } catch (error) {
      console.error('加载钱包统计失败:', error);
      // 计算统计数据
      const totalBalance = walletInfos.reduce((sum, wallet) => sum + wallet.balance, 0);
      const totalDeposit = walletInfos.reduce((sum, wallet) => sum + wallet.totalDeposit, 0);
      const totalWithdraw = walletInfos.reduce((sum, wallet) => sum + wallet.totalWithdraw, 0);
      setWalletStats({
        ...walletStats,
        totalBalance,
        totalDeposit,
        totalWithdraw,
        activeWallets: walletInfos.filter(w => w.status === 'active').length
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadWallets(),
        loadTransactions(),
        loadWalletStats()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  /**
   * 获取钱包状态徽章样式
   */
  const getWalletStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">正常</Badge>;
      case 'frozen':
        return <Badge variant="destructive">冻结</Badge>;
      case 'suspended':
        return <Badge variant="secondary">暂停</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  /**
   * 获取提现状态徽章样式
   */
  const getWithdrawStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />待处理</Badge>;
      case 'processing':
        return <Badge variant="default"><TrendingUp className="h-3 w-3 mr-1" />处理中</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />已完成</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />失败</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />拒绝</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  /**
   * 过滤钱包信息
   */
  const filteredWallets = walletInfos.filter(wallet => {
    const matchesSearch = wallet.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wallet.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wallet.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  /**
   * 筛选交易
   */
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.txHash && transaction.txHash.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  /**
   * 过滤提现记录
   */
  const filteredWithdraws = withdrawRecords.filter(record => {
    const matchesSearch = record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = withdrawStatusFilter === 'all' || record.status === withdrawStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 格式化金额
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: 'default' as const, text: '正常' },
      frozen: { variant: 'secondary' as const, text: '冻结' },
      suspended: { variant: 'destructive' as const, text: '暂停' },
      pending: { variant: 'secondary' as const, text: '处理中' },
      completed: { variant: 'default' as const, text: '已完成' },
      failed: { variant: 'destructive' as const, text: '失败' },
      cancelled: { variant: 'outline' as const, text: '已取消' }
    };
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  /**
   * 获取交易类型徽章
   */
  const getTypeBadge = (type: string) => {
    const typeMap = {
      deposit: { variant: 'default' as const, text: '充值' },
      withdraw: { variant: 'secondary' as const, text: '提现' },
      transfer: { variant: 'outline' as const, text: '转账' },
      reward: { variant: 'default' as const, text: '奖励' }
    };
    const config = typeMap[type as keyof typeof typeMap] || { variant: 'outline' as const, text: type };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  /**
   * 处理提现审核
   */
  const handleWithdrawAction = (recordId: string, action: 'approve' | 'reject') => {
    setWithdrawRecords(records =>
      records.map(record =>
        record.id === recordId
          ? {
              ...record,
              status: action === 'approve' ? 'processing' : 'rejected',
              processTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
              remark: action === 'approve' ? '审核通过，处理中' : '审核拒绝'
            }
          : record
      )
    );
  };

  /**
   * 查看钱包详情
   */
  const handleViewWalletDetails = (walletId: string) => {
    console.log('查看钱包详情:', walletId);
    // 这里应该打开钱包详情弹窗或跳转到详情页面
  };

  /**
   * 查看提现详情
   */
  const handleViewWithdrawDetails = (recordId: string) => {
    console.log('查看提现详情:', recordId);
    // 这里应该打开提现详情弹窗或跳转到详情页面
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">钱包管理</h1>
          <p className="text-muted-foreground">
            管理用户钱包地址、余额、提现记录
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总余额</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(walletStats.totalBalance)} USDT</div>
            <p className="text-xs text-muted-foreground">
              冻结: {formatAmount(walletStats.totalFrozen || 0)} USDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">充值/提现</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatAmount(walletStats.totalDeposit)}</div>
            <p className="text-xs text-muted-foreground">
              提现: -{formatAmount(walletStats.totalWithdraw)} USDT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃钱包</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{walletStats.activeWallets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              待处理提现: {formatAmount(walletStats.pendingWithdraw || 0)} USDT
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 钱包列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            钱包列表
          </CardTitle>
          <CardDescription>
            管理用户钱包信息和余额
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户名或钱包地址..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="frozen">冻结</SelectItem>
                  <SelectItem value="suspended">暂停</SelectItem>
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
                      <TableHead>用户名</TableHead>
                      <TableHead>钱包地址</TableHead>
                      <TableHead>余额 (USDT)</TableHead>
                      <TableHead>总充值 (USDT)</TableHead>
                      <TableHead>总提现 (USDT)</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWallets.map((wallet) => (
                      <TableRow key={wallet.id}>
                        <TableCell className="font-medium">{wallet.username}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {wallet.walletAddress.slice(0, 10)}...{wallet.walletAddress.slice(-8)}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {wallet.balance.toFixed(2)}
                        </TableCell>
                        <TableCell>{wallet.totalDeposit.toFixed(2)}</TableCell>
                        <TableCell>{wallet.totalWithdraw.toFixed(2)}</TableCell>
                        <TableCell>{getWalletStatusBadge(wallet.status)}</TableCell>
                        <TableCell>{wallet.lastActivity}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewWalletDetails(wallet.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredWallets.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                没有找到符合条件的钱包记录
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 交易记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            交易记录
          </CardTitle>
          <CardDescription>
            查看所有钱包交易记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户名、用户ID或交易哈希..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="类型" />
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易ID</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>手续费</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>交易哈希</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>完成时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.username}</div>
                          <div className="text-sm text-muted-foreground">{transaction.userId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                      <TableCell className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'deposit' ? '+' : '-'}{formatAmount(transaction.amount)} USDT
                      </TableCell>
                      <TableCell>{formatAmount(transaction.fee)} USDT</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.txHash || '-'}
                      </TableCell>
                      <TableCell>{transaction.createdAt}</TableCell>
                      <TableCell>{transaction.completedAt || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                没有找到符合条件的交易记录
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 提现记录 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>提现记录</CardTitle>
            <Select value={withdrawStatusFilter} onValueChange={setWithdrawStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="rejected">拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>提现地址</TableHead>
                  <TableHead>金额 (USDT)</TableHead>
                  <TableHead>手续费 (USDT)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdraws.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.username}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.toAddress.slice(0, 10)}...{record.toAddress.slice(-8)}
                    </TableCell>
                    <TableCell className="font-bold text-red-600">
                      -{record.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{record.fee.toFixed(2)}</TableCell>
                    <TableCell>{getWithdrawStatusBadge(record.status)}</TableCell>
                    <TableCell>{record.applyTime}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.remark}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewWithdrawDetails(record.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {record.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleWithdrawAction(record.id, 'approve')}
                            >
                              通过
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleWithdrawAction(record.id, 'reject')}
                            >
                              拒绝
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredWithdraws.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的提现记录
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { WalletManagement };
export default WalletManagement;