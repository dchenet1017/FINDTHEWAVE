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
        throw new Error('Request failed')
      } catch (error) {
        // Surface the failure - invented check-ins must never pass for real ones
        throw error
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
        throw new Error('Request failed')
      } catch (error) {
        // Surface the failure - invented check-ins must never pass for real ones
        throw error
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
        throw new Error('Request failed')
      } catch (error) {
        // Surface the failure - invented check-ins must never pass for real ones
        throw error
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
