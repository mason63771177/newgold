import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Settings, 
  ArrowUpRight, 
  ArrowDownRight,
  Percent,
  Calculator,
  CreditCard
} from 'lucide-react';

/**
 * 手续费配置接口
 */
interface FeeConfig {
  id: string;
  type: string;
  name: string;
  fixedFee: number; // 固定手续费（USDT）
  percentageRate: number; // 百分比费率
  minPercentageRate?: number; // 最小百分比费率
  maxPercentageRate?: number; // 最大百分比费率
  status: 'active' | 'inactive';
  updatedAt: string;
}

/**
 * 利润数据接口
 */
interface ProfitData {
  period: string;
  totalRevenue: number;
  totalFees: number;
  netProfit: number;
  profitMargin: number;
  transactionCount: number;
}

/**
 * 利润转账记录接口
 */
interface ProfitTransfer {
  id: string;
  amount: number;
  toAddress: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  txHash?: string;
}

/**
 * 手续费利润管理页面组件
 * 提供手续费配置、利润分析和利润转账管理功能
 */
const FeeManagement: React.FC = () => {
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [profitTransfers, setProfitTransfers] = useState<ProfitTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<FeeConfig | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');

  /**
   * 初始化页面数据
   */
  useEffect(() => {
    loadFeeConfigs();
    loadProfitData();
    loadProfitTransfers();
  }, []);

  /**
   * 加载手续费配置
   */
  const loadFeeConfigs = async () => {
    try {
      // 根据项目真实的手续费规则配置 - 只有提现手续费
      const mockConfigs: FeeConfig[] = [
        {
          id: '1',
          type: 'withdrawal',
          name: '提现手续费',
          fixedFee: 2.0, // 固定手续费 2 USDT
          percentageRate: 0.01, // 默认百分比费率 1%
          minPercentageRate: 0.01, // 最小百分比费率 1%
          maxPercentageRate: 0.05, // 最大百分比费率 5%
          status: 'active',
          updatedAt: '2024-01-15 10:30:00'
        }
      ];
      setFeeConfigs(mockConfigs);
    } catch (error) {
      console.error('加载手续费配置失败:', error);
    }
  };

  /**
   * 加载利润数据
   */
  const loadProfitData = async () => {
    try {
      // 模拟API调用
      const mockProfitData: ProfitData[] = [
        {
          period: '今日',
          totalRevenue: 12580.50,
          totalFees: 315.20,
          netProfit: 12265.30,
          profitMargin: 97.49,
          transactionCount: 1250
        },
        {
          period: '本周',
          totalRevenue: 85420.80,
          totalFees: 2136.05,
          netProfit: 83284.75,
          profitMargin: 97.50,
          transactionCount: 8540
        },
        {
          period: '本月',
          totalRevenue: 342680.90,
          totalFees: 8567.02,
          netProfit: 334113.88,
          profitMargin: 97.50,
          transactionCount: 34268
        }
      ];
      setProfitData(mockProfitData);
    } catch (error) {
      console.error('加载利润数据失败:', error);
    }
  };

  /**
   * 加载利润转账记录
   */
  const loadProfitTransfers = async () => {
    try {
      // 模拟API调用
      const mockTransfers: ProfitTransfer[] = [
        {
          id: '1',
          amount: 50000,
          toAddress: '0x1234...5678',
          status: 'completed',
          createdAt: '2024-01-15 14:30:00',
          txHash: '0xabcd...efgh'
        },
        {
          id: '2',
          amount: 25000,
          toAddress: '0x9876...5432',
          status: 'pending',
          createdAt: '2024-01-15 13:15:00'
        },
        {
          id: '3',
          amount: 75000,
          toAddress: '0x5555...7777',
          status: 'failed',
          createdAt: '2024-01-15 12:00:00'
        }
      ];
      setProfitTransfers(mockTransfers);
      setLoading(false);
    } catch (error) {
      console.error('加载利润转账记录失败:', error);
      setLoading(false);
    }
  };

  /**
   * 更新手续费配置
   */
  const updateFeeConfig = async (config: FeeConfig) => {
    try {
      // 模拟API调用
      console.log('更新手续费配置:', config);
      await loadFeeConfigs();
    } catch (error) {
      console.error('更新手续费配置失败:', error);
    }
  };

  /**
   * 执行利润转账
   */
  const executeProfitTransfer = async () => {
    if (!transferAmount || !transferAddress) {
      alert('请填写转账金额和地址');
      return;
    }

    try {
      // 模拟API调用
      const newTransfer: ProfitTransfer = {
        id: Date.now().toString(),
        amount: parseFloat(transferAmount),
        toAddress: transferAddress,
        status: 'pending',
        createdAt: new Date().toLocaleString()
      };
      
      setProfitTransfers(prev => [newTransfer, ...prev]);
      setTransferAmount('');
      setTransferAddress('');
      
      console.log('执行利润转账:', newTransfer);
    } catch (error) {
      console.error('执行利润转账失败:', error);
    }
  };

  /**
   * 获取状态徽章样式
   */
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: '启用', variant: 'default' as const },
      inactive: { label: '禁用', variant: 'secondary' as const },
      pending: { label: '处理中', variant: 'default' as const },
      completed: { label: '已完成', variant: 'default' as const },
      failed: { label: '失败', variant: 'destructive' as const }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">手续费利润管理</h1>
        <Button onClick={() => window.location.reload()}>
          刷新数据
        </Button>
      </div>

      <Tabs defaultValue="profit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profit">利润分析</TabsTrigger>
          <TabsTrigger value="config">手续费配置</TabsTrigger>
          <TabsTrigger value="transfer">利润转账</TabsTrigger>
        </TabsList>

        <TabsContent value="profit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profitData.map((data, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{data.period}利润</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      ${data.netProfit.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>总收入:</span>
                        <span>${data.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>手续费:</span>
                        <span>${data.totalFees.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>利润率:</span>
                        <span>{data.profitMargin}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>交易数:</span>
                        <span>{data.transactionCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                手续费配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feeConfigs.map((config) => (
                  <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{config.name}</h3>
                        {getStatusBadge(config.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        固定费用: ${config.fixedFee} USDT | 
                        百分比费率: {(config.percentageRate * 100).toFixed(2)}%
                        {config.minPercentageRate && config.maxPercentageRate && 
                          ` (${(config.minPercentageRate * 100).toFixed(1)}%-${(config.maxPercentageRate * 100).toFixed(1)}%)`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        更新时间: {config.updatedAt}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedConfig(config)}
                      >
                        编辑
                      </Button>
                      <Button 
                        variant={config.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => updateFeeConfig({
                          ...config,
                          status: config.status === 'active' ? 'inactive' : 'active'
                        })}
                      >
                        {config.status === 'active' ? '禁用' : '启用'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                利润转账
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">转账金额</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="请输入转账金额"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">接收地址</Label>
                  <Input
                    id="address"
                    placeholder="请输入钱包地址"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={executeProfitTransfer} className="mb-6">
                执行转账
              </Button>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">转账记录</h3>
                {profitTransfers.map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${transfer.amount.toLocaleString()}</span>
                        {getStatusBadge(transfer.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        接收地址: {transfer.toAddress}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        创建时间: {transfer.createdAt}
                      </div>
                      {transfer.txHash && (
                        <div className="text-xs text-muted-foreground">
                          交易哈希: {transfer.txHash}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {transfer.status === 'completed' && (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      )}
                      {transfer.status === 'failed' && (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeeManagement;