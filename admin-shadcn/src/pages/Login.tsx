import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Lock,
  User,
  Smartphone
} from 'lucide-react';
import { authAPI } from '@/services/api';

// 定义接口
interface LoginForm {
  username: string;
  password: string;
  captcha?: string;
  twoFactorCode?: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    role: string;
    lastLogin: string;
  };
  requiresTwoFactor?: boolean;
  message?: string;
}

/**
 * 管理员登录组件
 * 功能：用户名密码登录、双因子认证、验证码验证
 */
const Login: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({
    username: '',
    password: '',
    captcha: '',
    twoFactorCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [captchaUrl, setCaptchaUrl] = useState<string>('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);

  // 生成验证码
  const generateCaptcha = async () => {
    try {
      const response = await authAPI.getCaptcha();
      setCaptchaUrl(response.data.captchaUrl || '');
    } catch (error) {
      console.error('获取验证码失败:', error);
      // 使用模拟验证码
      setCaptchaUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMzMzIj5BQTM0PC90ZXh0Pjwvc3ZnPg==');
    }
  };

  // 检查账户锁定状态
  const checkLockStatus = () => {
    const lockEndTime = localStorage.getItem('loginLockEndTime');
    if (lockEndTime) {
      const endTime = parseInt(lockEndTime);
      const now = Date.now();
      if (now < endTime) {
        setIsLocked(true);
        setLockTimeRemaining(Math.ceil((endTime - now) / 1000));
        return true;
      } else {
        localStorage.removeItem('loginLockEndTime');
        localStorage.removeItem('loginAttempts');
        setLoginAttempts(0);
      }
    }
    return false;
  };

  // 倒计时效果
  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            localStorage.removeItem('loginLockEndTime');
            localStorage.removeItem('loginAttempts');
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLocked, lockTimeRemaining]);

  useEffect(() => {
    // 检查锁定状态
    if (!checkLockStatus()) {
      // 获取登录尝试次数
      const attempts = localStorage.getItem('loginAttempts');
      setLoginAttempts(attempts ? parseInt(attempts) : 0);
    }
    
    // 生成验证码
    generateCaptcha();
  }, []);

  // 处理表单输入
  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`账户已锁定，请等待 ${lockTimeRemaining} 秒后重试`);
      return;
    }

    if (!form.username || !form.password) {
      setError('请输入用户名和密码');
      return;
    }

    if (loginAttempts >= 3 && !form.captcha) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({
        username: form.username,
        password: form.password,
        captcha: form.captcha,
        twoFactorCode: form.twoFactorCode
      });

      const result = response.data as LoginResponse;

      if (result.success) {
        if (result.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          setSuccess('请输入双因子认证码');
        } else {
          // 登录成功
          setSuccess('登录成功，正在跳转...');
          
          // 保存token和用户信息
          if (result.token) {
            localStorage.setItem('adminToken', result.token);
          }
          if (result.user) {
            localStorage.setItem('adminUser', JSON.stringify(result.user));
          }
          
          // 清除登录尝试记录
          localStorage.removeItem('loginAttempts');
          localStorage.removeItem('loginLockEndTime');
          
          // 跳转到管理后台
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        }
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      
      // 增加登录尝试次数
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());
      
      // 检查是否需要锁定账户
      if (newAttempts >= 5) {
        const lockEndTime = Date.now() + 15 * 60 * 1000; // 锁定15分钟
        localStorage.setItem('loginLockEndTime', lockEndTime.toString());
        setIsLocked(true);
        setLockTimeRemaining(15 * 60);
        setError('登录失败次数过多，账户已锁定15分钟');
      } else {
        setError(error.response?.data?.message || error.message || '登录失败，请检查用户名和密码');
        
        // 重新生成验证码
        if (newAttempts >= 3) {
          generateCaptcha();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 格式化剩余时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* 登录卡片 */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">管理员登录</CardTitle>
            <CardDescription>
              Gold7 Game 后台管理系统
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {/* 成功提示 */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}
            
            {/* 账户锁定提示 */}
            {isLocked && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <div className="text-sm">
                  <div>账户已锁定，剩余时间：{formatTime(lockTimeRemaining)}</div>
                  <div className="text-xs mt-1">登录失败次数过多，请稍后重试</div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入管理员用户名"
                    value={form.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="pl-10"
                    disabled={loading || isLocked}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={form.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    disabled={loading || isLocked}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={loading || isLocked}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 验证码 - 登录失败3次后显示 */}
              {loginAttempts >= 3 && !isLocked && (
                <div className="space-y-2">
                  <Label htmlFor="captcha">验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      id="captcha"
                      type="text"
                      placeholder="请输入验证码"
                      value={form.captcha}
                      onChange={(e) => handleInputChange('captcha', e.target.value)}
                      className="flex-1"
                      disabled={loading}
                      maxLength={4}
                    />
                    <div 
                      className="w-24 h-10 border rounded cursor-pointer flex items-center justify-center bg-gray-50"
                      onClick={generateCaptcha}
                    >
                      {captchaUrl ? (
                        <img src={captchaUrl} alt="验证码" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-muted-foreground">点击刷新</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 双因子认证码 */}
              {requiresTwoFactor && (
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode">双因子认证码</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="twoFactorCode"
                      type="text"
                      placeholder="请输入6位认证码"
                      value={form.twoFactorCode}
                      onChange={(e) => handleInputChange('twoFactorCode', e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              {/* 登录按钮 */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || isLocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    登录
                  </>
                )}
              </Button>
            </form>

            {/* 登录状态信息 */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>登录尝试次数</span>
                <Badge variant={loginAttempts >= 3 ? 'destructive' : 'outline'}>
                  {loginAttempts}/5
                </Badge>
              </div>
              
              {loginAttempts >= 3 && !isLocked && (
                <div className="text-xs text-orange-600">
                  再失败 {5 - loginAttempts} 次将锁定账户15分钟
                </div>
              )}
            </div>

            {/* 安全提示 */}
            <div className="pt-2 text-center">
              <div className="text-xs text-muted-foreground">
                <Shield className="w-3 h-3 inline mr-1" />
                系统已启用安全防护，请妥善保管登录凭据
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 版权信息 */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <div>Gold7 Game Management System</div>
          <div className="mt-1">© 2024 All rights reserved</div>
        </div>
      </div>
    </div>
  );
};

export default Login;