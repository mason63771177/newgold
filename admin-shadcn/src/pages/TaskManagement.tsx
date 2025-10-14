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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  CheckSquare,
  Clock,
  DollarSign,
  Activity,
  Target
} from 'lucide-react';
import { taskAPI } from '@/services/api';
import type { Task, TaskStats } from '@/services/api.d';

/**
 * 任务管理页面
 * 提供任务列表查看、创建、编辑、删除等功能
 */
const TaskManagement: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<TaskStats>({
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalRewards: 0
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily',
    reward: 0,
    status: 'active'
  });

  // 筛选和分页状态
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * 加载任务统计数据
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTaskStats();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('加载任务统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载任务列表
   */
  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTasks();
      if (response.success) {
        setTasks(response.data || []);
        setTotalPages(Math.ceil((response.data?.length || 0) / pageSize));
      }
    } catch (error) {
      console.error('加载任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 创建任务
   */
  const handleCreateTask = async () => {
    try {
      const response = await taskAPI.createTask(formData);
      if (response.success) {
        setIsDialogOpen(false);
        resetForm();
        await loadTasks();
        await loadStatistics();
      }
    } catch (error) {
      console.error('创建任务失败:', error);
    }
  };

  /**
   * 更新任务
   */
  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      const response = await taskAPI.updateTask(editingTask.id, formData);
      if (response.success) {
        setIsDialogOpen(false);
        setEditingTask(null);
        resetForm();
        await loadTasks();
        await loadStatistics();
      }
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  /**
   * 删除任务
   */
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await taskAPI.deleteTask(taskId);
      if (response.success) {
        await loadTasks();
        await loadStatistics();
      }
    } catch (error) {
      console.error('删除任务失败:', error);
    }
  };

  /**
   * 重置表单
   */
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'daily',
      reward: 0,
      status: 'active'
    });
  };

  /**
   * 打开编辑对话框
   */
  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      type: task.type,
      reward: task.reward,
      status: task.status
    });
    setIsDialogOpen(true);
  };

  /**
   * 打开创建对话框
   */
  const openCreateDialog = () => {
    setEditingTask(null);
    resetForm();
    setIsDialogOpen(true);
  };

  /**
   * 获取任务状态徽章
   */
  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">进行中</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">已完成</Badge>;
      case 'paused':
        return <Badge variant="secondary">已暂停</Badge>;
      case 'expired':
        return <Badge variant="destructive">已过期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * 获取任务类型徽章
   */
  const getTaskTypeBadge = (type: string) => {
    switch (type) {
      case 'daily':
        return <Badge className="bg-orange-100 text-orange-800">每日任务</Badge>;
      case 'weekly':
        return <Badge className="bg-purple-100 text-purple-800">每周任务</Badge>;
      case 'monthly':
        return <Badge className="bg-indigo-100 text-indigo-800">每月任务</Badge>;
      case 'special':
        return <Badge className="bg-yellow-100 text-yellow-800">特殊任务</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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
   * 处理类型筛选
   */
  const handleTypeFilter = (type: string) => {
    setFilters({ ...filters, type });
    setCurrentPage(1);
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadStatistics();
    loadTasks();
  }, [currentPage, filters]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">任务管理</h1>
          <p className="text-muted-foreground">
            创建和管理用户任务
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadStatistics} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            创建任务
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              进行中: {statistics.activeTasks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              完成率: {statistics.totalTasks > 0 ? ((statistics.completedTasks / statistics.totalTasks) * 100).toFixed(1) : 0}%
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
              累计发放奖励
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃任务</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              正在进行的任务
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>任务列表</CardTitle>
              <CardDescription>
                查看和管理所有任务
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
                  placeholder="搜索任务标题或描述..."
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
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="paused">已暂停</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.type} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="daily">每日任务</SelectItem>
                <SelectItem value="weekly">每周任务</SelectItem>
                <SelectItem value="monthly">每月任务</SelectItem>
                <SelectItem value="special">特殊任务</SelectItem>
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
                    <TableHead>任务ID</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>奖励</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.id}</TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                      <TableCell>{getTaskTypeBadge(task.type)}</TableCell>
                      <TableCell>{task.reward.toFixed(4)} USDT</TableCell>
                      <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
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

          {tasks.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的任务
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

export default TaskManagement;