import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Wallet, 
  History, 
  Settings, 
  Play, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { fundCollectionAPI } from '@/services/api';

/**
 * 资金归集统计接口
 */
interface FundCollectionStats {
  totalBalance: number;
  consolidatableAmount: number;
  todayCollected: number;
  totalWallets: number;
  activeWallets: number;
  lastCollectionTime: string;
}

/**
 * 归集历史记录接口
 */
interface CollectionHistory {
  id: string;
  fromWallets: string[];
  toWallet: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  txHash?: string;
  errorMessage?: string;
}

/**
 * 可归集钱包接口
 */
interface ConsolidatableWallet {
  id: string;
  address: string;
  balance: number;
  currency: string;
  network: string;
  lastActivity: string;
  isSelected: boolean;
}

/**
 * 自动归集配置接口
 */
interface AutoCollectionConfig {
  enabled: boolean;
  minAmount: number;
  schedule: string;
  targetWallet: string;
  excludeWallets: string[];
}

/**
 * 资金归集管理页面
 */
const FundCollection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FundCollectionStats>({
    totalBalance: 0,
    consolidatableAmount: 0,
    todayCollected: 0,
    totalWallets: 0,
    activeWallets: 0,
    lastCollectionTime: ''
  });
  const [history, setHistory] = useState<CollectionHistory[]>([]);
  const [consolidatableWallets, setConsolidatableWallets] = useState<ConsolidatableWallet[]>([]);
  const [autoConfig, setAutoConfig] = useState<AutoCollectionConfig>({
    enabled: false,
    minAmount: 0.01,
    schedule: '0 2 * * *',
    targetWallet: '',
    excludeWallets: []
  });
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  /**
   * 加载统计数据
   */
  const loadStatistics = async () => {
    try {
      const response = await fundCollectionAPI.getStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 使用模拟数据
      setStats({
        totalBalance: 125.67,
        consolidatableAmount: 45.23,
        todayCollected: 12.34,
        totalWallets: 156,
        activeWallets: 89,
        lastCollectionTime: '2024-01-15 14:30:00'
      });
    }
  };

  /**
   * 加载归集历史
   */
  const loadHistory = async () => {
    try {
      const response = await fundCollectionAPI.getHistory();
      if (response.success) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('加载归集历史失败:', error);
      // 使用模拟数据
      setHistory([
        {
          id: '1',
          fromWallets: ['0x123...abc', '0x456...def'],
          toWallet: '0x789...ghi',
          amount: 12.34,
          currency: 'USDT',
          status: 'completed',
          createdAt: '2024-01-15 14:30:00',
          completedAt: '2024-01-15 14:32:15',
          txHash: '0xabc123...'
        },
        {
          id: '2',
          fromWallets: ['0x111...222'],
          toWallet: '0x789...ghi',
          amount: 5.67,
          currency: 'USDT',
          status: 'pending',
          createdAt: '2024-01-15 15:00:00'
        }
      ]);
    }
  };

  /**
   * 加载可归集钱包
   */
  const loadConsolidatableWallets = async () => {
    try {
      const response = await fundCollectionAPI.getConsolidatableWallets();
      if (response.success) {
        setConsolidatableWallets(response.data);
      }
    } catch (error) {
      console.error('加载可归集钱包失败:', error);
      // 使用模拟数据
      setConsolidatableWallets([
        {
          id: '1',
          address: '0x123...abc',
          balance: 15.67,
          currency: 'USDT',
          network: 'TRC20',
          lastActivity: '2024-01-15 12:00:00',
          isSelected: false
        },
        {
          id: '2',
          address: '0x456...def',
          balance: 29.56,
          currency: 'USDT',
          network: 'TRC20',
          lastActivity: '2024-01-15 10:30:00',
          isSelected: false
        }
      ]);
    }
  };

  /**
   * 加载自动归集配置
   */
  const loadAutoConfig = async () => {
    try {
      // const response = await fundCollectionAPI.getAutoConfig();
      // if (response.success) {
      //   setAutoConfig(response.data);
      // }
    } catch (error) {
      console.error('加载自动归集配置失败:', error);
    }
  };

  /**
   * 执行手动归集
   */
  const handleManualCollection = async () => {
    if (selectedWallets.length === 0) {
      alert('请选择要归集的钱包');
      return;
    }

    setLoading(true);
    try {
      const response = await fundCollectionAPI.executeCollection({
        walletIds: selectedWallets,
        targetWallet: autoConfig.targetWallet
      });
      
      if (response.success) {
        alert('归集任务已启动');
        loadHistory();
        loadStatistics();
        setSelectedWallets([]);
      }
    } catch (error) {
      console.error('执行归集失败:', error);
      alert('执行归集失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 保存自动归集配置
   */
  const handleSaveConfig = async () => {
    try {
      const response = await fundCollectionAPI.updateAutoConfig(autoConfig);
      if (response.success) {
        alert('配置保存成功');
        setShowConfig(false);
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败');
    }
  };

  /**
   * 切换钱包选择状态
   */
  const toggleWalletSelection = (walletId: string) => {
    setSelectedWallets(prev => 
      prev.includes(walletId) 
        ? prev.filter(id => id !== walletId)
        : [...prev, walletId]
    );
  };

  /**
   * 获取状态徽章
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />已完成</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />处理中</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />失败</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  useEffect(() => {
    loadStatistics();
    loadHistory();
    loadConsolidatableWallets();
    loadAutoConfig();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">资金归集管理</h1>
          <p className="text-gray-600 mt-2">管理钱包资金的自动和手动归集</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfig(!showConfig)}>
            <Settings className="w-4 h-4 mr-2" />
            配置
          </Button>
          <Button onClick={() => {
            loadStatistics();
            loadHistory();
            loadConsolidatableWallets();
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总余额</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              活跃钱包: {stats.activeWallets}/{stats.totalWallets}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可归集金额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.consolidatableAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              等待归集的资金
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日已归集</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todayCollected.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              最后归集: {stats.lastCollectionTime}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 自动归集配置 */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>自动归集配置</CardTitle>
            <CardDescription>设置自动归集的参数和规则</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>启用自动归集</Label>
                <Select 
                  value={autoConfig.enabled ? 'true' : 'false'}
                  onValueChange={(value) => setAutoConfig({...autoConfig, enabled: value === 'true'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">启用</SelectItem>
                    <SelectItem value="false">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>最小归集金额</Label>
                <Input
                  type="number"
                  value={autoConfig.minAmount}
                  onChange={(e) => setAutoConfig({...autoConfig, minAmount: parseFloat(e.target.value)})}
                  placeholder="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>执行计划 (Cron)</Label>
                <Input
                  value={autoConfig.schedule}
                  onChange={(e) => setAutoConfig({...autoConfig, schedule: e.target.value})}
                  placeholder="0 2 * * *"
                />
              </div>
              <div className="space-y-2">
                <Label>目标钱包</Label>
                <Input
                  value={autoConfig.targetWallet}
                  onChange={(e) => setAutoConfig({...autoConfig, targetWallet: e.target.value})}
                  placeholder="0x..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfig(false)}>
                取消
              </Button>
              <Button onClick={handleSaveConfig}>
                保存配置
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 可归集钱包 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>可归集钱包</CardTitle>
              <CardDescription>选择要归集的钱包地址</CardDescription>
            </div>
            <Button 
              onClick={handleManualCollection}
              disabled={loading || selectedWallets.length === 0}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              执行归集
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">选择</TableHead>
                <TableHead>钱包地址</TableHead>
                <TableHead>余额</TableHead>
                <TableHead>网络</TableHead>
                <TableHead>最后活动</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consolidatableWallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedWallets.includes(wallet.id)}
                      onChange={() => toggleWalletSelection(wallet.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-mono">{wallet.address}</TableCell>
                  <TableCell>{wallet.balance.toFixed(4)} {wallet.currency}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{wallet.network}</Badge>
                  </TableCell>
                  <TableCell>{wallet.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 归集历史 */}
      <Card>
        <CardHeader>
          <CardTitle>归集历史</CardTitle>
          <CardDescription>查看资金归集的历史记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>来源钱包</TableHead>
                <TableHead>目标钱包</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>完成时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="space-y-1">
                      {record.fromWallets.map((wallet, index) => (
                        <div key={index} className="font-mono text-sm">{wallet}</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{record.toWallet}</TableCell>
                  <TableCell>{record.amount.toFixed(4)} {record.currency}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>{record.createdAt}</TableCell>
                  <TableCell>{record.completedAt || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FundCollection;