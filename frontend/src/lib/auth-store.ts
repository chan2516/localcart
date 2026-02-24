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
  register: (email: string, password: string, firstName: string, lastName: string, phoneNumber?: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  loadUserFromStorage: () => void
  getProfile: () => Promise<void>
  
  // Password reset
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  
  // Vendor methods
  registerVendor: (businessName: string, description: string, businessPhone: string, businessAddress: string) => Promise<void>
  
  // Admin methods
  createAdminUser: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
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

  register: async (email, password, firstName, lastName, phoneNumber = '') => {
    set({ isLoading: true })
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
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

  forgotPassword: async (email) => {
    set({ isLoading: true })
    try {
      await apiClient.post('/auth/forgot-password', { email })
    } finally {
      set({ isLoading: false })
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ isLoading: true })
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  registerVendor: async (businessName, description, businessPhone, businessAddress) => {
    set({ isLoading: true })
    try {
      const response = await apiClient.post<any>('/vendors/register', {
        businessName,
        description,
        businessPhone,
        businessAddress,
      })
      
      set({ user: { ...get().user, role: 'VENDOR', vendorId: response.id } as User })
    } finally {
      set({ isLoading: false })
    }
  },

  createAdminUser: async (email, password, firstName, lastName) => {
    set({ isLoading: true })
    try {
      await apiClient.post('/admin/users/create', {
        email,
        password,
        firstName,
        lastName,
        roles: ['ADMIN'],
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
