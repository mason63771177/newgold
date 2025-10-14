import React, { useEffect, useState } from 'react'
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  message,
  Descriptions,
  Row,
  Col,
  DatePicker,
  Form,
  Typography,
  Alert,
  Tabs,
  Badge,
  Tooltip,
  Statistic,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { transactionApi, type TransactionDetail, type TransactionStatistics } from '@/services/api'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Text, Title } = Typography
const { TabPane } = Tabs

/**
 * 交易管理页面组件
 */
const Transactions: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [transactions, setTransactions] = useState<TransactionDetail[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<TransactionDetail[]>([])
  const [statistics, setStatistics] = useState<TransactionStatistics | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [pendingPagination, setPendingPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 筛选条件
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    riskLevel: '',
  })

  // 弹窗状态
  const [detailVisible, setDetailVisible] = useState(false)
  const [approvalVisible, setApprovalVisible] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null)
  const [transactionDetail, setTransactionDetail] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('all')

  const [form] = Form.useForm()

  /**
   * 加载交易列表
   */
  const loadTransactions = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pageSize,
        status: filters.status,
        type: filters.type,
        search: filters.search,
        startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
        riskLevel: filters.riskLevel,
      }

      const response = await transactionApi.getTransactions(params)
      setTransactions(response.transactions)
      setPagination({
        current: response.pagination.page,
        pageSize: response.pagination.limit,
        total: response.pagination.total,
      })
    } catch (error) {
      message.error('加载交易记录失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载待审核交易
   */
  const loadPendingTransactions = async (page = 1, pageSize = 20) => {
    setPendingLoading(true)
    try {
      const response = await transactionApi.getPendingTransactions({ page, limit: pageSize })
      setPendingTransactions(response.transactions)
      setPendingPagination({
        current: response.pagination.page,
        pageSize: response.pagination.limit,
        total: response.pagination.total,
      })
    } catch (error) {
      message.error('加载待审核交易失败')
    } finally {
      setPendingLoading(false)
    }
  }

  /**
   * 加载统计数据
   */
  const loadStatistics = async (period = 'today') => {
    try {
      const response = await transactionApi.getTransactionStatistics(period as any)
      setStatistics(response)
    } catch (error) {
      message.error('加载统计数据失败')
    }
  }

  /**
   * 查看交易详情
   */
  const handleViewDetail = async (record: TransactionDetail) => {
    try {
      const response = await transactionApi.getTransactionDetail(record.id)
      setTransactionDetail(response)
      setSelectedTransaction(record)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取交易详情失败')
    }
  }

  /**
   * 审核交易
   */
  const handleApproval = (record: TransactionDetail) => {
    setSelectedTransaction(record)
    setApprovalVisible(true)
    form.resetFields()
  }

  /**
   * 提交审核
   */
  const handleApprovalSubmit = async (values: { action: 'approve' | 'reject'; notes: string }) => {
    if (!selectedTransaction) return

    try {
      if (values.action === 'approve') {
        await transactionApi.approveTransaction(selectedTransaction.id, values.notes)
        message.success('交易审核通过')
      } else {
        await transactionApi.rejectTransaction(selectedTransaction.id, values.notes)
        message.success('交易已拒绝')
      }
      
      setApprovalVisible(false)
      loadTransactions(pagination.current, pagination.pageSize)
      loadPendingTransactions(pendingPagination.current, pendingPagination.pageSize)
      loadStatistics()
    } catch (error) {
      message.error('审核操作失败')
    }
  }

  /**
   * 风险评估
   */
  const handleRiskAssessment = async (record: TransactionDetail) => {
    try {
      const response = await transactionApi.assessTransactionRisk(record.id)
      message.success(`风险评估完成: ${response.riskLevel} (${response.riskScore}分)`)
      loadTransactions(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error('风险评估失败')
    }
  }

  /**
   * 重置筛选条件
   */
  const handleResetFilters = () => {
    setFilters({
      status: '',
      type: '',
      search: '',
      dateRange: null,
      riskLevel: '',
    })
  }

  /**
   * 应用筛选条件
   */
  const handleApplyFilters = () => {
    loadTransactions(1, pagination.pageSize)
  }

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户',
      key: 'user',
      width: 150,
      render: (record: TransactionDetail) => (
        <div>
          <div>{record.email}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.invite_code}
          </Text>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap = {
          deposit: { color: 'green', text: '充值' },
          withdrawal: { color: 'orange', text: '提现' },
          transfer: { color: 'blue', text: '转账' },
          reward: { color: 'purple', text: '奖励' },
          refund: { color: 'cyan', text: '退款' },
        }
        const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <Text strong style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount > 0 ? '+' : ''}{amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'processing', text: '处理中' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '失败' },
        }
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
        return <Badge status={config.color as any} text={config.text} />
      },
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (riskLevel: string, record: TransactionDetail) => {
        if (!riskLevel) return <Text type="secondary">未评估</Text>
        
        const riskMap = {
          low: { color: 'success', text: '低风险' },
          medium: { color: 'warning', text: '中风险' },
          high: { color: 'error', text: '高风险' },
        }
        const config = riskMap[riskLevel as keyof typeof riskMap]
        
        return (
          <Tooltip title={`风险评分: ${record.risk_score || 0}分`}>
            <Badge status={config.color as any} text={config.text} />
          </Tooltip>
        )
      },
    },
    {
      title: '审核状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'processing', text: '待审核' },
          approved: { color: 'success', text: '已通过' },
          rejected: { color: 'error', text: '已拒绝' },
        }
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
        return <Badge status={config.color as any} text={config.text} />
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: TransactionDetail) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.approval_status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleApproval(record)}
            >
              审核
            </Button>
          )}
          {!record.risk_level && (
            <Button
              type="link"
              size="small"
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleRiskAssessment(record)}
            >
              评估
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // 待审核交易表格列（简化版）
  const pendingColumns = columns.filter(col => 
    ['id', 'user', 'type', 'amount', 'risk_level', 'created_at', 'actions'].includes(col.key as string)
  )

  useEffect(() => {
    loadTransactions()
    loadPendingTransactions()
    loadStatistics()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>交易管理</Title>

      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日交易总数"
                value={statistics.basic.total_transactions}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日交易金额"
                value={statistics.basic.total_volume}
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审核交易"
                value={pendingPagination.total}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均交易金额"
                value={statistics.basic.avg_amount}
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="全部交易" key="all">
          <Card>
            {/* 筛选条件 */}
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={4}>
                  <Input
                    placeholder="搜索用户/哈希"
                    prefix={<SearchOutlined />}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </Col>
                <Col span={3}>
                  <Select
                    placeholder="交易状态"
                    value={filters.status}
                    onChange={(value) => setFilters({ ...filters, status: value })}
                    allowClear
                  >
                    <Option value="pending">处理中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="failed">失败</Option>
                  </Select>
                </Col>
                <Col span={3}>
                  <Select
                    placeholder="交易类型"
                    value={filters.type}
                    onChange={(value) => setFilters({ ...filters, type: value })}
                    allowClear
                  >
                    <Option value="deposit">充值</Option>
                    <Option value="withdrawal">提现</Option>
                    <Option value="transfer">转账</Option>
                    <Option value="reward">奖励</Option>
                    <Option value="refund">退款</Option>
                  </Select>
                </Col>
                <Col span={3}>
                  <Select
                    placeholder="风险等级"
                    value={filters.riskLevel}
                    onChange={(value) => setFilters({ ...filters, riskLevel: value })}
                    allowClear
                  >
                    <Option value="low">低风险</Option>
                    <Option value="medium">中风险</Option>
                    <Option value="high">高风险</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <RangePicker
                    value={filters.dateRange}
                    onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={5}>
                  <Space>
                    <Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilters}>
                      筛选
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                      重置
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>

            <Table
              columns={columns}
              dataSource={transactions}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                onChange: (page, pageSize) => {
                  loadTransactions(page, pageSize)
                },
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={`待审核 (${pendingPagination.total})`} key="pending">
          <Card>
            <Alert
              message="待审核交易"
              description="以下交易需要人工审核，请仔细核实交易信息后进行审核操作。"
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Table
              columns={pendingColumns}
              dataSource={pendingTransactions}
              rowKey="id"
              loading={pendingLoading}
              pagination={{
                current: pendingPagination.current,
                pageSize: pendingPagination.pageSize,
                total: pendingPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                onChange: (page, pageSize) => {
                  loadPendingTransactions(page, pageSize)
                },
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 交易详情弹窗 */}
      <Modal
        title="交易详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {transactionDetail && (
          <div>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="交易ID">{transactionDetail.transaction.id}</Descriptions.Item>
              <Descriptions.Item label="用户邮箱">{transactionDetail.transaction.email}</Descriptions.Item>
              <Descriptions.Item label="邀请码">{transactionDetail.transaction.invite_code}</Descriptions.Item>
              <Descriptions.Item label="交易类型">
                <Tag>{transactionDetail.transaction.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="交易金额">
                <Text strong style={{ fontSize: '16px' }}>
                  ¥{transactionDetail.transaction.amount.toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="交易状态">
                <Badge status="success" text={transactionDetail.transaction.status} />
              </Descriptions.Item>
              <Descriptions.Item label="余额变化">
                {transactionDetail.transaction.balance_before.toFixed(2)} → {transactionDetail.transaction.balance_after.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="当前余额">
                ¥{transactionDetail.transaction.current_balance?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="交易哈希" span={2}>
                <Text code>{transactionDetail.transaction.transaction_hash || '暂无'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(transactionDetail.transaction.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {transactionDetail.transaction.risk_level && (
              <>
                <Divider />
                <Descriptions title="风险评估" bordered column={2}>
                  <Descriptions.Item label="风险等级">
                    <Badge 
                      status={transactionDetail.transaction.risk_level === 'high' ? 'error' : 
                             transactionDetail.transaction.risk_level === 'medium' ? 'warning' : 'success'} 
                      text={transactionDetail.transaction.risk_level} 
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="风险评分">
                    {transactionDetail.transaction.risk_score}分
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {transactionDetail.relatedTransactions.length > 0 && (
              <>
                <Divider />
                <Title level={4}>相关交易</Title>
                <Table
                  size="small"
                  columns={[
                    { title: 'ID', dataIndex: 'id', key: 'id' },
                    { title: '类型', dataIndex: 'type', key: 'type' },
                    { title: '金额', dataIndex: 'amount', key: 'amount', render: (amount: number) => `¥${amount.toFixed(2)}` },
                    { title: '状态', dataIndex: 'status', key: 'status' },
                    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (time: string) => dayjs(time).format('MM-DD HH:mm') },
                  ]}
                  dataSource={transactionDetail.relatedTransactions}
                  rowKey="id"
                  pagination={false}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 审核弹窗 */}
      <Modal
        title="交易审核"
        open={approvalVisible}
        onCancel={() => setApprovalVisible(false)}
        footer={null}
      >
        {selectedTransaction && (
          <div>
            <Alert
              message="请仔细核实交易信息后进行审核"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Descriptions bordered column={1} style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="交易ID">{selectedTransaction.id}</Descriptions.Item>
              <Descriptions.Item label="用户">{selectedTransaction.email}</Descriptions.Item>
              <Descriptions.Item label="类型">{selectedTransaction.type}</Descriptions.Item>
              <Descriptions.Item label="金额">¥{selectedTransaction.amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                {selectedTransaction.risk_level ? (
                  <Badge 
                    status={selectedTransaction.risk_level === 'high' ? 'error' : 
                           selectedTransaction.risk_level === 'medium' ? 'warning' : 'success'} 
                    text={selectedTransaction.risk_level} 
                  />
                ) : '未评估'}
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleApprovalSubmit}
            >
              <Form.Item
                name="action"
                label="审核决定"
                rules={[{ required: true, message: '请选择审核决定' }]}
              >
                <Select placeholder="请选择">
                  <Option value="approve">通过</Option>
                  <Option value="reject">拒绝</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="notes"
                label="审核备注"
                rules={[{ required: true, message: '请输入审核备注' }]}
              >
                <TextArea rows={3} placeholder="请输入审核理由或备注" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    提交审核
                  </Button>
                  <Button onClick={() => setApprovalVisible(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Transactions