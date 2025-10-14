import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Database, 
  ToggleLeft, 
  ToggleRight,
  Key,
  Server,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

/**
 * 环境变量接口
 */
interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  description: string;
  isSecret: boolean;
  category: string;
  updatedAt: string;
}

/**
 * 功能开关接口
 */
interface FeatureToggle {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  description: string;
  category: string;
  updatedAt: string;
}

/**
 * 系统参数接口
 */
interface SystemParameter {
  id: string;
  name: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  category: string;
  updatedAt: string;
}

/**
 * 高级系统配置管理页面组件
 * 提供环境变量管理、功能开关和系统参数配置功能
 */
const SystemConfig: React.FC = () => {
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>([]);
  const [systemParams, setSystemParams] = useState<SystemParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('env');

  /**
   * 初始化页面数据
   */
  useEffect(() => {
    loadEnvironmentVariables();
    loadFeatureToggles();
    loadSystemParameters();
  }, []);

  /**
   * 加载环境变量
   */
  const loadEnvironmentVariables = async () => {
    try {
      // 模拟API调用
      const mockEnvVars: EnvironmentVariable[] = [
        {
          id: '1',
          key: 'DATABASE_URL',
          value: 'mysql://localhost:3306/gold7_game',
          description: '数据库连接地址',
          isSecret: true,
          category: 'database',
          updatedAt: '2024-01-15 10:30:00'
        },
        {
          id: '2',
          key: 'REDIS_URL',
          value: 'redis://localhost:6379',
          description: 'Redis缓存服务器地址',
          isSecret: false,
          category: 'cache',
          updatedAt: '2024-01-15 09:15:00'
        },
        {
          id: '3',
          key: 'JWT_SECRET',
          value: '***hidden***',
          description: 'JWT令牌密钥',
          isSecret: true,
          category: 'security',
          updatedAt: '2024-01-14 16:45:00'
        },
        {
          id: '4',
          key: 'TATUM_API_KEY',
          value: '***hidden***',
          description: 'Tatum区块链API密钥',
          isSecret: true,
          category: 'blockchain',
          updatedAt: '2024-01-14 15:20:00'
        }
      ];
      setEnvVars(mockEnvVars);
    } catch (error) {
      console.error('加载环境变量失败:', error);
    }
  };

  /**
   * 加载功能开关
   */
  const loadFeatureToggles = async () => {
    try {
      // 模拟API调用
      const mockToggles: FeatureToggle[] = [
        {
          id: '1',
          name: '新用户注册',
          key: 'ENABLE_USER_REGISTRATION',
          enabled: true,
          description: '允许新用户注册账号',
          category: 'user',
          updatedAt: '2024-01-15 10:30:00'
        },
        {
          id: '2',
          name: '红包功能',
          key: 'ENABLE_RED_PACKET',
          enabled: true,
          description: '启用红包抢夺功能',
          category: 'game',
          updatedAt: '2024-01-15 09:15:00'
        },
        {
          id: '3',
          name: '提现功能',
          key: 'ENABLE_WITHDRAWAL',
          enabled: false,
          description: '允许用户提现',
          category: 'wallet',
          updatedAt: '2024-01-14 16:45:00'
        },
        {
          id: '4',
          name: '邀请奖励',
          key: 'ENABLE_INVITE_REWARD',
          enabled: true,
          description: '启用邀请奖励机制',
          category: 'reward',
          updatedAt: '2024-01-14 15:20:00'
        }
      ];
      setFeatureToggles(mockToggles);
    } catch (error) {
      console.error('加载功能开关失败:', error);
    }
  };

  /**
   * 加载系统参数
   */
  const loadSystemParameters = async () => {
    try {
      // 模拟API调用
      const mockParams: SystemParameter[] = [
        {
          id: '1',
          name: '最大提现金额',
          key: 'MAX_WITHDRAWAL_AMOUNT',
          value: '10000',
          type: 'number',
          description: '单次提现最大金额限制',
          category: 'wallet',
          updatedAt: '2024-01-15 10:30:00'
        },
        {
          id: '2',
          name: '红包抢夺时间',
          key: 'RED_PACKET_DURATION',
          value: '77',
          type: 'number',
          description: '红包抢夺持续时间（秒）',
          category: 'game',
          updatedAt: '2024-01-15 09:15:00'
        },
        {
          id: '3',
          name: '邀请奖励金额',
          key: 'INVITE_REWARD_AMOUNT',
          value: '100',
          type: 'number',
          description: '成功邀请用户的奖励金额',
          category: 'reward',
          updatedAt: '2024-01-14 16:45:00'
        },
        {
          id: '4',
          name: '系统维护模式',
          key: 'MAINTENANCE_MODE',
          value: 'false',
          type: 'boolean',
          description: '系统维护模式开关',
          category: 'system',
          updatedAt: '2024-01-14 15:20:00'
        }
      ];
      setSystemParams(mockParams);
      setLoading(false);
    } catch (error) {
      console.error('加载系统参数失败:', error);
      setLoading(false);
    }
  };

  /**
   * 更新环境变量
   */
  const updateEnvironmentVariable = async (envVar: EnvironmentVariable) => {
    try {
      // 模拟API调用
      console.log('更新环境变量:', envVar);
      await loadEnvironmentVariables();
    } catch (error) {
      console.error('更新环境变量失败:', error);
    }
  };

  /**
   * 切换功能开关
   */
  const toggleFeature = async (toggle: FeatureToggle) => {
    try {
      // 模拟API调用
      const updatedToggle = { ...toggle, enabled: !toggle.enabled };
      console.log('切换功能开关:', updatedToggle);
      
      setFeatureToggles(prev => 
        prev.map(t => t.id === toggle.id ? updatedToggle : t)
      );
    } catch (error) {
      console.error('切换功能开关失败:', error);
    }
  };

  /**
   * 更新系统参数
   */
  const updateSystemParameter = async (param: SystemParameter) => {
    try {
      // 模拟API调用
      console.log('更新系统参数:', param);
      await loadSystemParameters();
    } catch (error) {
      console.error('更新系统参数失败:', error);
    }
  };

  /**
   * 获取分类徽章样式
   */
  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      database: { label: '数据库', variant: 'default' as const },
      cache: { label: '缓存', variant: 'secondary' as const },
      security: { label: '安全', variant: 'destructive' as const },
      blockchain: { label: '区块链', variant: 'default' as const },
      user: { label: '用户', variant: 'default' as const },
      game: { label: '游戏', variant: 'secondary' as const },
      wallet: { label: '钱包', variant: 'default' as const },
      reward: { label: '奖励', variant: 'secondary' as const },
      system: { label: '系统', variant: 'destructive' as const }
    };
    
    const config = categoryMap[category as keyof typeof categoryMap] || { label: category, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">高级系统配置</h1>
        <Button onClick={() => window.location.reload()}>
          刷新配置
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="env">环境变量</TabsTrigger>
          <TabsTrigger value="features">功能开关</TabsTrigger>
          <TabsTrigger value="params">系统参数</TabsTrigger>
        </TabsList>

        <TabsContent value="env" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                环境变量管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {envVars.map((envVar) => (
                  <div key={envVar.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{envVar.key}</h3>
                        {getCategoryBadge(envVar.category)}
                        {envVar.isSecret && (
                          <Badge variant="destructive">
                            <Shield className="h-3 w-3 mr-1" />
                            敏感
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {envVar.description}
                      </div>
                      <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                        {envVar.isSecret ? '***hidden***' : envVar.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        更新时间: {envVar.updatedAt}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => console.log('编辑环境变量:', envVar)}
                      >
                        编辑
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                功能开关管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureToggles.map((toggle) => (
                  <div key={toggle.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{toggle.name}</h3>
                        {getCategoryBadge(toggle.category)}
                        {toggle.enabled ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            启用
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            禁用
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {toggle.description}
                      </div>
                      <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                        {toggle.key}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        更新时间: {toggle.updatedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <Switch
                        checked={toggle.enabled}
                        onCheckedChange={() => toggleFeature(toggle)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="params" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                系统参数配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemParams.map((param) => (
                  <div key={param.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{param.name}</h3>
                        {getCategoryBadge(param.category)}
                        <Badge variant="outline">{param.type}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {param.description}
                      </div>
                      <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                        {param.key} = {param.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        更新时间: {param.updatedAt}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => console.log('编辑系统参数:', param)}
                      >
                        编辑
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfig;