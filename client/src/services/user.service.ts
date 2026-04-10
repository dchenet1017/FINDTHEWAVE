import api from '@/lib/axios'
import type { Business as BusinessType } from '../../shared/types/business'

export interface UserStats {
  totalCheckIns: number
  checkInsThisMonth: number
  rewardPoints: number
  rewardLevel: number
  upcomingBookings: number
  favoritesCount: number
}

export interface Booking {
  id: string
  waveLeaderId: string
  waveLeader: {
    id: string
    displayName: string
    specialty: string
    avatar?: string
    user?: {
      avatar?: string
    }
  }
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DECLINED'
  scheduledDate: string
  scheduledTime: string
  duration: number
  totalAmount: number
  notes?: string
  createdAt: string
}

export interface ActivityItem {
  id: string
  type: 'check_in' | 'booking' | 'review' | 'reward' | 'community'
  title: string
  description: string
  timestamp: string
  link?: string
  icon?: string
}

export const userService = {
  getStats: () =>
    api.get<{
      success: boolean
      data?: UserStats
    }>('/users/me/stats'),

  getUpcomingBookings: (limit?: number) =>
    api.get<{
      success: boolean
      data?: Booking[]
    }>('/users/me/bookings', {
      params: {
        status: 'upcoming',
        limit: limit || 3,
      },
    }),

  getRecentActivity: (limit?: number) =>
    api.get<{
      success: boolean
      data?: ActivityItem[]
    }>('/users/me/activity', {
      params: {
        limit: limit || 5,
      },
    }),

  // Communities (user's joined communities)
  getMyCommunities: () =>
    api.get<{
      success: boolean
      data?: Array<{ id: string; name: string; description?: string; icon?: string; color?: string; totalMembers?: number; joinedAt?: string }>
    }>('/users/me/communities'),

  // Favorites
  getFavorites: () =>
    api.get<{
      success: boolean
      data?: BusinessType[]
    }>('/users/me/favorites'),

  addFavorite: (businessId: string) =>
    api.post<{
      success: boolean
      data?: BusinessType
    }>(`/users/me/favorites/${businessId}`),

  removeFavorite: (businessId: string) =>
    api.delete<{
      success: boolean
    }>(`/users/me/favorites/${businessId}`),

  // Passport
  getPassport: () =>
    api.get<{
      success: boolean
      data?: PassportData
    }>('/users/me/passport'),

  // Check-ins
  getCheckInHistory: (limit?: number) =>
    api.get<{
      success: boolean
      data?: CheckIn[]
    }>('/users/me/checkins', {
      params: {
        limit: limit || 100,
      },
    }),

  getCheckInLocations: () =>
    api.get<{
      success: boolean
      data?: CheckInLocation[]
    }>('/users/me/checkins/locations'),

  // Profile
  getProfile: () =>
    api.get<{
      success: boolean
      data?: ProfileData
      error?: { message: string }
    }>('/users/me/profile'),

  updateProfile: (data: ProfileUpdateData) =>
    api.patch<{
      success: boolean
      data?: ProfileData
      error?: { message: string }
    }>('/users/me/profile', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post<{
      success: boolean
      data?: { avatar: string }
      error?: { message: string }
    }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  updateSettings: (data: UserSettings) =>
    api.patch<{
      success: boolean
      data?: UserSettings
      error?: { message: string }
    }>('/users/me/settings', data),

  deleteAccount: () =>
    api.delete<{
      success: boolean
      error?: { message: string }
    }>('/users/me'),
}

export interface PassportData {
  passportId: string
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  totalCheckIns: number
  totalPoints: number
  placesVisited: number
  memberSince: string
  qrPayload: string
}

export interface CheckIn {
  id: string
  businessId: string
  business: BusinessType
  method: 'MANUAL' | 'QR_CODE' | 'GEOFENCE'
  points: number
  createdAt: string
}

export interface CheckInLocation {
  id: string
  latitude: number
  longitude: number
  businessId: string
  businessName: string
  businessType: string
  createdAt: string
}

export type Business = BusinessType

export interface ProfileData {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  bio?: string
  avatar?: string
  isVerified: boolean
  createdAt: string
  stats: {
    checkIns: number
    placesVisited: number
    reviewsWritten: number
    bookings: number
    pointsEarned: number
    memberLevel: number
  }
  communities: Array<{
    id: string
    name: string
    description?: string
    joinedAt: string
  }>
  recentReviews: Array<{
    id: string
    businessId: string
    businessName: string
    rating: number
    comment: string
    createdAt: string
  }>
}

export interface ProfileUpdateData {
  firstName?: string
  lastName?: string
  phone?: string
  bio?: string
}

export interface UserSettings {
  privacy: {
    profileVisibility: 'public' | 'private'
    showCheckInHistory: boolean
    allowLocationTracking: boolean
  }
  notifications: {
    email: {
      bookingConfirmations: boolean
      bookingReminders: boolean
      promotionalOffers: boolean
      weeklyDigest: boolean
    }
    push: {
      nearbyDeals: boolean
      checkInReminders: boolean
      newWaveLeaders: boolean
    }
  }
  preferences: {
    defaultMapView: 'map' | 'satellite' | 'hybrid'
    distanceUnit: 'miles' | 'kilometers'
    theme: 'dark' | 'light' | 'system'
    language: string
  }
}

