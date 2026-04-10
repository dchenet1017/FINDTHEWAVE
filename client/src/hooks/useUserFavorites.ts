import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userService } from '@/services/user.service'
import type { Business } from '../../../../shared/types/business'

export const useFavorites = () => {
  return useQuery<Business[]>({
    queryKey: ['user', 'favorites'],
    queryFn: async () => {
      try {
        const { data } = await userService.getFavorites()
        if (data.success && data.data) {
          return data.data
        }
        // Fallback to empty array if API not implemented
        return []
      } catch (error) {
        // Return mock data for development
        return []
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useAddFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (businessId: string) => {
      const { data } = await userService.addFavorite(businessId)
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to add favorite')
      }
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'favorites'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
      toast.success('Added to favorites')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add favorite')
    },
  })
}

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (businessId: string) => {
      const { data } = await userService.removeFavorite(businessId)
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to remove favorite')
      }
      return businessId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'favorites'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
      toast.success('Removed from favorites')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove favorite')
    },
  })
}

export const useIsFavorite = (businessId: string) => {
  const { data: favorites = [] } = useFavorites()
  return favorites.some((fav) => fav.id === businessId)
}

