import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Statistic,
  Switch,
  InputNumber,
  TimePicker,
  Tag,
  Space,
  Tooltip,
  Progress
} from 'antd';
import {
  DollarOutlined,
  WalletOutlined,
  HistoryOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ExportOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import adminApi from '../../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 资金归集管理页面
 */
const FundCollection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [consolidatableWallets, setConsolidatableWallets] = useState<any[]>([]);
  const [autoConfig, setAutoConfig] = useState<any>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [historyFilters, setHistoryFilters] = useState<any>({});
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [collectModalVisible, setCollectModalVisible] = useState(false);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  
  const [form] = Form.useForm();
  const [configForm] = Form.useForm();

  /**
   * 加载统计数据
   */
  const loadStatistics = async () => {
    try {
      const response = await adminApi.get('/wallets/collect-stats');
      setStatistics(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  /**
   * 加载归集历史
   */
  const loadHistory = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await adminApi.get('/wallets/collect-history', { params });
      setHistory(response.data.records);
      setPagination({
        ...pagination,
        page,
        total: response.data.pagination.total
      });
    } catch (error) {
      console.error('加载归集历史失败:', error);
      message.error('加载归集历史失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载可归集钱包
   */
  const loadConsolidatableWallets = async () => {
    try {
      const response = await adminApi.get('/wallets/consolidatable', {
        params: { minBalance: 10, limit: 50 }
      });
      setConsolidatableWallets(response.data.wallets);
    } catch (error) {
      console.error('加载可归集钱包失败:', error);
    }
  };

  /**
   * 加载自动归集配置
   */
  const loadAutoConfig = async () => {
    try {
      const response = await adminApi.get('/wallets/auto-collect-config');
      setAutoConfig(response.data);
      configForm.setFieldsValue({
        ...response.data,
        scheduleTime: response.data.schedule_time ? dayjs(response.data.schedule_time, 'HH:mm') : null
      });
    } catch (error) {
      console.error('加载自动归集配置失败:', error);
    }
  };

  /**
   * 执行资金归集
   */
  const handleCollect = async (values: any) => {
    try {
      setLoading(true);
      const response = await adminApi.post('/wallets/collect', {
        addresses: selectedWallets,
        minBalance: values.minBalance || 10,
        type: 'manual'
      });
      
      message.success(`归集完成！成功: ${response.data.successful}, 失败: ${response.data.failed}`);
      setCollectModalVisible(false);
      setSelectedWallets([]);
      
      // 刷新数据
      await Promise.all([
        loadStatistics(),
        loadHistory(),
        loadConsolidatableWallets()
      ]);
    } catch (error: any) {
      console.error('资金归集失败:', error);
      message.error(error.response?.data?.message || '资金归集失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新自动归集配置
   */
  const handleUpdateConfig = async (values: any) => {
    try {
      setLoading(true);
      await adminApi.put('/wallets/auto-collect-config', {
        enabled: values.enabled,
        intervalMinutes: values.intervalMinutes,
        minBalance: values.minBalance,
        maxConcurrent: values.maxConcurrent,
        scheduleTime: values.scheduleTime?.format('HH:mm'),
        notificationEnabled: values.notificationEnabled
      });
      
      message.success('自动归集配置已更新');
      setConfigModalVisible(false);
      await loadAutoConfig();
    } catch (error: any) {
      console.error('更新配置失败:', error);
      message.error(error.response?.data?.message || '更新配置失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 搜索归集历史
   */
  const handleSearch = (values: any) => {
    const filters = {
      ...values,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD')
    };
    delete filters.dateRange;
    
    setHistoryFilters(filters);
    loadHistory(1, filters);
  };

  useEffect(() => {
    Promise.all([
      loadStatistics(),
      loadHistory(),
      loadConsolidatableWallets(),
      loadAutoConfig()
    ]);
  }, []);

  // 归集历史表格列定义
  const historyColumns = [
    {
      title: '源地址',
      dataIndex: 'from_address',
      key: 'from_address',
      width: 200,
      render: (address: string) => (
        <Tooltip title={address}>
          <span>{address?.slice(0, 10)}...{address?.slice(-8)}</span>
        </Tooltip>
      )
    },
    {
      title: '目标地址',
      dataIndex: 'to_address',
      key: 'to_address',
      width: 200,
      render: (address: string) => (
        <Tooltip title={address}>
          <span>{address?.slice(0, 10)}...{address?.slice(-8)}</span>
        </Tooltip>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `${amount?.toFixed(6)} USDT`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          success: { color: 'green', text: '成功' },
          failed: { color: 'red', text: '失败' },
          pending: { color: 'orange', text: '处理中' }
        };
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '交易哈希',
      dataIndex: 'tx_hash',
      key: 'tx_hash',
      width: 200,
      render: (hash: string) => hash ? (
        <Tooltip title={hash}>
          <span>{hash.slice(0, 10)}...{hash.slice(-8)}</span>
        </Tooltip>
      ) : '-'
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  // 可归集钱包表格列定义
  const walletColumns = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => (
        <Tooltip title={address}>
          <span>{address?.slice(0, 10)}...{address?.slice(-8)}</span>
        </Tooltip>
      )
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `${balance?.toFixed(6)} USDT`
    },
    {
      title: '最后更新',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm')
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Card title="统计概览" styles={{ body: { padding: '20px' } }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="今日归集次数" value={statistics.today?.totalCount || 0} />
          </Col>
          <Col span={6}>
            <Statistic title="今日归集金额" value={statistics.today?.totalAmount || 0} precision={2} />
          </Col>
          <Col span={6}>
            <Statistic title="成功率" value={statistics.today?.totalCount > 0 
              ? ((statistics.today?.successCount || 0) / statistics.today.totalCount * 100)
              : 0
            } suffix="%" />
          </Col>
          <Col span={6}>
            <Statistic title="待归集钱包" value={statistics.pendingWallets || 0} />
          </Col>
        </Row>
      </Card>

      {/* 操作按钮 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setCollectModalVisible(true)}
            loading={loading}
          >
            手动归集
          </Button>
        </Col>
        <Col>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setConfigModalVisible(true)}
          >
            自动归集配置
          </Button>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadStatistics();
              loadHistory();
              loadConsolidatableWallets();
            }}
          >
            刷新数据
          </Button>
        </Col>
      </Row>

      {/* 自动归集状态 */}
      <Card title="自动归集状态" style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <div>
              <strong>状态：</strong>
              <Tag color={autoConfig.enabled ? 'green' : 'red'}>
                {autoConfig.enabled ? '已启用' : '已禁用'}
              </Tag>
            </div>
          </Col>
          <Col span={4}>
            <div>
              <strong>执行间隔：</strong>
              {autoConfig.interval_minutes || 30} 分钟
            </div>
          </Col>
          <Col span={4}>
            <div>
              <strong>最小余额：</strong>
              {autoConfig.min_balance || 10} USDT
            </div>
          </Col>
          <Col span={4}>
            <div>
              <strong>定时执行：</strong>
              {autoConfig.schedule_time || '02:00'}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 可归集钱包 */}
      <Card 
        title="可归集钱包" 
        style={{ marginBottom: 24 }}
        extra={
          <Button 
            size="small" 
            onClick={loadConsolidatableWallets}
            icon={<ReloadOutlined />}
          >
            刷新
          </Button>
        }
      >
        <Table
          columns={walletColumns}
          dataSource={consolidatableWallets}
          rowKey="address"
          size="small"
          pagination={false}
          scroll={{ y: 200 }}
          rowSelection={{
            selectedRowKeys: selectedWallets,
            onChange: (selectedRowKeys: React.Key[]) => {
              setSelectedWallets(selectedRowKeys as string[]);
            },
            getCheckboxProps: (record) => ({
              disabled: record.balance < 10
            })
          }}
        />
      </Card>

      {/* 归集历史 */}
      <Card title="归集历史">
        {/* 搜索表单 */}
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="status">
            <Select placeholder="状态" allowClear style={{ width: 120 }}>
              <Option value="success">成功</Option>
              <Option value="failed">失败</Option>
              <Option value="pending">处理中</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker placeholder={['开始日期', '结束日期']} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              搜索
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={() => {
              form.resetFields();
              setHistoryFilters({});
              loadHistory(1, {});
            }}>
              重置
            </Button>
          </Form.Item>
        </Form>

        {/* 历史记录表格 */}
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, page, limit: pageSize || 10 });
              loadHistory(page, historyFilters);
            }
          }}
        />
      </Card>

      {/* 手动归集弹窗 */}
      <Modal
        title="手动资金归集"
        open={collectModalVisible}
        onCancel={() => setCollectModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleCollect}
          initialValues={{ minBalance: 10 }}
        >
          <Form.Item
            label="最小余额阈值"
            name="minBalance"
            rules={[{ required: true, message: '请输入最小余额阈值' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              addonAfter="USDT"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <div style={{ marginBottom: 16 }}>
            <strong>已选择钱包：{selectedWallets.length} 个</strong>
            {selectedWallets.length === 0 && (
              <div style={{ color: '#999', marginTop: 8 }}>
                未选择钱包时将自动归集所有符合条件的钱包
              </div>
            )}
          </div>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                开始归集
              </Button>
              <Button onClick={() => setCollectModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 自动归集配置弹窗 */}
      <Modal
        title="自动归集配置"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleUpdateConfig}
        >
          <Form.Item
            label="启用自动归集"
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="执行间隔（分钟）"
            name="intervalMinutes"
            rules={[{ required: true, message: '请输入执行间隔' }]}
          >
            <InputNumber min={5} max={1440} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="最小余额阈值"
            name="minBalance"
            rules={[{ required: true, message: '请输入最小余额阈值' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              addonAfter="USDT"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="最大并发数"
            name="maxConcurrent"
            rules={[{ required: true, message: '请输入最大并发数' }]}
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="定时执行时间"
            name="scheduleTime"
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="启用通知"
            name="notificationEnabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
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

export default FundCollection;