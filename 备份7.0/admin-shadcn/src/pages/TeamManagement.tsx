import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Users2, Search, Filter, Eye, UserPlus, TrendingUp, DollarSign } from 'lucide-react';

// 团队成员类型定义
interface TeamMember {
  id: string;
  username: string;
  walletAddress: string;
  inviterId: string | null;
  inviterName: string | null;
  level: number;
  directInvites: number;
  totalTeamSize: number;
  totalEarnings: number;
  status: 'active' | 'inactive';
  joinDate: string;
  lastActiveDate: string;
}

// 团队统计类型定义
interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalEarnings: number;
  avgTeamSize: number;
  topInviter: string;
  newMembersToday: number;
}

/**
 * 团队管理页面组件
 * 查看团队结构、邀请关系、团队统计数据
 */
const TeamManagement: React.FC = () => {
  // 模拟团队数据
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      username: 'user001',
      walletAddress: 'TXYz...abc123',
      inviterId: null,
      inviterName: null,
      level: 1,
      directInvites: 15,
      totalTeamSize: 45,
      totalEarnings: 1250.50,
      status: 'active',
      joinDate: '2024-01-15',
      lastActiveDate: '2024-01-20'
    },
    {
      id: '2',
      username: 'user002',
      walletAddress: 'TXYz...def456',
      inviterId: '1',
      inviterName: 'user001',
      level: 2,
      directInvites: 8,
      totalTeamSize: 23,
      totalEarnings: 680.25,
      status: 'active',
      joinDate: '2024-01-16',
      lastActiveDate: '2024-01-20'
    },
    {
      id: '3',
      username: 'user003',
      walletAddress: 'TXYz...ghi789',
      inviterId: '1',
      inviterName: 'user001',
      level: 2,
      directInvites: 12,
      totalTeamSize: 34,
      totalEarnings: 890.75,
      status: 'active',
      joinDate: '2024-01-17',
      lastActiveDate: '2024-01-19'
    },
    {
      id: '4',
      username: 'user004',
      walletAddress: 'TXYz...jkl012',
      inviterId: '2',
      inviterName: 'user002',
      level: 3,
      directInvites: 5,
      totalTeamSize: 12,
      totalEarnings: 320.00,
      status: 'inactive',
      joinDate: '2024-01-18',
      lastActiveDate: '2024-01-18'
    },
    {
      id: '5',
      username: 'user005',
      walletAddress: 'TXYz...mno345',
      inviterId: '3',
      inviterName: 'user003',
      level: 3,
      directInvites: 7,
      totalTeamSize: 18,
      totalEarnings: 450.30,
      status: 'active',
      joinDate: '2024-01-19',
      lastActiveDate: '2024-01-20'
    }
  ]);

  const [teamStats] = useState<TeamStats>({
    totalMembers: 156,
    activeMembers: 134,
    totalEarnings: 45680.50,
    avgTeamSize: 12.5,
    topInviter: 'user001',
    newMembersToday: 8
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  /**
   * 获取状态徽章样式
   */
  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default">活跃</Badge>
    ) : (
      <Badge variant="secondary">非活跃</Badge>
    );
  };

  /**
   * 获取等级徽章样式
   */
  const getLevelBadge = (level: number) => {
    const colors = ['default', 'secondary', 'outline'];
    const colorIndex = Math.min(level - 1, colors.length - 1);
    return <Badge variant={colors[colorIndex] as any}>L{level}</Badge>;
  };

  /**
   * 过滤团队成员
   */
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || member.level.toString() === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  /**
   * 查看团队详情
   */
  const handleViewTeamDetails = (memberId: string) => {
    console.log('查看团队详情:', memberId);
    // 这里应该打开团队详情弹窗或跳转到详情页面
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">团队管理</h1>
          <p className="text-muted-foreground">
            查看团队结构、邀请关系、团队统计数据
          </p>
        </div>
      </div>

      {/* 团队统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总成员数</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              活跃成员: {teamStats.activeMembers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">团队总收益</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalEarnings.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">
              平均团队规模: {teamStats.avgTeamSize}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">顶级邀请者</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.topInviter}</div>
            <p className="text-xs text-muted-foreground">
              邀请能力最强的用户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新增</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.newMembersToday}</div>
            <p className="text-xs text-muted-foreground">
              新加入的团队成员
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>团队成员列表</CardTitle>
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
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">非活跃</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="等级筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="1">1级</SelectItem>
                <SelectItem value="2">2级</SelectItem>
                <SelectItem value="3">3级</SelectItem>
                <SelectItem value="4">4级</SelectItem>
                <SelectItem value="5">5级</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 团队成员表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>钱包地址</TableHead>
                  <TableHead>邀请者</TableHead>
                  <TableHead>等级</TableHead>
                  <TableHead>直推人数</TableHead>
                  <TableHead>团队规模</TableHead>
                  <TableHead>总收益 (USDT)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>加入时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.username}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {member.walletAddress}
                    </TableCell>
                    <TableCell>
                      {member.inviterName || '-'}
                    </TableCell>
                    <TableCell>
                      {getLevelBadge(member.level)}
                    </TableCell>
                    <TableCell>{member.directInvites}</TableCell>
                    <TableCell>{member.totalTeamSize}</TableCell>
                    <TableCell>{member.totalEarnings.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>{member.joinDate}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTeamDetails(member.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的团队成员
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { TeamManagement };
export default TeamManagement;