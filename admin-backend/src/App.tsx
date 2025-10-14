import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useAuthStore } from '@/stores/authStore'

// 页面组件
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Users from '@/pages/Users'
import Wallets from '@/pages/Wallets'
import Transactions from '@/pages/Transactions'
import Tasks from '@/pages/Tasks'
import RedPackets from '@/pages/RedPackets'
import Teams from '@/pages/Teams'
import Monitoring from '@/pages/Monitoring'
import WalletMonitoring from './pages/WalletMonitoring';
import FundCollection from './pages/FundCollection';
import AddressManagement from './pages/AddressManagement';
import TeamManagement from './pages/TeamManagement';

const queryClient = new QueryClient()

/**
 * 受保护的路由组件
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

/**
 * 主应用组件
 */
const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          {/* 登录页面 */}
          <Route path="/login" element={<Login />} />
          
          {/* 受保护的路由 */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/wallets" element={<Wallets />} />
                    <Route path="/wallet-monitoring" element={<WalletMonitoring />} />
                    <Route path="/fund-collection" element={<FundCollection />} />
                    <Route path="/address-management" element={<AddressManagement />} />
                <Route path="/team-management" element={<TeamManagement />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/red-packets" element={<RedPackets />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/monitoring" element={<Monitoring />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </QueryClientProvider>
    </ConfigProvider>
  )
}

export default App