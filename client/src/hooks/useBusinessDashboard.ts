import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface BusinessDashboardBusiness {
  id: string
  name: string
  logoUrl?: string | null
  isVerified: boolean
}

export interface BusinessDashboardResponse {
  business: BusinessDashboardBusiness
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface BusinessStatsResponse {
  todayCheckIns: number
  thisWeekRevenue: number
  activePromotions: number
  averageRating: number
  reviewCount: number
  weekRevenueChangePct?: number
  todayCheckInsChangePct?: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  checkIns: number
}

export interface RecentCheckInItem {
  id: string
  user: { firstName: string | null; lastName: string | null; avatar?: string | null }
  createdAt: string
  points: number
}

function unwrap<T>(resp: any): T {
  if (resp?.success && resp?.data != null) return resp.data as T
  return resp as T
}

export const useBusinessDashboard = () => {
  return useQuery({
    queryKey: ['business', 'dashboard'],
    queryFn: async (): Promise<BusinessDashboardResponse> => {
      const { data } = await api.get('/business/dashboard')
      return unwrap<BusinessDashboardResponse>(data)
    },
    // allow the UI to render even before backend endpoints exist
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useBusinessStats = () => {
  return useQuery({
    queryKey: ['business', 'stats'],
    queryFn: async (): Promise<BusinessStatsResponse> => {
      const { data } = await api.get('/business/stats')
      return unwrap<BusinessStatsResponse>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useBusinessRevenue = (period: '7d' | '30d' | '90d' | '1y') => {
  return useQuery({
    queryKey: ['business', 'revenue', period],
    queryFn: async (): Promise<RevenueDataPoint[]> => {
      const { data } = await api.get('/business/revenue', { params: { period } })
      return unwrap<RevenueDataPoint[]>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useRecentCheckIns = (limit = 5) => {
  return useQuery({
    queryKey: ['business', 'checkins', 'recent', limit],
    queryFn: async (): Promise<RecentCheckInItem[]> => {
      const { data } = await api.get('/business/checkins/recent', { params: { limit } })
      return unwrap<RecentCheckInItem[]>(data)
    },
    retry: false,
    staleTime: 15 * 1000,
  })
}

