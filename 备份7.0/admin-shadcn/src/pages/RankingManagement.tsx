import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trophy, Users, Gift, Star, Crown, Medal, Award, TrendingUp } from 'lucide-react';

// 团队排行榜类型定义
interface TeamRanking {
  rank: number;
  username: string;
  teamSize: number;
  totalEarnings: number;
  directInvites: number;
  activeRate: number;
}

// 红包排行榜类型定义
interface RedPacketRanking {
  rank: number;
  username: string;
  totalGrabbed: number;
  grabCount: number;
  avgAmount: number;
  bestGrab: number;
  winRate: number;
}

// 大神排行榜类型定义
interface MasterRanking {
  rank: number;
  username: string;
  masterLevel: number;
  completedTasks: number;
  teamAchievement: number;
  totalRewards: number;
  masterScore: number;
}

// 排行榜统计类型定义
interface RankingStats {
  totalParticipants: number;
  topTeamSize: number;
  topRedPacketAmount: number;
  topMasterScore: number;
  avgTeamSize: number;
  avgRedPacketAmount: number;
}

/**
 * 排行榜管理页面组件
 * 查看团队排行榜、红包排行榜、大神排行榜数据
 */
const RankingManagement: React.FC = () => {
  // 团队排行榜数据
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([
    {
      rank: 1,
      username: 'user001',
      teamSize: 156,
      totalEarnings: 12500.50,
      directInvites: 45,
      activeRate: 89.5
    },
    {
      rank: 2,
      username: 'user002',
      teamSize: 134,
      totalEarnings: 9800.25,
      directInvites: 38,
      activeRate: 85.2
    },
    {
      rank: 3,
      username: 'user003',
      teamSize: 98,
      totalEarnings: 7650.75,
      directInvites: 32,
      activeRate: 82.1
    },
    {
      rank: 4,
      username: 'user004',
      teamSize: 87,
      totalEarnings: 6420.00,
      directInvites: 28,
      activeRate: 78.9
    },
    {
      rank: 5,
      username: 'user005',
      teamSize: 76,
      totalEarnings: 5890.30,
      directInvites: 25,
      activeRate: 76.3
    }
  ]);

  // 红包排行榜数据
  const [redPacketRankings, setRedPacketRankings] = useState<RedPacketRanking[]>([
    {
      rank: 1,
      username: 'user006',
      totalGrabbed: 2850.50,
      grabCount: 156,
      avgAmount: 18.27,
      bestGrab: 89.50,
      winRate: 78.5
    },
    {
      rank: 2,
      username: 'user007',
      totalGrabbed: 2650.25,
      grabCount: 142,
      avgAmount: 18.66,
      bestGrab: 85.20,
      winRate: 76.8
    },
    {
      rank: 3,
      username: 'user008',
      totalGrabbed: 2420.75,
      grabCount: 138,
      avgAmount: 17.54,
      bestGrab: 82.10,
      winRate: 74.2
    },
    {
      rank: 4,
      username: 'user009',
      totalGrabbed: 2180.00,
      grabCount: 125,
      avgAmount: 17.44,
      bestGrab: 78.90,
      winRate: 71.6
    },
    {
      rank: 5,
      username: 'user010',
      totalGrabbed: 1950.30,
      grabCount: 118,
      avgAmount: 16.53,
      bestGrab: 76.30,
      winRate: 69.5
    }
  ]);

  // 大神排行榜数据
  const [masterRankings, setMasterRankings] = useState<MasterRanking[]>([
    {
      rank: 1,
      username: 'user011',
      masterLevel: 5,
      completedTasks: 25,
      teamAchievement: 95.5,
      totalRewards: 8500.50,
      masterScore: 9850
    },
    {
      rank: 2,
      username: 'user012',
      masterLevel: 4,
      completedTasks: 22,
      teamAchievement: 92.3,
      totalRewards: 7200.25,
      masterScore: 8920
    },
    {
      rank: 3,
      username: 'user013',
      masterLevel: 4,
      completedTasks: 20,
      teamAchievement: 89.7,
      totalRewards: 6800.75,
      masterScore: 8450
    },
    {
      rank: 4,
      username: 'user014',
      masterLevel: 3,
      completedTasks: 18,
      teamAchievement: 87.2,
      totalRewards: 5900.00,
      masterScore: 7680
    },
    {
      rank: 5,
      username: 'user015',
      masterLevel: 3,
      completedTasks: 16,
      teamAchievement: 84.8,
      totalRewards: 5200.30,
      masterScore: 7120
    }
  ]);

  const [rankingStats] = useState<RankingStats>({
    totalParticipants: 1256,
    topTeamSize: 156,
    topRedPacketAmount: 2850.50,
    topMasterScore: 9850,
    avgTeamSize: 45.2,
    avgRedPacketAmount: 156.8
  });

  const [activeTab, setActiveTab] = useState<'team' | 'redpacket' | 'master'>('team');

  /**
   * 获取排名徽章样式
   */
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white"><Crown className="h-3 w-3 mr-1" />第1名</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white"><Medal className="h-3 w-3 mr-1" />第2名</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white"><Award className="h-3 w-3 mr-1" />第3名</Badge>;
    if (rank <= 10) return <Badge variant="default">第{rank}名</Badge>;
    return <Badge variant="outline">第{rank}名</Badge>;
  };

  /**
   * 获取大神等级徽章样式
   */
  const getMasterLevelBadge = (level: number) => {
    const colors = ['bg-gray-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500'];
    const colorClass = colors[Math.min(level - 1, colors.length - 1)] || 'bg-gray-500';
    return (
      <Badge className={`${colorClass} text-white`}>
        <Star className="h-3 w-3 mr-1" />
        {level}级大神
      </Badge>
    );
  };

  /**
   * 获取活跃率颜色
   */
  const getActiveRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * 获取胜率颜色
   */
  const getWinRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">排行榜管理</h1>
          <p className="text-muted-foreground">
            查看团队排行榜、红包排行榜、大神排行榜数据
          </p>
        </div>
      </div>

      {/* 排行榜统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总参与人数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankingStats.totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              活跃用户参与排行榜
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最大团队</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankingStats.topTeamSize}</div>
            <p className="text-xs text-muted-foreground">
              平均团队规模: {rankingStats.avgTeamSize}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">红包之王</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankingStats.topRedPacketAmount.toFixed(2)} USDT</div>
            <p className="text-xs text-muted-foreground">
              平均抢红包: {rankingStats.avgRedPacketAmount.toFixed(2)} USDT
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">大神之王</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankingStats.topMasterScore}</div>
            <p className="text-xs text-muted-foreground">
              最高大神积分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 排行榜选项卡 */}
      <Card>
        <CardHeader>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'team' ? 'default' : 'outline'}
              onClick={() => setActiveTab('team')}
            >
              <Users className="h-4 w-4 mr-2" />
              团队排行榜
            </Button>
            <Button
              variant={activeTab === 'redpacket' ? 'default' : 'outline'}
              onClick={() => setActiveTab('redpacket')}
            >
              <Gift className="h-4 w-4 mr-2" />
              红包排行榜
            </Button>
            <Button
              variant={activeTab === 'master' ? 'default' : 'outline'}
              onClick={() => setActiveTab('master')}
            >
              <Trophy className="h-4 w-4 mr-2" />
              大神排行榜
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 团队排行榜 */}
          {activeTab === 'team' && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>团队规模</TableHead>
                    <TableHead>总收益 (USDT)</TableHead>
                    <TableHead>直推人数</TableHead>
                    <TableHead>活跃率 (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamRankings.map((item) => (
                    <TableRow key={item.rank}>
                      <TableCell>{getRankBadge(item.rank)}</TableCell>
                      <TableCell className="font-medium">{item.username}</TableCell>
                      <TableCell className="font-bold text-blue-600">{item.teamSize}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {item.totalEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell>{item.directInvites}</TableCell>
                      <TableCell className={`font-bold ${getActiveRateColor(item.activeRate)}`}>
                        {item.activeRate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 红包排行榜 */}
          {activeTab === 'redpacket' && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>总抢红包 (USDT)</TableHead>
                    <TableHead>抢红包次数</TableHead>
                    <TableHead>平均金额 (USDT)</TableHead>
                    <TableHead>最佳手气 (USDT)</TableHead>
                    <TableHead>胜率 (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redPacketRankings.map((item) => (
                    <TableRow key={item.rank}>
                      <TableCell>{getRankBadge(item.rank)}</TableCell>
                      <TableCell className="font-medium">{item.username}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {item.totalGrabbed.toFixed(2)}
                      </TableCell>
                      <TableCell>{item.grabCount}</TableCell>
                      <TableCell>{item.avgAmount.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-yellow-600">
                        {item.bestGrab.toFixed(2)}
                      </TableCell>
                      <TableCell className={`font-bold ${getWinRateColor(item.winRate)}`}>
                        {item.winRate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 大神排行榜 */}
          {activeTab === 'master' && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>大神等级</TableHead>
                    <TableHead>完成任务</TableHead>
                    <TableHead>团队成就 (%)</TableHead>
                    <TableHead>总奖励 (USDT)</TableHead>
                    <TableHead>大神积分</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {masterRankings.map((item) => (
                    <TableRow key={item.rank}>
                      <TableCell>{getRankBadge(item.rank)}</TableCell>
                      <TableCell className="font-medium">{item.username}</TableCell>
                      <TableCell>{getMasterLevelBadge(item.masterLevel)}</TableCell>
                      <TableCell className="font-bold text-blue-600">{item.completedTasks}</TableCell>
                      <TableCell className={`font-bold ${getActiveRateColor(item.teamAchievement)}`}>
                        {item.teamAchievement.toFixed(1)}%
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {item.totalRewards.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-bold text-purple-600">
                        {item.masterScore.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { RankingManagement };
export default RankingManagement;