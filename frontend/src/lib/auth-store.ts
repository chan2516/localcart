import { create } from 'zustand'
import { apiClient } from './api-client'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN'
  vendorId?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

interface AuthStore {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setLoading: (loading: boolean) => void

  // Auth methods
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  loadUserFromStorage: () => void
  getProfile: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      })

      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)

      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true })
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      })

      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)

      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    })
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return

    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      })

      localStorage.setItem('accessToken', response.accessToken)
      set({
        accessToken: response.accessToken,
        user: response.user,
      })
    } catch {
      get().logout()
    }
  },

  loadUserFromStorage: () => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('accessToken')
    if (token) {
      set({ accessToken: token })
    }
  },

  getProfile: async () => {
    try {
      const user = await apiClient.get<User>('/auth/profile')
      set({ user, isAuthenticated: true })
    } catch {
      get().logout()
    }
  },
}))
