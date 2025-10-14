import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api'

/**
 * 登录表单数据接口
 */
interface LoginFormData {
  email: string
  password: string
  totpCode?: string
  remember?: boolean
}

/**
 * 登录页面组件
 */
const Login: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [needTotp, setNeedTotp] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  /**
   * 处理登录提交
   */
  const handleSubmit = async (values: LoginFormData) => {
    console.log('=== handleSubmit 被调用 ===', values)
    setLoading(true)
    
    try {
      console.log('调用 authApi.login...')
      const response = await authApi.login({
        username: values.email, // 后端期望username字段
        password: values.password,
        totpCode: values.totpCode,
      })
      console.log('authApi.login 响应:', response)

      // 构建用户信息
      const userInfo = {
        id: response.user?.id || 1,
        username: response.username || response.user?.username || values.email,
        email: response.user?.email || values.email,
        role: response.role || response.user?.role || 'admin',
        permissions: response.permissions || response.user?.permissions || ['*'],
        lastLoginAt: new Date().toISOString(),
        status: 'active' as const
      }
      
      console.log('准备调用 login 函数，用户信息:', userInfo)
      console.log('token:', response.token)
      
      // 登录成功，更新状态
      login(userInfo, response.token, response.token)
      
      // 等待状态更新完成
      setTimeout(() => {
        console.log('检查localStorage状态:', localStorage.getItem('admin-auth-storage'))
        message.success('登录成功')
        navigate('/dashboard')
      }, 100)
      
    } catch (error: any) {
      console.error('登录错误:', error)
      
      // 需要双因素认证
      if (error.code === 'TOTP_REQUIRED') {
        setNeedTotp(true)
        message.info('请输入双因素认证码')
        return
      }
      
      // 其他错误
      message.error(error.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
            数字钱包管理后台
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            请使用管理员账号登录
          </p>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          {/* 用户名 */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入用户名' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          {/* 密码 */}
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          {/* 双因素认证码 */}
          {needTotp && (
            <Form.Item
              name="totpCode"
              rules={[
                { required: true, message: '请输入双因素认证码' },
                { pattern: /^\d{6}$/, message: '认证码必须是6位数字' },
              ]}
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="双因素认证码"
                maxLength={6}
              />
            </Form.Item>
          )}

          {/* 记住我 */}
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>

          {/* 登录按钮 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 'bold',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        {/* 底部信息 */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ color: '#9ca3af', fontSize: 12 }}>
            © 2024 数字钱包管理系统. 保留所有权利.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Login