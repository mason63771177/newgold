import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wifi, 
  WifiOff, 
  MessageSquare, 
  Bell, 
  Users, 
  Activity, 
  Search, 
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe
} from 'lucide-react';

// 类型定义
interface WebSocketConnection {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  connectedAt: string;
  lastActivity: string;
  status: 'connected' | 'disconnected' | 'idle';
  location: string;
  roomId?: string;
}

interface MessageRecord {
  id: string;
  type: 'countdown' | 'redpacket' | 'task' | 'system' | 'broadcast';
  title: string;
  content: string;
  targetUsers: string[];
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
  deliveryCount: number;
  totalTargets: number;
}

interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  disconnectedConnections: number;
  messagesSentToday: number;
  averageResponseTime: number;
}

/**
 * 实时通信管理组件
 * 功能：WebSocket连接监控、消息推送管理、通知历史记录
 */
const RealtimeCommunication: React.FC = () => {
  const [connections, setConnections] = useState<WebSocketConnection[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [stats, setStats] = useState<ConnectionStats>({
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    disconnectedConnections: 0,
    messagesSentToday: 0,
    averageResponseTime: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [messageTypeFilter, setMessageTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('connections');

  // 加载WebSocket连接数据
  const loadConnections = async () => {
    try {
      // 这里应该调用实际的API
      // const response = await websocketAPI.getConnections();
      // setConnections(response.data || []);
      
      // 使用模拟数据
      setConnections([
        {
          id: 'conn_001',
          userId: 'U001',
          username: 'user001',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          connectedAt: '2024-01-20 14:30:00',
          lastActivity: '2024-01-20 16:25:00',
          status: 'connected',
          location: '北京',
          roomId: 'room_main'
        },
        {
          id: 'conn_002',
          userId: 'U002',
          username: 'user002',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          connectedAt: '2024-01-20 15:15:00',
          lastActivity: '2024-01-20 16:20:00',
          status: 'connected',
          location: '上海',
          roomId: 'room_main'
        },
        {
          id: 'conn_003',
          userId: 'U003',
          username: 'user003',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          connectedAt: '2024-01-20 13:45:00',
          lastActivity: '2024-01-20 15:30:00',
          status: 'idle',
          location: '广州'
        },
        {
          id: 'conn_004',
          userId: 'U004',
          username: 'user004',
          ipAddress: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (Android 11; Mobile)',
          connectedAt: '2024-01-20 12:00:00',
          lastActivity: '2024-01-20 14:00:00',
          status: 'disconnected',
          location: '深圳'
        }
      ]);
    } catch (error) {
      console.error('加载WebSocket连接数据失败:', error);
    }
  };

  // 加载消息记录
  const loadMessages = async () => {
    try {
      // 这里应该调用实际的API
      // const response = await websocketAPI.getMessages();
      // setMessages(response.data || []);
      
      // 使用模拟数据
      setMessages([
        {
          id: 'msg_001',
          type: 'countdown',
          title: '红包倒计时更新',
          content: '距离下次红包开始还有 30 秒',
          targetUsers: ['U001', 'U002', 'U003'],
          sentAt: '2024-01-20 16:25:00',
          status: 'delivered',
          deliveryCount: 3,
          totalTargets: 3
        },
        {
          id: 'msg_002',
          type: 'redpacket',
          title: '红包活动开始',
          content: '红包雨活动现在开始！快来抢红包吧！',
          targetUsers: ['U001', 'U002', 'U003', 'U004'],
          sentAt: '2024-01-20 16:20:00',
          status: 'delivered',
          deliveryCount: 3,
          totalTargets: 4
        },
        {
          id: 'msg_003',
          type: 'task',
          title: '任务完成通知',
          content: '恭喜您完成了新手任务，获得 100 USDT 奖励！',
          targetUsers: ['U001'],
          sentAt: '2024-01-20 16:15:00',
          status: 'delivered',
          deliveryCount: 1,
          totalTargets: 1
        },
        {
          id: 'msg_004',
          type: 'system',
          title: '系统维护通知',
          content: '系统将于今晚 22:00-24:00 进行维护，请提前做好准备',
          targetUsers: ['U001', 'U002', 'U003', 'U004', 'U005'],
          sentAt: '2024-01-20 16:00:00',
          status: 'failed',
          deliveryCount: 2,
          totalTargets: 5
        }
      ]);
    } catch (error) {
      console.error('加载消息记录失败:', error);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      // 这里应该调用实际的API
      // const response = await websocketAPI.getStats();
      // setStats(response.data || stats);
      
      // 使用模拟数据
      setStats({
        totalConnections: 1250,
        activeConnections: 856,
        idleConnections: 234,
        disconnectedConnections: 160,
        messagesSentToday: 15420,
        averageResponseTime: 45
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadConnections(),
        loadMessages(),
        loadStats()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // 筛选连接数据
  const filteredConnections = connections.filter(conn => {
    const matchesSearch = conn.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conn.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conn.ipAddress.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || conn.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 筛选消息数据
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = messageTypeFilter === 'all' || msg.type === messageTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // 获取连接状态徽章
  const getConnectionStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><Wifi className="w-3 h-3 mr-1" />在线</Badge>;
      case 'idle':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />空闲</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" />离线</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  // 获取消息类型徽章
  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'countdown':
        return <Badge variant="outline" className="bg-blue-50"><Clock className="w-3 h-3 mr-1" />倒计时</Badge>;
      case 'redpacket':
        return <Badge variant="default" className="bg-red-500"><Bell className="w-3 h-3 mr-1" />红包</Badge>;
      case 'task':
        return <Badge variant="secondary" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />任务</Badge>;
      case 'system':
        return <Badge variant="outline" className="bg-orange-50"><AlertTriangle className="w-3 h-3 mr-1" />系统</Badge>;
      case 'broadcast':
        return <Badge variant="secondary" className="bg-purple-500"><Send className="w-3 h-3 mr-1" />广播</Badge>;
      default:
        return <Badge variant="outline">其他</Badge>;
    }
  };

  // 获取消息状态徽章
  const getMessageStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline"><Send className="w-3 h-3 mr-1" />已发送</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />已送达</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />失败</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  // 断开连接
  const handleDisconnectUser = (connectionId: string) => {
    // 这里应该调用实际的API
    console.log('断开连接:', connectionId);
  };

  // 发送消息
  const handleSendMessage = (targetUsers: string[]) => {
    // 这里应该调用实际的API
    console.log('发送消息给用户:', targetUsers);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">实时通信管理</h1>
          <p className="text-muted-foreground">
            WebSocket连接监控、消息推送管理和通知历史记录
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总连接数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConnections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              活跃: {stats.activeConnections} | 空闲: {stats.idleConnections}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在线连接</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeConnections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              在线率: {((stats.activeConnections / stats.totalConnections) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日消息</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.messagesSentToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              消息推送总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              WebSocket响应时间
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">连接管理</TabsTrigger>
          <TabsTrigger value="messages">消息记录</TabsTrigger>
          <TabsTrigger value="broadcast">消息广播</TabsTrigger>
        </TabsList>

        {/* 连接管理标签页 */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                WebSocket连接监控
              </CardTitle>
              <CardDescription>
                实时查看和管理WebSocket连接状态
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
                        placeholder="搜索用户名、用户ID或IP地址..."
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
                      <SelectItem value="connected">在线</SelectItem>
                      <SelectItem value="idle">空闲</SelectItem>
                      <SelectItem value="disconnected">离线</SelectItem>
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
                          <TableHead>用户信息</TableHead>
                          <TableHead>连接状态</TableHead>
                          <TableHead>IP地址</TableHead>
                          <TableHead>位置</TableHead>
                          <TableHead>连接时间</TableHead>
                          <TableHead>最后活动</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredConnections.map((conn) => (
                          <TableRow key={conn.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{conn.username}</div>
                                <div className="text-sm text-muted-foreground">{conn.userId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getConnectionStatusBadge(conn.status)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {conn.ipAddress}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {conn.location}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {conn.connectedAt}
                            </TableCell>
                            <TableCell className="text-sm">
                              {conn.lastActivity}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendMessage([conn.userId])}
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  发消息
                                </Button>
                                {conn.status === 'connected' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDisconnectUser(conn.id)}
                                  >
                                    <WifiOff className="w-3 h-3 mr-1" />
                                    断开
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {filteredConnections.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    没有找到符合条件的连接记录
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 消息记录标签页 */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                消息推送记录
              </CardTitle>
              <CardDescription>
                查看历史消息推送记录和送达状态
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
                        placeholder="搜索消息标题或内容..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="countdown">倒计时</SelectItem>
                      <SelectItem value="redpacket">红包</SelectItem>
                      <SelectItem value="task">任务</SelectItem>
                      <SelectItem value="system">系统</SelectItem>
                      <SelectItem value="broadcast">广播</SelectItem>
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
                          <TableHead>消息信息</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>发送状态</TableHead>
                          <TableHead>送达率</TableHead>
                          <TableHead>发送时间</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMessages.map((msg) => (
                          <TableRow key={msg.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{msg.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                  {msg.content}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getMessageTypeBadge(msg.type)}
                            </TableCell>
                            <TableCell>
                              {getMessageStatusBadge(msg.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {msg.deliveryCount}/{msg.totalTargets}
                                </div>
                                <div className="text-muted-foreground">
                                  {((msg.deliveryCount / msg.totalTargets) * 100).toFixed(1)}%
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {msg.sentAt}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                查看详情
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {filteredMessages.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    没有找到符合条件的消息记录
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 消息广播标签页 */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                消息广播
              </CardTitle>
              <CardDescription>
                向指定用户或全体用户发送实时消息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  消息广播功能开发中...
                  <br />
                  将支持向指定用户或全体用户发送实时通知
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealtimeCommunication;