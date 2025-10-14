import React, { useState } from 'react';
import { Save, Settings, User, Bell, Shield, Database, Mail, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// 系统设置数据类型定义
interface SystemConfig {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  timezone: string;
  language: string;
  theme: string;
  enableNotifications: boolean;
  enableRegistration: boolean;
  maxFileSize: number;
  sessionTimeout: number;
}

interface UserPreferences {
  displayName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  avatar: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  darkMode: boolean;
}

/**
 * 系统设置页面组件
 * 提供系统配置和用户偏好设置功能
 */
export const SystemSettings: React.FC = () => {
  // 系统配置状态
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    siteName: '管理后台系统',
    siteDescription: '基于 React + Shadcn/ui 的现代化管理后台',
    adminEmail: 'admin@example.com',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    theme: 'light',
    enableNotifications: true,
    enableRegistration: false,
    maxFileSize: 10,
    sessionTimeout: 30
  });

  // 用户偏好设置状态
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    displayName: '管理员',
    email: 'admin@example.com',
    phone: '+86 138 0013 8000',
    department: '技术部',
    role: '系统管理员',
    avatar: '',
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false
  });

  const [activeTab, setActiveTab] = useState<'system' | 'user' | 'security' | 'notifications'>('system');
  const [isSaving, setIsSaving] = useState(false);

  /**
   * 保存系统配置
   */
  const handleSaveSystemConfig = async () => {
    setIsSaving(true);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('系统配置已保存');
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 保存用户偏好设置
   */
  const handleSaveUserPreferences = async () => {
    setIsSaving(true);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('用户设置已保存');
    } catch (error) {
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 渲染系统配置标签页
   */
  const renderSystemTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            基本设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="siteName">网站名称</Label>
              <Input
                id="siteName"
                value={systemConfig.siteName}
                onChange={(e) => setSystemConfig({ ...systemConfig, siteName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">管理员邮箱</Label>
              <Input
                id="adminEmail"
                type="email"
                value={systemConfig.adminEmail}
                onChange={(e) => setSystemConfig({ ...systemConfig, adminEmail: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="siteDescription">网站描述</Label>
            <Textarea
              id="siteDescription"
              value={systemConfig.siteDescription}
              onChange={(e) => setSystemConfig({ ...systemConfig, siteDescription: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">时区</Label>
              <Select value={systemConfig.timezone} onValueChange={(value) => setSystemConfig({ ...systemConfig, timezone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">语言</Label>
              <Select value={systemConfig.language} onValueChange={(value) => setSystemConfig({ ...systemConfig, language: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="en-US">English</SelectItem>
                  <SelectItem value="ja-JP">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            系统参数
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxFileSize">最大文件上传大小 (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={systemConfig.maxFileSize}
                onChange={(e) => setSystemConfig({ ...systemConfig, maxFileSize: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="sessionTimeout">会话超时时间 (分钟)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={systemConfig.sessionTimeout}
                onChange={(e) => setSystemConfig({ ...systemConfig, sessionTimeout: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableRegistration"
              checked={systemConfig.enableRegistration}
              onChange={(e) => setSystemConfig({ ...systemConfig, enableRegistration: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="enableRegistration">允许用户注册</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableNotifications"
              checked={systemConfig.enableNotifications}
              onChange={(e) => setSystemConfig({ ...systemConfig, enableNotifications: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="enableNotifications">启用系统通知</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSystemConfig} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? '保存中...' : '保存系统配置'}
        </Button>
      </div>
    </div>
  );

  /**
   * 渲染用户设置标签页
   */
  const renderUserTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            个人信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                value={userPreferences.displayName}
                onChange={(e) => setUserPreferences({ ...userPreferences, displayName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                value={userPreferences.email}
                onChange={(e) => setUserPreferences({ ...userPreferences, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">手机号码</Label>
              <Input
                id="phone"
                value={userPreferences.phone}
                onChange={(e) => setUserPreferences({ ...userPreferences, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">部门</Label>
              <Select value={userPreferences.department} onValueChange={(value) => setUserPreferences({ ...userPreferences, department: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="技术部">技术部</SelectItem>
                  <SelectItem value="产品部">产品部</SelectItem>
                  <SelectItem value="运营部">运营部</SelectItem>
                  <SelectItem value="市场部">市场部</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="role">角色</Label>
            <Select value={userPreferences.role} onValueChange={(value) => setUserPreferences({ ...userPreferences, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="系统管理员">系统管理员</SelectItem>
                <SelectItem value="普通管理员">普通管理员</SelectItem>
                <SelectItem value="操作员">操作员</SelectItem>
                <SelectItem value="查看者">查看者</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            偏好设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="darkMode"
              checked={userPreferences.darkMode}
              onChange={(e) => setUserPreferences({ ...userPreferences, darkMode: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="darkMode">启用深色模式</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={userPreferences.emailNotifications}
              onChange={(e) => setUserPreferences({ ...userPreferences, emailNotifications: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="emailNotifications">接收邮件通知</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="smsNotifications"
              checked={userPreferences.smsNotifications}
              onChange={(e) => setUserPreferences({ ...userPreferences, smsNotifications: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="smsNotifications">接收短信通知</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveUserPreferences} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? '保存中...' : '保存用户设置'}
        </Button>
      </div>
    </div>
  );

  /**
   * 渲染安全设置标签页
   */
  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            密码安全
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">当前密码</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div>
            <Label htmlFor="newPassword">新密码</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div>
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button>更新密码</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>登录安全</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">两步验证</h4>
              <p className="text-sm text-muted-foreground">为您的账户添加额外的安全保护</p>
            </div>
            <Button variant="outline">启用</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">登录历史</h4>
              <p className="text-sm text-muted-foreground">查看最近的登录记录</p>
            </div>
            <Button variant="outline">查看</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * 渲染通知设置标签页
   */
  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知偏好
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">系统通知</h4>
                <p className="text-sm text-muted-foreground">接收系统更新和维护通知</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">用户活动</h4>
                <p className="text-sm text-muted-foreground">新用户注册和重要用户操作</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">订单通知</h4>
                <p className="text-sm text-muted-foreground">新订单和订单状态变更</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">安全警报</h4>
                <p className="text-sm text-muted-foreground">异常登录和安全事件</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            通知方式
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">邮件通知</h4>
                <p className="text-sm text-muted-foreground">通过邮件接收通知</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">短信通知</h4>
                <p className="text-sm text-muted-foreground">通过短信接收重要通知</p>
              </div>
              <input type="checkbox" className="rounded border-gray-300" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">浏览器推送</h4>
                <p className="text-sm text-muted-foreground">在浏览器中显示通知</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>
          <Save className="w-4 h-4 mr-2" />
          保存通知设置
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">系统设置</h1>
        <p className="text-muted-foreground">管理系统配置和个人偏好设置</p>
      </div>

      {/* 标签页导航 */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            系统配置
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'user'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            用户设置
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            安全设置
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            通知设置
          </button>
        </nav>
      </div>

      {/* 标签页内容 */}
      <div>
        {activeTab === 'system' && renderSystemTab()}
        {activeTab === 'user' && renderUserTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
      </div>
    </div>
  );
};