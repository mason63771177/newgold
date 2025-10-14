import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Search, RefreshCw, Crown, Star, TrendingUp } from 'lucide-react';
import { rankingAPI } from '@/services/api';

// 定义接口
interface RankingEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  rank: number;
  reward?: number;
  avatar?: string;
  level?: number;
  badge?: string;
  lastUpdated: string;
}

interface RankingStats {
  totalParticipants: number;
  averageScore: number;
  topScore: number;
  totalRewards: number;
  activeRankings: number;
}

/**
 * 排行榜管理组件
 * 功能：查看和管理用户排行榜数据
 */
const RankingManagement: React.FC = () => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [rankingStats, setRankingStats] = useState<RankingStats>({
    totalParticipants: 0,
    averageScore: 0,
    topScore: 0,
    totalRewards: 0,
    activeRankings: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState('all');

  // 加载排行榜数据
  const loadRankings = async () => {
    try {
      const response = await rankingAPI.getRankings();
      setRankings(response.data || []);
    } catch (error) {
      console.error('加载排行榜数据失败:', error);
      // 使用模拟数据作为后备
      setRankings([
        {
          id: '1',
          userId: 'U001',
          username: 'user001',
          score: 2850,
          rank: 1,
          reward: 1000,
          avatar: '',
          level: 15,
          badge: 'gold',
          lastUpdated: '2024-01-20 16:30:00'
        },
        {
          id: '2',
          userId: 'U002',
          username: 'user002',
          score: 2720,
          rank: 2,
          reward: 500,
          avatar: '',
          level: 14,
          badge: 'silver',
          lastUpdated: '2024-01-20 15:45:00'
        },
        {
          id: '3',
          userId: 'U003',
          username: 'user003',
          score: 2650,
          rank: 3,
          reward: 300,
          avatar: '',
          level: 13,
          badge: 'bronze',
          lastUpdated: '2024-01-20 14:20:00'
        },
        {
          id: '4',
          userId: 'U004',
          username: 'user004',
          score: 2480,
          rank: 4,
          reward: 200,
          avatar: '',
          level: 12,
          badge: '',
          lastUpdated: '2024-01-20 13:10:00'
        },
        {
          id: '5',
          userId: 'U005',
          username: 'user005',
          score: 2350,
          rank: 5,
          reward: 100,
          avatar: '',
          level: 11,
          badge: '',
          lastUpdated: '2024-01-20 12:30:00'
        },
        {
          id: '6',
          userId: 'U006',
          username: 'user006',
          score: 2200,
          rank: 6,
          reward: 50,
          avatar: '',
          level: 10,
          badge: '',
          lastUpdated: '2024-01-20 11:45:00'
        },
        {
          id: '7',
          userId: 'U007',
          username: 'user007',
          score: 2100,
          rank: 7,
          reward: 50,
          avatar: '',
          level: 9,
          badge: '',
          lastUpdated: '2024-01-20 10:20:00'
        },
        {
          id: '8',
          userId: 'U008',
          username: 'user008',
          score: 1950,
          rank: 8,
          reward: 30,
          avatar: '',
          level: 8,
          badge: '',
          lastUpdated: '2024-01-20 09:15:00'
        }
      ]);
    }
  };

  // 加载排行榜统计
  const loadRankingStats = async () => {
    try {
      // 这里应该调用实际的API
      // const response = await rankingAPI.getStats();
      // setRankingStats(response.data || rankingStats);
      
      // 使用模拟数据
      setRankingStats({
        totalParticipants: 1250,
        averageScore: 1850,
        topScore: 2850,
        totalRewards: 15000,
        activeRankings: 8
      });
    } catch (error) {
      console.error('加载排行榜统计失败:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadRankings(),
        loadRankingStats()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // 筛选排行榜数据
  const filteredRankings = rankings.filter(entry => {
    const matchesSearch = entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesRank = true;
    if (rankFilter === 'top3') {
      matchesRank = entry.rank <= 3;
    } else if (rankFilter === 'top10') {
      matchesRank = entry.rank <= 10;
    } else if (rankFilter === 'top50') {
      matchesRank = entry.rank <= 50;
    }
    
    return matchesSearch && matchesRank;
  });

  // 获取排名徽章
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge variant="default" className="bg-yellow-500"><Crown className="w-3 h-3 mr-1" />冠军</Badge>;
    } else if (rank === 2) {
      return <Badge variant="secondary" className="bg-gray-400"><Medal className="w-3 h-3 mr-1" />亚军</Badge>;
    } else if (rank === 3) {
      return <Badge variant="outline" className="bg-orange-400"><Award className="w-3 h-3 mr-1" />季军</Badge>;
    } else if (rank <= 10) {
      return <Badge variant="outline">前十</Badge>;
    } else if (rank <= 50) {
      return <Badge variant="secondary">前五十</Badge>;
    } else {
      return <Badge variant="outline">{rank}</Badge>;
    }
  };

  // 获取等级徽章
  const getLevelBadge = (level?: number, badge?: string) => {
    if (badge === 'gold') {
      return <Badge variant="default" className="bg-yellow-500"><Star className="w-3 h-3 mr-1" />黄金</Badge>;
    } else if (badge === 'silver') {
      return <Badge variant="secondary" className="bg-gray-400"><Star className="w-3 h-3 mr-1" />白银</Badge>;
    } else if (badge === 'bronze') {
      return <Badge variant="outline" className="bg-orange-400"><Star className="w-3 h-3 mr-1" />青铜</Badge>;
    } else if (level) {
      return <Badge variant="outline">Lv.{level}</Badge>;
    }
    return <Badge variant="outline">新手</Badge>;
  };

  // 格式化分数
  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  // 格式化奖励
  const formatReward = (reward?: number) => {
    if (!reward) return '-';
    return `${reward.toLocaleString()} USDT`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">排行榜管理</h1>
          <p className="text-muted-foreground">
            查看和管理用户排行榜数据和奖励分配
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">参与人数</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankingStats.totalParticipants.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              活跃排名: {rankingStats.activeRankings}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最高分数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatScore(rankingStats.topScore)}</div>
            <p className="text-xs text-muted-foreground">
              平均分数: {formatScore(rankingStats.averageScore)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总奖励</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{rankingStats.totalRewards.toLocaleString()} USDT</div>
            <p className="text-xs text-muted-foreground">
              已发放奖励金额
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">竞争激烈度</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">高</div>
            <p className="text-xs text-muted-foreground">
              基于分数分布计算
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 排行榜列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            用户排行榜
          </CardTitle>
          <CardDescription>
            查看用户排名、分数和奖励信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户名或用户ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="排名" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部排名</SelectItem>
                  <SelectItem value="top3">前三名</SelectItem>
                  <SelectItem value="top10">前十名</SelectItem>
                  <SelectItem value="top50">前五十名</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">加载中...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>排名</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>分数</TableHead>
                      <TableHead>等级</TableHead>
                      <TableHead>奖励</TableHead>
                      <TableHead>最后更新</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRankings.map((entry) => (
                      <TableRow key={entry.id} className={entry.rank <= 3 ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRankBadge(entry.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.username}</div>
                            <div className="text-sm text-muted-foreground">{entry.userId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-lg">{formatScore(entry.score)}</div>
                        </TableCell>
                        <TableCell>
                          {getLevelBadge(entry.level, entry.badge)}
                        </TableCell>
                        <TableCell>
                          <div className={entry.reward ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                            {formatReward(entry.reward)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.lastUpdated}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredRankings.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                没有找到符合条件的排行榜记录
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 奖励分配说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            奖励分配规则
          </CardTitle>
          <CardDescription>
            排行榜奖励分配机制说明
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">排名奖励</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    第1名
                  </span>
                  <span className="font-medium text-green-600">1000 USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-gray-400" />
                    第2名
                  </span>
                  <span className="font-medium text-green-600">500 USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-400" />
                    第3名
                  </span>
                  <span className="font-medium text-green-600">300 USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>第4-5名</span>
                  <span className="font-medium text-green-600">200 USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>第6-10名</span>
                  <span className="font-medium text-green-600">100 USDT</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">等级徽章</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    黄金徽章
                  </span>
                  <span>分数 ≥ 2500</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gray-400" />
                    白银徽章
                  </span>
                  <span>分数 ≥ 2000</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-400" />
                    青铜徽章
                  </span>
                  <span>分数 ≥ 1500</span>
                </div>
                <div className="flex justify-between">
                  <span>普通等级</span>
                  <span>分数 &lt; 1500</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingManagement;