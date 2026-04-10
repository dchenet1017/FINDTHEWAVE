import { useQuery } from '@tanstack/react-query'
import { userService, type UserStats, type Booking, type ActivityItem } from '@/services/user.service'

export const useUserStats = () => {
  return useQuery<UserStats>({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      try {
        const { data } = await userService.getStats()
        if (data.success && data.data) {
          return data.data
        }
        // Fallback to mock data if API not implemented
        return {
          totalCheckIns: 12,
          checkInsThisMonth: 5,
          rewardPoints: 1240,
          rewardLevel: 3,
          upcomingBookings: 3,
          favoritesCount: 8,
        }
      } catch (error) {
        // Return mock data on error
        return {
          totalCheckIns: 12,
          checkInsThisMonth: 5,
          rewardPoints: 1240,
          rewardLevel: 3,
          upcomingBookings: 3,
          favoritesCount: 8,
        }
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useUpcomingBookings = (limit: number = 3) => {
  return useQuery<Booking[]>({
    queryKey: ['user', 'bookings', 'upcoming', limit],
    queryFn: async () => {
      try {
        const { data } = await userService.getUpcomingBookings(limit)
        if (data.success && data.data) {
          return data.data
        }
        // Fallback to empty array if API not implemented
        return []
      } catch (error) {
        // Return mock data on error
        return [
          {
            id: '1',
            waveLeaderId: 'wl1',
            waveLeader: {
              id: 'wl1',
              displayName: 'Mike Johnson',
              specialty: 'Surfing',
            },
            status: 'CONFIRMED',
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledTime: '10:00 AM',
            duration: 2,
            totalAmount: 150,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            waveLeaderId: 'wl2',
            waveLeader: {
              id: 'wl2',
              displayName: 'Sarah Williams',
              specialty: 'Yoga',
            },
            status: 'PENDING',
            scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledTime: '2:00 PM',
            duration: 1,
            totalAmount: 80,
            createdAt: new Date().toISOString(),
          },
        ]
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useRecentActivity = (limit: number = 5) => {
  return useQuery<ActivityItem[]>({
    queryKey: ['user', 'activity', limit],
    queryFn: async () => {
      try {
        const { data } = await userService.getRecentActivity(limit)
        if (data.success && data.data) {
          return data.data
        }
        // Fallback to mock data if API not implemented
        return generateMockActivity(limit)
      } catch (error) {
        // Return mock data on error
        return generateMockActivity(limit)
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

function generateMockActivity(limit: number): ActivityItem[] {
  const now = new Date()
  return [
    {
      id: '1',
      type: 'check_in',
      title: 'Checked in at Ocean Breeze Restaurant',
      description: 'You earned 10 points',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      link: '/dashboard/places',
    },
    {
      id: '2',
      type: 'booking',
      title: 'Booking confirmed with Mike Johnson',
      description: 'Surfing session on Dec 15 at 10:00 AM',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      link: '/dashboard/bookings',
    },
    {
      id: '3',
      type: 'reward',
      title: 'Level up!',
      description: 'You reached Level 3',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      link: '/dashboard/rewards',
    },
    {
      id: '4',
      type: 'review',
      title: 'Review submitted',
      description: 'You reviewed Ocean Breeze Restaurant',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      link: '/dashboard/places',
    },
    {
      id: '5',
      type: 'check_in',
      title: 'Checked in at Beachside Bar',
      description: 'You earned 10 points',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      link: '/dashboard/places',
    },
  ].slice(0, limit)
}

