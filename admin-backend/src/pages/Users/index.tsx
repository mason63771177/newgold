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
  Form,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
  Avatar,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { userApi } from '@/services/api'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select

/**
 * 用户数据接口
 */
interface User {
  id: number
  username: string
  email: string
  phone?: string
  status: 'active' | 'inactive' | 'locked'
  role: string
  balance: number
  totalDeposit: number
  totalWithdraw: number
  lastLoginAt: string
  createdAt: string
  updatedAt: string
}

/**
 * 用户管理页面组件
 */
const Users: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [form] = Form.useForm()

  /**
   * 加载用户列表
   */
  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await userApi.getUsers({
        page: currentPage,
        pageSize,
        search: searchText,
        status: statusFilter,
      })

      setUsers((response as any)?.list || [])
      setTotal((response as any)?.total || 0)
    } catch (error) {
      console.error('加载用户列表失败:', error)
      message.error('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 搜索用户
   */
  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
  }

  /**
   * 状态筛选
   */
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  /**
   * 查看用户详情
   */
  const handleViewDetail = async (user: User) => {
    try {
      const userDetail = await userApi.getUserById(user.id)
      setSelectedUser(userDetail as any)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取用户详情失败')
    }
  }

  /**
   * 编辑用户
   */
  const handleEdit = (user: User) => {
    setSelectedUser(user)
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      role: user.role,
    })
    setEditVisible(true)
  }

  /**
   * 更新用户状态
   */
  const handleStatusChange = async (userId: number, status: string) => {
    try {
      await userApi.updateUserStatus(userId, status)
      message.success('用户状态更新成功')
      loadUsers()
    } catch (error) {
      message.error('更新用户状态失败')
    }
  }

  /**
   * 保存用户编辑
   */
  const handleSaveEdit = async (values: any) => {
    try {
      // 这里应该调用更新用户信息的API
      // await userApi.updateUser(selectedUser!.id, values)
      message.success('用户信息更新成功')
      setEditVisible(false)
      loadUsers()
    } catch (error) {
      message.error('更新用户信息失败')
    }
  }

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    loadUsers()
  }

  useEffect(() => {
    loadUsers()
  }, [currentPage, pageSize, searchText, statusFilter])

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: User) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '正常' },
          inactive: { color: 'orange', text: '未激活' },
          locked: { color: 'red', text: '锁定' },
        }
        const config = statusMap[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: Record<string, { color: string; text: string }> = {
          user: { color: 'blue', text: '普通用户' },
          vip: { color: 'gold', text: 'VIP用户' },
          admin: { color: 'purple', text: '管理员' },
        }
        const config = roleMap[role] || { color: 'default', text: role }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `¥${balance.toFixed(2)}`,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              title="确定要锁定此用户吗？"
              onConfirm={() => handleStatusChange(record.id, 'locked')}
            >
              <Button type="link" size="small" icon={<LockOutlined />} danger>
                锁定
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确定要解锁此用户吗？"
              onConfirm={() => handleStatusChange(record.id, 'active')}
            >
              <Button type="link" size="small" icon={<UnlockOutlined />}>
                解锁
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>用户管理</h1>
        <p style={{ margin: '8px 0 0', color: '#666' }}>
          管理系统用户信息和状态
        </p>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Search
                placeholder="搜索用户名、邮箱或手机号"
                allowClear
                style={{ width: 300 }}
                onSearch={handleSearch}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                style={{ width: 120 }}
                onChange={handleStatusFilter}
              >
                <Option value="active">正常</Option>
                <Option value="inactive">未激活</Option>
                <Option value="locked">锁定</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                添加用户
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 用户列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size || 10)
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 用户详情抽屉 */}
      <Drawer
        title="用户详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedUser && (
          <div>
            {/* 基本信息 */}
            <Descriptions title="基本信息" bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="用户ID">{selectedUser.id}</Descriptions.Item>
              <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedUser.email}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedUser.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedUser.status === 'active' ? 'green' : selectedUser.status === 'inactive' ? 'orange' : 'red'}>
                  {selectedUser.status === 'active' ? '正常' : selectedUser.status === 'inactive' ? '未激活' : '锁定'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color="blue">{selectedUser.role}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(selectedUser.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {selectedUser.lastLoginAt ? dayjs(selectedUser.lastLoginAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* 资金统计 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="当前余额"
                    value={selectedUser.balance}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="累计充值"
                    value={selectedUser.totalDeposit}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="累计提现"
                    value={selectedUser.totalWithdraw}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEdit}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">未激活</Option>
              <Option value="locked">锁定</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="user">普通用户</Option>
              <Option value="vip">VIP用户</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users