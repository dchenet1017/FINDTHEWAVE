import { useQuery } from '@tanstack/react-query'
import { businessService } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'

export const useMyServiceArea = () => {
  return useQuery({
    queryKey: ['waveleader', 'service-area'],
    queryFn: async () => {
      // placeholder: return a default area
      return {
        center: [-73.9857, 40.7484] as [number, number],
        radius: 10,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useBusinessesInArea = (center?: [number, number], radiusMiles = 10) => {
  return useQuery({
    queryKey: ['waveleader', 'businesses-area', center, radiusMiles],
    queryFn: async () => {
      const res = await businessService.getBusinesses({ page: 1, limit: 200 })
      const data = res.data as any
      if (Array.isArray(data)) return data as Business[]
      if (Array.isArray(data?.items)) return data.items as Business[]
      if (Array.isArray(data?.businesses)) return data.businesses as Business[]
      return []
    },
    enabled: Boolean(center),
    staleTime: 60 * 1000,
  })
}

export const useBookingLocations = (_period: 'day' | 'week' | 'month' = 'week') => {
  return useQuery({
    queryKey: ['waveleader', 'booking-locations', _period],
    queryFn: async () => [],
    staleTime: 60 * 1000,
  })
}

export const useEarningsHeatmap = (_period: 'day' | 'week' | 'month' = 'week') => {
  return useQuery({
    queryKey: ['waveleader', 'earnings-heatmap', _period],
    queryFn: async () => [],
    staleTime: 5 * 60 * 1000,
  })
}

export const useNearbyOpportunities = () => {
  return useQuery({
    queryKey: ['waveleader', 'opportunities'],
    queryFn: async () => [],
    staleTime: 5 * 60 * 1000,
  })
}

export const useWaveLeaderMap = () => {
  const { data: area } = useMyServiceArea()
  const center = area?.center
  const radius = area?.radius
  const { data: businesses = [] } = useBusinessesInArea(center, radius || 10)
  return { area, center, radius, businesses }
}

