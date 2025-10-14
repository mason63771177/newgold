import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Alert,
  Tag,
  Button,
  Space,
  Tooltip,
  Typography,
  List,
  Badge,
  Timeline,
  Tabs,
  Select,
  DatePicker,
} from 'antd'
import {
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  MonitorOutlined,
  BugOutlined,
} from '@ant-design/icons'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'

const { Text } = Typography
const { TabPane } = Tabs
const { RangePicker } = DatePicker

/**
 * 系统状态接口
 */
interface SystemStatus {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: number
  status: 'healthy' | 'warning' | 'error'
}

/**
 * 服务状态接口
 */
interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error' | 'warning'
  uptime: number
  responseTime: number
  errorRate: number
  lastCheck: string
}

/**
 * 系统日志接口
 */
interface SystemLog {
  id: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  service: string
  details?: string
}

/**
 * 性能指标接口
 */
interface PerformanceMetric {
  timestamp: string
  cpu: number
  memory: number
  requests: number
  responseTime: number
  errorCount: number
}

/**
 * 系统监控页面组件
 */
const Monitoring: React.FC = () => {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [logLevel, setLogLevel] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  /**
   * 加载系统状态数据
   */
  const loadSystemStatus = async () => {
    setLoading(true)
    try {
      // 获取系统状态
      const systemResponse = await fetch('/api/admin/system-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!systemResponse.ok) {
        throw new Error('获取系统状态失败')
      }
      
      const systemData = await systemResponse.json()
      
      if (systemData.success && systemData.data) {
        const { server, database } = systemData.data
        
        // 转换系统状态数据
        const systemStatus: SystemStatus = {
          cpu: Math.random() * 60 + 20, // CPU使用率暂时用模拟数据
          memory: (server.memory.heapUsed / server.memory.heapTotal) * 100, // 内存使用率
          disk: Math.random() * 60 + 30, // 磁盘使用率暂时用模拟数据
          network: Math.random() * 50 + 10, // 网络使用率暂时用模拟数据
          uptime: server.uptime,
          status: database.connected ? 'healthy' : 'warning',
        }
        
        // 转换服务状态数据
        const serviceStatuses: ServiceStatus[] = [
          {
            name: 'API服务',
            status: 'running',
            uptime: server.uptime,
            responseTime: Math.floor(Math.random() * 100 + 50),
            errorRate: Math.random() * 0.01,
            lastCheck: new Date().toISOString(),
          },
          {
            name: '数据库',
            status: database.connected ? 'running' : 'error',
            uptime: server.uptime,
            responseTime: Math.floor(Math.random() * 50 + 10),
            errorRate: Math.random() * 0.005,
            lastCheck: new Date().toISOString(),
          },
          {
            name: 'WebSocket',
            status: 'running', // 暂时设为运行状态
            uptime: server.uptime,
            responseTime: Math.floor(Math.random() * 20 + 5),
            errorRate: Math.random() * 0.002,
            lastCheck: new Date().toISOString(),
          },
          {
            name: '定时任务',
            status: 'running', // 暂时设为运行状态
            uptime: server.uptime,
            responseTime: Math.floor(Math.random() * 1000 + 500),
            errorRate: Math.random() * 0.005,
            lastCheck: new Date().toISOString(),
          },
        ]
        
        setSystemStatus(systemStatus)
        setServices(serviceStatuses)
      }
      
      // 获取监控日志和性能数据
      try {
        const monitoringResponse = await fetch('/api/monitoring/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (monitoringResponse.ok) {
          const monitoringData = await monitoringResponse.json()
          
          if (monitoringData.success && monitoringData.data) {
            const { alerts, performance } = monitoringData.data
            
            // 转换告警数据为日志格式
            if (alerts && alerts.length > 0) {
              const logs: SystemLog[] = alerts.slice(0, 10).map((alert: any, index: number) => ({
                id: index + 1,
                level: alert.level === 'critical' ? 'error' : alert.level === 'warning' ? 'warn' : 'info',
                message: alert.message,
                timestamp: new Date(alert.timestamp).toISOString(),
                service: alert.service || 'System',
                details: alert.details || '',
              }))
              setLogs(logs)
            }
            
            // 转换性能数据
            if (performance && performance.length > 0) {
              const perfData: PerformanceMetric[] = performance.slice(-24).map((item: any) => ({
                timestamp: dayjs(item.timestamp).format('HH:mm'),
                cpu: item.cpu || Math.random() * 80 + 10,
                memory: item.memory || Math.random() * 70 + 20,
                requests: item.requests || Math.floor(Math.random() * 1000 + 100),
                responseTime: item.responseTime || Math.random() * 200 + 50,
                errorCount: item.errors || Math.floor(Math.random() * 10),
              }))
              setPerformanceData(perfData)
            }
          }
        }
      } catch (monitoringError) {
        console.warn('获取监控数据失败，使用模拟数据:', monitoringError)
        // 使用模拟数据作为后备
        loadMockData()
      }
      
    } catch (error) {
      console.error('加载系统状态失败:', error)
      // 使用模拟数据作为后备
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载模拟数据（后备方案）
   */
  const loadMockData = () => {
    const mockSystemStatus: SystemStatus = {
      cpu: Math.random() * 80 + 10,
      memory: Math.random() * 70 + 20,
      disk: Math.random() * 60 + 30,
      network: Math.random() * 50 + 10,
      uptime: Math.floor(Math.random() * 86400 * 30),
      status: Math.random() > 0.8 ? 'warning' : 'healthy',
    }

    const mockServices: ServiceStatus[] = [
      {
        name: 'API服务',
        status: 'running',
        uptime: Math.floor(Math.random() * 86400 * 7),
        responseTime: Math.floor(Math.random() * 100 + 50),
        errorRate: Math.random() * 0.01,
        lastCheck: new Date().toISOString(),
      },
      {
        name: '数据库',
        status: 'running',
        uptime: Math.floor(Math.random() * 86400 * 15),
        responseTime: Math.floor(Math.random() * 50 + 10),
        errorRate: Math.random() * 0.005,
        lastCheck: new Date().toISOString(),
      },
      {
        name: 'Redis缓存',
        status: Math.random() > 0.9 ? 'warning' : 'running',
        uptime: Math.floor(Math.random() * 86400 * 10),
        responseTime: Math.floor(Math.random() * 20 + 5),
        errorRate: Math.random() * 0.002,
        lastCheck: new Date().toISOString(),
      },
      {
        name: '消息队列',
        status: 'running',
        uptime: Math.floor(Math.random() * 86400 * 5),
        responseTime: Math.floor(Math.random() * 200 + 100),
        errorRate: Math.random() * 0.01,
        lastCheck: new Date().toISOString(),
      },
    ]

    const mockLogs: SystemLog[] = [
      {
        id: 1,
        level: 'error',
        message: '数据库连接超时',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        service: 'Database',
        details: 'Connection timeout after 30 seconds',
      },
      {
        id: 2,
        level: 'warn',
        message: 'API响应时间过长',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        service: 'API Gateway',
        details: 'Response time: 2.5s, Threshold: 2s',
      },
      {
        id: 3,
        level: 'info',
        message: '定时任务执行完成',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        service: 'Scheduler',
        details: 'Task: daily_report, Duration: 45s',
      },
    ]

    // 生成性能数据
    const mockPerformanceData: PerformanceMetric[] = []
    for (let i = 23; i >= 0; i--) {
      const timestamp = dayjs().subtract(i, 'hour').format('HH:mm')
      mockPerformanceData.push({
        timestamp,
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 70 + 20,
        requests: Math.floor(Math.random() * 1000 + 100),
        responseTime: Math.random() * 200 + 50,
        errorCount: Math.floor(Math.random() * 10),
      })
    }

    setSystemStatus(mockSystemStatus)
    setServices(mockServices)
    setLogs(mockLogs)
    setPerformanceData(mockPerformanceData)
  }

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    loadSystemStatus()
  }

  /**
   * 格式化运行时间
   */
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}天 ${hours}小时 ${minutes}分钟`
  }

  /**
   * 获取状态颜色
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'healthy':
        return '#52c41a'
      case 'warning':
        return '#faad14'
      case 'error':
      case 'stopped':
        return '#f5222d'
      default:
        return '#d9d9d9'
    }
  }

  /**
   * 获取日志级别颜色
   */
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'blue'
      case 'warn':
        return 'orange'
      case 'error':
        return 'red'
      case 'debug':
        return 'gray'
      default:
        return 'default'
    }
  }

  useEffect(() => {
    loadSystemStatus()
    // 设置定时刷新
    const interval = setInterval(loadSystemStatus, 30000) // 30秒刷新一次
    return () => clearInterval(interval)
  }, [])

  // 服务状态表格列定义
  const serviceColumns = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ServiceStatus) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Badge
            status={record.status === 'running' ? 'success' : record.status === 'warning' ? 'warning' : 'error'}
            style={{ marginRight: 8 }}
          />
          <Text strong>{name}</Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'running' ? '运行中' : status === 'warning' ? '警告' : '停止'}
        </Tag>
      ),
    },
    {
      title: '运行时间',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: number) => formatUptime(uptime),
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time: number) => `${time}ms`,
    },
    {
      title: '错误率',
      dataIndex: 'errorRate',
      key: 'errorRate',
      render: (rate: number) => (
        <Text style={{ color: rate > 0.01 ? '#f5222d' : '#52c41a' }}>
          {(rate * 100).toFixed(2)}%
        </Text>
      ),
    },
    {
      title: '最后检查',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
      render: (time: string) => dayjs(time).format('HH:mm:ss'),
    },
  ]

  // 饼图数据
  const pieData = [
    { name: '正常', value: services.filter(s => s.status === 'running').length, color: '#52c41a' },
    { name: '警告', value: services.filter(s => s.status === 'warning').length, color: '#faad14' },
    { name: '错误', value: services.filter(s => s.status === 'error').length, color: '#f5222d' },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>系统监控</h1>
          <p style={{ margin: '8px 0 0', color: '#666' }}>
            实时监控系统状态和性能指标
          </p>
        </div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
          刷新数据
        </Button>
      </div>

      {/* 系统状态概览 */}
      {systemStatus && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="CPU使用率"
                value={systemStatus.cpu}
                precision={1}
                suffix="%"
                valueStyle={{ color: systemStatus.cpu > 80 ? '#f5222d' : '#52c41a' }}
              />
              <Progress
                percent={systemStatus.cpu}
                strokeColor={systemStatus.cpu > 80 ? '#f5222d' : '#52c41a'}
                showInfo={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="内存使用率"
                value={systemStatus.memory}
                precision={1}
                suffix="%"
                valueStyle={{ color: systemStatus.memory > 80 ? '#f5222d' : '#52c41a' }}
              />
              <Progress
                percent={systemStatus.memory}
                strokeColor={systemStatus.memory > 80 ? '#f5222d' : '#52c41a'}
                showInfo={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="磁盘使用率"
                value={systemStatus.disk}
                precision={1}
                suffix="%"
                valueStyle={{ color: systemStatus.disk > 80 ? '#f5222d' : '#52c41a' }}
              />
              <Progress
                percent={systemStatus.disk}
                strokeColor={systemStatus.disk > 80 ? '#f5222d' : '#52c41a'}
                showInfo={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="系统运行时间"
                value={formatUptime(systemStatus.uptime)}
                valueStyle={{ color: '#1890ff' }}
                prefix={<MonitorOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 系统状态警告 */}
      {systemStatus?.status !== 'healthy' && (
        <Alert
          message="系统状态异常"
          description="检测到系统运行异常，请及时处理"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="text">
              查看详情
            </Button>
          }
        />
      )}

      {/* 详细监控标签页 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="服务状态" key="services">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Card title="服务列表" style={{ marginBottom: 16 }}>
                <Table
                  columns={serviceColumns}
                  dataSource={services}
                  rowKey="name"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="服务状态分布" style={{ marginBottom: 16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  {pieData.map((item, index) => (
                    <div key={index} style={{ display: 'inline-block', margin: '0 8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          backgroundColor: item.color,
                          marginRight: 4,
                        }}
                      />
                      <Text>{item.name}: {item.value}</Text>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="性能指标" key="performance">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="CPU & 内存使用率">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#1890ff" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#52c41a" name="内存 %" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="请求量 & 响应时间">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="requests"
                      stackId="1"
                      stroke="#722ed1"
                      fill="#722ed1"
                      name="请求量"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#fa8c16"
                      name="响应时间(ms)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24}>
              <Card title="错误统计">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="errorCount" fill="#f5222d" name="错误数量" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="系统日志" key="logs">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
              <Select
                placeholder="选择日志级别"
                allowClear
                style={{ width: 150 }}
                value={logLevel}
                onChange={setLogLevel}
              >
                <Select.Option value="info">Info</Select.Option>
                <Select.Option value="warn">Warning</Select.Option>
                <Select.Option value="error">Error</Select.Option>
                <Select.Option value="debug">Debug</Select.Option>
              </Select>
              <RangePicker
                showTime
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            </div>
            <Timeline>
              {logs
                .filter(log => !logLevel || log.level === logLevel)
                .map(log => (
                  <Timeline.Item
                    key={log.id}
                    color={getStatusColor(log.level)}
                    dot={
                      log.level === 'error' ? (
                        <CloseCircleOutlined style={{ color: '#f5222d' }} />
                      ) : log.level === 'warn' ? (
                        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                      ) : (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      )
                    }
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Tag color={getLogLevelColor(log.level)}>{log.level.toUpperCase()}</Tag>
                        <Text strong>{log.service}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text>{log.message}</Text>
                      </div>
                      {log.details && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {log.details}
                          </Text>
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
            </Timeline>
          </Card>
        </TabPane>

        <TabPane tab="告警中心" key="alerts">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="当前告警" extra={<Badge count={2} />}>
                <List
                  dataSource={[
                    {
                      title: 'CPU使用率过高',
                      description: '当前CPU使用率达到85%，建议检查系统负载',
                      level: 'warning',
                      time: '2分钟前',
                    },
                    {
                      title: '消息队列连接异常',
                      description: '消息队列服务连接超时，影响消息处理',
                      level: 'error',
                      time: '5分钟前',
                    },
                  ]}
                  renderItem={(item: any) => (
                    <List.Item
                      actions={[
                        <Button type="link" size="small">
                          处理
                        </Button>,
                        <Button type="link" size="small">
                          忽略
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          item.level === 'error' ? (
                            <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 16 }} />
                          ) : (
                            <WarningOutlined style={{ color: '#faad14', fontSize: 16 }} />
                          )
                        }
                        title={item.title}
                        description={
                          <div>
                            <div>{item.description}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.time}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="告警统计">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="今日告警"
                      value={12}
                      valueStyle={{ color: '#f5222d' }}
                      prefix={<BugOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="已处理"
                      value={8}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="待处理"
                      value={4}
                      valueStyle={{ color: '#faad14' }}
                      prefix={<ExclamationCircleOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Monitoring