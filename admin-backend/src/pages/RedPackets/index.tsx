import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  DatePicker,
  Select,
  Input,
  Modal,
  Form,
  InputNumber,
  TimePicker,
  message,
  Tabs,
  Tooltip,
  Badge,
  Divider,
  Popconfirm,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExportOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  GiftOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  redpacketApi,
  RedpacketStatistics,
  RedpacketEvent,
  RedpacketRecord,
  RedpacketConfig,
  CreateRedpacketEventRequest,
  UpdateRedpacketStatusRequest,
} from '@/services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

/**
 * 红包管理页面组件
 * 包含红包统计、活动管理、记录查看、配置管理等功能
 */
const RedpacketManagement: React.FC = () => {
  // 状态管理
  const [statistics, setStatistics] = useState<RedpacketStatistics | null>(null);
  const [events, setEvents] = useState<RedpacketEvent[]>([]);
  const [records, setRecords] = useState<RedpacketRecord[]>([]);
  const [config, setConfig] = useState<RedpacketConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  
  // 分页状态
  const [eventsPagination, setEventsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [recordsPagination, setRecordsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 筛选状态
  const [eventsFilters, setEventsFilters] = useState({
    status: '',
    search: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });
  const [recordsFilters, setRecordsFilters] = useState({
    eventId: undefined as number | undefined,
    search: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RedpacketEvent | null>(null);

  // 表单实例
  const [createForm] = Form.useForm();
  const [configForm] = Form.useForm();

  /**
   * 加载统计数据
   */
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await redpacketApi.getStatistics();
      setStatistics(data);
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载红包活动列表
   */
  const loadEvents = async (page = 1, pageSize = 10) => {
    try {
      setEventsLoading(true);
      const params = {
        page,
        limit: pageSize,
        status: eventsFilters.status || undefined,
        search: eventsFilters.search || undefined,
        startDate: eventsFilters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: eventsFilters.dateRange?.[1]?.format('YYYY-MM-DD'),
      };
      
      const response = await redpacketApi.getEvents(params);
      setEvents(response.events);
      setEventsPagination({
        current: response.pagination.page,
        pageSize: response.pagination.limit,
        total: response.pagination.total,
      });
    } catch (error) {
      message.error('加载红包活动失败');
    } finally {
      setEventsLoading(false);
    }
  };

  /**
   * 加载红包记录列表
   */
  const loadRecords = async (page = 1, pageSize = 10) => {
    try {
      setRecordsLoading(true);
      const params = {
        page,
        limit: pageSize,
        eventId: recordsFilters.eventId,
        search: recordsFilters.search || undefined,
        startDate: recordsFilters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: recordsFilters.dateRange?.[1]?.format('YYYY-MM-DD'),
      };
      
      const response = await redpacketApi.getRecords(params);
      setRecords(response.records);
      setRecordsPagination({
        current: response.pagination.page,
        pageSize: response.pagination.limit,
        total: response.pagination.total,
      });
    } catch (error) {
      message.error('加载红包记录失败');
    } finally {
      setRecordsLoading(false);
    }
  };

  /**
   * 加载红包配置
   */
  const loadConfig = async () => {
    try {
      const data = await redpacketApi.getConfig();
      setConfig(data);
      configForm.setFieldsValue({
        ...data,
        timeWindows: data.timeWindows.map(tw => dayjs().hour(tw.hour).minute(tw.minute)),
      });
    } catch (error) {
      message.error('加载红包配置失败');
    }
  };

  /**
   * 创建红包活动
   */
  const handleCreateEvent = async (values: any) => {
    try {
      const eventData: CreateRedpacketEventRequest = {
        eventName: values.eventName,
        description: values.description,
        totalAmount: values.totalAmount,
        minAmount: values.minAmount,
        maxAmount: values.maxAmount,
        timeWindows: values.timeWindows.map((time: dayjs.Dayjs) => ({
          hour: time.hour(),
          minute: time.minute(),
        })),
        duration: values.duration,
        startTime: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.dateRange[1].format('YYYY-MM-DD HH:mm:ss'),
      };

      await redpacketApi.createEvent(eventData);
      message.success('红包活动创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      loadEvents();
      loadStatistics();
    } catch (error) {
      message.error('创建红包活动失败');
    }
  };

  /**
   * 更新活动状态
   */
  const handleUpdateEventStatus = async (
    eventId: number,
    status: 'pending' | 'active' | 'completed' | 'cancelled',
    reason?: string
  ) => {
    try {
      const data: UpdateRedpacketStatusRequest = { status, reason };
      await redpacketApi.updateEventStatus(eventId, data);
      message.success('活动状态更新成功');
      loadEvents();
      loadStatistics();
    } catch (error) {
      message.error('更新活动状态失败');
    }
  };

  /**
   * 更新红包配置
   */
  const handleUpdateConfig = async (values: any) => {
    try {
      const configData = {
        ...values,
        timeWindows: values.timeWindows.map((time: dayjs.Dayjs) => ({
          hour: time.hour(),
          minute: time.minute(),
        })),
      };

      await redpacketApi.updateConfig(configData);
      message.success('红包配置更新成功');
      setConfigModalVisible(false);
      loadConfig();
    } catch (error) {
      message.error('更新红包配置失败');
    }
  };

  // 红包活动表格列定义
  const eventsColumns: ColumnsType<RedpacketEvent> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '活动名称',
      dataIndex: 'event_name',
      key: 'event_name',
      ellipsis: true,
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
      sorter: true,
    },
    {
      title: '已发放',
      dataIndex: 'distributed_amount',
      key: 'distributed_amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '抢夺次数',
      dataIndex: 'grab_count',
      key: 'grab_count',
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: '待开始' },
          active: { color: 'green', text: '进行中' },
          completed: { color: 'blue', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '时间窗口',
      dataIndex: 'time_windows',
      key: 'time_windows',
      ellipsis: true,
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration}秒`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateEventStatus(record.id, 'active')}
            >
              启动
            </Button>
          )}
          {record.status === 'active' && (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleUpdateEventStatus(record.id, 'completed')}
            >
              完成
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'active') && (
            <Popconfirm
              title="确定要取消这个活动吗？"
              onConfirm={() => handleUpdateEventStatus(record.id, 'cancelled')}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
              >
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 红包记录表格列定义
  const recordsColumns: ColumnsType<RedpacketRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户邮箱',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: '邀请码',
      dataIndex: 'invite_code',
      key: 'invite_code',
    },
    {
      title: '活动名称',
      dataIndex: 'event_name',
      key: 'event_name',
      ellipsis: true,
    },
    {
      title: '抢夺金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
      sorter: true,
    },
    {
      title: '用户状态',
      dataIndex: 'user_status',
      key: 'user_status',
      render: (status: number) => {
        const statusConfig = {
          1: { color: 'green', text: '正常' },
          2: { color: 'orange', text: '冻结' },
          3: { color: 'red', text: '禁用' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: '未知' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '抢夺时间',
      dataIndex: 'grabbed_at',
      key: 'grabbed_at',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: true,
    },
  ];

  // 初始化加载
  useEffect(() => {
    loadStatistics();
    loadEvents();
    loadRecords();
    loadConfig();
  }, []);

  // 筛选变化时重新加载
  useEffect(() => {
    loadEvents(1);
  }, [eventsFilters]);

  useEffect(() => {
    loadRecords(1);
  }, [recordsFilters]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总活动数"
              value={statistics?.overview.totalEvents || 0}
              prefix={<GiftOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中活动"
              value={statistics?.overview.activeEvents || 0}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总发放金额"
              value={statistics?.overview.totalDistributed || 0}
              prefix={<DollarOutlined />}
              precision={2}
              suffix="元"
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日参与人数"
              value={statistics?.today.participants || 0}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Card>
        <Tabs defaultActiveKey="events">
          <TabPane tab="红包活动" key="events">
            {/* 活动筛选工具栏 */}
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Input
                    placeholder="搜索活动名称"
                    prefix={<SearchOutlined />}
                    value={eventsFilters.search}
                    onChange={(e) => setEventsFilters(prev => ({ ...prev, search: e.target.value }))}
                    allowClear
                  />
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="活动状态"
                    value={eventsFilters.status}
                    onChange={(value) => setEventsFilters(prev => ({ ...prev, status: value }))}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    <Option value="pending">待开始</Option>
                    <Option value="active">进行中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="cancelled">已取消</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <RangePicker
                    value={eventsFilters.dateRange}
                    onChange={(dates) => setEventsFilters(prev => ({ ...prev, dateRange: dates }))}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={8}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                    >
                      创建活动
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => loadEvents()}
                    >
                      刷新
                    </Button>
                    <Button
                      icon={<SettingOutlined />}
                      onClick={() => setConfigModalVisible(true)}
                    >
                      配置管理
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>

            {/* 活动列表表格 */}
            <Table
              columns={eventsColumns}
              dataSource={events}
              rowKey="id"
              loading={eventsLoading}
              pagination={{
                ...eventsPagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) => loadEvents(page, pageSize),
              }}
            />
          </TabPane>

          <TabPane tab="抢夺记录" key="records">
            {/* 记录筛选工具栏 */}
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Input
                    placeholder="搜索用户邮箱或邀请码"
                    prefix={<SearchOutlined />}
                    value={recordsFilters.search}
                    onChange={(e) => setRecordsFilters(prev => ({ ...prev, search: e.target.value }))}
                    allowClear
                  />
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="选择活动"
                    value={recordsFilters.eventId}
                    onChange={(value) => setRecordsFilters(prev => ({ ...prev, eventId: value }))}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {events.map(event => (
                      <Option key={event.id} value={event.id}>
                        {event.event_name}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <RangePicker
                    value={recordsFilters.dateRange}
                    onChange={(dates) => setRecordsFilters(prev => ({ ...prev, dateRange: dates }))}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={8}>
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => loadRecords()}
                    >
                      刷新
                    </Button>
                    <Button
                      icon={<ExportOutlined />}
                      onClick={() => message.info('导出功能开发中')}
                    >
                      导出
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>

            {/* 记录列表表格 */}
            <Table
              columns={recordsColumns}
              dataSource={records}
              rowKey="id"
              loading={recordsLoading}
              pagination={{
                ...recordsPagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) => loadRecords(page, pageSize),
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建活动弹窗 */}
      <Modal
        title="创建红包活动"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateEvent}
        >
          <Form.Item
            name="eventName"
            label="活动名称"
            rules={[{ required: true, message: '请输入活动名称' }]}
          >
            <Input placeholder="请输入活动名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="活动描述"
            rules={[{ required: true, message: '请输入活动描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入活动描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="总金额"
                rules={[{ required: true, message: '请输入总金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入总金额"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="持续时间(秒)"
                rules={[{ required: true, message: '请输入持续时间' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="请输入持续时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minAmount"
                label="最小金额"
                rules={[{ required: true, message: '请输入最小金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入最小金额"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxAmount"
                label="最大金额"
                rules={[{ required: true, message: '请输入最大金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入最大金额"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="timeWindows"
            label="时间窗口"
            rules={[{ required: true, message: '请选择时间窗口' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择时间窗口"
              style={{ width: '100%' }}
            >
              <Option value={dayjs().hour(9).minute(0)}>09:00</Option>
              <Option value={dayjs().hour(12).minute(0)}>12:00</Option>
              <Option value={dayjs().hour(20).minute(0)}>20:00</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="活动时间"
            rules={[{ required: true, message: '请选择活动时间' }]}
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建活动
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 配置管理弹窗 */}
      <Modal
        title="红包配置管理"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleUpdateConfig}
        >
          <Form.Item
            name="isActive"
            label="启用红包功能"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="timeWindows"
            label="默认时间窗口"
            rules={[{ required: true, message: '请选择时间窗口' }]}
          >
            <TimePicker.RangePicker
              mode="time"
              format="HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="默认持续时间(秒)"
            rules={[{ required: true, message: '请输入持续时间' }]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="请输入持续时间"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minAmount"
                label="默认最小金额"
                rules={[{ required: true, message: '请输入最小金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入最小金额"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxAmount"
                label="默认最大金额"
                rules={[{ required: true, message: '请输入最大金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入最大金额"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="totalPool"
            label="默认总池金额"
            rules={[{ required: true, message: '请输入总池金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入总池金额"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存配置
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RedpacketManagement;