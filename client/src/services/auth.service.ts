import api from '@/lib/axios'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: 'USER' | 'WAVELEADER' | 'BUSINESS'
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    accessToken: string
    refreshToken: string
  }
  error?: {
    code: string
    message: string
  }
}

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  phone: string | null
  role: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN'
  isVerified: boolean
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),

  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register', data),

  logout: () =>
    api.post('/auth/logout', {
      refreshToken: localStorage.getItem('refreshToken'),
    }),

  refreshToken: () =>
    api.post<{
      success: boolean
      data?: {
        accessToken: string
        refreshToken: string
      }
    }>('/auth/refresh', {
      refreshToken: localStorage.getItem('refreshToken'),
    }),

  verifyEmail: (token: string) =>
    api.post<{
      success: boolean
      data?: {
        message: string
      }
      error?: {
        code: string
        message: string
      }
    }>('/auth/verify-email', { token }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  getCurrentUser: () =>
    api.get<{
      success: boolean
      data?: {
        user: User
      }
    }>('/auth/me'),
}

