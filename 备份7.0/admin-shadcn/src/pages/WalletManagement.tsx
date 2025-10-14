import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Wallet, DollarSign, TrendingUp, TrendingDown, Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

// 钱包信息类型定义
interface WalletInfo {
  id: string;
  username: string;
  walletAddress: string;
  balance: number;
  totalDeposit: number;
  totalWithdraw: number;
  status: 'active' | 'frozen' | 'suspended';
  createTime: string;
  lastTransactionTime: string;
}

// 提现记录类型定义
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

// 钱包统计类型定义
interface WalletStats {
  totalWallets: number;
  activeWallets: number;
  totalBalance: number;
  totalWithdrawToday: number;
  pendingWithdraws: number;
  avgBalance: number;
}

/**
 * 钱包管理页面组件
 * 管理用户钱包地址、余额、提现记录
 */
const WalletManagement: React.FC = () => {
  // 钱包信息数据 - 修正为符合业务规则：玩家只能充值100USDT
  const [walletInfos, setWalletInfos] = useState<WalletInfo[]>([
    {
      id: '1',
      username: 'user001',
      walletAddress: 'TXYzAbc123def456ghi789jkl012mno345pqr678',
      balance: 50.50,
      totalDeposit: 100.00, // 单次充值100USDT
      totalWithdraw: 49.50,
      status: 'active',
      createTime: '2024-01-15 10:30:00',
      lastTransactionTime: '2024-01-20 14:25:00'
    },
    {
      id: '2',
      username: 'user002',
      walletAddress: 'TXYzDef456ghi789jkl012mno345pqr678stu901',
      balance: 180.25,
      totalDeposit: 200.00, // 2次充值，每次100USDT
      totalWithdraw: 19.75,
      status: 'active',
      createTime: '2024-01-16 09:15:00',
      lastTransactionTime: '2024-01-20 11:40:00'
    },
    {
      id: '3',
      username: 'user003',
      walletAddress: 'TXYzGhi789jkl012mno345pqr678stu901vwx234',
      balance: 0.00,
      totalDeposit: 100.00, // 单次充值100USDT
      totalWithdraw: 100.00,
      status: 'frozen',
      createTime: '2024-01-17 16:20:00',
      lastTransactionTime: '2024-01-19 08:30:00'
    },
    {
      id: '4',
      username: 'user004',
      walletAddress: 'TXYzJkl012mno345pqr678stu901vwx234yz567',
      balance: 220.00,
      totalDeposit: 300.00, // 3次充值，每次100USDT
      totalWithdraw: 80.00,
      status: 'active',
      createTime: '2024-01-18 13:45:00',
      lastTransactionTime: '2024-01-20 16:10:00'
    },
    {
      id: '5',
      username: 'user005',
      walletAddress: 'TXYzMno345pqr678stu901vwx234yz567abc890',
      balance: 350.30,
      totalDeposit: 400.00, // 4次充值，每次100USDT
      totalWithdraw: 49.70,
      status: 'active',
      createTime: '2024-01-19 11:00:00',
      lastTransactionTime: '2024-01-20 12:55:00'
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

  const [walletStats] = useState<WalletStats>({
    totalWallets: 156,
    activeWallets: 134,
    totalBalance: 15600.00, // 调整为合理的总余额（156个钱包 * 平均100USDT）
    totalWithdrawToday: 500.00, // 调整为合理的今日提现金额
    pendingWithdraws: 8,
    avgBalance: 100.00 // 调整为符合业务规则的平均余额
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState('all');

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
   * 过滤提现记录
   */
  const filteredWithdraws = withdrawRecords.filter(record => {
    const matchesSearch = record.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = withdrawStatusFilter === 'all' || record.status === withdrawStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      </div>

      {/* 钱包统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">钱包总数</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{walletStats.totalWallets}</div>
            <p className="text-xs text-muted-foreground">
              活跃钱包: {walletStats.activeWallets}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总余额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{walletStats.totalBalance.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">
              平均余额: {walletStats.avgBalance.toFixed(2)} USDT
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日提现</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{walletStats.totalWithdrawToday.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">
              待处理: {walletStats.pendingWithdraws} 笔
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理提现</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{walletStats.pendingWithdraws}</div>
            <p className="text-xs text-muted-foreground">
              需要审核的提现申请
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 钱包信息列表 */}
      <Card>
        <CardHeader>
          <CardTitle>钱包信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="frozen">冻结</SelectItem>
                <SelectItem value="suspended">暂停</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                    <TableCell>{wallet.createTime}</TableCell>
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

          {filteredWallets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的钱包信息
            </div>
          )}
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