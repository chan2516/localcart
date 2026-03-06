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
  user?: {
    id?: number | string
    email?: string
    firstName?: string
    lastName?: string
    roles?: string[]
    vendorId?: number | string
  }
  userId?: number | string
  email?: string
  firstName?: string
  lastName?: string
  roles?: string[]
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
  registerVendor: (
    businessName: string,
    description: string,
    businessEmail: string,
    businessPhone: string,
    businessAddress: string,
    taxId: string,
    businessRegistrationNumber: string,
    businessType: string
  ) => Promise<void>
  
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

      const mappedUser = mapAuthResponseToUser(response)
      persistAuthCookies(response.accessToken, mappedUser?.role)
      set({ user: mappedUser, accessToken: response.accessToken, isAuthenticated: !!mappedUser })
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
        ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
      })

      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)

      const mappedUser = mapAuthResponseToUser(response)
      persistAuthCookies(response.accessToken, mappedUser?.role)
      set({ user: mappedUser, accessToken: response.accessToken, isAuthenticated: !!mappedUser })
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

  registerVendor: async (
    businessName,
    description,
    businessEmail,
    businessPhone,
    businessAddress,
    taxId,
    businessRegistrationNumber,
    businessType
  ) => {
    set({ isLoading: true })
    try {
      const response = await apiClient.post<any>('/vendors/register', {
        businessName,
        description,
        businessEmail,
        businessPhone,
        businessAddress,
        taxId,
        businessRegistrationNumber,
        businessType,
      })
      
      set({ user: { ...get().user, role: 'VENDOR', vendorId: response.id } as User })
    } finally {
      set({ isLoading: false })
    }
  },

  createAdminUser: async (email, password, firstName, lastName) => {
    set({ isLoading: true })
    try {
      void [email, password, firstName, lastName]
      // Backend currently exposes user management actions, not user creation.
      throw new Error('Admin user creation endpoint is not available in the current backend API')
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    clearAuthCookies()
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
      const mappedUser = mapAuthResponseToUser(response)
      persistAuthCookies(response.accessToken, mappedUser?.role)
      set({
        accessToken: response.accessToken,
        user: mappedUser,
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
      const profile = await apiClient.get<any>('/auth/profile')
      const mappedUser = mapProfileToUser(profile)
      persistAuthCookies(localStorage.getItem('accessToken'), mappedUser?.role)
      set({ user: mappedUser, isAuthenticated: !!mappedUser })
    } catch {
      get().logout()
    }
  },
}))

function mapRole(roles: string[] | undefined): User['role'] {
  if (!roles || roles.length === 0) return 'CUSTOMER'
  if (roles.some((role) => role.includes('ADMIN'))) return 'ADMIN'
  if (roles.some((role) => role.includes('VENDOR'))) return 'VENDOR'
  return 'CUSTOMER'
}

function mapAuthResponseToUser(response: AuthResponse): User | null {
  if (response.user && response.user.id != null && response.user.email) {
    return {
      id: String(response.user.id),
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      role: mapRole(response.user.roles),
      vendorId: response.user.vendorId != null ? String(response.user.vendorId) : undefined,
    }
  }

  if (response.userId != null && response.email) {
    return {
      id: String(response.userId),
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: mapRole(response.roles),
    }
  }

  return null
}

function mapProfileToUser(profile: any): User | null {
  if (!profile || profile.userId == null || !profile.email) return null

  return {
    id: String(profile.userId),
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    role: mapRole(profile.roles),
  }
}

function persistAuthCookies(token: string | null, role?: User['role']) {
  if (typeof document === 'undefined' || !token) return
  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `lc_access_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  if (role) {
    document.cookie = `lc_role=${role}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  }
}

function clearAuthCookies() {
  if (typeof document === 'undefined') return
  document.cookie = 'lc_access_token=; Path=/; Max-Age=0; SameSite=Lax'
  document.cookie = 'lc_role=; Path=/; Max-Age=0; SameSite=Lax'
}
