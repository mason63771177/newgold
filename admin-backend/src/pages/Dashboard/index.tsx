import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Progress, Tag, Space, Button, DatePicker, Select } from 'antd'
import {
  UserOutlined,
  WalletOutlined,
  TransactionOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { userApi, walletApi, transactionApi, monitoringApi } from '@/services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

/**
 * 统计数据接口
 */
interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalWallets: number
  totalBalance: number
  todayTransactions: number
  pendingTransactions: number
  systemStatus: 'healthy' | 'warning' | 'error'
}

/**
 * 图表数据接口
 */
interface ChartData {
  date: string
  users: number
  transactions: number
  volume: number
}

/**
 * 仪表板页面组件
 */
const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalWallets: 0,
    totalBalance: 0,
    todayTransactions: 0,
    pendingTransactions: 0,
    systemStatus: 'healthy',
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ])

  /**
   * 加载仪表板数据
   */
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // 并行加载各种数据
      const [userStats, transactionStats, systemStatus, transactions] = await Promise.all([
        userApi.getUserStats(),
        transactionApi.getTransactionStatistics(),
        monitoringApi.getSystemStatus(),
        transactionApi.getTransactions({ page: 1, limit: 10 }),
      ])

      // 设置统计数据
      setStats({
        totalUsers: (userStats as any)?.totalUsers || 0,
        activeUsers: (userStats as any)?.activeUsers || 0,
        totalWallets: (userStats as any)?.totalWallets || 0,
        totalBalance: (transactionStats as any)?.totalBalance || 0,
        todayTransactions: (transactionStats as any)?.todayTransactions || 0,
        pendingTransactions: (transactionStats as any)?.pendingTransactions || 0,
        systemStatus: (systemStatus as any)?.status || 'healthy',
      })

      // 设置最近交易
      setRecentTransactions((transactions as any)?.list || [])

      // 生成模拟图表数据（实际项目中应从API获取）
      const mockChartData = generateMockChartData()
      setChartData(mockChartData)
      
    } catch (error) {
      console.error('加载仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 生成模拟图表数据
   */
  const generateMockChartData = (): ChartData[] => {
    const data: ChartData[] = []
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('MM-DD')
      data.push({
        date,
        users: Math.floor(Math.random() * 100) + 50,
        transactions: Math.floor(Math.random() * 200) + 100,
        volume: Math.floor(Math.random() * 10000) + 5000,
      })
    }
    return data
  }

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    loadDashboardData()
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // 最近交易表格列定义
  const transactionColumns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          deposit: { color: 'green', text: '充值' },
          withdraw: { color: 'red', text: '提现' },
          transfer: { color: 'blue', text: '转账' },
          reward: { color: 'orange', text: '奖励' },
        }
        const config = typeMap[type] || { color: 'default', text: type }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'processing', text: '待处理' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '失败' },
        }
        const config = statusMap[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>仪表板</h1>
          <p style={{ margin: '8px 0 0', color: '#666' }}>
            系统概览和关键指标监控
          </p>
        </div>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]])
              }
            }}
            format="YYYY-MM-DD"
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.activeUsers}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${stats.totalUsers}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="钱包总数"
              value={stats.totalWallets}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总余额"
              value={stats.totalBalance}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
              suffix="¥"
            />
          </Card>
        </Col>
      </Row>

      {/* 第二行统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日交易"
              value={stats.todayTransactions}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理交易"
              value={stats.pendingTransactions}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>系统状态</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {stats.systemStatus === 'healthy' && <span style={{ color: '#52c41a' }}>正常</span>}
                  {stats.systemStatus === 'warning' && <span style={{ color: '#fa8c16' }}>警告</span>}
                  {stats.systemStatus === 'error' && <span style={{ color: '#f5222d' }}>异常</span>}
                </div>
              </div>
              <Progress
                type="circle"
                percent={stats.systemStatus === 'healthy' ? 100 : stats.systemStatus === 'warning' ? 75 : 25}
                width={60}
                strokeColor={stats.systemStatus === 'healthy' ? '#52c41a' : stats.systemStatus === 'warning' ? '#fa8c16' : '#f5222d'}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃率"
              value={(stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0)}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="用户增长趋势" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#1890ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="交易量统计" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transactions" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 最近交易 */}
      <Card title="最近交易" loading={loading}>
        <Table
          columns={transactionColumns}
          dataSource={recentTransactions}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  )
}

export default Dashboard