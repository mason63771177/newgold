import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/stores/authStore'

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  data: T
}

/**
 * 登录请求接口
 */
export// 登录请求接口
interface LoginRequest {
  username: string
  password: string
  totpCode?: string
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  user: {
    id: number
    username: string
    role: string
    permissions: string[]
  }
  token: string
}

/**
 * 钱包接口
 */
export interface Wallet {
  id: number
  address: string
  userId: number
  username: string
  balance: number
  frozenBalance: number
  totalDeposit: number
  totalWithdraw: number
  status: 'active' | 'frozen' | 'closed'
  type: 'user' | 'system'
  createdAt: string
  updatedAt: string
  lastTransactionAt?: string
  derivationIndex?: number
}

/**
 * 交易记录接口
 */
export interface Transaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'transfer'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  transaction_hash?: string
  description?: string
  created_at: string
}

/**
 * 归集历史接口
 */
export interface CollectHistory {
  id: number
  taskId: string
  addressCount: number
  totalAmount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
}

/**
 * 钱包地址接口
 */
export interface WalletAddress {
  id: number
  address: string
  balance: number
  derivationIndex: number
  userId?: number
  createdAt: string
}

/**
 * 余额分布接口
 */
export interface BalanceDistribution {
  range: string
  count: number
  totalBalance: number
}

/**
 * 归集历史接口（现有功能）
 */
export interface ConsolidationHistory {
  id: number
  fromAddress: string
  toAddress: string
  amount: number
  txHash: string
  status: string
  createdAt: string
}

/**
 * 创建axios实例
 */
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 添加认证token
      const { token } = useAuthStore.getState()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { data } = response
      
      // 检查业务状态码
      if (!data.success) {
        throw new Error(data.message || '请求失败')
      }
      
      return data.data
    },
    async (error) => {
      const { response } = error
      
      if (response) {
        const { status, data } = response
        
        switch (status) {
          case 401:
            // 未授权，清除登录状态
            useAuthStore.getState().logout()
            window.location.href = '/login'
            message.error('登录已过期，请重新登录')
            break
            
          case 403:
            message.error('权限不足')
            break
            
          case 404:
            message.error('请求的资源不存在')
            break
            
          case 500:
            message.error('服务器内部错误')
            break
            
          default:
            message.error(data?.message || '请求失败')
        }
      } else {
        message.error('网络连接失败')
      }
      
      return Promise.reject(error)
    }
  )

  return instance
}

// 创建API实例
const api = createApiInstance()

/**
 * 认证相关API
 */
export const authApi = {
  /**
   * 登录
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post('/admin/login', data)
  },

  /**
   * 验证token
   */
  verifyToken: async (): Promise<{ valid: boolean }> => {
    return api.post('/admin/verify-token')
  },

  /**
   * 刷新token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    return api.post('/admin/refresh-token', { refreshToken })
  },

  /**
   * 登出
   */
  logout: async (): Promise<void> => {
    return api.post('/admin/logout')
  },
}

/**
 * 用户管理API
 */
export const userApi = {
  /**
   * 获取用户列表
   */
  getUsers: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
  }) => {
    return api.get('/admin/users', { params })
  },

  /**
   * 获取用户详情
   */
  getUserById: async (id: number) => {
    return api.get(`/admin/users/${id}`)
  },

  /**
   * 更新用户状态
   */
  updateUserStatus: async (id: number, status: string) => {
    return api.put(`/admin/users/${id}/status`, { status })
  },

  /**
   * 获取用户统计
   */
  getUserStats: async () => {
    return api.get('/admin/users/stats')
  },
}

/**
 * 钱包管理API
 */
export const walletApi = {
  // 获取钱包列表
  getWallets: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<{
    wallets: Wallet[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      pages: number;
    };
  }> => api.get('/admin/wallets', { params }),

  // 获取钱包详情
  getWalletDetail: (address: string): Promise<{
    wallet: Wallet;
    statistics: {
      totalTransactions: number;
      totalDeposit: number;
      totalWithdraw: number;
      netFlow: number;
    };
    recentTransactions: Transaction[];
  }> => api.get(`/admin/wallets/${address}`),

  // 更新钱包状态
  updateWalletStatus: (address: string, status: string): Promise<{
    address: string;
    status: string;
    updatedAt: string;
  }> => api.put(`/admin/wallets/${address}/status`, { status }),

  // 获取钱包统计
  getWalletStats: (): Promise<{
    wallets: {
      total: number;
      active: number;
      frozen: number;
      totalBalance: number;
      totalFrozenBalance: number;
    };
    transactions: {
      total: number;
      today: number;
      totalDeposits: number;
      totalWithdrawals: number;
      todayDeposits: number;
      todayWithdrawals: number;
    };
    addresses: {
      total: number;
      withBalance: number;
      needConsolidation: number;
    };
  }> => api.get('/admin/wallets/stats'),

  // 执行资金归集
  collectFunds: (data: {
    addresses?: string[];
    minBalance?: number;
  }): Promise<{
    taskId: string;
    addressCount: number;
    minBalance: number;
    status: string;
  }> => api.post('/admin/wallets/collect', data),

  // 获取归集历史
  getCollectHistory: (params: {
    page?: number;
    pageSize?: number;
  }): Promise<{
    history: CollectHistory[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      pages: number;
    };
  }> => api.get('/admin/wallets/collect-history', { params }),

  // 获取地址列表
  getAddresses: (params: { page?: number; pageSize?: number }): Promise<{ 
    addresses: WalletAddress[]; 
    total: number 
  }> => api.get('/admin/addresses', { params }),

  // 获取余额分布
  getBalanceDistribution: (): Promise<{ 
    distribution: BalanceDistribution[] 
  }> => api.get('/admin/balance-distribution'),

  // 执行归集
  executeConsolidation: (data: { minBalance: number; addresses?: string[] }): Promise<{ 
    success: boolean; 
    message: string 
  }> => api.post('/admin/consolidate', data),

  // 获取归集历史
  getConsolidationHistory: (params: { page?: number; pageSize?: number }): Promise<{ 
    history: ConsolidationHistory[]; 
    total: number 
  }> => api.get('/admin/consolidation-history', { params })
};

// 交易管理相关接口
export interface TransactionDetail extends Transaction {
  user_id: number;
  balance_before: number;
  balance_after: number;
  risk_level?: 'low' | 'medium' | 'high';
  risk_score?: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approval_time?: string;
  approval_notes?: string;
  updated_at: string;
  // 关联用户信息
  email?: string;
  invite_code?: string;
  user_status?: number;
  current_balance?: number;
  frozen_balance?: number;
  approved_by_name?: string;
}

export interface TransactionRiskAssessment {
  id: number;
  transaction_id: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: string[];
  assessed_by: number;
  created_at: string;
}

export interface TransactionStatistics {
  basic: {
    total_transactions: number;
    completed_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    total_volume: number;
    avg_amount: number;
  };
  byType: Array<{
    type: string;
    count: number;
    volume: number;
  }>;
  byRisk: Array<{
    risk_level: string;
    count: number;
    avg_risk_score: number;
  }>;
  byApproval: Array<{
    approval_status: string;
    count: number;
  }>;
}

/**
 * 交易管理API
 */
export const transactionApi = {
  // 获取交易列表
  getTransactions: (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    riskLevel?: string;
  }): Promise<{
    transactions: TransactionDetail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    return api.get('/admin/transactions', { params });
  },

  // 获取交易详情
  getTransactionDetail: (id: number): Promise<{
    transaction: TransactionDetail;
    relatedTransactions: Array<{
      id: number;
      type: string;
      amount: number;
      status: string;
      created_at: string;
    }>;
    riskAssessments: TransactionRiskAssessment[];
  }> => {
    return api.get(`/admin/transactions/${id}`);
  },

  // 审核交易（批准）
  approveTransaction: (id: number, notes?: string): Promise<{ message: string }> => {
    return api.put(`/admin/transactions/${id}/approve`, { notes });
  },

  // 拒绝交易
  rejectTransaction: (id: number, notes?: string): Promise<{ message: string }> => {
    return api.put(`/admin/transactions/${id}/reject`, { notes });
  },

  // 获取待审核交易
  getPendingTransactions: (params: {
    page?: number;
    limit?: number;
  }): Promise<{
    transactions: TransactionDetail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    return api.get('/admin/transactions/pending', { params });
  },

  // 交易风险评估
  assessTransactionRisk: (id: number): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
  }> => {
    return api.post(`/admin/transactions/${id}/assess-risk`);
  },

  // 获取交易统计
  getTransactionStatistics: (period?: 'today' | 'week' | 'month' | 'all'): Promise<TransactionStatistics> => {
    return api.get('/admin/transactions/statistics', { params: { period } });
  },

  /**
   * 获取审核记录
   */
  getReviewRecords: async (transactionId: number) => {
    return api.get(`/admin/transactions/${transactionId}/reviews`)
  },

  /**
   * 导出交易记录
   */
  exportTransactions: async (params?: {
    search?: string
    status?: string
    type?: string
    riskLevel?: string
    startDate?: string
    endDate?: string
  }) => {
    return api.post('/admin/transactions/export', params)
  },
}

/**
 * 系统监控API
 */
export const monitoringApi = {
  /**
   * 获取系统状态
   */
  getSystemStatus: async () => {
    return api.get('/admin/system-status')
  },

  /**
   * 获取性能指标
   */
  getMetrics: async () => {
    return api.get('/admin/monitoring/metrics')
  },

  /**
   * 获取日志
   */
  getLogs: async (params?: {
    level?: string
    startDate?: string
    endDate?: string
    limit?: number
  }) => {
    return api.get('/admin/monitoring/logs', { params })
  },
}

// 任务管理相关接口
export interface Task {
  id: number;
  user_id: number;
  task_type: 'newbie' | 'quiz' | 'god';
  task_name: string;
  task_description: string;
  reward_amount: number;
  status: 'pending' | 'completed' | 'failed';
  completed_at?: string;
  created_at: string;
  updated_at?: string;
  email?: string;
  invite_code?: string;
  user_status?: string;
}

export interface TaskDetail extends Task {
  balance?: number;
  user_created_at?: string;
  userTasks?: Task[];
}

export interface TaskStatistics {
  overview: {
    total: number;
    completed: number;
    pending: number;
    completionRate: string;
  };
  timeStats: {
    today: number;
    week: number;
    month: number;
  };
  typeStats: Array<{
    task_type: string;
    count: number;
    completed: number;
    avg_reward: number;
  }>;
  rewards: {
    totalAmount: number;
    rewardedTasks: number;
    avgAmount: number;
  };
}

export interface TaskConfig {
  id: number;
  task_type: string;
  task_name: string;
  task_description: string;
  reward_amount: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TaskDetailResponse {
  task: TaskDetail;
  userTasks: Task[];
}

export interface TaskConfigResponse {
  configs: Record<string, TaskConfig[]>;
  all: TaskConfig[];
}

export interface BatchRewardRequest {
  taskIds: number[];
  rewardAmount: number;
  description?: string;
}

export interface BatchRewardResponse {
  successCount: number;
  failedTasks: Array<{
    taskId: number;
    reason: string;
  }>;
}

// 任务管理 API
export const taskApi = {
  // 获取任务列表
  getTasks: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    taskType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TaskListResponse> =>
    api.get('/admin/tasks', { params }),

  // 获取任务详情
  getTaskDetail: (id: number): Promise<TaskDetailResponse> =>
    api.get(`/admin/tasks/${id}`),

  // 获取任务统计数据
  getTaskStatistics: (): Promise<TaskStatistics> =>
    api.get('/admin/tasks/statistics'),

  // 获取任务配置
  getTaskConfigs: (): Promise<TaskConfigResponse> =>
    api.get('/admin/tasks/configs'),

  // 更新任务配置
  updateTaskConfig: (id: number, data: Partial<TaskConfig>): Promise<{ message: string }> =>
    api.put(`/admin/tasks/configs/${id}`, data),

  // 批量发放奖励
  batchReward: (data: BatchRewardRequest): Promise<BatchRewardResponse> =>
    api.post('/admin/tasks/batch-reward', data),

  // 导出任务数据
  exportTasks: (params?: {
    status?: string;
    taskType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> =>
    api.get('/admin/tasks/export', { params, responseType: 'blob' }),
};

// 红包管理相关接口
export interface RedpacketStatistics {
  overview: {
    totalEvents: number;
    activeEvents: number;
    completedEvents: number;
    totalDistributed: number;
    avgAmount: number;
  };
  today: {
    events: number;
    distributed: number;
    participants: number;
  };
  grabs: {
    totalGrabs: number;
    uniqueUsers: number;
    totalAmount: number;
    avgAmount: number;
    maxAmount: number;
  };
  timeWindows: Array<{
    hour: number;
    grabCount: number;
    totalAmount: number;
  }>;
}

export interface RedpacketEvent {
  id: number;
  event_name: string;
  description: string;
  total_amount: number;
  min_amount: number;
  max_amount: number;
  time_windows: string;
  duration: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  distributed_amount: number;
  grab_count: number;
}

export interface RedpacketRecord {
  id: number;
  event_id: number;
  user_id: number;
  amount: number;
  grabbed_at: string;
  email: string;
  invite_code: string;
  user_status: number;
  event_name: string;
  event_total_amount: number;
}

export interface RedpacketConfig {
  id?: number;
  timeWindows: Array<{ hour: number; minute: number }>;
  duration: number;
  totalPool: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RedpacketEventListResponse {
  events: RedpacketEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface RedpacketRecordListResponse {
  records: RedpacketRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateRedpacketEventRequest {
  eventName: string;
  description: string;
  totalAmount: number;
  minAmount: number;
  maxAmount: number;
  timeWindows: Array<{ hour: number; minute: number }>;
  duration: number;
  startTime: string;
  endTime: string;
}

export interface UpdateRedpacketStatusRequest {
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  reason?: string;
}

// 红包管理 API
export const redpacketApi = {
  // 获取红包统计数据
  getStatistics: (): Promise<RedpacketStatistics> =>
    api.get('/admin/redpackets/statistics'),

  // 获取红包活动列表
  getEvents: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RedpacketEventListResponse> =>
    api.get('/admin/redpackets/events', { params }),

  // 获取红包记录列表
  getRecords: (params?: {
    page?: number;
    limit?: number;
    eventId?: number;
    userId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RedpacketRecordListResponse> =>
    api.get('/admin/redpackets/records', { params }),

  // 创建红包活动
  createEvent: (data: CreateRedpacketEventRequest): Promise<{ eventId: number; message: string }> =>
    api.post('/admin/redpackets/events', data),

  // 更新红包活动状态
  updateEventStatus: (id: number, data: UpdateRedpacketStatusRequest): Promise<{ message: string }> =>
    api.put(`/admin/redpackets/events/${id}/status`, data),

  // 获取红包配置
  getConfig: (): Promise<RedpacketConfig> =>
    api.get('/admin/redpackets/config'),

  // 更新红包配置
  updateConfig: (data: Partial<RedpacketConfig>): Promise<{ message: string }> =>
    api.put('/admin/redpackets/config', data),
};

// 钱包监控相关接口
export interface WalletMonitoringStatistics {
  wallets: {
    total_wallets: number;
    active_wallets: number;
    inactive_wallets: number;
    frozen_wallets: number;
  };
  balance: {
    total_balance: number;
    avg_balance: number;
    max_balance: number;
    min_balance: number;
    non_zero_wallets: number;
  };
  today: {
    today_transactions: number;
    today_deposits: number;
    today_withdrawals: number;
    pending_transactions: number;
  };
  alerts: {
    total_alerts: number;
    active_alerts: number;
    high_severity_alerts: number;
  };
}

export interface WalletAlert {
  id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  title: string;
  description: string;
  wallet_address: string;
  threshold_value?: number;
  actual_value?: number;
  resolved_at?: string;
  resolved_by?: number;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  invite_code?: string;
  resolved_by_name?: string;
}

export interface WalletAlertListResponse {
  alerts: WalletAlert[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}

export interface BalanceTrend {
  date: string;
  deposits: number;
  withdrawals: number;
  deposit_count: number;
  withdraw_count: number;
}

export interface BalanceDistribution {
  balance_range: string;
  wallet_count: number;
}

export interface BalanceTrendsResponse {
  trends: BalanceTrend[];
  distribution: BalanceDistribution[];
}

export interface WalletMonitoringConfig {
  id?: number;
  balance_threshold: number;
  transaction_threshold: number;
  daily_limit: number;
  alert_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  check_interval: number;
  created_at?: string;
  updated_at?: string;
}

export interface ResolveAlertRequest {
  resolution_notes: string;
}

// 钱包监控API
export const walletMonitoringApi = {
  // 获取监控统计
  getStatistics: (): Promise<WalletMonitoringStatistics> =>
    api.get('/admin/wallet-monitoring/statistics'),

  // 获取告警列表
  getAlerts: (params: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WalletAlertListResponse> =>
    api.get('/admin/wallet-monitoring/alerts', { params }),

  // 获取余额趋势
  getBalanceTrends: (params: {
    days?: number;
  }): Promise<BalanceTrendsResponse> =>
    api.get('/admin/wallet-monitoring/balance-trends', { params }),

  // 解决告警
  resolveAlert: (id: number, data: ResolveAlertRequest): Promise<any> =>
    api.put(`/admin/wallet-monitoring/alerts/${id}/resolve`, data),

  // 获取监控配置
  getConfig: (): Promise<WalletMonitoringConfig> =>
    api.get('/admin/wallet-monitoring/config'),

  // 更新监控配置
  updateConfig: (data: Partial<WalletMonitoringConfig>): Promise<any> =>
    api.put('/admin/wallet-monitoring/config', data),
};

export default api