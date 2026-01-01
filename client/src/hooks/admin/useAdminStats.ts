import { useQuery } from '@tanstack/react-query'
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
}

// Mock data generator
const generateUserChartData = () => {
  const days = 30
  const data = []
  let baseValue = 1000

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    baseValue += Math.floor(Math.random() * 20) - 5
    data.push({
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.max(800, baseValue),
    })
  }
  return data
}

const generateRevenueChartData = () => {
  const days = 7
  const data = []
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  for (let i = 0; i < days; i++) {
    data.push({
      name: dayNames[i],
      value: Math.floor(Math.random() * 5000) + 2000,
    })
  }
  return data
}

const generateRecentActivity = (): Activity[] => {
  const activities: Activity[] = []
  const types: Activity['type'][] = [
    'user_registered',
    'business_pending',
    'booking_created',
    'review_posted',
  ]
  const names = [
    'John Doe',
    'Jane Smith',
    'Mike Johnson',
    'Sarah Williams',
    'David Brown',
    'Emily Davis',
  ]

  for (let i = 0; i < 10; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const name = names[Math.floor(Math.random() * names.length)]
    const hoursAgo = Math.floor(Math.random() * 48)

    let description = ''
    switch (type) {
      case 'user_registered':
        description = `${name} registered a new account`
        break
      case 'business_pending':
        description = `${name}'s business is pending approval`
        break
      case 'booking_created':
        description = `${name} created a new booking`
        break
      case 'review_posted':
        description = `${name} posted a review`
        break
    }

    activities.push({
      id: `activity-${i}`,
      type,
      description,
      timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      user: {
        name,
        avatar: undefined,
      },
    })
  }

  return activities.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )
}

export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      return {
        totalUsers: 1247,
        userGrowth: 12.5,
        activeWaveLeaders: 89,
        waveLeaderGrowth: 8.3,
        totalBusinesses: 156,
        businessGrowth: 15.2,
        monthlyRevenue: 24850,
        revenueGrowth: 22.1,
        userChartData: generateUserChartData(),
        revenueChartData: generateRevenueChartData(),
        recentActivity: generateRecentActivity(),
        pendingBusinesses: 12,
        flaggedContent: 3,
        pendingWaveLeaders: 5,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

