import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import type { Crawl } from '@/types/crawl'

function unwrap<T>(resp: unknown): T {
  const r = resp as { success?: boolean; data?: T }
  if (r?.success && r?.data != null) return r.data
  return resp as T
}

export interface BusinessCrawlStats {
  totalCrawls: number
  upcomingCrawls: number
  draftCrawls: number
  totalAttendees: number
}

export type BusinessCrawlsTab = 'upcoming' | 'past' | 'drafts'

export interface CreateCrawlData {
  title: string
  description?: string
  imageUrl?: string | null
  startDate: string
  endDate: string
  maxAttendees?: number | null
  bonusPoints?: number
  stopBusinessIds: string[]
  publishMode?: 'draft' | 'publish'
}

export type UpdateCrawlData = Partial<CreateCrawlData>

export interface CrawlAttendeeRow {
  id: string
  crawlId: string
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  registeredAt: string
  status: string
  completedAt: string | null
  bonusAwarded: boolean
  stopsCompleted: number
}

export interface MyCrawlStop {
  stopId: string
  crawlId: string
  order: number
  crawl: { id: string; title: string; startDate: string; endDate: string; status: string }
}

export const useBusinessCrawlStats = () => {
  return useQuery({
    queryKey: ['business', 'crawls', 'stats'],
    queryFn: async (): Promise<BusinessCrawlStats> => {
      const { data } = await api.get('/business/crawls/stats')
      return unwrap<BusinessCrawlStats>(data)
    },
    retry: false,
    staleTime: 30 * 1000,
  })
}

export const useBusinessCrawls = (tab: BusinessCrawlsTab = 'upcoming') => {
  return useQuery({
    queryKey: ['business', 'crawls', tab],
    queryFn: async (): Promise<Crawl[]> => {
      const { data } = await api.get('/business/crawls', { params: { tab } })
      return unwrap<Crawl[]>(data) ?? []
    },
    retry: false,
    staleTime: 15 * 1000,
  })
}

export const useBusinessCrawl = (crawlId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ['business', 'crawls', crawlId],
    queryFn: async (): Promise<Crawl> => {
      const { data } = await api.get(`/business/crawls/${crawlId}`)
      return unwrap<Crawl>(data)
    },
    enabled: Boolean(crawlId) && enabled,
    retry: false,
  })
}

export const useCreateCrawl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCrawlData): Promise<Crawl> => {
      const { data } = await api.post('/business/crawls', input)
      return unwrap<Crawl>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'crawls'] })
      toast.success('Crawl saved successfully.')
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        'Failed to save crawl'
      toast.error(msg)
    },
  })
}

export const useUpdateCrawl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateCrawlData }): Promise<Crawl> => {
      const { data } = await api.patch(`/business/crawls/${id}`, payload)
      return unwrap<Crawl>(data)
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['business', 'crawls'] })
      queryClient.invalidateQueries({ queryKey: ['business', 'crawls', vars.id] })
      toast.success('Crawl updated.')
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        'Failed to update crawl'
      toast.error(msg)
    },
  })
}

export const useDeleteCrawl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/business/crawls/${id}`)
      return unwrap<{ deleted: boolean }>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'crawls'] })
      toast.success('Draft deleted.')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not delete crawl')
    },
  })
}

export const useCancelCrawl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<Crawl> => {
      const { data } = await api.post(`/business/crawls/${id}/cancel`)
      return unwrap<Crawl>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'crawls'] })
      toast.success('Crawl cancelled.')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not cancel crawl')
    },
  })
}

export const usePublishCrawl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<Crawl> => {
      const { data } = await api.post(`/business/crawls/${id}/publish`)
      return unwrap<Crawl>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'crawls'] })
      toast.success('Crawl published.')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not publish crawl')
    },
  })
}

export const useDuplicateCrawl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<Crawl> => {
      const { data } = await api.post(`/business/crawls/${id}/duplicate`)
      return unwrap<Crawl>(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'crawls'] })
      toast.success('Duplicate created as draft.')
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Could not duplicate crawl')
    },
  })
}

export const useCrawlAttendees = (crawlId: string | undefined) => {
  return useQuery({
    queryKey: ['crawls', crawlId, 'attendees'],
    queryFn: async (): Promise<CrawlAttendeeRow[]> => {
      const { data } = await api.get(`/business/crawls/${crawlId}/attendees`)
      return unwrap<CrawlAttendeeRow[]>(data) ?? []
    },
    enabled: Boolean(crawlId),
    retry: false,
    staleTime: 10 * 1000,
  })
}

/** Stops the logged-in business owns, across all crawls — for the check-in UI. */
export const useMyCrawlStops = () => {
  return useQuery({
    queryKey: ['business', 'crawls', 'my-stops'],
    queryFn: async (): Promise<MyCrawlStop[]> => {
      const { data } = await api.get('/business/crawls/my-stops')
      return unwrap<MyCrawlStop[]>(data) ?? []
    },
    retry: false,
  })
}

export const useCheckInAtStop = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      crawlId,
      stopId,
      attendeeId,
      method,
    }: {
      crawlId: string
      stopId: string
      attendeeId: string
      method?: 'QR_CODE' | 'MANUAL'
    }) => {
      const { data } = await api.post(`/business/crawls/${crawlId}/stops/${stopId}/check-in`, {
        attendeeId,
        method,
      })
      return unwrap<{
        checkedIn?: boolean
        alreadyCheckedIn?: boolean
        attendeeId: string
        stopsCompleted?: number
        totalStops?: number
        bonusAwarded?: boolean
      }>(data)
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crawls', variables.crawlId, 'attendees'] })
      queryClient.invalidateQueries({ queryKey: ['business', 'crawls'] })
      if (result.bonusAwarded) {
        toast.success('Stop check-in complete — crawl finished, bonus awarded!')
      } else if (!result.alreadyCheckedIn) {
        toast.success(`Checked in (${result.stopsCompleted}/${result.totalStops} stops)`)
      }
    },
    onError: (e: unknown) => {
      toast.error((e as Error)?.message || 'Check-in failed')
    },
  })
}
