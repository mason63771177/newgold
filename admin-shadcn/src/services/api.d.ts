// API服务类型声明文件

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  balance: number;
  inviteCode: string;
  invitedBy?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalBalance: number;
  status1Users?: number;  // 新注册玩家数量
  status2Users?: number;  // 任务中玩家数量
  status3Users?: number;  // 待复购玩家数量
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  reward: number;
  status: string;
  createdAt: string;
}

export interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalRewards: number;
}

export interface RedPacketConfig {
  id: string;
  name: string;
  totalAmount: number;
  count: number;
  minAmount: number;
  maxAmount: number;
  startTime: string;
  endTime: string;
  status: string;
}

export interface RedPacketRecord {
  id: string;
  userId: string;
  username: string;
  amount: number;
  claimedAt: string;
}

export interface RedPacketStats {
  totalConfigs: number;
  activeConfigs: number;
  totalAmount: number;
  claimedAmount: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  username: string;
  level: number;
  directInvites: number;
  totalInvites: number;
  teamReward: number;
  joinedAt: string;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalRewards: number;
  avgTeamSize: number;
}

export interface WalletRecord {
  id: string;
  userId: string;
  username: string;
  walletAddress: string;
  balance: number;
  frozenBalance: number;
  totalDeposit: number;
  totalWithdraw: number;
  lastActivity: string;
  status: string;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  txHash?: string;
  createdAt: string;
  completedAt?: string;
}

export interface WalletStats {
  totalBalance: number;
  totalFrozen: number;
  totalDeposit: number;
  totalWithdraw: number;
  pendingWithdraw: number;
  activeWallets: number;
}

export interface RankingEntry {
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

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  systemUptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  networkTraffic: number;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  lastUpdated: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  module: string;
  userId?: string;
}

export interface SystemAlert {
  id: string;
  type: 'system' | 'security' | 'performance' | 'business';
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface FeeConfig {
  id: string;
  type: string;
  name: string;
  fixedFee: number;
  percentageRate: number;
  minPercentageRate?: number;
  maxPercentageRate?: number;
  status: string;
  updatedAt: string;
}

export interface FeeStats {
  totalFeeCollected: number;
  totalProfit: number;
  avgFeeRate: number;
  transactionCount: number;
}

// API服务接口
export declare const userAPI: {
  getUsers(): Promise<ApiResponse<User[]>>;
  getUserStats(): Promise<ApiResponse<UserStats>>;
  updateUserStatus(userId: string, status: string): Promise<ApiResponse>;
  deleteUser(userId: string): Promise<ApiResponse>;
};

export declare const taskAPI: {
  getTasks(): Promise<ApiResponse<Task[]>>;
  getTaskStats(): Promise<ApiResponse<TaskStats>>;
  createTask(task: Partial<Task>): Promise<ApiResponse>;
  updateTask(taskId: string, task: Partial<Task>): Promise<ApiResponse>;
  deleteTask(taskId: string): Promise<ApiResponse>;
};

export declare const redPacketAPI: {
  getConfigs(): Promise<ApiResponse<RedPacketConfig[]>>;
  getRecords(): Promise<ApiResponse<RedPacketRecord[]>>;
  getStats(): Promise<ApiResponse<RedPacketStats>>;
  createConfig(config: Partial<RedPacketConfig>): Promise<ApiResponse>;
  updateConfig(configId: string, config: Partial<RedPacketConfig>): Promise<ApiResponse>;
  deleteConfig(configId: string): Promise<ApiResponse>;
};

export declare const teamAPI: {
  getMembers(): Promise<ApiResponse<TeamMember[]>>;
  getStats(): Promise<ApiResponse<TeamStats>>;
};

export declare const walletAPI: {
  getWallets(): Promise<ApiResponse<WalletRecord[]>>;
  getTransactions(): Promise<ApiResponse<Transaction[]>>;
  getStats(): Promise<ApiResponse<WalletStats>>;
};

export declare const rankingAPI: {
  getRankings(): Promise<ApiResponse<RankingEntry[]>>;
};

export declare const systemAPI: {
  getStats(): Promise<ApiResponse<SystemStats>>;
  getConfigs(): Promise<ApiResponse<SystemConfig[]>>;
  updateConfig(id: string, config: SystemConfig): Promise<ApiResponse<SystemConfig>>;
  getLogs(): Promise<ApiResponse<SystemLog[]>>;
  getAlerts(): Promise<ApiResponse<SystemAlert[]>>;
  resolveAlert(id: string): Promise<ApiResponse<void>>;
  getHealth(): Promise<ApiResponse<any>>;
};

export declare const authAPI: {
  login(data: { username: string; password: string; captcha?: string; twoFactorCode?: string }): Promise<ApiResponse<{ success: boolean; token?: string; user?: any; requiresTwoFactor?: boolean; message?: string }>>;
  logout(): Promise<ApiResponse>;
  getCurrentUser(): Promise<ApiResponse<User>>;
  refreshToken(): Promise<ApiResponse<{ token: string }>>;
  getCaptcha(): Promise<ApiResponse<{ captchaUrl: string }>>;
};

// 资金归集API类型声明
export declare const fundCollectionAPI: {
  getStatistics(): Promise<ApiResponse<any>>;
  getHistory(params?: any): Promise<ApiResponse<any[]>>;
  getConsolidatableWallets(): Promise<ApiResponse<any[]>>;
  updateAutoConfig(config: any): Promise<ApiResponse>;
  executeCollection(data: any): Promise<ApiResponse>;
};

// 地址管理API类型声明
export declare const addressManagementAPI: {
  getStatistics(): Promise<ApiResponse<any>>;
  getAddresses(params?: any): Promise<ApiResponse<any[]>>;
  addAddress(address: any): Promise<ApiResponse>;
  updateAddress(id: string, address: any): Promise<ApiResponse>;
  deleteAddress(id: string): Promise<ApiResponse>;
  addToWhitelist(address: string): Promise<ApiResponse>;
  removeFromWhitelist(address: string): Promise<ApiResponse>;
};

// 钱包监控API类型声明
export declare const walletMonitoringAPI: {
  getStatistics(): Promise<ApiResponse<any>>;
  getBalanceTrends(params?: any): Promise<ApiResponse<any[]>>;
  getAlerts(params?: any): Promise<ApiResponse<any[]>>;
  getMonitoringConfig(): Promise<ApiResponse<any>>;
  updateMonitoringConfig(config: any): Promise<ApiResponse>;
  resolveAlert(alertId: string): Promise<ApiResponse>;
};

// 交易管理API类型声明
export declare const transactionManagementAPI: {
  getStatistics(): Promise<ApiResponse<any>>;
  getTransactions(params?: any): Promise<ApiResponse<any[]>>;
  getTransactionDetail(id: string): Promise<ApiResponse<any>>;
  updateTransactionStatus(id: string, status: string): Promise<ApiResponse>;
  retryTransaction(id: string): Promise<ApiResponse>;
  exportTransactions(params?: any): Promise<ApiResponse<any>>;
};

// 监控API类型声明
export declare const monitoringAPI: {
  getSystemMetrics(): Promise<ApiResponse<any>>;
  getPerformanceData(): Promise<ApiResponse<any>>;
  getMonitoringAlerts(params?: any): Promise<ApiResponse<any[]>>;
  getHealthCheck(): Promise<ApiResponse<any>>;
  updateMonitoringConfig(config: any): Promise<ApiResponse>;
};

// 手续费管理API类型声明
export declare const feeManagementAPI: {
  getFeeConfigs(): Promise<ApiResponse<FeeConfig[]>>;
  getFeeStats(): Promise<ApiResponse<FeeStats>>;
  updateFeeConfig(id: string, config: Partial<FeeConfig>): Promise<ApiResponse>;
  createFeeConfig(config: Partial<FeeConfig>): Promise<ApiResponse>;
  deleteFeeConfig(id: string): Promise<ApiResponse>;
};