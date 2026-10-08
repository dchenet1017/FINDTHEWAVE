import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Activity } from '@/components/admin/RecentActivity'

export interface AdminStats {
  totalUsers: number
  userGrowth: number
  activeWaveLeaders: number
  waveLeaderGrowth: number
  totalBusinesses: number
  businessGrowth: number
  monthlyRevenue: number
  revenueGrowth: number
  userChartData: Array<{ name: string; value: number }>
  revenueChartData: Array<{ name: string; value: number }>
  recentActivity: Activity[]
  pendingBusinesses: number
  flaggedContent: number
  pendingWaveLeaders: number
}

/** Figures for the admin home page, all computed server-side from real rows */
export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean
        data: Omit<AdminStats, 'recentActivity'> & {
          recentActivity: (Omit<Activity, 'timestamp'> & { timestamp: string })[]
        }
      }>('/admin/dashboard')
      return {
        ...data.data,
        recentActivity: data.data.recentActivity.map((a) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })),
      }
    },
    staleTime: 60 * 1000,
  })
}
