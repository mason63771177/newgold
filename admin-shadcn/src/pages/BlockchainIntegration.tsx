import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { 
  Link, 
  Activity, 
  Shield, 
  Webhook,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Eye,
  Trash2,
  Plus,
  ExternalLink,
  Clock,
  TrendingUp,
  Database
} from 'lucide-react';

/**
 * API监控数据接口
 */
interface ApiMonitorData {
  id: string;
  endpoint: string;
  method: string;
  status: 'active' | 'inactive' | 'error';
  responseTime: number;
  successRate: number;
  lastCall: string;
  totalCalls: number;
  errorCount: number;
}

/**
 * 区块链交易验证接口
 */
interface BlockchainTransaction {
  id: string;
  txHash: string;
  blockchain: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  fromAddress: string;
  toAddress: string;
  confirmations: number;
  requiredConfirmations: number;
  timestamp: string;
  gasUsed?: string;
  gasFee?: string;
}

/**
 * Webhook配置接口
 */
interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered: string;
  successCount: number;
  failureCount: number;
  retryCount: number;
  timeout: number;
}

/**
 * 区块链集成管理组件
 */
const BlockchainIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('api-monitor');
  const [loading, setLoading] = useState(false);

  // API监控状态
  const [apiMonitorData, setApiMonitorData] = useState<ApiMonitorData[]>([
    {
      id: '1',
      endpoint: '/v3/tatum/account/balance',
      method: 'GET',
      status: 'active',
      responseTime: 245,
      successRate: 99.8,
      lastCall: '2024-01-15 14:30:25',
      totalCalls: 15420,
      errorCount: 31
    },
    {
      id: '2',
      endpoint: '/v3/tatum/transaction/send',
      method: 'POST',
      status: 'active',
      responseTime: 1250,
      successRate: 98.5,
      lastCall: '2024-01-15 14:29:15',
      totalCalls: 8930,
      errorCount: 134
    },
    {
      id: '3',
      endpoint: '/v3/tatum/address/generate',
      method: 'POST',
      status: 'error',
      responseTime: 0,
      successRate: 0,
      lastCall: '2024-01-15 12:15:30',
      totalCalls: 2340,
      errorCount: 45
    }
  ]);

  // 区块链交易状态
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([
    {
      id: '1',
      txHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
      blockchain: 'ETH',
      status: 'confirmed',
      amount: '0.5 ETH',
      fromAddress: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e416',
      toAddress: '0x8ba1f109551bD432803012645Hac136c22C177e9',
      confirmations: 15,
      requiredConfirmations: 12,
      timestamp: '2024-01-15 14:25:30',
      gasUsed: '21000',
      gasFee: '0.002 ETH'
    },
    {
      id: '2',
      txHash: '0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
      blockchain: 'BTC',
      status: 'pending',
      amount: '0.01 BTC',
      fromAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      toAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      confirmations: 2,
      requiredConfirmations: 6,
      timestamp: '2024-01-15 14:30:15'
    },
    {
      id: '3',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      blockchain: 'USDT',
      status: 'failed',
      amount: '100 USDT',
      fromAddress: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e416',
      toAddress: '0x8ba1f109551bD432803012645Hac136c22C177e9',
      confirmations: 0,
      requiredConfirmations: 12,
      timestamp: '2024-01-15 14:20:45',
      gasUsed: '0',
      gasFee: '0 ETH'
    }
  ]);

  // Webhook配置状态
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: '1',
      name: '交易确认通知',
      url: 'https://api.example.com/webhooks/transaction-confirmed',
      events: ['transaction.confirmed', 'transaction.failed'],
      status: 'active',
      lastTriggered: '2024-01-15 14:25:30',
      successCount: 1250,
      failureCount: 15,
      retryCount: 3,
      timeout: 30
    },
    {
      id: '2',
      name: '余额变动通知',
      url: 'https://api.example.com/webhooks/balance-changed',
      events: ['balance.increased', 'balance.decreased'],
      status: 'active',
      lastTriggered: '2024-01-15 14:20:15',
      successCount: 890,
      failureCount: 8,
      retryCount: 3,
      timeout: 30
    },
    {
      id: '3',
      name: '地址生成通知',
      url: 'https://api.example.com/webhooks/address-generated',
      events: ['address.generated'],
      status: 'inactive',
      lastTriggered: '2024-01-15 12:30:00',
      successCount: 340,
      failureCount: 2,
      retryCount: 3,
      timeout: 30
    }
  ]);

  /**
   * 刷新API监控数据
   */
  const refreshApiMonitor = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 这里应该调用实际的API
      console.log('刷新API监控数据');
    } catch (error) {
      console.error('刷新API监控数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 重新验证交易
   */
  const retryTransaction = async (txId: string) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 这里应该调用实际的API重新验证交易
      console.log('重新验证交易:', txId);
    } catch (error) {
      console.error('重新验证交易失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 测试Webhook
   */
  const testWebhook = async (webhookId: string) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 这里应该调用实际的API测试Webhook
      console.log('测试Webhook:', webhookId);
    } catch (error) {
      console.error('测试Webhook失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取状态徽章样式
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />正常</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />待确认</Badge>;
      case 'error':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />失败</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">已停用</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">区块链集成管理</h1>
          <p className="text-gray-600 mt-2">管理Tatum API监控、区块链交易验证和Webhook配置</p>
        </div>
        <Button onClick={refreshApiMonitor} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API状态</p>
                <p className="text-2xl font-bold text-green-600">98.5%</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待确认交易</p>
                <p className="text-2xl font-bold text-yellow-600">12</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃Webhook</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
              </div>
              <Webhook className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日调用</p>
                <p className="text-2xl font-bold text-purple-600">26.7K</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-monitor">API监控</TabsTrigger>
          <TabsTrigger value="transaction-verify">交易验证</TabsTrigger>
          <TabsTrigger value="webhook-config">Webhook管理</TabsTrigger>
        </TabsList>

        {/* API监控标签页 */}
        <TabsContent value="api-monitor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Tatum API监控
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>API端点</TableHead>
                    <TableHead>方法</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>响应时间</TableHead>
                    <TableHead>成功率</TableHead>
                    <TableHead>总调用次数</TableHead>
                    <TableHead>最后调用</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiMonitorData.map((api) => (
                    <TableRow key={api.id}>
                      <TableCell className="font-medium">{api.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{api.method}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(api.status)}</TableCell>
                      <TableCell>{api.responseTime}ms</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={api.successRate} className="w-16" />
                          <span className="text-sm">{api.successRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{api.totalCalls.toLocaleString()}</TableCell>
                      <TableCell>{api.lastCall}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 交易验证标签页 */}
        <TabsContent value="transaction-verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                区块链交易验证
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易哈希</TableHead>
                    <TableHead>区块链</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>确认数</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">
                        {tx.txHash.substring(0, 20)}...
                        <Button size="sm" variant="ghost" className="ml-2">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.blockchain}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="font-medium">{tx.amount}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={(tx.confirmations / tx.requiredConfirmations) * 100} 
                            className="w-16" 
                          />
                          <span className="text-sm">
                            {tx.confirmations}/{tx.requiredConfirmations}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => retryTransaction(tx.id)}
                            disabled={loading}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook管理标签页 */}
        <TabsContent value="webhook-config" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Webhook className="w-5 h-5 mr-2" />
                  Webhook配置管理
                </CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  添加Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>事件</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>成功/失败</TableHead>
                    <TableHead>最后触发</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {webhook.url.substring(0, 30)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-green-600">{webhook.successCount}</span>
                          {' / '}
                          <span className="text-red-600">{webhook.failureCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{webhook.lastTriggered}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => testWebhook(webhook.id)}
                            disabled={loading}
                          >
                            测试
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainIntegration;