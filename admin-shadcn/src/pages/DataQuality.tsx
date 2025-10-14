import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  Eye,
  Settings,
  Clock,
  Plus
} from 'lucide-react';

/**
 * 数据质量检查项接口
 */
interface DataQualityCheck {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'warning' | 'running';
  score: number;
  lastRun: string;
  description: string;
  affectedRecords: number;
  totalRecords: number;
}

/**
 * 数据完整性验证接口
 */
interface DataIntegrityCheck {
  id: string;
  tableName: string;
  checkType: string;
  status: 'passed' | 'failed' | 'warning';
  errorCount: number;
  totalRecords: number;
  lastCheck: string;
  details: string;
}

/**
 * 质量报告接口
 */
interface QualityReport {
  id: string;
  reportName: string;
  generatedAt: string;
  overallScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  issuesFound: number;
  recordsAnalyzed: number;
  categories: {
    consistency: number;
    completeness: number;
    accuracy: number;
    validity: number;
  };
}

/**
 * 数据质量管理组件
 */
const DataQuality: React.FC = () => {
  const [activeTab, setActiveTab] = useState('consistency-check');
  const [loading, setLoading] = useState(false);

  // 数据一致性检查状态
  const [consistencyChecks, setConsistencyChecks] = useState<DataQualityCheck[]>([
    {
      id: '1',
      name: '用户钱包余额一致性',
      category: '钱包数据',
      status: 'passed',
      score: 98.5,
      lastRun: '2024-01-15 14:30:00',
      description: '检查用户钱包余额与交易记录的一致性',
      affectedRecords: 15,
      totalRecords: 10000
    },
    {
      id: '2',
      name: '团队成员数量一致性',
      category: '团队数据',
      status: 'warning',
      score: 85.2,
      lastRun: '2024-01-15 14:25:00',
      description: '检查团队成员数量与实际邀请记录的一致性',
      affectedRecords: 148,
      totalRecords: 2500
    },
    {
      id: '3',
      name: '任务完成状态一致性',
      category: '任务数据',
      status: 'failed',
      score: 72.8,
      lastRun: '2024-01-15 14:20:00',
      description: '检查任务完成状态与奖励发放记录的一致性',
      affectedRecords: 342,
      totalRecords: 5600
    }
  ]);

  // 数据完整性验证状态
  const [integrityChecks, setIntegrityChecks] = useState<DataIntegrityCheck[]>([
    {
      id: '1',
      tableName: 'users',
      checkType: '必填字段检查',
      status: 'passed',
      errorCount: 0,
      totalRecords: 10000,
      lastCheck: '2024-01-15 14:30:00',
      details: '所有用户记录的必填字段完整'
    },
    {
      id: '2',
      tableName: 'wallet_transactions',
      checkType: '外键约束检查',
      status: 'warning',
      errorCount: 23,
      totalRecords: 45000,
      lastCheck: '2024-01-15 14:25:00',
      details: '发现23条交易记录的用户ID不存在'
    },
    {
      id: '3',
      tableName: 'red_packets',
      checkType: '数据格式检查',
      status: 'failed',
      errorCount: 156,
      totalRecords: 8900,
      lastCheck: '2024-01-15 14:20:00',
      details: '发现156条红包记录的金额格式不正确'
    }
  ]);

  // 质量报告状态
  const [qualityReports, setQualityReports] = useState<QualityReport[]>([
    {
      id: '1',
      reportName: '每日数据质量报告',
      generatedAt: '2024-01-15 14:00:00',
      overallScore: 92.3,
      status: 'excellent',
      issuesFound: 45,
      recordsAnalyzed: 125000,
      categories: {
        consistency: 95.2,
        completeness: 98.1,
        accuracy: 89.5,
        validity: 86.8
      }
    },
    {
      id: '2',
      reportName: '每周数据质量报告',
      generatedAt: '2024-01-14 00:00:00',
      overallScore: 88.7,
      status: 'good',
      issuesFound: 127,
      recordsAnalyzed: 875000,
      categories: {
        consistency: 91.3,
        completeness: 94.2,
        accuracy: 85.1,
        validity: 84.2
      }
    }
  ]);

  /**
   * 运行数据质量检查
   */
  const runQualityCheck = async (checkId: string) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      // 这里应该调用实际的API
      console.log('运行数据质量检查:', checkId);
    } catch (error) {
      console.error('运行数据质量检查失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 生成质量报告
   */
  const generateReport = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 3000));
      // 这里应该调用实际的API
      console.log('生成质量报告');
    } catch (error) {
      console.error('生成质量报告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取状态徽章样式
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />通过</Badge>;
      case 'warning':
      case 'good':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />警告</Badge>;
      case 'failed':
      case 'poor':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />失败</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />运行中</Badge>;
      case 'fair':
        return <Badge className="bg-orange-100 text-orange-800">一般</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  /**
   * 获取质量分数颜色
   */
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">数据质量管理</h1>
          <p className="text-gray-600 mt-2">监控和管理系统数据的一致性、完整性和准确性</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={generateReport} disabled={loading}>
            <FileText className={`w-4 h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
            生成报告
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">整体质量分数</p>
                <p className="text-2xl font-bold text-green-600">92.3%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">发现问题</p>
                <p className="text-2xl font-bold text-yellow-600">45</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已分析记录</p>
                <p className="text-2xl font-bold text-blue-600">125K</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">最后检查</p>
                <p className="text-2xl font-bold text-purple-600">2小时前</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consistency-check">一致性检查</TabsTrigger>
          <TabsTrigger value="integrity-check">完整性验证</TabsTrigger>
          <TabsTrigger value="quality-reports">质量报告</TabsTrigger>
        </TabsList>

        {/* 一致性检查标签页 */}
        <TabsContent value="consistency-check" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  数据一致性检查
                </CardTitle>
                <Button onClick={() => runQualityCheck('all')} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  运行所有检查
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>检查项目</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>质量分数</TableHead>
                    <TableHead>影响记录</TableHead>
                    <TableHead>最后运行</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consistencyChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{check.name}</div>
                          <div className="text-sm text-gray-500">{check.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{check.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(check.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={check.score} className="w-16" />
                          <span className={`text-sm font-medium ${getScoreColor(check.score)}`}>
                            {check.score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{check.affectedRecords}</span>
                          <span className="text-gray-500"> / {check.totalRecords}</span>
                        </div>
                      </TableCell>
                      <TableCell>{check.lastRun}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => runQualityCheck(check.id)}
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

        {/* 完整性验证标签页 */}
        <TabsContent value="integrity-check" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                数据完整性验证
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>数据表</TableHead>
                    <TableHead>检查类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>错误数量</TableHead>
                    <TableHead>总记录数</TableHead>
                    <TableHead>最后检查</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrityChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell className="font-mono">{check.tableName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{check.checkType}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(check.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${check.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {check.errorCount}
                          </span>
                          {check.errorCount > 0 && (
                            <Progress 
                              value={(check.errorCount / check.totalRecords) * 100} 
                              className="w-16" 
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{check.totalRecords.toLocaleString()}</TableCell>
                      <TableCell>{check.lastCheck}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
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

        {/* 质量报告标签页 */}
        <TabsContent value="quality-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  数据质量报告
                </CardTitle>
                <Button onClick={generateReport} disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  生成新报告
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {qualityReports.map((report) => (
                  <Card key={report.id} className="border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{report.reportName}</CardTitle>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-sm text-gray-500">生成时间: {report.generatedAt}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 整体分数 */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">整体质量分数</span>
                          <span className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                            {report.overallScore}%
                          </span>
                        </div>

                        {/* 统计信息 */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">发现问题:</span>
                            <span className="ml-2 font-medium">{report.issuesFound}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">分析记录:</span>
                            <span className="ml-2 font-medium">{report.recordsAnalyzed.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* 分类分数 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>一致性</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={report.categories.consistency} className="w-16" />
                              <span className="font-medium">{report.categories.consistency}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>完整性</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={report.categories.completeness} className="w-16" />
                              <span className="font-medium">{report.categories.completeness}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>准确性</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={report.categories.accuracy} className="w-16" />
                              <span className="font-medium">{report.categories.accuracy}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>有效性</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={report.categories.validity} className="w-16" />
                              <span className="font-medium">{report.categories.validity}%</span>
                            </div>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex space-x-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="w-4 h-4 mr-2" />
                            查看详情
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            下载报告
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataQuality;