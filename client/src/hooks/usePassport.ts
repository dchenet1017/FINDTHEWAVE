import { useQuery } from '@tanstack/react-query'
import { userService, type PassportData, type CheckIn, type CheckInLocation } from '@/services/user.service'

export const usePassportData = () => {
  return useQuery<PassportData>({
    queryKey: ['user', 'passport'],
    queryFn: async () => {
      try {
        const { data } = await userService.getPassport()
        if (data.success && data.data) {
          return data.data
        }
        // Fallback to mock data if API not implemented
        return generateMockPassportData()
      } catch (error) {
        // Return mock data on error
        return generateMockPassportData()
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCheckInHistory = (limit?: number) => {
  return useQuery<CheckIn[]>({
    queryKey: ['user', 'checkins', 'history', limit],
    queryFn: async () => {
      try {
        const { data } = await userService.getCheckInHistory(limit)
        if (data.success && data.data) {
          return data.data
        }
        // Fallback to mock data if API not implemented
        return generateMockCheckIns(limit || 20)
      } catch (error) {
        // Return mock data on error
        return generateMockCheckIns(limit || 20)
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCheckInLocations = () => {
  return useQuery<CheckInLocation[]>({
    queryKey: ['user', 'checkins', 'locations'],
    queryFn: async () => {
      try {
        const { data } = await userService.getCheckInLocations()
        if (data.success && data.data) {
          return data.data
        }
        // Fallback to mock data if API not implemented
        return generateMockCheckInLocations()
      } catch (error) {
        // Return mock data on error
        return generateMockCheckInLocations()
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

function calculateLevel(totalCheckIns: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (totalCheckIns >= 51) return 'PLATINUM'
  if (totalCheckIns >= 26) return 'GOLD'
  if (totalCheckIns >= 11) return 'SILVER'
  return 'BRONZE'
}

function generatePassportId(): string {
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase()
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `WF-${part1}-${part2}`
}

function generateMockPassportData(): PassportData {
  const totalCheckIns = 12
  return {
    passportId: generatePassportId(),
    level: calculateLevel(totalCheckIns),
    totalCheckIns,
    totalPoints: 1240,
    placesVisited: 8,
    memberSince: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    qrPayload: JSON.stringify({
      userId: 'user123',
      passportId: generatePassportId(),
      timestamp: new Date().toISOString(),
    }),
  }
}

function generateMockCheckIns(limit: number): CheckIn[] {
  const businessTypes = ['BAR', 'RESTAURANT', 'ENTERTAINMENT', 'FITNESS', 'WELLNESS', 'HOTEL', 'OTHER']
  const methods: ('MANUAL' | 'QR_CODE' | 'GEOFENCE')[] = ['MANUAL', 'QR_CODE', 'GEOFENCE']
  
  return Array.from({ length: Math.min(limit, 20) }, (_, i) => {
    const type = businessTypes[i % businessTypes.length]
    const daysAgo = i * 2
    return {
      id: `checkin-${i}`,
      businessId: `business-${i}`,
      business: {
        id: `business-${i}`,
        name: `${type} Place ${i + 1}`,
        type: type as any,
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.006 + (Math.random() - 0.5) * 0.1,
        isVerified: true,
        description: `A great ${type.toLowerCase()} place`,
        location: {
          address: `${i + 100} Main St`,
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
          longitude: -74.006 + (Math.random() - 0.5) * 0.1,
        },
        approvalStatus: 'APPROVED',
        isActive: true,
        images: [],
        userId: 'user1',
      },
      method: methods[i % methods.length],
      points: 10,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
}

function generateMockCheckInLocations(): CheckInLocation[] {
  return Array.from({ length: 12 }, (_, i) => {
    const daysAgo = i * 2
    return {
      id: `checkin-${i}`,
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.006 + (Math.random() - 0.5) * 0.1,
      businessId: `business-${i}`,
      businessName: `Business ${i + 1}`,
      businessType: ['BAR', 'RESTAURANT', 'ENTERTAINMENT'][i % 3],
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
}

