import { create } from 'zustand'
import { apiClient } from './api-client'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  vendorId?: string
  vendorStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
}

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'ADMIN_L1' | 'ADMIN_L2'

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
    vendorStatus?: string
  }
  userId?: number | string
  email?: string
  firstName?: string
  lastName?: string
  roles?: string[]
  vendorId?: number | string
  vendorStatus?: string
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
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  
  // Vendor methods
  registerVendor: (
    businessName: string,
    description: string,
    businessEmail: string,
    businessPhone: string,
    businessAddress: string,
    businessZipCode: string,
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

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true })
    try {
      await apiClient.post('/auth/change-password', {
        oldPassword,
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
    businessZipCode,
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
        businessZipCode,
        taxId,
        businessRegistrationNumber,
        businessType,
      })

      const currentUser = get().user
      const vendorId = response?.id != null ? String(response.id) : undefined
      const updatedUser = currentUser
        ? ({ ...currentUser, role: 'VENDOR', vendorId, vendorStatus: response?.status } as User)
        : null

      if (updatedUser) {
        persistAuthCookies(localStorage.getItem('accessToken'), 'VENDOR')
      }

      set({ user: updatedUser, isAuthenticated: !!updatedUser })
    } finally {
      set({ isLoading: false })
    }
  },

  createAdminUser: async (email, password, firstName, lastName) => {
    set({ isLoading: true })
    try {
      await apiClient.post('/admin/admins', {
        email,
        password,
        firstName,
        lastName,
      })
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
      const currentUser = get().user
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      })

      localStorage.setItem('accessToken', response.accessToken)
      let mappedUser = mapAuthResponseToUser(response)
      if (mappedUser && (!response.roles || response.roles.length === 0) && currentUser?.role) {
        mappedUser = { ...mappedUser, role: currentUser.role }
      }

      if (!mappedUser && currentUser) {
        mappedUser = currentUser
      }

      persistAuthCookies(response.accessToken, mappedUser?.role || currentUser?.role)
      set({
        accessToken: response.accessToken,
        user: mappedUser,
        isAuthenticated: !!mappedUser,
      })
    } catch {
      get().logout()
    }
  },

  loadUserFromStorage: () => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('accessToken')
    if (token) {
      set({ accessToken: token, isAuthenticated: true })
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
  if (roles.some((role) => role.includes('ADMIN_L2'))) return 'ADMIN_L2'
  if (roles.some((role) => role.includes('ADMIN_L1'))) return 'ADMIN_L1'
  if (roles.some((role) => role.includes('ADMIN'))) return 'ADMIN_L1'
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
      vendorStatus: normalizeVendorStatus(response.user.vendorStatus),
    }
  }

  if (response.userId != null && response.email) {
    return {
      id: String(response.userId),
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: mapRole(response.roles),
      vendorId: response.vendorId != null ? String(response.vendorId) : undefined,
      vendorStatus: normalizeVendorStatus(response.vendorStatus),
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
    vendorId: profile.vendorId != null ? String(profile.vendorId) : undefined,
    vendorStatus: normalizeVendorStatus(profile.vendorStatus),
  }
}

function normalizeVendorStatus(value: unknown): User['vendorStatus'] | undefined {
  if (typeof value !== 'string') return undefined

  const normalized = value.toUpperCase()
  if (normalized === 'PENDING' || normalized === 'APPROVED' || normalized === 'REJECTED' || normalized === 'SUSPENDED') {
    return normalized as User['vendorStatus']
  }

  return undefined
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

export function isAnyAdminRole(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'ADMIN_L1' || role === 'ADMIN_L2'
}

export function isLevelOneAdminRole(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'ADMIN_L1'
}
