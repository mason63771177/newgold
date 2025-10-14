import React, { useState } from 'react'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Space, Badge } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  WalletOutlined,
  TransactionOutlined,
  CheckSquareOutlined,
  GiftOutlined,
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  MonitorOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const { Header, Sider, Content } = AntLayout

/**
 * 菜单配置
 */
const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/users',
    icon: <UserOutlined />,
    label: '用户管理',
  },
  {
    key: '/wallets',
    icon: <WalletOutlined />,
    label: '钱包管理',
  },
  {
          key: '/wallet-monitoring',
          icon: <MonitorOutlined />,
          label: '钱包监控',
        },
        {
          key: '/fund-collection',
          icon: <DollarOutlined />,
          label: '资金归集',
        },
        {
          key: '/address-management',
          icon: <DatabaseOutlined />,
          label: '地址管理',
        },
  {
    key: '/transactions',
    icon: <TransactionOutlined />,
    label: '交易管理',
  },
  {
    key: '/tasks',
    icon: <CheckSquareOutlined />,
    label: '任务管理',
  },
  {
    key: '/redpackets',
    icon: <GiftOutlined />,
    label: '红包管理',
  },
  {
    key: '/teams',
    icon: <TeamOutlined />,
    label: '团队管理',
  },
  {
    key: '/team-management',
    icon: <TeamOutlined />,
    label: '团队分析',
  },
  {
    key: '/rankings',
    icon: <TrophyOutlined />,
    label: '排行榜',
  },
  {
    key: '/monitoring',
    icon: <MonitorOutlined />,
    label: '系统监控',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
]

/**
 * 主布局组件
 */
interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  /**
   * 处理菜单点击
   */
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  /**
   * 处理用户菜单点击
   */
  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'logout':
        logout()
        navigate('/login')
        break
      case 'profile':
        navigate('/settings/profile')
        break
      default:
        break
    }
  }

  /**
   * 用户下拉菜单
   */
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  return (
    <AntLayout className="admin-layout">
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={256}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
            borderBottom: '1px solid #303030',
          }}
        >
          {collapsed ? '钱包' : '数字钱包管理后台'}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* 主内容区 */}
      <AntLayout style={{ marginLeft: collapsed ? 80 : 256, transition: 'margin-left 0.2s' }}>
        {/* 顶部导航 */}
        <Header
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 80 : 256,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'left 0.2s',
          }}
        >
          {/* 左侧：折叠按钮 */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          {/* 右侧：用户信息和通知 */}
          <Space size="middle">
            {/* 通知铃铛 */}
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ fontSize: '16px' }}
              />
            </Badge>

            {/* 用户信息 */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.username || '管理员'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            marginTop: 64,
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout