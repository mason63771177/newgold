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
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
  Key,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import { userAPI } from '../services/api';
import type { User } from '../services/api.d';

// 权限相关接口定义
interface Permission {
  id: string;
  name: string;
  code: string;
  description: string;
  module: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

interface PermissionStats {
  totalRoles: number;
  totalPermissions: number;
  totalUsers: number;
  adminUsers: number;
}

/**
 * 权限管理页面
 * 提供角色和权限管理功能
 */
const PermissionManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'users'>('roles');
  const [statistics, setStatistics] = useState<PermissionStats>({
    totalRoles: 0,
    totalPermissions: 0,
    totalUsers: 0,
    adminUsers: 0
  });

  // 角色相关状态
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // 筛选和分页状态
  const [filters, setFilters] = useState({
    search: '',
    module: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * 加载权限统计数据
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      // 模拟统计数据
      setStatistics({
        totalRoles: roles.length,
        totalPermissions: permissions.length,
        totalUsers: users.length,
        adminUsers: users.filter(u => u.role === 'admin').length
      });
    } catch (error) {
      console.error('加载权限统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载角色列表
   */
  const loadRoles = async () => {
    try {
      setLoading(true);
      // 模拟角色数据
      const mockRoles: Role[] = [
        {
          id: '1',
          name: '超级管理员',
          code: 'super_admin',
          description: '拥有系统所有权限',
          permissions: ['user_manage', 'system_config', 'data_export'],
          userCount: 2,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '管理员',
          code: 'admin',
          description: '拥有大部分管理权限',
          permissions: ['user_manage', 'task_manage'],
          userCount: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: '运营',
          code: 'operator',
          description: '负责日常运营管理',
          permissions: ['task_manage', 'redpacket_manage'],
          userCount: 8,
          createdAt: new Date().toISOString()
        }
      ];
      setRoles(mockRoles);
      setTotalPages(Math.ceil(mockRoles.length / pageSize));
    } catch (error) {
      console.error('加载角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载权限列表
   */
  const loadPermissions = async () => {
    try {
      setLoading(true);
      // 模拟权限数据
      const mockPermissions: Permission[] = [
        {
          id: '1',
          name: '用户管理',
          code: 'user_manage',
          description: '查看、编辑、删除用户',
          module: 'user',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '任务管理',
          code: 'task_manage',
          description: '创建、编辑、删除任务',
          module: 'task',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: '红包管理',
          code: 'redpacket_manage',
          description: '配置和管理红包',
          module: 'redpacket',
          createdAt: new Date().toISOString()
        },
        {
          id: '4',
          name: '系统配置',
          code: 'system_config',
          description: '修改系统配置',
          module: 'system',
          createdAt: new Date().toISOString()
        },
        {
          id: '5',
          name: '数据导出',
          code: 'data_export',
          description: '导出系统数据',
          module: 'system',
          createdAt: new Date().toISOString()
        }
      ];
      setPermissions(mockPermissions);
    } catch (error) {
      console.error('加载权限列表失败:', error);
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
      const response = await userAPI.getUsers();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取角色徽章
   */
  const getRoleBadge = (roleCode: string) => {
    switch (roleCode) {
      case 'super_admin':
        return <Badge className="bg-red-100 text-red-800"><Shield className="w-3 h-3 mr-1" />超级管理员</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800"><Key className="w-3 h-3 mr-1" />管理员</Badge>;
      case 'operator':
        return <Badge className="bg-green-100 text-green-800"><Settings className="w-3 h-3 mr-1" />运营</Badge>;
      case 'user':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />普通用户</Badge>;
      default:
        return <Badge variant="outline">{roleCode}</Badge>;
    }
  };

  /**
   * 获取模块徽章
   */
  const getModuleBadge = (module: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      task: 'bg-green-100 text-green-800',
      redpacket: 'bg-red-100 text-red-800',
      system: 'bg-purple-100 text-purple-800',
      wallet: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={colors[module] || 'bg-gray-100 text-gray-800'}>
        {module}
      </Badge>
    );
  };

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  /**
   * 处理模块筛选
   */
  const handleModuleFilter = (module: string) => {
    setFilters({ ...filters, module });
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
    if (activeTab === 'roles') {
      loadRoles();
    } else if (activeTab === 'permissions') {
      loadPermissions();
    } else {
      loadUsers();
    }
  }, [activeTab, currentPage, filters]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">权限管理</h1>
          <p className="text-muted-foreground">
            管理系统角色和权限配置
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadStatistics} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'roles' ? '创建角色' : activeTab === 'permissions' ? '创建权限' : '分配权限'}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总角色数</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              系统角色总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总权限数</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              系统权限总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              管理员: {statistics.adminUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理员用户</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              拥有管理权限的用户
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 标签页切换 */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'roles' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('roles')}
        >
          角色管理
        </Button>
        <Button
          variant={activeTab === 'permissions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('permissions')}
        >
          权限管理
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('users')}
        >
          用户权限
        </Button>
      </div>

      {/* 角色管理 */}
      {activeTab === 'roles' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>角色管理</CardTitle>
                <CardDescription>
                  查看和管理系统角色
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 搜索 */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索角色名称..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">加载中...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>角色ID</TableHead>
                      <TableHead>角色名称</TableHead>
                      <TableHead>角色代码</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>权限数量</TableHead>
                      <TableHead>用户数量</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.id}</TableCell>
                        <TableCell>{getRoleBadge(role.code)}</TableCell>
                        <TableCell className="font-mono text-sm">{role.code}</TableCell>
                        <TableCell className="max-w-xs truncate">{role.description}</TableCell>
                        <TableCell>{role.permissions.length}</TableCell>
                        <TableCell>{role.userCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(role.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
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
          </CardContent>
        </Card>
      )}

      {/* 权限管理 */}
      {activeTab === 'permissions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>权限管理</CardTitle>
                <CardDescription>
                  查看和管理系统权限
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
                    placeholder="搜索权限名称..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={filters.module} onValueChange={handleModuleFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="模块" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部模块</SelectItem>
                  <SelectItem value="user">用户</SelectItem>
                  <SelectItem value="task">任务</SelectItem>
                  <SelectItem value="redpacket">红包</SelectItem>
                  <SelectItem value="system">系统</SelectItem>
                  <SelectItem value="wallet">钱包</SelectItem>
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
                      <TableHead>权限ID</TableHead>
                      <TableHead>权限名称</TableHead>
                      <TableHead>权限代码</TableHead>
                      <TableHead>所属模块</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">{permission.id}</TableCell>
                        <TableCell className="font-medium">{permission.name}</TableCell>
                        <TableCell className="font-mono text-sm">{permission.code}</TableCell>
                        <TableCell>{getModuleBadge(permission.module)}</TableCell>
                        <TableCell className="max-w-xs truncate">{permission.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(permission.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
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
          </CardContent>
        </Card>
      )}

      {/* 用户权限 */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>用户权限</CardTitle>
                <CardDescription>
                  查看和管理用户权限分配
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">加载中...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户ID</TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>最后登录</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status === 'active' ? '正常' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '从未登录'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              {user.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

export default PermissionManagement;