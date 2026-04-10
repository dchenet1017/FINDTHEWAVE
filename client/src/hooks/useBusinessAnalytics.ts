import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year' | 'custom'

export interface AnalyticsParams {
  period: AnalyticsPeriod
  compareTo?: 'previous' | 'none'
  startDate?: string // YYYY-MM-DD (custom)
  endDate?: string // YYYY-MM-DD (custom)
  granularity?: 'daily' | 'weekly' | 'monthly'
}

export interface SparkMetric {
  total: number
  trendPct: number
  sparkline: number[]
}

export interface BusinessAnalyticsResponse {
  range: { start: string; end: string }
  compareRange?: { start: string; end: string } | null
  metrics: {
    checkIns: SparkMetric
    revenue: SparkMetric
    newCustomers: SparkMetric
    avgRating: { value: number; trendPct: number; reviewCount: number; sparkline?: number[] }
  }
  series: {
    checkIns: { date: string; value: number }[]
    revenue: { date: string; value: number }[]
    customers: { date: string; new: number; returning: number; retentionRate: number }[]
  }
}

export interface PeakHourRow {
  hour: number // 0-23
  checkIns: number
  revenue: number
  avgDurationMinutes?: number
}

export interface TopCustomerRow {
  id: string
  firstName: string | null
  lastName: string | null
  avatar?: string | null
  totalCheckIns: number
  totalSpent: number
  lastVisit: string
}

export interface PromotionPerformanceRow {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'ENDED' | 'SCHEDULED'
  checkIns: number
  revenueImpact: number
}

function unwrap<T>(resp: any): T {
  if (resp?.success && resp?.data != null) return resp.data as T
  return resp as T
}

export const useBusinessAnalytics = (params: AnalyticsParams) => {
  return useQuery({
    queryKey: ['business', 'analytics', params],
    queryFn: async (): Promise<BusinessAnalyticsResponse> => {
      const { data } = await api.get('/business/analytics', { params })
      return unwrap<BusinessAnalyticsResponse>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const usePeakHours = (period: string) => {
  return useQuery({
    queryKey: ['business', 'peak-hours', period],
    queryFn: async (): Promise<PeakHourRow[]> => {
      const { data } = await api.get('/business/analytics/peak-hours', {
        params: { period },
      })
      return unwrap<PeakHourRow[]>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useTopCustomers = (limit = 10) => {
  return useQuery({
    queryKey: ['business', 'top-customers', limit],
    queryFn: async (): Promise<TopCustomerRow[]> => {
      const { data } = await api.get('/business/analytics/top-customers', {
        params: { limit },
      })
      return unwrap<TopCustomerRow[]>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const usePromotionsPerformance = () => {
  return useQuery({
    queryKey: ['business', 'analytics', 'promotions-performance'],
    queryFn: async (): Promise<PromotionPerformanceRow[]> => {
      const { data } = await api.get('/business/analytics/promotions-performance')
      return unwrap<PromotionPerformanceRow[]>(data)
    },
    retry: false,
    staleTime: 60 * 1000,
  })
}

