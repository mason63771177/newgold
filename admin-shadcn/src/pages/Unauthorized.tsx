/**
 * 未授权页面
 * 用于显示权限不足的提示
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, ArrowLeft, Home } from 'lucide-react';

/**
 * 未授权页面组件
 * @returns {React.ReactNode} 未授权页面
 */
const Unauthorized = () => {
  const navigate = useNavigate();

  /**
   * 返回上一页
   */
  const goBack = () => {
    navigate(-1);
  };

  /**
   * 返回首页
   */
  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            访问被拒绝
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            您没有权限访问此页面
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">403 - 权限不足</CardTitle>
            <CardDescription>
              抱歉，您的账户权限不足以访问此页面。
              请联系系统管理员获取相应权限。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={goBack}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回上一页
              </Button>
              
              <Button 
                onClick={goHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                返回首页
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>如需帮助，请联系系统管理员</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Unauthorized;