import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Copy
} from 'lucide-react';
import { addressManagementAPI } from '@/services/api';

/**
 * 地址统计接口
 */
interface AddressStats {
  totalAddresses: number;
  whitelistAddresses: number;
  blacklistAddresses: number;
  recentActivity: number;
}

/**
 * 地址记录接口
 */
interface AddressRecord {
  id: string;
  address: string;
  type: 'whitelist' | 'blacklist' | 'normal';
  label?: string;
  balance?: number;
  transactionCount: number;
  firstSeen: string;
  lastActivity: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'blocked';
  tags: string[];
}

/**
 * 白名单地址接口
 */
interface WhitelistAddress {
  id: string;
  address: string;
  label: string;
  addedBy: string;
  addedAt: string;
  reason: string;
}

/**
 * 地址管理页面
 */
const AddressManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AddressStats>({
    totalAddresses: 0,
    whitelistAddresses: 0,
    blacklistAddresses: 0,
    recentActivity: 0
  });
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistAddress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage] = useState(1);
  const [pageSize] = useState(20);

  /**
   * 加载地址统计
   */
  const loadStats = async () => {
    try {
      // const response = await addressManagementAPI.getAddressStats();
      // if (response.success) {
      //   setStats(response.data);
      // }
    } catch (error) {
      console.error('加载地址统计失败:', error);
      // 使用模拟数据
      setStats({
        totalAddresses: 1256,
        whitelistAddresses: 89,
        blacklistAddresses: 23,
        recentActivity: 156
      });
    }
  };

  /**
   * 加载地址列表
   */
  const loadAddresses = async () => {
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        type: filterType !== 'all' ? filterType : undefined
      };
      const response = await addressManagementAPI.getAddresses(params);
      if (response.success) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error('加载地址列表失败:', error);
      // 使用模拟数据
      setAddresses([
        {
          id: '1',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'whitelist',
          label: '官方钱包',
          balance: 1250.67,
          transactionCount: 89,
          firstSeen: '2024-01-01 10:00:00',
          lastActivity: '2024-01-15 14:30:00',
          riskLevel: 'low',
          status: 'active',
          tags: ['官方', '可信']
        },
        {
          id: '2',
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
          type: 'normal',
          label: '用户钱包',
          balance: 45.23,
          transactionCount: 12,
          firstSeen: '2024-01-10 15:20:00',
          lastActivity: '2024-01-15 12:15:00',
          riskLevel: 'low',
          status: 'active',
          tags: ['用户']
        },
        {
          id: '3',
          address: '0x9876543210fedcba9876543210fedcba98765432',
          type: 'blacklist',
          label: '可疑地址',
          balance: 0,
          transactionCount: 156,
          firstSeen: '2024-01-05 08:30:00',
          lastActivity: '2024-01-14 20:45:00',
          riskLevel: 'high',
          status: 'blocked',
          tags: ['可疑', '高风险']
        }
      ]);
    }
  };

  /**
   * 加载白名单
   */
  const loadWhitelist = async () => {
    try {
      // const response = await addressManagementAPI.getWhitelist();
      // if (response.success) {
      //   setWhitelist(response.data);
      // }
    } catch (error) {
      console.error('加载白名单失败:', error);
      // 使用模拟数据
      setWhitelist([
        {
          id: '1',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          label: '官方钱包',
          addedBy: 'admin',
          addedAt: '2024-01-01 10:00:00',
          reason: '官方认证钱包'
        },
        {
          id: '2',
          address: '0x2345678901bcdef12345678901bcdef123456789',
          label: '合作伙伴',
          addedBy: 'admin',
          addedAt: '2024-01-05 14:30:00',
          reason: '合作伙伴钱包'
        }
      ]);
    }
  };

  /**
   * 添加到白名单
   */
  const handleAddToWhitelist = async () => {
    if (!newAddress.trim()) {
      alert('请输入地址');
      return;
    }

    setLoading(true);
    try {
      const response = await addressManagementAPI.addToWhitelist(newAddress.trim());
      if (response.success) {
        alert('添加成功');
        setNewAddress('');
        setNewLabel('');
        setShowAddForm(false);
        loadWhitelist();
        loadStats();
      }
    } catch (error) {
      console.error('添加白名单失败:', error);
      alert('添加失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 从白名单移除
   */
  const handleRemoveFromWhitelist = async (address: string) => {
    if (!confirm('确定要从白名单中移除此地址吗？')) {
      return;
    }

    try {
      const response = await addressManagementAPI.removeFromWhitelist(address);
      if (response.success) {
        alert('移除成功');
        loadWhitelist();
        loadStats();
      }
    } catch (error) {
      console.error('移除白名单失败:', error);
      alert('移除失败');
    }
  };

  /**
   * 复制地址到剪贴板
   */
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    alert('地址已复制到剪贴板');
  };

  /**
   * 获取风险等级徽章
   */
  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">低风险</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">中风险</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">高风险</Badge>;
      default:
        return <Badge>{level}</Badge>;
    }
  };

  /**
   * 获取状态徽章
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />活跃</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">非活跃</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />已阻止</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  /**
   * 获取类型徽章
   */
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'whitelist':
        return <Badge className="bg-blue-100 text-blue-800">白名单</Badge>;
      case 'blacklist':
        return <Badge className="bg-red-100 text-red-800">黑名单</Badge>;
      case 'normal':
        return <Badge className="bg-gray-100 text-gray-800">普通</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  /**
   * 格式化地址显示
   */
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    loadStats();
    loadAddresses();
    loadWhitelist();
  }, [currentPage, searchTerm, filterType]);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">地址管理</h1>
          <p className="text-gray-600 mt-2">管理钱包地址的白名单、黑名单和风险监控</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            添加地址
          </Button>
          <Button onClick={() => {
            loadStats();
            loadAddresses();
            loadWhitelist();
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总地址数</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAddresses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              已监控的地址总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">白名单</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.whitelistAddresses}</div>
            <p className="text-xs text-muted-foreground">
              可信任的地址
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">黑名单</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blacklistAddresses}</div>
            <p className="text-xs text-muted-foreground">
              高风险地址
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">近期活跃</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              24小时内活跃地址
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 添加地址表单 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>添加地址到白名单</CardTitle>
            <CardDescription>将可信任的地址添加到白名单中</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>钱包地址</Label>
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              <div className="space-y-2">
                <Label>标签</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="地址标签"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                取消
              </Button>
              <Button onClick={handleAddToWhitelist} disabled={loading}>
                {loading ? '添加中...' : '添加到白名单'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索地址..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">所有类型</option>
                <option value="whitelist">白名单</option>
                <option value="blacklist">黑名单</option>
                <option value="normal">普通</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 地址列表 */}
      <Card>
        <CardHeader>
          <CardTitle>地址列表</CardTitle>
          <CardDescription>所有监控的钱包地址及其详细信息</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>地址</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>余额</TableHead>
                <TableHead>交易数</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后活动</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.map((address) => (
                <TableRow key={address.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{formatAddress(address.address)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyAddress(address.address)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(address.type)}</TableCell>
                  <TableCell>{address.label || '-'}</TableCell>
                  <TableCell>
                    {address.balance ? `$${address.balance.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{address.transactionCount}</TableCell>
                  <TableCell>{getRiskBadge(address.riskLevel)}</TableCell>
                  <TableCell>{getStatusBadge(address.status)}</TableCell>
                  <TableCell>{address.lastActivity}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {address.type === 'whitelist' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFromWhitelist(address.address)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 白名单管理 */}
      <Card>
        <CardHeader>
          <CardTitle>白名单管理</CardTitle>
          <CardDescription>管理可信任的钱包地址</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>地址</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>添加人</TableHead>
                <TableHead>添加时间</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {whitelist.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{formatAddress(item.address)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyAddress(item.address)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>{item.addedBy}</TableCell>
                  <TableCell>{item.addedAt}</TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveFromWhitelist(item.address)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      移除
                    </Button>
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

export default AddressManagement;