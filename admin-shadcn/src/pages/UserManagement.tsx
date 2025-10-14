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
  Eye,
  UserCheck,
  UserX,
  Trash2,
  Users,
  UserPlus,
  DollarSign,
  Activity
} from 'lucide-react';
import { userAPI } from '@/services/api';
import type { User, UserStats } from '@/services/api.d';
import { useDebounce } from '@/hooks/useDebounce';
import { globalApiCache } from '@/hooks/useApiCache';

/**
 * 用户管理页面
 * 提供用户列表查看、状态管理、删除等功能
 */
const UserManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalBalance: 0
  });
  const [users, setUsers] = useState<User[]>([]);

  // 筛选和分页状态
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // 防抖处理搜索关键词，避免频繁API调用
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  /**
   * 加载用户统计数据
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const cacheKey = globalApiCache.generateKey('/api/admin/users/stats');
      const response = await globalApiCache.withCache(
        () => userAPI.getUserStats(),
        cacheKey
      );
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('加载用户统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载用户列表
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize,
        status: filters.status,
        role: filters.role,
        search: debouncedSearchTerm // 使用防抖后的搜索关键词
      };
      const response = await userAPI.getUsers(params);
      if (response.success) {
        setUsers(response.data.users || []);
        setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新用户状态
   */
  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await userAPI.updateUserStatus(userId, status);
      if (response.success) {
        // 只重新加载用户列表，统计数据不需要频繁更新
        await loadUsers();
        // 可选：如果需要更新统计数据，可以单独调用
        // await loadStatistics();
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
    }
  };

  /**
   * 删除用户
   */
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await userAPI.deleteUser(userId);
      if (response.success) {
        await loadUsers();
        // 删除用户后需要更新统计数据，清除缓存以获取最新数据
        const cacheKey = globalApiCache.generateKey('/api/admin/users/stats');
        globalApiCache.remove(cacheKey);
        await loadStatistics();
      }
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  /**
   * 获取用户状态徽章
   */
  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">活跃</Badge>;
      case 'inactive':
        return <Badge variant="secondary">未激活</Badge>;
      case 'suspended':
        return <Badge variant="destructive">已暂停</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-800">已封禁</Badge>;
      // 新增的用户状态识别
      case 'status1':
      case 'new_registered':
        return <Badge className="bg-blue-100 text-blue-800">新注册玩家</Badge>;
      case 'status2':
      case 'in_task':
        return <Badge className="bg-orange-100 text-orange-800">任务中玩家</Badge>;
      case 'status3':
      case 'pending_repurchase':
        return <Badge className="bg-purple-100 text-purple-800">待复购玩家</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * 获取用户角色徽章
   */
  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800">管理员</Badge>;
      case 'vip':
        return <Badge className="bg-yellow-100 text-yellow-800">VIP</Badge>;
      case 'user':
        return <Badge variant="outline">普通用户</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
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
   * 处理状态筛选
   */
  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status });
    setCurrentPage(1);
  };

  /**
   * 处理角色筛选
   */
  const handleRoleFilter = (role: string) => {
    setFilters({ ...filters, role });
    setCurrentPage(1);
  };

  // 页面初始加载时获取统计数据（只执行一次）
  useEffect(() => {
    loadStatistics();
  }, []);

  // 当页面、筛选条件或防抖搜索关键词改变时，重新加载用户列表
  useEffect(() => {
    loadUsers();
  }, [currentPage, filters.status, filters.role, debouncedSearchTerm]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">
            查看和管理所有用户账户
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              活跃用户: {statistics.activeUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新增</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">
              较昨日增长
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新注册玩家</CardTitle>
            <div className="h-4 w-4 bg-blue-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.status1Users || 0}</div>
            <p className="text-xs text-muted-foreground">
              状态1用户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">任务中玩家</CardTitle>
            <div className="h-4 w-4 bg-orange-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.status2Users || 0}</div>
            <p className="text-xs text-muted-foreground">
              状态2用户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待复购玩家</CardTitle>
            <div className="h-4 w-4 bg-purple-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.status3Users || 0}</div>
            <p className="text-xs text-muted-foreground">
              状态3用户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总余额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalBalance.toFixed(4)} USDT</div>
            <p className="text-xs text-muted-foreground">
              用户总资产
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>
                查看和管理所有用户账户
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
                  placeholder="搜索用户名、邮箱或手机号..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">未激活</SelectItem>
                <SelectItem value="suspended">已暂停</SelectItem>
                <SelectItem value="banned">已封禁</SelectItem>
                <SelectItem value="status1">新注册玩家</SelectItem>
                <SelectItem value="status2">任务中玩家</SelectItem>
                <SelectItem value="status3">待复购玩家</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.role} onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
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
                    <TableHead>邮箱/手机</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>余额</TableHead>
                    <TableHead>邀请码</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.email && <div className="text-sm">{user.email}</div>}
                          {user.phone && <div className="text-sm text-muted-foreground">{user.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{getUserRoleBadge(user.role)}</TableCell>
                      <TableCell>{getUserStatusBadge(user.status)}</TableCell>
                      <TableCell>{user.balance.toFixed(4)} USDT</TableCell>
                      <TableCell className="font-mono text-sm">{user.inviteCode}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '从未登录'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('查看用户详情:', user.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateUserStatus(user.id, 'suspended')}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateUserStatus(user.id, 'active')}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的用户
            </div>
          )}

          {/* 分页 */}
          <div className="flex items-center justify-between mt-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;