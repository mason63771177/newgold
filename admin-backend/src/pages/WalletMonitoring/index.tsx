import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Switch,
  InputNumber,
  message,
  Tag,
  Space,
  Tooltip,
  Alert,
  Divider,
  Progress
} from 'antd';
import {
  MonitorOutlined,
  AlertOutlined,
  WalletOutlined,
  RiseOutlined,
  SettingOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  WalletMonitoringStatistics,
  WalletAlert,
  WalletAlertListResponse,
  BalanceTrendsResponse,
  WalletMonitoringConfig,
  walletMonitoringApi
} from '../../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 钱包监控管理组件
 * 提供钱包监控统计、告警管理、余额趋势和配置功能
 */
const WalletMonitoring: React.FC = () => {
  // 统计数据状态
  const [statistics, setStatistics] = useState<WalletMonitoringStatistics | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // 告警列表状态
  const [alerts, setAlerts] = useState<WalletAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsPagination, setAlertsPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 余额趋势状态
  const [balanceTrends, setBalanceTrends] = useState<BalanceTrendsResponse | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // 配置状态
  const [config, setConfig] = useState<WalletMonitoringConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);

  // 筛选状态
  const [alertFilters, setAlertFilters] = useState({
    status: '',
    severity: '',
    type: '',
    dateRange: null as any
  });

  // 模态框状态
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<WalletAlert | null>(null);

  // 表单实例
  const [resolveForm] = Form.useForm();
  const [configForm] = Form.useForm();

  /**
   * 加载监控统计数据
   */
  const loadStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const response = await walletMonitoringApi.getStatistics();
      setStatistics(response);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      message.error('加载统计数据失败');
    } finally {
      setStatisticsLoading(false);
    }
  };

  /**
   * 加载告警列表
   */
  const loadAlerts = async (page = 1, pageSize = 20) => {
    setAlertsLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...alertFilters,
        startDate: alertFilters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: alertFilters.dateRange?.[1]?.format('YYYY-MM-DD')
      };

      const response = await walletMonitoringApi.getAlerts(params);
      setAlerts(response.alerts);
      setAlertsPagination({
        current: response.pagination.current,
        pageSize: response.pagination.pageSize,
        total: response.pagination.total
      });
    } catch (error) {
      console.error('加载告警列表失败:', error);
      message.error('加载告警列表失败');
    } finally {
      setAlertsLoading(false);
    }
  };

  /**
   * 加载余额趋势数据
   */
  const loadBalanceTrends = async (days = 7) => {
    setTrendsLoading(true);
    try {
      const response = await walletMonitoringApi.getBalanceTrends({ days });
      setBalanceTrends(response);
    } catch (error) {
      console.error('加载余额趋势失败:', error);
      message.error('加载余额趋势失败');
    } finally {
      setTrendsLoading(false);
    }
  };

  /**
   * 加载监控配置
   */
  const loadConfig = async () => {
    setConfigLoading(true);
    try {
      const response = await walletMonitoringApi.getConfig();
      setConfig(response);
      configForm.setFieldsValue(response);
    } catch (error) {
      console.error('加载监控配置失败:', error);
      message.error('加载监控配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  /**
   * 解决告警
   */
  const handleResolveAlert = async (values: { resolution_notes: string }) => {
    if (!selectedAlert) return;

    try {
      await walletMonitoringApi.resolveAlert(selectedAlert.id, values);
      message.success('告警已解决');
      setResolveModalVisible(false);
      resolveForm.resetFields();
      setSelectedAlert(null);
      loadAlerts(alertsPagination.current, alertsPagination.pageSize);
      loadStatistics(); // 刷新统计数据
    } catch (error) {
      console.error('解决告警失败:', error);
      message.error('解决告警失败');
    }
  };

  /**
   * 更新监控配置
   */
  const handleUpdateConfig = async (values: WalletMonitoringConfig) => {
    try {
      await walletMonitoringApi.updateConfig(values);
      message.success('监控配置已更新');
      setConfigModalVisible(false);
      loadConfig();
    } catch (error) {
      console.error('更新监控配置失败:', error);
      message.error('更新监控配置失败');
    }
  };

  /**
   * 获取严重程度标签
   */
  const getSeverityTag = (severity: string) => {
    const severityMap = {
      low: { color: 'blue', text: '低' },
      medium: { color: 'orange', text: '中' },
      high: { color: 'red', text: '高' },
      critical: { color: 'purple', text: '严重' }
    };
    const config = severityMap[severity as keyof typeof severityMap] || { color: 'default', text: severity };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  /**
   * 获取状态标签
   */
  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'red', text: '活跃', icon: <ExclamationCircleOutlined /> },
      resolved: { color: 'green', text: '已解决', icon: <CheckCircleOutlined /> }
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 告警列表表格列定义
  const alertColumns: ColumnsType<WalletAlert> = [
    {
      title: '告警类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 120,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => getSeverityTag(severity),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '钱包地址',
      dataIndex: 'wallet_address',
      key: 'wallet_address',
      width: 150,
      ellipsis: true,
      render: (address) => (
        <Tooltip title={address}>
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '-'}
        </Tooltip>
      ),
    },
    {
      title: '用户邮箱',
      dataIndex: 'user_email',
      key: 'user_email',
      width: 150,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.status === 'active' && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedAlert(record);
                setResolveModalVisible(true);
              }}
            >
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 组件挂载时加载数据
  useEffect(() => {
    loadStatistics();
    loadAlerts();
    loadBalanceTrends();
    loadConfig();
  }, []);

  // 筛选条件变化时重新加载告警列表
  useEffect(() => {
    loadAlerts(1, alertsPagination.pageSize);
  }, [alertFilters]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <h2>
          <MonitorOutlined style={{ marginRight: '8px' }} />
          钱包监控
        </h2>
        <p style={{ color: '#666', margin: 0 }}>
          实时监控钱包状态、余额变化和异常告警
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={statisticsLoading}>
            <Statistic
              title="钱包总数"
              value={statistics?.wallets.total_wallets || 0}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              活跃: {statistics?.wallets.active_wallets || 0} | 
              冻结: {statistics?.wallets.frozen_wallets || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={statisticsLoading}>
            <Statistic
              title="总余额"
              value={statistics?.balance.total_balance || 0}
              precision={2}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="USDT"
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              非零钱包: {statistics?.balance.non_zero_wallets || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={statisticsLoading}>
            <Statistic
              title="今日交易"
              value={statistics?.today.today_transactions || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              待处理: {statistics?.today.pending_transactions || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={statisticsLoading}>
            <Statistic
              title="活跃告警"
              value={statistics?.alerts.active_alerts || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: statistics?.alerts.active_alerts ? '#ff4d4f' : '#52c41a' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              高危: {statistics?.alerts.high_severity_alerts || 0}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 告警管理 */}
      <Card
        title={
          <Space>
            <AlertOutlined />
            告警管理
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadAlerts(alertsPagination.current, alertsPagination.pageSize)}
            >
              刷新
            </Button>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        {/* 筛选条件 */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="告警状态"
              value={alertFilters.status}
              onChange={(value) => setAlertFilters({ ...alertFilters, status: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="active">活跃</Option>
              <Option value="resolved">已解决</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="严重程度"
              value={alertFilters.severity}
              onChange={(value) => setAlertFilters({ ...alertFilters, severity: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="critical">严重</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="告警类型"
              value={alertFilters.type}
              onChange={(e) => setAlertFilters({ ...alertFilters, type: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={alertFilters.dateRange}
              onChange={(dates) => setAlertFilters({ ...alertFilters, dateRange: dates })}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>

        {/* 告警列表 */}
        <Table
          columns={alertColumns}
          dataSource={alerts}
          rowKey="id"
          loading={alertsLoading}
          pagination={{
            ...alertsPagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              loadAlerts(page, pageSize);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 监控配置 */}
      <Card
        title={
          <Space>
            <SettingOutlined />
            监控配置
          </Space>
        }
        extra={
          <Button
            type="primary"
            onClick={() => setConfigModalVisible(true)}
          >
            编辑配置
          </Button>
        }
      >
        {config && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>余额阈值告警:</strong> {config.balance_threshold} USDT
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>交易阈值告警:</strong> {config.transaction_threshold} USDT
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>日限额:</strong> {config.daily_limit} USDT
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>告警启用:</strong> 
                <Tag color={config.alert_enabled ? 'green' : 'red'}>
                  {config.alert_enabled ? '已启用' : '已禁用'}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>邮件通知:</strong> 
                <Tag color={config.email_notifications ? 'green' : 'red'}>
                  {config.email_notifications ? '已启用' : '已禁用'}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>检查间隔:</strong> {config.check_interval} 秒
              </div>
            </Col>
          </Row>
        )}
      </Card>

      {/* 解决告警模态框 */}
      <Modal
        title="解决告警"
        open={resolveModalVisible}
        onCancel={() => {
          setResolveModalVisible(false);
          resolveForm.resetFields();
          setSelectedAlert(null);
        }}
        footer={null}
      >
        {selectedAlert && (
          <>
            <Alert
              message={selectedAlert.title}
              description={selectedAlert.description}
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            <Form
              form={resolveForm}
              layout="vertical"
              onFinish={handleResolveAlert}
            >
              <Form.Item
                name="resolution_notes"
                label="解决方案说明"
                rules={[{ required: true, message: '请输入解决方案说明' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请详细描述解决方案和处理过程..."
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setResolveModalVisible(false)}>
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit">
                    确认解决
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 监控配置模态框 */}
      <Modal
        title="监控配置"
        open={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false);
          configForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleUpdateConfig}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="balance_threshold"
                label="余额阈值告警 (USDT)"
                rules={[{ required: true, message: '请输入余额阈值' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="超过此金额将触发告警"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="transaction_threshold"
                label="交易阈值告警 (USDT)"
                rules={[{ required: true, message: '请输入交易阈值' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="单笔交易超过此金额将触发告警"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="daily_limit"
                label="日限额 (USDT)"
                rules={[{ required: true, message: '请输入日限额' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="每日交易限额"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="check_interval"
                label="检查间隔 (秒)"
                rules={[{ required: true, message: '请输入检查间隔' }]}
              >
                <InputNumber
                  min={60}
                  max={3600}
                  style={{ width: '100%' }}
                  placeholder="监控检查间隔时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="alert_enabled"
                label="启用告警"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="email_notifications"
                label="邮件通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sms_notifications"
                label="短信通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setConfigModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存配置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WalletMonitoring;