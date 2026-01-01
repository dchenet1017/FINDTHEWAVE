import { Role } from '@prisma/client'

export interface AuthResponse {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
  }
}

export interface TokenPayload {
  userId: string
  role: Role
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role: 'USER' | 'WAVELEADER' | 'BUSINESS'
}

export interface LoginData {
  email: string
  password: string
}

export interface UserWithoutPassword {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  phone: string | null
  role: Role
  isVerified: boolean
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
  updatedAt: Date
}

