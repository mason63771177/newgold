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
  RefreshCw,
  Users,
  UserPlus,
  Crown,
  Star,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';
import { teamAPI } from '../services/api';
import type { TeamMember, TeamStats } from '../services/api.d';

/**
 * 团队管理页面
 * 提供团队成员查看、管理等功能
 */
const TeamManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<TeamStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalRewards: 0,
    avgTeamSize: 0
  });
  const [members, setMembers] = useState<TeamMember[]>([]);

  // 筛选和分页状态
  const [filters, setFilters] = useState({
    level: 'all',
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * 加载团队统计数据
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getStats();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('加载团队统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载团队成员列表
   */
  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getMembers();
      if (response.success) {
        setMembers(response.data || []);
        setTotalPages(Math.ceil((response.data?.length || 0) / pageSize));
      }
    } catch (error) {
      console.error('加载团队成员失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取等级徽章
   */
  const getLevelBadge = (level: number) => {
    if (level >= 5) {
      return <Badge className="bg-purple-100 text-purple-800"><Crown className="w-3 h-3 mr-1" />钻石</Badge>;
    } else if (level >= 4) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Star className="w-3 h-3 mr-1" />黄金</Badge>;
    } else if (level >= 3) {
      return <Badge className="bg-gray-100 text-gray-800">白银</Badge>;
    } else if (level >= 2) {
      return <Badge className="bg-orange-100 text-orange-800">青铜</Badge>;
    } else {
      return <Badge variant="outline">新手</Badge>;
    }
  };

  /**
   * 获取状态徽章
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">活跃</Badge>;
      case 'inactive':
        return <Badge variant="secondary">不活跃</Badge>;
      case 'banned':
        return <Badge variant="destructive">已封禁</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  /**
   * 处理等级筛选
   */
  const handleLevelFilter = (level: string) => {
    setFilters({ ...filters, level });
    setCurrentPage(1);
  };

  /**
   * 处理状态筛选
   */
  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status });
    setCurrentPage(1);
  };

  /**
   * 格式化时间
   */
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadStatistics();
    loadMembers();
  }, [currentPage, filters]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">团队管理</h1>
          <p className="text-muted-foreground">
            管理团队成员和查看团队统计
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadStatistics} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均团队规模</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.avgTeamSize.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              平均每个团队人数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总成员数</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              活跃: {statistics.activeMembers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃成员</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              活跃率: {statistics.totalMembers > 0 ? ((statistics.activeMembers / statistics.totalMembers) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总奖励</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRewards.toFixed(4)} USDT</div>
            <p className="text-xs text-muted-foreground">
              团队奖励总额
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 团队成员列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>团队成员</CardTitle>
              <CardDescription>
                查看和管理团队成员信息
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户名或邀请码..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filters.level} onValueChange={handleLevelFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="5">钻石</SelectItem>
                <SelectItem value="4">黄金</SelectItem>
                <SelectItem value="3">白银</SelectItem>
                <SelectItem value="2">青铜</SelectItem>
                <SelectItem value="1">新手</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">不活跃</SelectItem>
                <SelectItem value="banned">已封禁</SelectItem>
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
                    <TableHead>用户ID</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>直接邀请</TableHead>
                    <TableHead>总邀请</TableHead>
                    <TableHead>团队奖励</TableHead>
                    <TableHead>加入时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.userId}</TableCell>
                      <TableCell className="font-medium">{member.username}</TableCell>
                      <TableCell>{getLevelBadge(member.level)}</TableCell>
                      <TableCell>{member.directInvites}</TableCell>
                      <TableCell>{member.totalInvites}</TableCell>
                      <TableCell>{member.teamReward.toFixed(4)} USDT</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(member.joinedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {members.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的团队成员
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      <div className="flex items-center justify-between">
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
    </div>
  );
};

export default TeamManagement;