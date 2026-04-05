import axios, { AxiosError, AxiosHeaders, AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1'

interface ApiError {
  message: string
  status: number
  errors?: Record<string, string>
}

class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: Array<(token: string | null) => void> = []

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as (typeof error.config & { _retry?: boolean })

        if (error.response?.status !== 401 || !originalRequest) {
          return Promise.reject(error)
        }

        if (originalRequest.url?.includes('/auth/refresh')) {
          this.handleUnauthorizedRedirect()
          return Promise.reject(error)
        }

        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
        if (!refreshToken) {
          this.handleUnauthorizedRedirect()
          return Promise.reject(error)
        }

        if (originalRequest._retry) {
          this.handleUnauthorizedRedirect()
          return Promise.reject(error)
        }

        originalRequest._retry = true

        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.subscribeTokenRefresh((newToken) => {
              if (!newToken) {
                reject(error)
                return
              }

              if (!originalRequest.headers) {
                originalRequest.headers = AxiosHeaders.from({})
              }
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              resolve(this.client(originalRequest))
            })
          })
        }

        this.isRefreshing = true

        try {
          const refreshResponse = await this.client.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
          const newAccessToken = refreshResponse.data.accessToken
          localStorage.setItem('accessToken', newAccessToken)

          this.notifyTokenRefreshed(newAccessToken)

          if (!originalRequest.headers) {
            originalRequest.headers = AxiosHeaders.from({})
          }
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return this.client(originalRequest)
        } catch (refreshError) {
          this.notifyTokenRefreshed(null)
          this.handleUnauthorizedRedirect()
          return Promise.reject(refreshError)
        } finally {
          this.isRefreshing = false
        }
      }
    )
  }

  private subscribeTokenRefresh(callback: (token: string | null) => void) {
    this.refreshSubscribers.push(callback)
  }

  private notifyTokenRefreshed(token: string | null) {
    this.refreshSubscribers.forEach((callback) => callback(token))
    this.refreshSubscribers = []
  }

  private handleUnauthorizedRedirect() {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    const pathname = window.location.pathname || '/'
    const adminScope = pathname.startsWith('/admin') || pathname.startsWith('/auth/admin')
    const vendorScope = pathname.startsWith('/vendor') || pathname.startsWith('/auth/vendor')

    if (adminScope) {
      window.location.href = '/admin/login'
    } else if (vendorScope) {
      window.location.href = '/auth/vendor/login'
    } else {
      window.location.href = '/auth/login'
    }
  }

  async get<T>(url: string, config = {}) {
    try {
      const response = await this.client.get<T>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async post<T>(url: string, data = {}, config = {}) {
    try {
      const response = await this.client.post<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async put<T>(url: string, data = {}, config = {}) {
    try {
      const response = await this.client.put<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async patch<T>(url: string, data = {}, config = {}) {
    try {
      const response = await this.client.patch<T>(url, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete<T>(url: string, config = {}) {
    try {
      const response = await this.client.delete<T>(url, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return {
          message: 'Request timed out. Please check if backend is reachable at 127.0.0.1:8080.',
          status: 504,
        }
      }

      const status = error.response?.status || 500
      const message = error.response?.data?.message || error.message || 'An error occurred'
      const errors =
        error.response?.data?.errors ||
        error.response?.data?.fieldErrors ||
        {}

      return {
        message,
        status,
        errors,
      }
    }

    return {
      message: 'An unexpected error occurred',
      status: 500,
    }
  }
}

export const apiClient = new ApiClient()
