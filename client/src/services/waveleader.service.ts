import api from '@/lib/axios'

export interface WaveLeaderDashboard {
  displayName: string
  isAvailable: boolean
  isVerified: boolean
  rating: number
  totalReviews: number
  thisWeekBookings: number
  thisWeekEarnings: number
  responseRate: number
  upcomingBookings: Array<{
    id: string
    clientName: string
    date: string
    time: string
    location?: string
  }>
  recentReviews: Array<{
    id: string
    clientName: string
    rating: number
    comment: string
    date: string
  }>
  earningsChart: Array<{ date: string; amount: number }>
  serviceArea?: {
    center: [number, number]
    radiusMiles: number
    businessesCount: number
  }
}

export interface WaveLeaderStats {
  thisWeekBookings: number
  thisWeekEarnings: number
  rating: number
  totalReviews: number
  responseRate: number
  trend?: { bookings: number; earnings: number }
}

export interface ServiceArea {
  center: [number, number]
  radius: number
  address?: string
}

export interface WaveLeaderOpportunity {
  id: string
  name: string
  type: string
  description?: string
  latitude: number
  longitude: number
  distance?: number
  logo?: string
}

export interface BookingLocation {
  id: string
  latitude: number
  longitude: number
  address?: string
  date: string
  time: string
  clientName: string
  distance?: number
}

export interface EarningsHeatmapPoint {
  lat: number
  lng: number
  weight: number
}

export interface WaveLeaderProfile {
  id: string
  displayName: string
  specialty: string
  description: string
  hourlyRate: number
  portfolioImages: string[]
  tags: string[]
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  isVerified: boolean
  rating: number
  totalReviews: number
  totalBookings: number
  isAvailable: boolean
  user?: {
    phone?: string | null
    avatar?: string | null
  }
}

export interface PublicWaveLeaderProfile extends WaveLeaderProfile {
  communities?: Array<{ id: string; name: string }>
}

export interface WaveLeaderReview {
  id: string
  clientName: string
  rating: number
  comment: string
  date: string
  waveLeaderResponse?: string | null
}

export const waveleaderService = {
  getDashboard: () =>
    api.get<{ success: boolean; data?: WaveLeaderDashboard }>('/waveleader/dashboard'),

  getStats: () =>
    api.get<{ success: boolean; data?: WaveLeaderStats }>('/waveleader/stats'),

  updateAvailability: (isAvailable: boolean) =>
    api.patch<{ success: boolean }>('/waveleader/me/availability', { isAvailable }),

  getServiceArea: () =>
    api.get<{ success: boolean; data?: ServiceArea }>('/waveleader/me/service-area'),

  updateServiceArea: (data: {
    latitude: number
    longitude: number
    radius: number
  }) =>
    api.put<{ success: boolean }>('/waveleader/me/service-area', data),

  getOpportunities: () =>
    api.get<{
      success: boolean
      data?: WaveLeaderOpportunity[]
    }>('/waveleader/opportunities'),

  getBookingLocations: (period?: string) =>
    api.get<{
      success: boolean
      data?: BookingLocation[]
    }>('/waveleader/bookings/locations', { params: { period } }),

  getEarningsHeatmap: (period?: string) =>
    api.get<{
      success: boolean
      data?: EarningsHeatmapPoint[]
    }>('/waveleader/earnings/heatmap', { params: { period } }),

  getMe: () =>
    api.get<{ success: boolean; data?: WaveLeaderProfile }>('/waveleader/me'),

  updateMe: (data: Partial<WaveLeaderProfile>) =>
    api.patch<{ success: boolean; data?: WaveLeaderProfile }>('/waveleader/me', data),

  getPublicProfile: (id: string) =>
    api.get<{ success: boolean; data?: PublicWaveLeaderProfile }>(`/waveleader/${id}/profile`),

  getReviews: (id: string, page = 1, limit = 10) =>
    api.get<{
      success: boolean
      data?: { reviews: WaveLeaderReview[]; total: number }
    }>(`/waveleader/${id}/reviews`, { params: { page, limit } }),
}
