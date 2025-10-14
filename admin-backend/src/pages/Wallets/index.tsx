import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
  Statistic,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  DatePicker,
  Typography
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  DollarOutlined,
  HistoryOutlined,
  ExportOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { walletApi, type Wallet, type Transaction, type CollectHistory } from '@/services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography;

/**
 * 钱包管理页面组件
 */
const Wallets: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // 搜索和筛选
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // 钱包详情
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [walletDetailVisible, setWalletDetailVisible] = useState(false);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  // 归集功能
  const [collectModalVisible, setCollectModalVisible] = useState(false);
  const [collectHistoryVisible, setCollectHistoryVisible] = useState(false);
  const [collectHistory, setCollectHistory] = useState<CollectHistory[]>([]);
  
  // 统计数据
  const [statistics, setStatistics] = useState<any>(null);
  
  const [form] = Form.useForm();

  /**
   * 加载钱包列表
   */
  const loadWallets = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await walletApi.getWallets({
        page,
        pageSize,
        search: searchText,
        status: statusFilter,
        type: typeFilter
      });
      
      setWallets(response.wallets);
      setPagination({
        current: response.pagination.page,
        pageSize: response.pagination.pageSize,
        total: response.pagination.total
      });
    } catch (error) {
      console.error('加载钱包列表失败:', error);
      message.error('加载钱包列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载统计数据
   */
  const loadStatistics = async () => {
    try {
      const response = await walletApi.getWalletStats();
      setStatistics(response);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  /**
   * 查看钱包详情
   */
  const viewWalletDetail = async (wallet: Wallet) => {
    try {
      setSelectedWallet(wallet);
      setWalletDetailVisible(true);
      
      const response = await walletApi.getWalletDetail(wallet.address);
      setWalletStats(response.statistics);
      setRecentTransactions(response.recentTransactions);
    } catch (error) {
      console.error('获取钱包详情失败:', error);
      message.error('获取钱包详情失败');
    }
  };

  /**
   * 更新钱包状态
   */
  const updateWalletStatus = async (address: string, status: string) => {
    try {
      await walletApi.updateWalletStatus(address, status);
      message.success('钱包状态更新成功');
      loadWallets(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('更新钱包状态失败:', error);
      message.error('更新钱包状态失败');
    }
  };

  /**
   * 执行资金归集
   */
  const handleCollectFunds = async (values: any) => {
    try {
      await walletApi.collectFunds({
        minBalance: values.minBalance,
        addresses: values.addresses
      });
      
      message.success('资金归集任务已启动');
      setCollectModalVisible(false);
      form.resetFields();
      loadCollectHistory();
    } catch (error) {
      console.error('资金归集失败:', error);
      message.error('资金归集失败');
    }
  };

  /**
   * 加载归集历史
   */
  const loadCollectHistory = async () => {
    try {
      const response = await walletApi.getCollectHistory({ page: 1, pageSize: 20 });
      setCollectHistory(response.history);
    } catch (error) {
      console.error('加载归集历史失败:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    loadWallets();
    loadStatistics();
  }, []);

  // 搜索和筛选变化时重新加载
  useEffect(() => {
    loadWallets(1, pagination.pageSize);
  }, [searchText, statusFilter, typeFilter]);

  // 表格列定义
  const columns = [
    {
      title: '钱包地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      render: (address: string) => (
        <Tooltip title={address || '未知地址'}>
          <Text copyable={{ text: address || '' }}>
            {address ? `${address.slice(0, 8)}...${address.slice(-8)}` : '未知地址'}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 150
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (balance: number) => (
        <Text strong>{balance.toFixed(6)} USDT</Text>
      )
    },
    {
      title: '冻结余额',
      dataIndex: 'frozenBalance',
      key: 'frozenBalance',
      width: 120,
      render: (frozenBalance: number) => (
        <Text type={frozenBalance > 0 ? 'warning' : 'secondary'}>
          {frozenBalance.toFixed(6)} USDT
        </Text>
      )
    },
    {
      title: '总充值',
      dataIndex: 'totalDeposit',
      key: 'totalDeposit',
      width: 120,
      render: (amount: number) => (
        <Text type="success">{amount.toFixed(6)} USDT</Text>
      )
    },
    {
      title: '总提现',
      dataIndex: 'totalWithdraw',
      key: 'totalWithdraw',
      width: 120,
      render: (amount: number) => (
        <Text type="danger">{amount.toFixed(6)} USDT</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '正常' },
          frozen: { color: 'red', text: '冻结' },
          closed: { color: 'gray', text: '关闭' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '最后交易',
      dataIndex: 'lastTransactionAt',
      key: 'lastTransactionAt',
      width: 150,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: Wallet) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewWalletDetail(record)}
          >
            详情
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              title="确定要冻结此钱包吗？"
              onConfirm={() => updateWalletStatus(record.address, 'frozen')}
            >
              <Button
                type="link"
                size="small"
                icon={<LockOutlined />}
                danger
              >
                冻结
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确定要解冻此钱包吗？"
              onConfirm={() => updateWalletStatus(record.address, 'active')}
            >
              <Button
                type="link"
                size="small"
                icon={<UnlockOutlined />}
              >
                解冻
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>钱包管理</Title>
      
      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总钱包数"
                value={statistics.wallets.total}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃钱包"
                value={statistics.wallets.active}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总余额"
                value={statistics.wallets.totalBalance}
                precision={6}
                suffix="USDT"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日交易"
                value={statistics.transactions.today}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Search
                placeholder="搜索钱包地址、用户邮箱或邀请码"
                style={{ width: 300 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={() => loadWallets(1, pagination.pageSize)}
              />
              <Select
                placeholder="状态筛选"
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
              >
                <Option value="active">正常</Option>
                <Option value="frozen">冻结</Option>
                <Option value="closed">关闭</Option>
              </Select>
              <Select
                placeholder="类型筛选"
                style={{ width: 120 }}
                value={typeFilter}
                onChange={setTypeFilter}
                allowClear
              >
                <Option value="user">用户钱包</Option>
                <Option value="system">系统钱包</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadWallets(pagination.current, pagination.pageSize)}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => setCollectModalVisible(true)}
              >
                资金归集
              </Button>
              <Button
                icon={<HistoryOutlined />}
                onClick={() => {
                  setCollectHistoryVisible(true);
                  loadCollectHistory();
                }}
              >
                归集历史
              </Button>
              <Button icon={<ExportOutlined />}>
                导出数据
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 钱包列表表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={wallets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              loadWallets(page, pageSize);
            }
          }}
        />
      </Card>

      {/* 钱包详情抽屉 */}
      <Drawer
        title="钱包详情"
        width={800}
        open={walletDetailVisible}
        onClose={() => setWalletDetailVisible(false)}
      >
        {selectedWallet && (
          <div>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="钱包地址" span={2}>
                <Text copyable>{selectedWallet.address}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {selectedWallet.userId}
              </Descriptions.Item>
              <Descriptions.Item label="用户名">
                {selectedWallet.username}
              </Descriptions.Item>
              <Descriptions.Item label="当前余额">
                <Text strong>{selectedWallet.balance.toFixed(6)} USDT</Text>
              </Descriptions.Item>
              <Descriptions.Item label="冻结余额">
                <Text type="warning">{selectedWallet.frozenBalance.toFixed(6)} USDT</Text>
              </Descriptions.Item>
              <Descriptions.Item label="钱包状态">
                <Tag color={selectedWallet.status === 'active' ? 'green' : 'red'}>
                  {selectedWallet.status === 'active' ? '正常' : '冻结'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedWallet.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {walletStats && (
              <div style={{ marginTop: 24 }}>
                <Title level={4}>交易统计</Title>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic title="总交易数" value={walletStats.totalTransactions} />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="总充值" 
                      value={walletStats.totalDeposit} 
                      precision={6}
                      suffix="USDT"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="总提现" 
                      value={walletStats.totalWithdraw} 
                      precision={6}
                      suffix="USDT"
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="净流入" 
                      value={walletStats.netFlow} 
                      precision={6}
                      suffix="USDT"
                      valueStyle={{ color: walletStats.netFlow >= 0 ? '#3f8600' : '#cf1322' }}
                    />
                  </Col>
                </Row>
              </div>
            )}

            {recentTransactions.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={4}>最近交易</Title>
                <Table
                  size="small"
                  dataSource={recentTransactions}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: '类型',
                      dataIndex: 'type',
                      render: (type: string) => {
                        const typeConfig = {
                          deposit: { color: 'green', text: '充值' },
                          withdrawal: { color: 'red', text: '提现' },
                          transfer: { color: 'blue', text: '转账' }
                        };
                        const config = typeConfig[type as keyof typeof typeConfig];
                        return <Tag color={config.color}>{config.text}</Tag>;
                      }
                    },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      render: (amount: number) => `${amount.toFixed(6)} USDT`
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      render: (status: string) => {
                        const statusConfig = {
                          pending: { color: 'orange', text: '待处理' },
                          completed: { color: 'green', text: '已完成' },
                          failed: { color: 'red', text: '失败' },
                          cancelled: { color: 'gray', text: '已取消' }
                        };
                        const config = statusConfig[status as keyof typeof statusConfig];
                        return <Tag color={config.color}>{config.text}</Tag>;
                      }
                    },
                    {
                      title: '时间',
                      dataIndex: 'created_at',
                      render: (date: string) => dayjs(date).format('MM-DD HH:mm')
                    }
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 资金归集模态框 */}
      <Modal
        title="资金归集"
        open={collectModalVisible}
        onCancel={() => setCollectModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCollectFunds}
        >
          <Form.Item
            name="minBalance"
            label="最小余额阈值"
            rules={[{ required: true, message: '请输入最小余额阈值' }]}
            initialValue={10}
          >
            <Input
              type="number"
              suffix="USDT"
              placeholder="输入最小余额阈值"
            />
          </Form.Item>
          <Form.Item
            name="addresses"
            label="指定地址（可选）"
          >
            <Input.TextArea
              rows={4}
              placeholder="每行一个地址，留空则归集所有符合条件的地址"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                开始归集
              </Button>
              <Button onClick={() => setCollectModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 归集历史模态框 */}
      <Modal
        title="归集历史"
        width={800}
        open={collectHistoryVisible}
        onCancel={() => setCollectHistoryVisible(false)}
        footer={null}
      >
        <Table
          size="small"
          dataSource={collectHistory}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: '任务ID',
              dataIndex: 'taskId',
              width: 150
            },
            {
              title: '地址数量',
              dataIndex: 'addressCount'
            },
            {
              title: '归集金额',
              dataIndex: 'totalAmount',
              render: (amount: number) => `${amount.toFixed(6)} USDT`
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (status: string) => {
                const statusConfig = {
                  pending: { color: 'orange', text: '待处理' },
                  processing: { color: 'blue', text: '处理中' },
                  completed: { color: 'green', text: '已完成' },
                  failed: { color: 'red', text: '失败' }
                };
                const config = statusConfig[status as keyof typeof statusConfig];
                return <Tag color={config.color}>{config.text}</Tag>;
              }
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
            }
          ]}
        />
      </Modal>
    </div>
  );
};

export default Wallets;