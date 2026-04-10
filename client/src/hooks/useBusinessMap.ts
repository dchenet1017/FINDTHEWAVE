import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'

type ApiEnvelope<T> = { success: boolean; data: T }

function unwrap<T>(resp: any): T {
  if (resp?.success && resp?.data != null) return resp.data as T
  return resp as T
}

export interface BusinessLocationResponse {
  id: string
  name: string
  type: string
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  latitude: number
  longitude: number
  isVerified?: boolean
  adRadiusMiles?: number | null
}

export interface CompetitorItem {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  rating?: number | null
  isVerified?: boolean
  checkIns?: number | null
  hasActivePromotions?: boolean
}

export interface HeatPoint {
  latitude: number
  longitude: number
  count: number
}

export interface NearbyWaveLeaderItem {
  id: string
  displayName: string
  specialty?: string | null
  rating?: number | null
  hourlyRate?: number | null
  isAvailable?: boolean
  latitude: number
  longitude: number
  avatar?: string | null
}

export const useBusinessLocation = () => {
  return useQuery({
    queryKey: ['business', 'location'],
    queryFn: async (): Promise<BusinessLocationResponse> => {
      const { data } = await api.get('/business/location')
      return unwrap<BusinessLocationResponse>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useNearbyCompetitors = (args: {
  type?: string
  lat?: number
  lng?: number
  radiusMiles: number
}) => {
  const { type, lat, lng, radiusMiles } = args
  return useQuery({
    queryKey: ['business', 'competitors', type, lat, lng, radiusMiles],
    queryFn: async (): Promise<CompetitorItem[]> => {
      const { data } = await api.get('/business/competitors', {
        params: { type, lat, lng, radius: radiusMiles },
      })
      return unwrap<CompetitorItem[]>(data)
    },
    enabled: Boolean(type && lat != null && lng != null),
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useCustomerHeatmap = (period = '30d') => {
  return useQuery({
    queryKey: ['business', 'customer-heatmap', period],
    queryFn: async (): Promise<HeatPoint[]> => {
      const { data } = await api.get('/business/analytics/customer-locations', {
        params: { period },
      })
      return unwrap<HeatPoint[]>(data)
    },
    retry: false,
    staleTime: 60 * 1000,
  })
}

export const useNearbyWaveLeaders = (args: { lat?: number; lng?: number; radiusMiles: number }) => {
  const { lat, lng, radiusMiles } = args
  return useQuery({
    queryKey: ['business', 'waveleaders', lat, lng, radiusMiles],
    queryFn: async (): Promise<NearbyWaveLeaderItem[]> => {
      const { data } = await api.get('/business/waveleaders', {
        params: { lat, lng, radius: radiusMiles },
      })
      return unwrap<NearbyWaveLeaderItem[]>(data)
    },
    enabled: Boolean(lat != null && lng != null),
    retry: false,
    staleTime: 60 * 1000,
  })
}

export const useUpdateBusinessLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (location: { latitude: number; longitude: number; address: string }) => {
      const { data } = await api.patch('/business/location', location)
      return unwrap(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'location'] })
      queryClient.invalidateQueries({ queryKey: ['business', 'dashboard'] })
      toast.success('Location updated successfully')
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update location'
      toast.error(msg)
    },
  })
}

