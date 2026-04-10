import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import type { Advertisement, CreateAdData } from '@/types/ads'

function unwrap<T>(resp: any): T {
  if (resp?.success && resp?.data != null) return resp.data as T
  return resp as T
}

export type AdsTabStatus = 'active' | 'scheduled' | 'paused' | 'completed'

export const useAdvertisements = (status?: AdsTabStatus) => {
  return useQuery({
    queryKey: ['business', 'ads', status],
    queryFn: async (): Promise<Advertisement[]> => {
      const { data } = await api.get('/business/ads', { params: status ? { status } : undefined })
      return unwrap<Advertisement[]>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useAdvertisement = (adId?: string) => {
  const adsQuery = useAdvertisements()
  return {
    ...adsQuery,
    data: adId ? adsQuery.data?.find((ad) => ad.id === adId) : undefined,
  }
}

export const useCreateAdvertisement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (adData: CreateAdData) => {
      const { data } = await api.post('/business/ads', adData)
      return unwrap<Advertisement>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'ads'] })
      toast.success('Advertisement created successfully!')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || e?.message || 'Failed to create advertisement')
    },
  })
}

export const useUpdateAdvertisement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ adId, patch }: { adId: string; patch: Partial<CreateAdData> }) => {
      const { data } = await api.patch(`/business/ads/${adId}`, patch)
      return unwrap<Advertisement>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'ads'] })
      toast.success('Advertisement updated')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || e?.message || 'Failed to update advertisement')
    },
  })
}

export const usePauseAdvertisement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (adId: string) => {
      const { data } = await api.post(`/business/ads/${adId}/pause`)
      return unwrap(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'ads'] })
      toast.success('Advertisement paused')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || e?.message || 'Failed to pause advertisement')
    },
  })
}

export const useResumeAdvertisement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (adId: string) => {
      const { data } = await api.post(`/business/ads/${adId}/resume`)
      return unwrap(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'ads'] })
      toast.success('Advertisement resumed')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || e?.message || 'Failed to resume advertisement')
    },
  })
}

export const useDeleteAdvertisement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (adId: string) => {
      await api.delete(`/business/ads/${adId}`)
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'ads'] })
      toast.success('Advertisement deleted')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message || e?.message || 'Failed to delete advertisement')
    },
  })
}

export const useEstimateAdReach = (radius: number, demographics?: any) => {
  return useQuery({
    queryKey: ['business', 'ad-estimate', radius, demographics],
    queryFn: async () => {
      const { data } = await api.get('/business/ads/estimate', {
        params: { radius, demographics },
      })
      return unwrap(data)
    },
    enabled: radius > 0,
    retry: false,
    staleTime: 30 * 1000,
  })
}

