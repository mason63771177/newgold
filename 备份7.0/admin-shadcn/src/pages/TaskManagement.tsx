import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CheckSquare, Plus, Edit, Trash2, Users, Gift } from 'lucide-react';

// 任务类型定义
interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: 'active' | 'inactive';
  completedCount: number;
  totalCount: number;
  type: 'novice' | 'quiz' | 'master';
}

/**
 * 任务管理页面组件
 * 管理新手任务、答题任务、大神任务的配置和完成情况
 */
const TaskManagement: React.FC = () => {
  // 模拟任务数据
  const [noviceTasks, setNoviceTasks] = useState<Task[]>([
    { id: '1', title: '完成账号激活', description: '转账100 USDT激活账号', reward: 10, status: 'active', completedCount: 156, totalCount: 200, type: 'novice' },
    { id: '2', title: '邀请1位好友', description: '成功邀请1位好友注册', reward: 20, status: 'active', completedCount: 89, totalCount: 200, type: 'novice' },
    { id: '3', title: '完成首次任务', description: '完成第一个任务获得奖励', reward: 15, status: 'active', completedCount: 134, totalCount: 200, type: 'novice' },
  ]);

  const [quizTasks, setQuizTasks] = useState<Task[]>([
    { id: '4', title: '区块链基础知识', description: '完成区块链基础知识答题', reward: 25, status: 'active', completedCount: 67, totalCount: 100, type: 'quiz' },
    { id: '5', title: 'DeFi协议理解', description: '完成DeFi协议相关答题', reward: 30, status: 'active', completedCount: 45, totalCount: 100, type: 'quiz' },
  ]);

  const [masterTasks, setMasterTasks] = useState<Task[]>([
    { id: '6', title: '团队建设达人', description: '邀请10位有效用户', reward: 100, status: 'active', completedCount: 23, totalCount: 50, type: 'master' },
    { id: '7', title: '社区推广专家', description: '团队总人数达到50人', reward: 200, status: 'active', completedCount: 12, totalCount: 50, type: 'master' },
    { id: '8', title: '收益分享王者', description: '团队总收益达到1000 USDT', reward: 300, status: 'active', completedCount: 8, totalCount: 50, type: 'master' },
  ]);

  const [activeTab, setActiveTab] = useState('novice');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  /**
   * 获取任务状态徽章样式
   */
  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default">启用</Badge>
    ) : (
      <Badge variant="secondary">禁用</Badge>
    );
  };

  /**
   * 获取完成率徽章样式
   */
  const getCompletionBadge = (completed: number, total: number) => {
    const rate = (completed / total) * 100;
    if (rate >= 80) return <Badge variant="default">{rate.toFixed(1)}%</Badge>;
    if (rate >= 50) return <Badge variant="secondary">{rate.toFixed(1)}%</Badge>;
    return <Badge variant="outline">{rate.toFixed(1)}%</Badge>;
  };

  /**
   * 处理编辑任务
   */
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  /**
   * 处理删除任务
   */
  const handleDeleteTask = (taskId: string, type: string) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      if (type === 'novice') {
        setNoviceTasks(prev => prev.filter(task => task.id !== taskId));
      } else if (type === 'quiz') {
        setQuizTasks(prev => prev.filter(task => task.id !== taskId));
      } else if (type === 'master') {
        setMasterTasks(prev => prev.filter(task => task.id !== taskId));
      }
    }
  };

  /**
   * 处理保存任务
   */
  const handleSaveTask = () => {
    // 这里应该调用API保存任务
    console.log('保存任务');
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  /**
   * 渲染任务表格
   */
  const renderTaskTable = (tasks: Task[], type: string) => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>任务名称</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>奖励 (USDT)</TableHead>
            <TableHead>完成情况</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{task.description}</TableCell>
              <TableCell>{task.reward}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {task.completedCount}/{task.totalCount}
                  </span>
                  {getCompletionBadge(task.completedCount, task.totalCount)}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(task.status)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTask(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id, type)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">任务管理</h1>
          <p className="text-muted-foreground">
            管理新手任务、答题任务、大神任务的配置和完成情况
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加任务
        </Button>
      </div>

      {/* 任务统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新手任务</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{noviceTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃任务数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">答题任务</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃任务数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">大神任务</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{masterTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃任务数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总完成率</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.5%</div>
            <p className="text-xs text-muted-foreground">
              所有任务平均完成率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <div className="flex space-x-1 rounded-lg bg-muted p-1 mb-4">
              <Button
                variant={activeTab === 'novice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('novice')}
                className="flex-1"
              >
                新手任务
              </Button>
              <Button
                variant={activeTab === 'quiz' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('quiz')}
                className="flex-1"
              >
                答题任务
              </Button>
              <Button
                variant={activeTab === 'master' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('master')}
                className="flex-1"
              >
                大神任务
              </Button>
            </div>
            <div className="space-y-4">
              <div className="rounded-md border">
                {activeTab === 'novice' && renderTaskTable(noviceTasks, 'novice')}
                {activeTab === 'quiz' && renderTaskTable(quizTasks, 'quiz')}
                {activeTab === 'master' && renderTaskTable(masterTasks, 'master')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 任务编辑弹窗 */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{editingTask ? '编辑任务' : '添加任务'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                配置任务的基本信息和奖励设置
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">任务名称</Label>
                <Input
                  id="title"
                  defaultValue={editingTask?.title || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">任务描述</Label>
                <Textarea
                  id="description"
                  defaultValue={editingTask?.description || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward">奖励 (USDT)</Label>
                <Input
                  id="reward"
                  type="number"
                  defaultValue={editingTask?.reward || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select defaultValue={editingTask?.status || 'active'}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveTask}>
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

export { TaskManagement };
export default TaskManagement;