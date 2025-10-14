import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Gift, Clock, DollarSign, Users, Settings, Eye, Plus, Edit } from 'lucide-react';

// 红包配置类型定义
interface RedPacketConfig {
  id: string;
  timeSlot: string;
  duration: number; // 持续时间（秒）
  totalAmount: number;
  totalCount: number;
  isActive: boolean;
}

// 红包记录类型定义
interface RedPacketRecord {
  id: string;
  sessionId: string;
  username: string;
  walletAddress: string;
  amount: number;
  grabTime: string;
  timeSlot: string;
  rank: number;
}

// 红包统计类型定义
interface RedPacketStats {
  todayTotal: number;
  todayGrabbed: number;
  todayParticipants: number;
  avgAmount: number;
  topGrabber: string;
  nextSession: string;
}

/**
 * 红包管理页面组件
 * 配置红包时间窗口、红包池、查看抢红包记录
 */
const RedPacketManagement: React.FC = () => {
  // 红包配置数据
  const [redPacketConfigs, setRedPacketConfigs] = useState<RedPacketConfig[]>([
    {
      id: '1',
      timeSlot: '09:00',
      duration: 77,
      totalAmount: 1000,
      totalCount: 100,
      isActive: true
    },
    {
      id: '2',
      timeSlot: '12:00',
      duration: 77,
      totalAmount: 1500,
      totalCount: 150,
      isActive: true
    },
    {
      id: '3',
      timeSlot: '20:00',
      duration: 77,
      totalAmount: 2000,
      totalCount: 200,
      isActive: true
    }
  ]);

  // 红包记录数据
  const [redPacketRecords, setRedPacketRecords] = useState<RedPacketRecord[]>([
    {
      id: '1',
      sessionId: 'RP20240120090001',
      username: 'user001',
      walletAddress: 'TXYz...abc123',
      amount: 15.50,
      grabTime: '2024-01-20 09:01:23',
      timeSlot: '09:00',
      rank: 1
    },
    {
      id: '2',
      sessionId: 'RP20240120090001',
      username: 'user002',
      walletAddress: 'TXYz...def456',
      amount: 12.30,
      grabTime: '2024-01-20 09:01:25',
      timeSlot: '09:00',
      rank: 2
    },
    {
      id: '3',
      sessionId: 'RP20240120090001',
      username: 'user003',
      walletAddress: 'TXYz...ghi789',
      amount: 8.75,
      grabTime: '2024-01-20 09:01:28',
      timeSlot: '09:00',
      rank: 3
    },
    {
      id: '4',
      sessionId: 'RP20240120120001',
      username: 'user004',
      walletAddress: 'TXYz...jkl012',
      amount: 18.90,
      grabTime: '2024-01-20 12:00:45',
      timeSlot: '12:00',
      rank: 1
    },
    {
      id: '5',
      sessionId: 'RP20240120120001',
      username: 'user005',
      walletAddress: 'TXYz...mno345',
      amount: 14.20,
      grabTime: '2024-01-20 12:00:47',
      timeSlot: '12:00',
      rank: 2
    }
  ]);

  const [redPacketStats] = useState<RedPacketStats>({
    todayTotal: 4500,
    todayGrabbed: 3850,
    todayParticipants: 285,
    avgAmount: 13.51,
    topGrabber: 'user004',
    nextSession: '20:00'
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RedPacketConfig | null>(null);
  const [timeSlotFilter, setTimeSlotFilter] = useState('all');

  /**
   * 获取状态徽章样式
   */
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default">启用</Badge>
    ) : (
      <Badge variant="secondary">禁用</Badge>
    );
  };

  /**
   * 获取排名徽章样式
   */
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 第1名</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 第2名</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600">🥉 第3名</Badge>;
    return <Badge variant="outline">第{rank}名</Badge>;
  };

  /**
   * 过滤红包记录
   */
  const filteredRecords = redPacketRecords.filter(record => {
    return timeSlotFilter === 'all' || record.timeSlot === timeSlotFilter;
  });

  /**
   * 编辑红包配置
   */
  const handleEditConfig = (config: RedPacketConfig) => {
    setEditingConfig(config);
    setShowConfigModal(true);
  };

  /**
   * 添加新红包配置
   */
  const handleAddConfig = () => {
    setEditingConfig(null);
    setShowConfigModal(true);
  };

  /**
   * 切换红包配置状态
   */
  const handleToggleConfig = (configId: string) => {
    setRedPacketConfigs(configs =>
      configs.map(config =>
        config.id === configId
          ? { ...config, isActive: !config.isActive }
          : config
      )
    );
  };

  /**
   * 查看红包详情
   */
  const handleViewDetails = (sessionId: string) => {
    console.log('查看红包详情:', sessionId);
    // 这里应该打开红包详情弹窗或跳转到详情页面
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">红包管理</h1>
          <p className="text-muted-foreground">
            配置红包时间窗口、红包池、查看抢红包记录
          </p>
        </div>
        <Button onClick={handleAddConfig}>
          <Plus className="h-4 w-4 mr-2" />
          添加红包配置
        </Button>
      </div>

      {/* 红包统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日红包总额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redPacketStats.todayTotal} USDT</div>
            <p className="text-xs text-muted-foreground">
              已抢: {redPacketStats.todayGrabbed} USDT
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">参与人数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redPacketStats.todayParticipants}</div>
            <p className="text-xs text-muted-foreground">
              平均金额: {redPacketStats.avgAmount.toFixed(2)} USDT
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最佳手气</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redPacketStats.topGrabber}</div>
            <p className="text-xs text-muted-foreground">
              今日手气最佳用户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">下次开抢</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redPacketStats.nextSession}</div>
            <p className="text-xs text-muted-foreground">
              下一场红包时间
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 红包配置 */}
      <Card>
        <CardHeader>
          <CardTitle>红包时间配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间段</TableHead>
                  <TableHead>持续时间</TableHead>
                  <TableHead>红包总额 (USDT)</TableHead>
                  <TableHead>红包数量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redPacketConfigs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.timeSlot}</TableCell>
                    <TableCell>{config.duration}秒</TableCell>
                    <TableCell>{config.totalAmount}</TableCell>
                    <TableCell>{config.totalCount}</TableCell>
                    <TableCell>{getStatusBadge(config.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConfig(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={config.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleConfig(config.id)}
                        >
                          {config.isActive ? '禁用' : '启用'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 抢红包记录 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>抢红包记录</CardTitle>
            <Select value={timeSlotFilter} onValueChange={setTimeSlotFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="时间段筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部时间段</SelectItem>
                <SelectItem value="09:00">09:00</SelectItem>
                <SelectItem value="12:00">12:00</SelectItem>
                <SelectItem value="20:00">20:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>场次ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>钱包地址</TableHead>
                  <TableHead>金额 (USDT)</TableHead>
                  <TableHead>排名</TableHead>
                  <TableHead>时间段</TableHead>
                  <TableHead>抢红包时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.sessionId}</TableCell>
                    <TableCell className="font-medium">{record.username}</TableCell>
                    <TableCell className="font-mono text-sm">{record.walletAddress}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      {record.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getRankBadge(record.rank)}</TableCell>
                    <TableCell>{record.timeSlot}</TableCell>
                    <TableCell>{record.grabTime}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(record.sessionId)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的红包记录
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置弹窗 */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {editingConfig ? '编辑红包配置' : '添加红包配置'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timeSlot">时间段</Label>
                <Input
                  id="timeSlot"
                  type="time"
                  defaultValue={editingConfig?.timeSlot || ''}
                />
              </div>
              <div>
                <Label htmlFor="duration">持续时间（秒）</Label>
                <Input
                  id="duration"
                  type="number"
                  defaultValue={editingConfig?.duration || 77}
                />
              </div>
              <div>
                <Label htmlFor="totalAmount">红包总额 (USDT)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  defaultValue={editingConfig?.totalAmount || ''}
                />
              </div>
              <div>
                <Label htmlFor="totalCount">红包数量</Label>
                <Input
                  id="totalCount"
                  type="number"
                  defaultValue={editingConfig?.totalCount || ''}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfigModal(false)}
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    // 这里应该处理保存逻辑
                    setShowConfigModal(false);
                  }}
                >
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export { RedPacketManagement };
export default RedPacketManagement;