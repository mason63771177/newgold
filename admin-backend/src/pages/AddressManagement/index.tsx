import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Popconfirm,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExportOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface AddressInfo {
  id: number;
  userId?: number;
  address: string;
  network: string;
  currency: string;
  status: 'active' | 'used' | 'reserved' | 'disabled';
  totalReceived: number;
  lastDepositAt?: string;
  createdAt: string;
  updatedAt: string;
  userInfo?: {
    email?: string;
    inviteCode?: string;
  };
}

interface AddressStats {
  overview: {
    totalAddresses: number;
    activeAddresses: number;
    usedAddresses: number;
    reservedAddresses: number;
    usageRate: number;
    addressesWithBalance: number;
    totalReceived: number;
    recentActiveAddresses: number;
  };
  networkDistribution: Array<{
    network: string;
    count: number;
    activeCount: number;
  }>;
  currencyDistribution: Array<{
    currency: string;
    count: number;
    totalReceived: number;
  }>;
}

interface WhitelistAddress {
  id: number;
  address: string;
  label: string;
  network: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const AddressManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<AddressInfo[]>([]);
  const [stats, setStats] = useState<AddressStats | null>(null);
  const [whitelist, setWhitelist] = useState<WhitelistAddress[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    network: '',
    currency: '',
    hasBalance: '',
    search: ''
  });
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [whitelistModalVisible, setWhitelistModalVisible] = useState(false);
  const [generateForm] = Form.useForm();
  const [whitelistForm] = Form.useForm();

  /**
   * 获取地址池统计信息
   */
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/addresses/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  /**
   * 获取地址列表
   */
  const fetchAddresses = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...filters
      });

      const response = await fetch(`/api/admin/addresses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setAddresses(data.data.addresses);
        setPagination({
          current: data.data.pagination.current,
          pageSize: data.data.pagination.pageSize,
          total: data.data.pagination.total
        });
      } else {
        message.error(data.message || '获取地址列表失败');
      }
    } catch (error) {
      console.error('获取地址列表失败:', error);
      message.error('获取地址列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取白名单列表
   */
  const fetchWhitelist = async () => {
    try {
      const response = await fetch('/api/admin/addresses/whitelist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWhitelist(data.data.whitelist);
      }
    } catch (error) {
      console.error('获取白名单失败:', error);
    }
  };

  /**
   * 批量生成地址
   */
  const handleGenerateAddresses = async (values: any) => {
    try {
      const response = await fetch('/api/admin/addresses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      
      if (data.success) {
        message.success(`成功生成 ${data.data.count} 个地址`);
        setGenerateModalVisible(false);
        generateForm.resetFields();
        fetchAddresses();
        fetchStats();
      } else {
        message.error(data.message || '生成地址失败');
      }
    } catch (error) {
      console.error('生成地址失败:', error);
      message.error('生成地址失败');
    }
  };

  /**
   * 更新地址状态
   */
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/addresses/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      
      if (data.success) {
        message.success('地址状态更新成功');
        fetchAddresses();
        fetchStats();
      } else {
        message.error(data.message || '更新状态失败');
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      message.error('更新状态失败');
    }
  };

  /**
   * 添加白名单地址
   */
  const handleAddWhitelist = async (values: any) => {
    try {
      const response = await fetch('/api/admin/addresses/whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      
      if (data.success) {
        message.success('地址已添加到白名单');
        setWhitelistModalVisible(false);
        whitelistForm.resetFields();
        fetchWhitelist();
      } else {
        message.error(data.message || '添加白名单失败');
      }
    } catch (error) {
      console.error('添加白名单失败:', error);
      message.error('添加白名单失败');
    }
  };

  /**
   * 移除白名单地址
   */
  const handleRemoveWhitelist = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/addresses/whitelist/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        message.success('地址已从白名单移除');
        fetchWhitelist();
      } else {
        message.error(data.message || '移除白名单失败');
      }
    } catch (error) {
      console.error('移除白名单失败:', error);
      message.error('移除白名单失败');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAddresses();
    fetchWhitelist();
  }, []);

  useEffect(() => {
    fetchAddresses(1, pagination.pageSize);
  }, [filters]);

  // 地址列表表格列定义
  const addressColumns: ColumnsType<AddressInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      render: (address: string) => (
        <Tooltip title={address}>
          <code style={{ fontSize: '12px' }}>
            {address.slice(0, 8)}...{address.slice(-8)}
          </code>
        </Tooltip>
      ),
    },
    {
      title: '网络',
      dataIndex: 'network',
      key: 'network',
      width: 80,
      render: (network: string) => (
        <Tag color="blue">{network}</Tag>
      ),
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
      render: (currency: string) => (
        <Tag color="green">{currency}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'success', text: '活跃' },
          used: { color: 'processing', text: '已使用' },
          reserved: { color: 'warning', text: '预留' },
          disabled: { color: 'error', text: '禁用' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge status={config.color as any} text={config.text} />;
      },
    },
    {
      title: '总接收',
      dataIndex: 'totalReceived',
      key: 'totalReceived',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#52c41a' : '#8c8c8c' }}>
          {amount.toFixed(2)} USDT
        </span>
      ),
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 150,
      render: (_, record) => (
        record.userInfo?.email ? (
          <div>
            <div style={{ fontSize: '12px' }}>{record.userInfo.email}</div>
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
              {record.userInfo.inviteCode}
            </div>
          </div>
        ) : (
          <span style={{ color: '#8c8c8c' }}>未分配</span>
        )
      ),
    },
    {
      title: '最后充值',
      dataIndex: 'lastDepositAt',
      key: 'lastDepositAt',
      width: 120,
      render: (date: string) => (
        date ? (
          <span style={{ fontSize: '12px' }}>
            {formatDistanceToNow(new Date(date), { 
              addSuffix: true, 
              locale: zhCN 
            })}
          </span>
        ) : (
          <span style={{ color: '#8c8c8c' }}>从未</span>
        )
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <span style={{ fontSize: '12px' }}>
          {formatDistanceToNow(new Date(date), { 
            addSuffix: true, 
            locale: zhCN 
          })}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Select
            size="small"
            value={record.status}
            style={{ width: 80 }}
            onChange={(value) => handleUpdateStatus(record.id, value)}
          >
            <Option value="active">活跃</Option>
            <Option value="used">已使用</Option>
            <Option value="reserved">预留</Option>
            <Option value="disabled">禁用</Option>
          </Select>
        </Space>
      ),
    },
  ];

  // 白名单表格列定义
  const whitelistColumns: ColumnsType<WhitelistAddress> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => (
        <Tooltip title={address}>
          <code style={{ fontSize: '12px' }}>
            {address.slice(0, 12)}...{address.slice(-12)}
          </code>
        </Tooltip>
      ),
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => label || '-',
    },
    {
      title: '网络',
      dataIndex: 'network',
      key: 'network',
      render: (network: string) => (
        <Tag color="blue">{network}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span style={{ fontSize: '12px' }}>
          {formatDistanceToNow(new Date(date), { 
            addSuffix: true, 
            locale: zhCN 
          })}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确定要移除这个地址吗？"
          onConfirm={() => handleRemoveWhitelist(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button 
            type="link" 
            danger 
            size="small"
            icon={<DeleteOutlined />}
          >
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="address-management">
      <div className="page-header">
        <h2>地址管理</h2>
        <p>管理系统中的钱包地址池，包括地址生成、状态管理和白名单配置</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总地址数"
                value={stats.overview.totalAddresses}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃地址"
                value={stats.overview.activeAddresses}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="使用率"
                value={stats.overview.usageRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总接收金额"
                value={stats.overview.totalReceived}
                precision={2}
                suffix="USDT"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Tabs defaultActiveKey="addresses">
        <TabPane tab="地址池管理" key="addresses">
          <Card>
            {/* 筛选和操作栏 */}
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Space>
                    <Search
                      placeholder="搜索地址或用户邮箱"
                      style={{ width: 200 }}
                      onSearch={(value) => setFilters({ ...filters, search: value })}
                      allowClear
                    />
                    <Select
                      placeholder="状态"
                      style={{ width: 120 }}
                      value={filters.status}
                      onChange={(value) => setFilters({ ...filters, status: value })}
                      allowClear
                    >
                      <Option value="active">活跃</Option>
                      <Option value="used">已使用</Option>
                      <Option value="reserved">预留</Option>
                      <Option value="disabled">禁用</Option>
                    </Select>
                    <Select
                      placeholder="网络"
                      style={{ width: 120 }}
                      value={filters.network}
                      onChange={(value) => setFilters({ ...filters, network: value })}
                      allowClear
                    >
                      <Option value="TRC20">TRC20</Option>
                      <Option value="ERC20">ERC20</Option>
                    </Select>
                    <Select
                      placeholder="余额状态"
                      style={{ width: 120 }}
                      value={filters.hasBalance}
                      onChange={(value) => setFilters({ ...filters, hasBalance: value })}
                      allowClear
                    >
                      <Option value="true">有余额</Option>
                      <Option value="false">无余额</Option>
                    </Select>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setGenerateModalVisible(true)}
                    >
                      生成地址
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        fetchAddresses();
                        fetchStats();
                      }}
                    >
                      刷新
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>

            {/* 地址列表表格 */}
            <Table
              columns={addressColumns}
              dataSource={addresses}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                onChange: (page, pageSize) => {
                  fetchAddresses(page, pageSize);
                },
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="地址白名单" key="whitelist">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setWhitelistModalVisible(true)}
              >
                添加白名单地址
              </Button>
            </div>

            <Table
              columns={whitelistColumns}
              dataSource={whitelist}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 生成地址弹窗 */}
      <Modal
        title="批量生成地址"
        open={generateModalVisible}
        onCancel={() => {
          setGenerateModalVisible(false);
          generateForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={generateForm}
          layout="vertical"
          onFinish={handleGenerateAddresses}
          initialValues={{
            count: 10,
            network: 'TRC20',
            currency: 'USDT'
          }}
        >
          <Form.Item
            label="生成数量"
            name="count"
            rules={[
              { required: true, message: '请输入生成数量' },
              { type: 'number', min: 1, max: 100, message: '数量必须在1-100之间' }
            ]}
          >
            <Input type="number" placeholder="请输入生成数量（1-100）" />
          </Form.Item>
          <Form.Item
            label="网络类型"
            name="network"
            rules={[{ required: true, message: '请选择网络类型' }]}
          >
            <Select>
              <Option value="TRC20">TRC20</Option>
              <Option value="ERC20">ERC20</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="币种"
            name="currency"
            rules={[{ required: true, message: '请选择币种' }]}
          >
            <Select>
              <Option value="USDT">USDT</Option>
              <Option value="TRX">TRX</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                生成地址
              </Button>
              <Button onClick={() => {
                setGenerateModalVisible(false);
                generateForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加白名单弹窗 */}
      <Modal
        title="添加白名单地址"
        open={whitelistModalVisible}
        onCancel={() => {
          setWhitelistModalVisible(false);
          whitelistForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={whitelistForm}
          layout="vertical"
          onFinish={handleAddWhitelist}
          initialValues={{
            network: 'TRC20'
          }}
        >
          <Form.Item
            label="地址"
            name="address"
            rules={[
              { required: true, message: '请输入地址' },
              { min: 20, message: '地址长度不能少于20位' }
            ]}
          >
            <Input placeholder="请输入钱包地址" />
          </Form.Item>
          <Form.Item
            label="标签"
            name="label"
          >
            <Input placeholder="请输入地址标签（可选）" />
          </Form.Item>
          <Form.Item
            label="网络类型"
            name="network"
            rules={[{ required: true, message: '请选择网络类型' }]}
          >
            <Select>
              <Option value="TRC20">TRC20</Option>
              <Option value="ERC20">ERC20</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
              <Button onClick={() => {
                setWhitelistModalVisible(false);
                whitelistForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressManagement;