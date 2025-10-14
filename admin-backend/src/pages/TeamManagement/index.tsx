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
  Space,
  Tag,
  Modal,
  Form,
  message,
  Tabs,
  Tree,
  Tooltip,
  DatePicker,
  Progress,
  Badge,
  Descriptions,
  Divider
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  TrophyOutlined,
  RiseOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  DownloadOutlined,
  BranchesOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface TeamStats {
  overview: {
    totalUsers: number;
    invitedUsers: number;
    activeInviters: number;
    avgTeamSize: string;
    maxTeamSize: number;
    totalTeamMembers: number;
    newUsersToday: number;
    newInvitedToday: number;
  };
  levelDistribution: Array<{
    level: number;
    count: number;
  }>;
  topInviters: Array<{
    id: number;
    username: string;
    invite_code: string;
    team_count: number;
    directInvites: number;
    total_earnings: number;
  }>;
}

interface TeamMember {
  id: number;
  email: string;
  invite_code: string;
  inviter_code: string;
  team_count: number;
  activation_count: number;
  total_earnings: number;
  balance: number;
  status: string;
  created_at: string;
  last_activation_time: string;
  directInvites: number;
  inviterEmail: string;
}

interface TeamStructure {
  userInfo: TeamMember;
  teamStructure: Array<any>;
  teamStats: {
    totalMembers: number;
    directMembers: number;
    maxDepth: number;
    avgDepth: number;
  };
}

interface InviteAnalysis {
  inviteTrends: Array<{
    date: string;
    totalRegistrations: number;
    invitedRegistrations: number;
    directRegistrations: number;
  }>;
  inviteEffectiveness: Array<{
    inviterEmail: string;
    invite_code: string;
    totalInvites: number;
    activatedInvites: number;
    recentInvites: number;
    avgEarnings: number;
    totalEarnings: number;
  }>;
  conversionAnalysis: {
    totalInvited: number;
    activated: number;
    conversionRate: number;
    avgActivationTime: number;
  };
}

/**
 * 团队管理页面组件
 * 提供团队统计、成员管理、结构分析等功能
 */
const TeamManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [searchParams, setSearchParams] = useState({
    search: '',
    status: 'all',
    minTeamSize: 0,
    sortBy: 'team_count',
    sortOrder: 'desc'
  });
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [structureVisible, setStructureVisible] = useState(false);
  const [teamStructure, setTeamStructure] = useState<TeamStructure | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [inviteAnalysis, setInviteAnalysis] = useState<InviteAnalysis | null>(null);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [analysisPeriod, setAnalysisPeriod] = useState('7d');

  const [form] = Form.useForm();

  /**
   * 获取团队统计数据
   */
  const fetchTeamStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/teams/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTeamStats(result.data);
        } else {
          message.error(result.message || '获取团队统计失败');
        }
      } else {
        message.error('获取团队统计失败');
      }
    } catch (error) {
      console.error('获取团队统计错误:', error);
      message.error('获取团队统计失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取团队成员列表
   */
  const fetchTeamMembers = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.current.toString());
      queryParams.append('limit', pagination.pageSize.toString());
      
      Object.entries({ ...searchParams, ...params }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/teams?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTeamMembers(result.data.teams);
          setPagination(prev => ({
            ...prev,
            total: result.data.pagination.total
          }));
        } else {
          message.error(result.message || '获取团队成员失败');
        }
      } else {
        message.error('获取团队成员失败');
      }
    } catch (error) {
      console.error('获取团队成员错误:', error);
      message.error('获取团队成员失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取团队结构
   */
  const fetchTeamStructure = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/teams/${userId}/structure?depth=3`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTeamStructure(result.data);
          setStructureVisible(true);
        } else {
          message.error(result.message || '获取团队结构失败');
        }
      } else {
        message.error('获取团队结构失败');
      }
    } catch (error) {
      console.error('获取团队结构错误:', error);
      message.error('获取团队结构失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取邀请关系分析
   */
  const fetchInviteAnalysis = async (period: string = '7d') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/teams/invite-analysis?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setInviteAnalysis(result.data);
          setAnalysisVisible(true);
        } else {
          message.error(result.message || '获取邀请分析失败');
        }
      } else {
        message.error('获取邀请分析失败');
      }
    } catch (error) {
      console.error('获取邀请分析错误:', error);
      message.error('获取邀请分析失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新成员状态
   */
  const updateMemberStatus = async (values: any) => {
    if (!selectedMember) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/teams/${selectedMember.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success('成员状态更新成功');
          setStatusModalVisible(false);
          form.resetFields();
          fetchTeamMembers();
        } else {
          message.error(result.message || '更新成员状态失败');
        }
      } else {
        message.error('更新成员状态失败');
      }
    } catch (error) {
      console.error('更新成员状态错误:', error);
      message.error('更新成员状态失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * 处理筛选变化
   */
  const handleFilterChange = (key: string, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * 处理表格变化
   */
  const handleTableChange = (paginationConfig: any, filters: any, sorter: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }));

    if (sorter.field) {
      setSearchParams(prev => ({
        ...prev,
        sortBy: sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
      }));
    }
  };

  /**
   * 渲染团队结构树
   */
  const renderTeamTree = (data: any[]): any[] => {
    return data.map(member => ({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{member.email}</span>
          <Tag color={member.status === 'active' ? 'green' : 'red'}>
            {member.status}
          </Tag>
          <Badge count={member.team_count} showZero color="blue" />
        </div>
      ),
      key: member.id,
      children: member.children && member.children.length > 0 ? renderTeamTree(member.children) : undefined
    }));
  };

  // 团队成员表格列定义
  const columns: ColumnsType<TeamMember> = [
    {
      title: '用户邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true
    },
    {
      title: '邀请码',
      dataIndex: 'invite_code',
      key: 'invite_code',
      width: 120,
      render: (code) => (
        <Tooltip title={code}>
          <Tag color="blue">{code?.slice(-6)}</Tag>
        </Tooltip>
      )
    },
    {
      title: '邀请人',
      dataIndex: 'inviterEmail',
      key: 'inviterEmail',
      width: 150,
      ellipsis: true,
      render: (email) => email || '-'
    },
    {
      title: '团队人数',
      dataIndex: 'team_count',
      key: 'team_count',
      width: 100,
      sorter: true,
      render: (count) => (
        <Badge count={count} showZero color="blue" />
      )
    },
    {
      title: '直推人数',
      dataIndex: 'directInvites',
      key: 'directInvites',
      width: 100,
      render: (count) => (
        <Badge count={count} showZero color="green" />
      )
    },
    {
      title: '激活次数',
      dataIndex: 'activation_count',
      key: 'activation_count',
      width: 100,
      sorter: true
    },
    {
      title: '总收益',
      dataIndex: 'total_earnings',
      key: 'total_earnings',
      width: 120,
      sorter: true,
      render: (earnings) => `¥${earnings?.toFixed(2) || '0.00'}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'inactive' ? 'orange' : 'red'}>
          {status === 'active' ? '活跃' : status === 'inactive' ? '非活跃' : '已暂停'}
        </Tag>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      sorter: true,
      render: (date) => format(new Date(date), 'yyyy-MM-dd HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<BranchesOutlined />}
            onClick={() => fetchTeamStructure(record.id)}
          >
            结构
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedMember(record);
              setStatusModalVisible(true);
            }}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ];

  useEffect(() => {
    fetchTeamStats();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [pagination.current, pagination.pageSize, searchParams]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          团队管理
        </h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          管理团队结构、邀请关系和成员状态
        </p>
      </div>

      <Tabs defaultActiveKey="overview">
        <TabPane tab="团队概览" key="overview">
          {/* 统计卡片 */}
          {teamStats && (
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="总用户数"
                    value={teamStats.overview.totalUsers}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="邀请用户数"
                    value={teamStats.overview.invitedUsers}
                    prefix={<UserAddOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="活跃邀请人"
                    value={teamStats.overview.activeInviters}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="平均团队规模"
                    value={teamStats.overview.avgTeamSize}
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* 今日数据和排行榜 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={12}>
              <Card title="今日数据" size="small" styles={{ body: { padding: '16px' } }}>
                {teamStats && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="新增用户"
                        value={teamStats.overview.newUsersToday}
                        valueStyle={{ fontSize: '20px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="新增邀请"
                        value={teamStats.overview.newInvitedToday}
                        valueStyle={{ fontSize: '20px' }}
                      />
                    </Col>
                  </Row>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="邀请人排行" size="small">
                {teamStats?.topInviters.slice(0, 5).map((inviter, index) => (
                  <div key={inviter.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '4px 0',
                    borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <span>
                      <Badge count={index + 1} color={index < 3 ? '#faad14' : '#d9d9d9'} />
                      <span style={{ marginLeft: '8px' }}>{inviter.username}</span>
                    </span>
                    <Tag color="blue">{inviter.team_count}人</Tag>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="成员管理" key="members">
          {/* 搜索和筛选 */}
          <Card style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8} lg={6}>
                <Search
                  placeholder="搜索邮箱或邀请码"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={12} sm={4} lg={3}>
                <Select
                  placeholder="状态"
                  style={{ width: '100%' }}
                  value={searchParams.status}
                  onChange={(value) => handleFilterChange('status', value)}
                >
                  <Option value="all">全部状态</Option>
                  <Option value="active">活跃</Option>
                  <Option value="inactive">非活跃</Option>
                  <Option value="suspended">已暂停</Option>
                </Select>
              </Col>
              <Col xs={12} sm={4} lg={3}>
                <Select
                  placeholder="团队规模"
                  style={{ width: '100%' }}
                  value={searchParams.minTeamSize}
                  onChange={(value) => handleFilterChange('minTeamSize', value)}
                >
                  <Option value={0}>全部</Option>
                  <Option value={1}>≥1人</Option>
                  <Option value={5}>≥5人</Option>
                  <Option value={10}>≥10人</Option>
                  <Option value={50}>≥50人</Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} lg={6}>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      fetchTeamStats();
                      fetchTeamMembers();
                    }}
                  >
                    刷新
                  </Button>
                  <Button
                    icon={<LineChartOutlined />}
                    onClick={() => fetchInviteAnalysis(analysisPeriod)}
                  >
                    邀请分析
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 团队成员表格 */}
          <Card>
            <Table
              columns={columns}
              dataSource={teamMembers}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 团队结构模态框 */}
      <Modal
        title="团队结构"
        open={structureVisible}
        onCancel={() => setStructureVisible(false)}
        footer={null}
        width={800}
      >
        {teamStructure && (
          <div>
            <Descriptions bordered size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="用户邮箱">{teamStructure.userInfo.email}</Descriptions.Item>
              <Descriptions.Item label="邀请码">{teamStructure.userInfo.invite_code}</Descriptions.Item>
              <Descriptions.Item label="团队总人数">{teamStructure.teamStats.totalMembers}</Descriptions.Item>
              <Descriptions.Item label="直推人数">{teamStructure.teamStats.directMembers}</Descriptions.Item>
              <Descriptions.Item label="最大层级">{teamStructure.teamStats.maxDepth}</Descriptions.Item>
              <Descriptions.Item label="平均层级">{teamStructure.teamStats.avgDepth?.toFixed(2)}</Descriptions.Item>
            </Descriptions>
            
            <Divider>团队结构树</Divider>
            
            {teamStructure.teamStructure.length > 0 ? (
              <Tree
                treeData={renderTeamTree(teamStructure.teamStructure)}
                defaultExpandAll
                style={{ maxHeight: '400px', overflow: 'auto' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无下级成员
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 状态更新模态框 */}
      <Modal
        title="更新成员状态"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={updateMemberStatus}
        >
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
              <Option value="suspended">已暂停</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="操作原因"
            name="reason"
          >
            <Input.TextArea
              placeholder="请输入操作原因（可选）"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 邀请分析模态框 */}
      <Modal
        title="邀请关系分析"
        open={analysisVisible}
        onCancel={() => setAnalysisVisible(false)}
        footer={null}
        width={1000}
      >
        {inviteAnalysis && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Select
                value={analysisPeriod}
                onChange={(value) => {
                  setAnalysisPeriod(value);
                  fetchInviteAnalysis(value);
                }}
                style={{ width: 120 }}
              >
                <Option value="1d">今日</Option>
                <Option value="7d">近7天</Option>
                <Option value="30d">近30天</Option>
              </Select>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="转化率分析" size="small">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="总邀请数"
                        value={inviteAnalysis.conversionAnalysis.totalInvited}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="已激活数"
                        value={inviteAnalysis.conversionAnalysis.activated}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="转化率"
                        value={inviteAnalysis.conversionAnalysis.conversionRate}
                        suffix="%"
                        precision={2}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="平均激活时间"
                        value={inviteAnalysis.conversionAnalysis.avgActivationTime}
                        suffix="小时"
                        precision={1}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
              <Col span={24}>
                <Card title="邀请效果排行" size="small">
                  <Table
                    dataSource={inviteAnalysis.inviteEffectiveness}
                    rowKey="invite_code"
                    pagination={false}
                    size="small"
                    scroll={{ y: 300 }}
                    columns={[
                      {
                        title: '邀请人',
                        dataIndex: 'inviterEmail',
                        key: 'inviterEmail',
                        width: 150,
                        ellipsis: true
                      },
                      {
                        title: '总邀请',
                        dataIndex: 'totalInvites',
                        key: 'totalInvites',
                        width: 80
                      },
                      {
                        title: '已激活',
                        dataIndex: 'activatedInvites',
                        key: 'activatedInvites',
                        width: 80
                      },
                      {
                        title: '转化率',
                        key: 'conversionRate',
                        width: 80,
                        render: (_, record) => (
                          `${((record.activatedInvites / record.totalInvites) * 100).toFixed(1)}%`
                        )
                      },
                      {
                        title: '总收益',
                        dataIndex: 'totalEarnings',
                        key: 'totalEarnings',
                        width: 100,
                        render: (earnings) => `¥${earnings?.toFixed(2) || '0.00'}`
                      }
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeamManagement;