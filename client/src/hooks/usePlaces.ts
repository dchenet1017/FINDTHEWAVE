import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/user.service'
import { useFavorites, useAddFavorite, useRemoveFavorite, useIsFavorite } from './useUserFavorites'
import type { Business } from '../../../../shared/types/business'

export interface VisitedPlace {
  id: string
  business: Business
  lastVisited: string
  checkInCount: number
}

export const useVisitedPlaces = () => {
  return useQuery<VisitedPlace[]>({
    queryKey: ['user', 'visited-places'],
    queryFn: async () => {
      try {
        const { data } = await userService.getCheckInHistory(100)
        if (data.success && data.data) {
          // Group check-ins by business
          const businessMap = new Map<string, VisitedPlace>()
          
          data.data.forEach((checkIn) => {
            const businessId = checkIn.businessId
            const existing = businessMap.get(businessId)
            
            if (existing) {
              // Update last visited if this is more recent
              const checkInDate = new Date(checkIn.createdAt)
              const existingDate = new Date(existing.lastVisited)
              if (checkInDate > existingDate) {
                existing.lastVisited = checkIn.createdAt
              }
              existing.checkInCount++
            } else {
              businessMap.set(businessId, {
                id: checkIn.id,
                business: checkIn.business,
                lastVisited: checkIn.createdAt,
                checkInCount: 1,
              })
            }
          })
          
          return Array.from(businessMap.values()).sort(
            (a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime()
          )
        }
        return []
      } catch (error) {
        // Return mock data for development
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Re-export favorites hooks
export { useFavorites, useAddFavorite, useRemoveFavorite, useIsFavorite }

