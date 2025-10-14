import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/**
 * 月度销售数据
 */
const monthlyData = [
  { name: '1月', value: 4000 },
  { name: '2月', value: 3000 },
  { name: '3月', value: 2000 },
  { name: '4月', value: 2780 },
  { name: '5月', value: 1890 },
  { name: '6月', value: 2390 },
];

/**
 * 用户增长数据
 */
const userGrowthData = [
  { name: '1月', users: 400 },
  { name: '2月', users: 300 },
  { name: '3月', users: 600 },
  { name: '4月', users: 800 },
  { name: '5月', users: 500 },
  { name: '6月', users: 700 },
];

/**
 * 设备类型分布数据
 */
const deviceData = [
  { name: '桌面端', value: 400, color: '#0088FE' },
  { name: '移动端', value: 300, color: '#00C49F' },
  { name: '平板端', value: 200, color: '#FFBB28' },
  { name: '其他', value: 100, color: '#FF8042' },
];

/**
 * 柱状图组件
 */
export const SalesChart: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>月度销售统计</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

/**
 * 折线图组件
 */
export const UserGrowthChart: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>用户增长趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="#8884d8" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

/**
 * 饼图组件
 */
export const DeviceChart: React.FC = () => {
  /**
   * 自定义标签渲染函数
   */
  const renderLabel = (entry: any) => {
    return `${entry.name}: ${entry.value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>设备类型分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={deviceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {deviceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};