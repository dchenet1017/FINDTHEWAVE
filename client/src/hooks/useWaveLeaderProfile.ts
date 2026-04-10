import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { waveleaderService } from '@/services/waveleader.service'
import type { WaveLeaderProfile } from '@/services/waveleader.service'

export const useWaveLeaderProfile = () => {
  return useQuery({
    queryKey: ['waveleader', 'profile'],
    queryFn: async () => {
      const { data } = await waveleaderService.getMe()
      if (data.success && data.data) return data.data
      throw new Error('Failed to load profile')
    },
    staleTime: 2 * 60 * 1000,
  })
}

export const usePublicWaveLeaderProfile = (id: string | undefined) => {
  return useQuery({
    queryKey: ['waveleader', 'public', id],
    queryFn: async () => {
      if (!id) throw new Error('ID required')
      const { data } = await waveleaderService.getPublicProfile(id)
      if (data.success && data.data) return data.data
      throw new Error('Failed to load profile')
    },
    enabled: !!id,
  })
}

export const useUpdateWaveLeaderProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<WaveLeaderProfile>) =>
      waveleaderService.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'profile'] })
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'dashboard'] })
      toast.success('Profile updated successfully')
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })
}

export const useWaveLeaderReviews = (id: string | undefined, page = 1) => {
  return useQuery({
    queryKey: ['waveleader', id, 'reviews', page],
    queryFn: async () => {
      if (!id) throw new Error('ID required')
      const { data } = await waveleaderService.getReviews(id, page, 10)
      if (data.success && data.data) return data.data
      return { reviews: [], total: 0 }
    },
    enabled: !!id,
  })
}
