import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 用户信息接口
 */
export interface AdminUser {
  id: number
  username: string
  email: string
  role: string
  permissions: string[]
  lastLoginAt: string
  status: 'active' | 'inactive' | 'locked'
}

/**
 * 认证状态接口
 */
interface AuthState {
  // 状态
  isAuthenticated: boolean
  user: AdminUser | null
  token: string | null
  refreshToken: string | null
  
  // 操作
  login: (user: AdminUser, token: string, refreshToken: string) => void
  logout: () => void
  updateUser: (user: Partial<AdminUser>) => void
  setToken: (token: string) => void
}

/**
 * 认证状态管理
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      
      // 登录操作
      login: (user: AdminUser, token: string, refreshToken: string) => {
        set({
          isAuthenticated: true,
          user,
          token,
          refreshToken,
        })
      },
      
      // 登出操作
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
        })
      },
      
      // 更新用户信息
      updateUser: (userData: Partial<AdminUser>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData }
          })
        }
      },
      
      // 设置token
      setToken: (token: string) => {
        set({ token })
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
)