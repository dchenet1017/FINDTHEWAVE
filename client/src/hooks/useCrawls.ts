import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import api from '@/lib/axios'
import type { Crawl, CrawlsListResponse, CrawlDiscoveryFilters, MyCrawlRegistration } from '@/types/crawl'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { code?: string; message?: string } }

function unwrap<T>(res: { data: ApiEnvelope<T> }, fallback: string): T {
  const body = res.data
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message || fallback)
  }
  return body.data
}

function unwrapRegistration(res: { data: ApiEnvelope<MyCrawlRegistration | null> }): MyCrawlRegistration | null {
  const body = res.data
  if (!body.success) {
    throw new Error(body.error?.message || 'Failed to load registration')
  }
  return body.data ?? null
}

export const useCrawls = (filters: CrawlDiscoveryFilters) => {
  return useQuery<CrawlsListResponse>({
    queryKey: ['crawls', filters],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<CrawlsListResponse>>('/crawls', {
        params: {
          search: filters.search || undefined,
          sort: filters.sort,
          page: filters.page,
          limit: filters.limit,
        },
      })
      return unwrap(res, 'Failed to load crawls')
    },
    staleTime: 30 * 1000,
  })
}

export const useNearbyCrawls = (lat: number | undefined, lng: number | undefined, radius: number, enabled = true) => {
  return useQuery<{ items: Crawl[] }>({
    queryKey: ['crawls', 'nearby', lat, lng, radius],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ items: Crawl[] }>>('/crawls/nearby', {
        params: { lat, lng, radius },
      })
      return unwrap(res, 'Failed to load nearby crawls')
    },
    enabled: enabled && lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng),
    staleTime: 60 * 1000,
    // lat/lng recompute from the map bounds on every pan when the user's
    // location isn't available, so keep showing the previous results while
    // the next fetch is in flight instead of flashing the layer empty.
    placeholderData: keepPreviousData,
  })
}

export const useCrawlDetails = (crawlId: string | undefined) => {
  return useQuery<Crawl>({
    queryKey: ['crawls', 'detail', crawlId],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<Crawl>>(`/crawls/${crawlId}`)
      return unwrap(res, 'Crawl not found')
    },
    enabled: !!crawlId,
    retry: false,
  })
}

export const useMyCrawlRegistration = (crawlId: string | undefined, enabled: boolean) => {
  return useQuery<MyCrawlRegistration | null>({
    queryKey: ['crawls', 'registration', crawlId],
    queryFn: async () => {
      try {
        const res = await api.get<ApiEnvelope<MyCrawlRegistration | null>>(`/crawls/${crawlId}/my-registration`)
        return unwrapRegistration(res)
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) return null
        throw e
      }
    },
    enabled: !!crawlId && enabled,
    retry: false,
  })
}

export const useRegisterForCrawl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (crawlId: string) => {
      const res = await api.post<ApiEnvelope<MyCrawlRegistration>>(`/crawls/${crawlId}/register`)
      return unwrap(res, 'Registration failed')
    },
    onSuccess: (_data, crawlId) => {
      queryClient.invalidateQueries({ queryKey: ['crawls', 'detail', crawlId] })
      queryClient.invalidateQueries({ queryKey: ['crawls', 'registration', crawlId] })
      queryClient.invalidateQueries({ queryKey: ['crawls'] })
      toast.success('Registered for the crawl!')
    },
    onError: (e: unknown) => {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error?.message
          ? String(e.response.data.error.message)
          : e instanceof Error
            ? e.message
            : 'Registration failed'
      toast.error(msg)
    },
  })
}

export const useCancelCrawlRegistration = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (crawlId: string) => {
      const res = await api.delete<ApiEnvelope<{ cancelled: boolean }>>(`/crawls/${crawlId}/register`)
      return unwrap(res, 'Cancel failed')
    },
    onSuccess: (_data, crawlId) => {
      queryClient.invalidateQueries({ queryKey: ['crawls', 'detail', crawlId] })
      queryClient.invalidateQueries({ queryKey: ['crawls', 'registration', crawlId] })
      queryClient.invalidateQueries({ queryKey: ['crawls'] })
      toast.success('Registration cancelled')
    },
    onError: (e: unknown) => {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error?.message
          ? String(e.response.data.error.message)
          : e instanceof Error
            ? e.message
            : 'Could not cancel'
      toast.error(msg)
    },
  })
}
