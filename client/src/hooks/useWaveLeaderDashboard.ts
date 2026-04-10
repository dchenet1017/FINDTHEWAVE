import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { waveleaderService } from '@/services/waveleader.service'

export const useWaveLeaderDashboard = () => {
  return useQuery({
    queryKey: ['waveleader', 'dashboard'],
    queryFn: async () => {
      const { data } = await waveleaderService.getDashboard()
      if (data.success && data.data) return data.data
      throw new Error('Failed to load dashboard')
    },
  })
}

export const useWaveLeaderStats = () => {
  return useQuery({
    queryKey: ['waveleader', 'stats'],
    queryFn: async () => {
      const { data } = await waveleaderService.getStats()
      if (data.success && data.data) return data.data
      throw new Error('Failed to load stats')
    },
  })
}

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (isAvailable: boolean) =>
      waveleaderService.updateAvailability(isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'stats'] })
      toast.success('Availability updated')
    },
    onError: () => {
      toast.error('Failed to update availability')
    },
  })
}
