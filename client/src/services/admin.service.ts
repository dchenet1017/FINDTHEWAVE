import api from '@/lib/axios'

export interface UserFilters {
  search?: string
  role?: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN' | ''
  status?: 'active' | 'inactive' | 'unverified' | ''
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  role?: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN'
  isActive?: boolean
  isVerified?: boolean
}

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  role: 'USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN'
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin: string | null
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BusinessFilters {
  search?: string
  type?: 'BAR' | 'RESTAURANT' | 'ENTERTAINMENT' | 'FITNESS' | 'WELLNESS' | 'HOTEL' | 'OTHER' | ''
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | ''
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Business {
  id: string
  name: string
  description: string
  type: 'BAR' | 'RESTAURANT' | 'ENTERTAINMENT' | 'FITNESS' | 'WELLNESS' | 'HOTEL' | 'OTHER'
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  images: string[]
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    avatar: string | null
  }
  _count?: {
    promotions: number
    events: number
    checkIns: number
  }
}

export interface BusinessesResponse {
  businesses: Business[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const adminService = {
  // Users
  getUsers: (filters: UserFilters) =>
    api.get<UsersResponse>('/admin/users', { params: filters }),

  getUser: (id: string) => api.get<User>(`/admin/users/${id}`),

  updateUser: (id: string, data: UpdateUserData) =>
    api.patch<User>(`/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  suspendUser: (id: string) => api.post(`/admin/users/${id}/suspend`),

  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),

  bulkAction: (action: string, userIds: string[]) =>
    api.post('/admin/users/bulk', { action, userIds }),

  // Businesses
  getBusinesses: (filters: BusinessFilters) =>
    api.get<BusinessesResponse>('/admin/businesses', { params: filters }),

  getBusiness: (id: string) => api.get<Business>(`/admin/businesses/${id}`),

  updateBusiness: (id: string, data: any) =>
    api.patch<Business>(`/admin/businesses/${id}`, data),

  approveBusiness: (id: string, notes?: string) =>
    api.post<Business>(`/admin/businesses/${id}/approve`, { notes }),

  rejectBusiness: (id: string, reason: string, notes?: string) =>
    api.post<Business>(`/admin/businesses/${id}/reject`, { reason, notes }),

  deleteBusiness: (id: string) => api.delete(`/admin/businesses/${id}`),

  // WaveLeaders
  getWaveLeaders: (filters: any) =>
    api.get('/admin/waveleaders', { params: filters }),

  getWaveLeader: (id: string) =>
    api.get(`/admin/waveleaders/${id}`),

  updateWaveLeader: (id: string, data: any) =>
    api.patch(`/admin/waveleaders/${id}`, data),

  verifyWaveLeader: (id: string) =>
    api.post(`/admin/waveleaders/${id}/verify`),

  suspendWaveLeader: (id: string) =>
    api.post(`/admin/waveleaders/${id}/suspend`),

  activateWaveLeader: (id: string) =>
    api.post(`/admin/waveleaders/${id}/activate`),

  deleteWaveLeader: (id: string) =>
    api.delete(`/admin/waveleaders/${id}`),

  // Analytics
  getAnalytics: (params: { startDate: string; endDate: string }) =>
    api.get('/admin/analytics/overview', { params }),

  getUserAnalytics: (params: { startDate: string; endDate: string }) =>
    api.get('/admin/analytics/users', { params }),

  getRevenueAnalytics: (params: { startDate: string; endDate: string }) =>
    api.get('/admin/analytics/revenue', { params }),
}

