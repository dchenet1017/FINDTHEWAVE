import { useQuery } from '@tanstack/react-query'
import { userService, type UserStats, type Booking, type ActivityItem } from '@/services/user.service'

/**
 * Dashboard data, straight from the API. These used to fall back to invented
 * numbers, bookings and activity whenever a request failed, which would show
 * pilot users things that never happened. A failure now surfaces as an error.
 */

export const useUserStats = () => {
  return useQuery<UserStats>({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      const { data } = await userService.getStats()
      if (!data.success || !data.data) throw new Error('Could not load your stats')
      return data.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useUpcomingBookings = (limit: number = 3) => {
  return useQuery<Booking[]>({
    queryKey: ['user', 'bookings', 'upcoming', limit],
    queryFn: async () => {
      const { data } = await userService.getUpcomingBookings(limit)
      if (!data.success) throw new Error('Could not load your bookings')
      return data.data ?? []
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useRecentActivity = (limit: number = 5) => {
  return useQuery<ActivityItem[]>({
    queryKey: ['user', 'activity', limit],
    queryFn: async () => {
      const { data } = await userService.getRecentActivity(limit)
      if (!data.success) throw new Error('Could not load your activity')
      return data.data ?? []
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
