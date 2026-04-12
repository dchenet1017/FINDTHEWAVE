import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { waveleaderService } from '@/services/waveleader.service'
import { businessService } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'

export const useServiceArea = () => {
  return useQuery({
    queryKey: ['waveleader', 'service-area'],
    queryFn: async () => {
      const { data } = await waveleaderService.getServiceArea()
      if (data.success && data.data) return data.data
      return {
        center: [-73.9857, 40.7484] as [number, number],
        radius: 10,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdateServiceArea = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { center: [number, number]; radius: number }) =>
      waveleaderService.updateServiceArea({
        latitude: data.center[1],
        longitude: data.center[0],
        radius: data.radius,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'service-area'] })
      queryClient.invalidateQueries({ queryKey: ['waveleader', 'dashboard'] })
      toast.success('Service area updated')
    },
    onError: () => {
      toast.error('Failed to update service area')
    },
  })
}

export const useBusinessesInArea = (
  center: [number, number] | undefined,
  radius: number
) => {
  return useQuery({
    queryKey: ['waveleader', 'businesses-area', center, radius],
    queryFn: async () => {
      if (!center) return []
      try {
        const res = await businessService.getNearbyBusinesses({
          latitude: center[1],
          longitude: center[0],
          radiusMiles: radius,
        })
        const raw = res.data as any
        const data = raw?.data ?? raw
        if (Array.isArray(data)) return data as Business[]
        if (Array.isArray(data?.items)) return data.items as Business[]
        if (Array.isArray(data?.businesses)) return data.businesses as Business[]
        return []
      } catch {
        const res = await businessService.getBusinesses({
          page: 1,
          limit: 200,
        })
        const raw = res.data as any
        const data = raw?.data ?? raw
        if (Array.isArray(data)) return data as Business[]
        if (Array.isArray(data?.items)) return data.items as Business[]
        return []
      }
    },
    enabled: !!center && radius > 0,
    staleTime: 60 * 1000,
  })
}

export const useOpportunities = () => {
  return useQuery({
    queryKey: ['waveleader', 'opportunities'],
    queryFn: async () => {
      const { data } = await waveleaderService.getOpportunities()
      if (data.success && data.data) return data.data
      return []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useBookingLocations = (period: string = 'week') => {
  return useQuery({
    queryKey: ['waveleader', 'booking-locations', period],
    queryFn: async () => {
      const { data } = await waveleaderService.getBookingLocations(period)
      if (data.success && data.data) return data.data
      return []
    },
    staleTime: 60 * 1000,
  })
}

export const useEarningsHeatmap = (period: string = 'week') => {
  return useQuery({
    queryKey: ['waveleader', 'earnings-heatmap', period],
    queryFn: async () => {
      const { data } = await waveleaderService.getEarningsHeatmap(period)
      if (data.success && data.data) return data.data
      return []
    },
    staleTime: 5 * 60 * 1000,
  })
}
