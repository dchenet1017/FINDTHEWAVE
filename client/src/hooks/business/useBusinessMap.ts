import { useQuery } from '@tanstack/react-query'
import { businessService } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'

export const useMyBusiness = () => {
  return useQuery({
    queryKey: ['business', 'me'],
    queryFn: async () => {
      const res = await businessService.getBusiness('me') // assumes backend supports /businesses/me; otherwise adjust
      return res.data as Business
    },
    staleTime: 60 * 1000,
  })
}

export const useCompetitors = (type?: string, loc?: { lat: number; lng: number }, radiusMiles = 5) => {
  return useQuery({
    queryKey: ['business', 'competitors', type, loc, radiusMiles],
    queryFn: async () => {
      // fallback: fetch businesses filtered by type
      const res = await businessService.getBusinesses({
        type: (type as any) || '',
        page: 1,
        limit: 200,
      })
      return res.data.items || res.data.businesses || (res.data as Business[]) || []
    },
    enabled: Boolean(type),
    staleTime: 60 * 1000,
  })
}

export const useCustomerHeatmap = (businessId?: string, period: 'day' | 'week' | 'month' = 'week') => {
  return useQuery({
    queryKey: ['business', 'heatmap', businessId, period],
    queryFn: async () => {
      // placeholder: returns empty until API exists
      return []
    },
    enabled: Boolean(businessId),
    staleTime: 5 * 60 * 1000,
  })
}

export const useNearbyWaveLeaders = (loc?: { lat: number; lng: number }, radiusMiles = 5) => {
  return useQuery({
    queryKey: ['business', 'waveleaders', loc, radiusMiles],
    queryFn: async () => {
      // placeholder: no API yet
      return []
    },
    enabled: Boolean(loc),
    staleTime: 5 * 60 * 1000,
  })
}

export const useBusinessMap = () => {
  const { data: myBusiness } = useMyBusiness()
  const { data: competitors = [] } = useCompetitors(myBusiness?.type, undefined, 5)
  return { myBusiness, competitors }
}

