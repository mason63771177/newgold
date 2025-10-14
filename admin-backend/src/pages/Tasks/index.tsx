import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Tag,
  Statistic,
  Row,
  Col,
  Tabs,
  Typography,
  Descriptions,
  InputNumber,
  Popconfirm,
  Switch,
  Tooltip,
  Badge,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GiftOutlined,
  SettingOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  FilterOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { taskApi, Task, TaskDetail, TaskStatistics, TaskConfig } from '@/services/api';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * 任务管理页面
 */
const TaskManagement: React.FC = () => {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [configs, setConfigs] = useState<TaskConfig[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  
  // 模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  
  // 表单实例
  const [rewardForm] = Form.useForm();
  
  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 筛选条件
  const [filters, setFilters] = useState({
    taskType: '',
    status: '',
    search: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  /**
   * 获取统计数据
   */
  const fetchStatistics = async () => {
    try {
      const data = await taskApi.getStatistics();
      setStatistics(data);
    } catch (error) {
      message.error('获取统计数据失败');
    }
  };

  /**
   * 获取任务列表
   */
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getTasks({
        page: pagination.current,
        limit: pagination.pageSize,
        taskType: filters.taskType || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
      });
      setTasks(data.tasks);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
      }));
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取任务配置
   */
  const fetchConfigs = async () => {
    try {
      const data = await taskApi.getConfigs();
      setConfigs(data.all);
    } catch (error) {
      message.error('获取任务配置失败');
    }
  };

  /**
   * 查看任务详情
   */
  const handleViewDetail = async (record: Task) => {
    try {
      const data = await taskApi.getTaskDetail(record.id);
      setSelectedTask(data.task);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('获取任务详情失败');
    }
  };

  /**
   * 更新任务状态
   */
  const handleUpdateStatus = async (id: number, status: string, reason?: string) => {
    try {
      await taskApi.updateTaskStatus(id, { status, reason });
      message.success('状态更新成功');
      fetchTasks();
      fetchStatistics();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  /**
   * 批量奖励发放
   */
  const handleBatchReward = async (values: { rewardAmount: number; description?: string }) => {
    try {
      await taskApi.batchReward({
        taskIds: selectedTasks,
        rewardAmount: values.rewardAmount,
        description: values.description,
      });
      message.success('批量奖励发放成功');
      setRewardModalVisible(false);
      rewardForm.resetFields();
      setSelectedTasks([]);
      fetchTasks();
      fetchStatistics();
    } catch (error) {
      message.error('批量奖励发放失败');
    }
  };

  /**
   * 更新任务配置
   */
  const handleUpdateConfig = async (id: number, values: Partial<TaskConfig>) => {
    try {
      await taskApi.updateConfig(id, values);
      message.success('配置更新成功');
      fetchConfigs();
    } catch (error) {
      message.error('配置更新失败');
    }
  };

  /**
   * 搜索处理
   */
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * 重置筛选
   */
  const handleReset = () => {
    setFilters({
      taskType: '',
      status: '',
      search: '',
      dateRange: null,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * 筛选处理
   */
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * 表格变化处理
   */
  const handleTableChange: TableProps<Task>['onChange'] = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 10,
    }));
  };

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys: selectedTasks,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedTasks(selectedRowKeys.map(key => Number(key)));
    },
  };

  // 初始化数据
  useEffect(() => {
    fetchStatistics();
    fetchConfigs();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [pagination.current, pagination.pageSize, filters]);

  // 任务状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'orange', text: '待处理' },
      completed: { color: 'green', text: '已完成' },
      failed: { color: 'red', text: '失败' },
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 任务类型标签
  const getTypeTag = (type: string) => {
    const typeMap = {
      newbie: { color: 'blue', text: '新手任务' },
      quiz: { color: 'purple', text: '答题任务' },
      god: { color: 'gold', text: '大神任务' },
    };
    const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns: ColumnsType<Task> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户信息',
      key: 'user',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.email}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.invite_code}
          </Text>
        </div>
      ),
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 200,
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '奖励金额',
      dataIndex: 'reward_amount',
      key: 'reward_amount',
      width: 100,
      render: (amount: number) => `${amount} USDT`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                onClick={() => handleUpdateStatus(record.id, 'completed')}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                onClick={() => handleUpdateStatus(record.id, 'failed')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="任务管理" style={{ marginBottom: '24px' }}>
        <Tabs defaultActiveKey="list">
          <TabPane tab="任务列表" key="list">
            {/* 统计卡片 */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总任务数"
                    value={statistics?.overview.total || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已完成"
                    value={statistics?.overview.completed || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="待处理"
                    value={statistics?.overview.pending || 0}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总奖励金额"
                    value={statistics?.rewards.totalAmount || 0}
                    prefix={<GiftOutlined />}
                    suffix="USDT"
                    precision={2}
                  />
                </Card>
              </Col>
            </Row>

            {/* 筛选条件 */}
            <Card style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Search
                    placeholder="搜索用户邮箱、邀请码或任务名称"
                    onSearch={handleSearch}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="任务类型"
                    value={filters.taskType}
                    onChange={(value) => handleFilterChange('taskType', value)}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="newbie">新手任务</Option>
                    <Option value="quiz">答题任务</Option>
                    <Option value="god">大神任务</Option>
                  </Select>
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="状态"
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="pending">待处理</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="failed">失败</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <RangePicker
                    value={filters.dateRange}
                    onChange={(dates) => handleFilterChange('dateRange', dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    <Button onClick={handleReset}>重置</Button>
                    <Button
                      type="primary"
                      disabled={selectedTasks.length === 0}
                      onClick={() => setRewardModalVisible(true)}
                    >
                      批量奖励
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchTasks}>
                      刷新
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* 任务表格 */}
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              onChange={handleTableChange}
              rowSelection={{
                ...rowSelection,
                getCheckboxProps: (record: Task) => ({
                  disabled: record.status !== 'completed',
                }),
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>

          <TabPane tab="任务配置" key="config">
            <Table
              columns={[
                {
                  title: '任务类型',
                  dataIndex: 'task_type',
                  key: 'task_type',
                  render: (type: string) => getTypeTag(type),
                },
                {
                  title: '任务名称',
                  dataIndex: 'task_name',
                  key: 'task_name',
                },
                {
                  title: '任务描述',
                  dataIndex: 'task_description',
                  key: 'task_description',
                  ellipsis: true,
                },
                {
                  title: '奖励金额',
                  dataIndex: 'reward_amount',
                  key: 'reward_amount',
                  render: (amount: number) => `${amount} USDT`,
                },
                {
                  title: '状态',
                  dataIndex: 'is_active',
                  key: 'is_active',
                  render: (active: boolean) => (
                    <Tag color={active ? 'green' : 'red'}>
                      {active ? '启用' : '禁用'}
                    </Tag>
                  ),
                },
                {
                  title: '排序',
                  dataIndex: 'sort_order',
                  key: 'sort_order',
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record) => (
                    <Space>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => {
                          // 这里可以添加编辑配置的逻辑
                          message.info('配置编辑功能待实现');
                        }}
                      >
                        编辑
                      </Button>
                    </Space>
                  ),
                },
              ]}
              dataSource={configs}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 任务详情模态框 */}
      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTask && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="用户邮箱">
                {selectedTask.email}
              </Descriptions.Item>
              <Descriptions.Item label="邀请码">
                {selectedTask.invite_code}
              </Descriptions.Item>
              <Descriptions.Item label="任务名称">
                {selectedTask.task_name}
              </Descriptions.Item>
              <Descriptions.Item label="任务类型">
                {getTypeTag(selectedTask.task_type)}
              </Descriptions.Item>
              <Descriptions.Item label="奖励金额">
                {selectedTask.reward_amount} USDT
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedTask.status)}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedTask.completed_at ? dayjs(selectedTask.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedTask.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {selectedTask.userTasks && selectedTask.userTasks.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h4>用户其他任务</h4>
                <Table
                  columns={[
                    {
                      title: '任务名称',
                      dataIndex: 'task_name',
                      key: 'task_name',
                    },
                    {
                      title: '任务类型',
                      dataIndex: 'task_type',
                      key: 'task_type',
                      render: (type: string) => getTypeTag(type),
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => getStatusTag(status),
                    },
                    {
                      title: '完成时间',
                      dataIndex: 'completed_at',
                      key: 'completed_at',
                      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
                    },
                  ]}
                  dataSource={selectedTask.userTasks}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 批量奖励模态框 */}
      <Modal
        title="批量奖励发放"
        open={rewardModalVisible}
        onCancel={() => setRewardModalVisible(false)}
        onOk={() => rewardForm.submit()}
        confirmLoading={loading}
      >
        <Form
          form={rewardForm}
          layout="vertical"
          onFinish={handleBatchReward}
        >
          <Form.Item label="选中任务数量">
            <Text>{selectedTasks.length} 个任务</Text>
          </Form.Item>
          <Form.Item
            name="rewardAmount"
            label="奖励金额"
            rules={[{ required: true, message: '请输入奖励金额' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="USDT" />
          </Form.Item>
          <Form.Item
            name="description"
            label="奖励描述"
          >
            <TextArea rows={3} placeholder="请输入奖励描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskManagement;