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
  Drawer,
  Descriptions,
  Row,
  Col,
  Statistic,
  Typography,
  Avatar,
  List,
  Progress,
  Tooltip,
  Tree,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
  TrophyOutlined,
  GiftOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select
const { Text } = Typography

/**
 * 团队成员接口
 */
interface TeamMember {
  id: number
  userId: number
  username: string
  avatar?: string
  level: number
  joinTime: string
  inviteCount: number
  totalReward: number
  status: 'active' | 'inactive'
  isLeader: boolean
}

/**
 * 团队数据接口
 */
interface Team {
  id: number
  leaderId: number
  leaderName: string
  leaderAvatar?: string
  teamName?: string
  memberCount: number
  totalReward: number
  level: number
  createdAt: string
  updatedAt: string
  members: TeamMember[]
  performance: {
    totalInvites: number
    activeMembers: number
    monthlyReward: number
    ranking: number
  }
}

/**
 * 团队树节点接口
 */
interface TeamTreeNode {
  key: string
  title: React.ReactNode
  children?: TeamTreeNode[]
  isLeaf?: boolean
  member: TeamMember
}

/**
 * 团队管理页面组件
 */
const Teams: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [treeVisible, setTreeVisible] = useState(false)
  const [treeData, setTreeData] = useState<TeamTreeNode[]>([])

  /**
   * 加载团队列表
   */
  const loadTeams = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      const mockTeams: Team[] = [
        {
          id: 1,
          leaderId: 1001,
          leaderName: 'team_leader_001',
          leaderAvatar: '',
          teamName: '金牌团队',
          memberCount: 25,
          totalReward: 15680.50,
          level: 5,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          members: [
            {
              id: 1,
              userId: 1001,
              username: 'team_leader_001',
              level: 5,
              joinTime: '2024-01-01T00:00:00Z',
              inviteCount: 24,
              totalReward: 5680.50,
              status: 'active',
              isLeader: true,
            },
            {
              id: 2,
              userId: 1002,
              username: 'member_002',
              level: 3,
              joinTime: '2024-01-02T10:30:00Z',
              inviteCount: 8,
              totalReward: 2340.20,
              status: 'active',
              isLeader: false,
            },
            {
              id: 3,
              userId: 1003,
              username: 'member_003',
              level: 2,
              joinTime: '2024-01-03T15:20:00Z',
              inviteCount: 3,
              totalReward: 890.80,
              status: 'active',
              isLeader: false,
            },
          ],
          performance: {
            totalInvites: 35,
            activeMembers: 23,
            monthlyReward: 3450.20,
            ranking: 1,
          },
        },
        {
          id: 2,
          leaderId: 2001,
          leaderName: 'team_leader_002',
          leaderAvatar: '',
          teamName: '银牌团队',
          memberCount: 18,
          totalReward: 8920.30,
          level: 4,
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          members: [
            {
              id: 4,
              userId: 2001,
              username: 'team_leader_002',
              level: 4,
              joinTime: '2024-01-05T00:00:00Z',
              inviteCount: 17,
              totalReward: 3920.30,
              status: 'active',
              isLeader: true,
            },
          ],
          performance: {
            totalInvites: 25,
            activeMembers: 16,
            monthlyReward: 2180.50,
            ranking: 2,
          },
        },
        {
          id: 3,
          leaderId: 3001,
          leaderName: 'team_leader_003',
          leaderAvatar: '',
          teamName: '铜牌团队',
          memberCount: 12,
          totalReward: 4560.80,
          level: 3,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          members: [
            {
              id: 5,
              userId: 3001,
              username: 'team_leader_003',
              level: 3,
              joinTime: '2024-01-10T00:00:00Z',
              inviteCount: 11,
              totalReward: 2560.80,
              status: 'active',
              isLeader: true,
            },
          ],
          performance: {
            totalInvites: 15,
            activeMembers: 10,
            monthlyReward: 1230.40,
            ranking: 3,
          },
        },
      ]

      // 应用筛选
      let filteredTeams = mockTeams
      if (searchText) {
        filteredTeams = filteredTeams.filter(team =>
          team.leaderName.toLowerCase().includes(searchText.toLowerCase()) ||
          (team.teamName && team.teamName.toLowerCase().includes(searchText.toLowerCase()))
        )
      }
      if (levelFilter) {
        filteredTeams = filteredTeams.filter(team => team.level.toString() === levelFilter)
      }

      setTeams(filteredTeams)
      setTotal(filteredTeams.length)
    } catch (error) {
      console.error('加载团队列表失败:', error)
      message.error('加载团队列表失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 搜索团队
   */
  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
  }

  /**
   * 查看团队详情
   */
  const handleViewDetail = (team: Team) => {
    setSelectedTeam(team)
    setDetailVisible(true)
  }

  /**
   * 查看团队结构树
   */
  const handleViewTree = (team: Team) => {
    // 构建团队结构树数据
    const buildTreeData = (members: TeamMember[]): TeamTreeNode[] => {
      const leader = members.find(m => m.isLeader)
      if (!leader) return []

      const leaderNode: TeamTreeNode = {
        key: `member-${leader.id}`,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <span>
              <Text strong>{leader.username}</Text>
              <CrownOutlined style={{ color: '#faad14', marginLeft: 4 }} />
            </span>
            <Tag color="gold">队长</Tag>
            <Tag color="blue">Lv.{leader.level}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              邀请{leader.inviteCount}人
            </Text>
          </div>
        ),
        member: leader,
        children: members
          .filter(m => !m.isLeader)
          .map(member => ({
            key: `member-${member.id}`,
            title: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>{member.username}</Text>
                <Tag color="green">Lv.{member.level}</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  邀请{member.inviteCount}人
                </Text>
                <Tag color={member.status === 'active' ? 'success' : 'default'}>
                  {member.status === 'active' ? '活跃' : '非活跃'}
                </Tag>
              </div>
            ),
            member,
            isLeaf: true,
          })),
      }

      return [leaderNode]
    }

    setTreeData(buildTreeData(team.members))
    setSelectedTeam(team)
    setTreeVisible(true)
  }

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    loadTeams()
  }

  useEffect(() => {
    loadTeams()
  }, [currentPage, pageSize, searchText, levelFilter, statusFilter])

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '团队信息',
      key: 'teamInfo',
      render: (_: any, record: Team) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{ marginRight: 8 }}
            />
            <Text strong>{record.leaderName}</Text>
            <CrownOutlined style={{ color: '#faad14', marginLeft: 4 }} />
          </div>
          {record.teamName && (
            <div>
              <Text type="secondary">{record.teamName}</Text>
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <Tag color="blue">Lv.{record.level}</Tag>
            {record.performance.ranking <= 3 && (
              <Tag color="gold" icon={<TrophyOutlined />}>
                第{record.performance.ranking}名
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '团队规模',
      key: 'scale',
      render: (_: any, record: Team) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <TeamOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            <Text strong>{record.memberCount}</Text>
            <Text type="secondary" style={{ marginLeft: 4 }}>人</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              活跃: {record.performance.activeMembers}人
            </Text>
          </div>
          <Progress
            percent={(record.performance.activeMembers / record.memberCount) * 100}
            size="small"
            showInfo={false}
            strokeColor="#52c41a"
          />
        </div>
      ),
    },
    {
      title: '邀请业绩',
      key: 'performance',
      render: (_: any, record: Team) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text strong style={{ color: '#722ed1' }}>
              {record.performance.totalInvites}
            </Text>
            <Text type="secondary" style={{ marginLeft: 4 }}>
              总邀请
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              本月: {Math.floor(record.performance.totalInvites * 0.3)}人
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '奖励统计',
      key: 'rewards',
      render: (_: any, record: Team) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text strong style={{ color: '#fa8c16' }}>
              ¥{record.totalReward.toFixed(2)}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              本月: ¥{record.performance.monthlyReward.toFixed(2)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('YYYY-MM-DD')}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {dayjs(date).format('HH:mm:ss')}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Team) => (
        <Space size="small" direction="vertical">
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
            icon={<TeamOutlined />}
            onClick={() => handleViewTree(record)}
          >
            团队结构
          </Button>
        </Space>
      ),
    },
  ]

  // 计算统计数据
  const totalMembers = teams.reduce((sum, team) => sum + team.memberCount, 0)
  const totalRewards = teams.reduce((sum, team) => sum + team.totalReward, 0)
  const totalInvites = teams.reduce((sum, team) => sum + team.performance.totalInvites, 0)
  const avgTeamSize = teams.length > 0 ? Math.round(totalMembers / teams.length) : 0

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>团队管理</h1>
        <p style={{ margin: '8px 0 0', color: '#666' }}>
          管理用户团队结构和邀请关系
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="团队总数"
              value={total}
              valueStyle={{ color: '#1890ff' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总成员数"
              value={totalMembers}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总邀请数"
              value={totalInvites}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总奖励"
              value={totalRewards}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
              prefix="¥"
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索队长用户名或团队名称"
              allowClear
              onSearch={handleSearch}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="团队等级"
              allowClear
              style={{ width: '100%' }}
              value={levelFilter}
              onChange={setLevelFilter}
            >
              <Option value="1">Lv.1</Option>
              <Option value="2">Lv.2</Option>
              <Option value="3">Lv.3</Option>
              <Option value="4">Lv.4</Option>
              <Option value="5">Lv.5</Option>
            </Select>
          </Col>
          <Col flex="auto">
            <Space style={{ float: 'right' }}>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 团队列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={teams}
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

      {/* 团队详情抽屉 */}
      <Drawer
        title="团队详情"
        placement="right"
        width={700}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedTeam && (
          <div>
            <Descriptions title="基本信息" bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="团队ID">{selectedTeam.id}</Descriptions.Item>
              <Descriptions.Item label="队长">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                  <Text strong>{selectedTeam.leaderName}</Text>
                  <CrownOutlined style={{ color: '#faad14', marginLeft: 4 }} />
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="团队名称">
                {selectedTeam.teamName || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="团队等级">
                <Tag color="blue">Lv.{selectedTeam.level}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="排名">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TrophyOutlined style={{ color: '#faad14', marginRight: 4 }} />
                  <Text strong>第{selectedTeam.performance.ranking}名</Text>
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="团队成员"
                    value={selectedTeam.memberCount}
                    suffix="人"
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<TeamOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="活跃成员"
                    value={selectedTeam.performance.activeMembers}
                    suffix="人"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="活跃率"
                    value={(selectedTeam.performance.activeMembers / selectedTeam.memberCount) * 100}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总邀请数"
                    value={selectedTeam.performance.totalInvites}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总奖励"
                    value={selectedTeam.totalReward}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="本月奖励"
                    value={selectedTeam.performance.monthlyReward}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="团队成员" style={{ marginBottom: 24 }}>
              <List
                dataSource={selectedTeam.members}
                renderItem={(member) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong>{member.username}</Text>
                          {member.isLeader && (
                            <CrownOutlined style={{ color: '#faad14' }} />
                          )}
                          <Tag color="blue">Lv.{member.level}</Tag>
                          <Tag color={member.status === 'active' ? 'success' : 'default'}>
                            {member.status === 'active' ? '活跃' : '非活跃'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary">
                            加入时间: {dayjs(member.joinTime).format('YYYY-MM-DD HH:mm')}
                          </Text>
                          <br />
                          <Text type="secondary">
                            邀请人数: {member.inviteCount}人 | 获得奖励: ¥{member.totalReward.toFixed(2)}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Descriptions title="系统信息" bordered column={1}>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedTeam.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(selectedTeam.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* 团队结构树模态框 */}
      <Modal
        title={`团队结构 - ${selectedTeam?.teamName || selectedTeam?.leaderName}`}
        open={treeVisible}
        onCancel={() => setTreeVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: 600, overflow: 'auto' }}>
          <Tree
            treeData={treeData}
            defaultExpandAll
            showLine
            showIcon={false}
            selectable={false}
          />
        </div>
      </Modal>
    </div>
  )
}

export default Teams