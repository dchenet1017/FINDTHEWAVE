import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Event, EventsListResponse, EventDiscoveryFilters } from '@/types/event'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } }

function unwrap<T>(res: { data: ApiEnvelope<T> }, fallback: string): T {
  const body = res.data
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message || fallback)
  }
  return body.data
}

export type EventsQueryParams = Partial<{
  search: string
  category: string
  dateFrom: string
  dateTo: string
  freeOnly: boolean
  hasWaveLeader: boolean
  virtualOnly: boolean
  minPrice: number
  maxPrice: number
  lat: number
  lng: number
  radius: number
  minSpotsLeft: number
  sort: string
  page: number
  limit: number
}>

function filtersToParams(f: EventDiscoveryFilters, userLat?: number, userLng?: number): EventsQueryParams {
  const params: EventsQueryParams = {
    search: f.search || undefined,
    category: f.category === 'ALL' ? undefined : f.category,
    freeOnly: f.freeOnly || undefined,
    hasWaveLeader: f.hasWaveLeader || undefined,
    virtualOnly: f.virtualOnly || undefined,
    minPrice: f.minPrice > 0 ? f.minPrice : undefined,
    maxPrice: f.maxPrice < 500 ? f.maxPrice : undefined,
    minSpotsLeft: f.minSpotsLeft > 0 ? f.minSpotsLeft : undefined,
    sort: f.sort,
    page: f.page,
    limit: f.limit,
  }
  if (userLat != null && userLng != null && f.distanceMiles > 0) {
    params.lat = userLat
    params.lng = userLng
    params.radius = f.distanceMiles
  }
  return params
}

export const useEvents = (
  filters: EventDiscoveryFilters,
  opts?: { dateFrom?: string; dateTo?: string; userLat?: number; userLng?: number }
) => {
  const params = {
    ...filtersToParams(filters, opts?.userLat, opts?.userLng),
    dateFrom: opts?.dateFrom,
    dateTo: opts?.dateTo,
  }

  return useQuery<EventsListResponse>({
    queryKey: ['events', params],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<EventsListResponse>>('/events', {
        params: {
          ...params,
          freeOnly: params.freeOnly ? 'true' : undefined,
          hasWaveLeader: params.hasWaveLeader ? 'true' : undefined,
          virtualOnly: params.virtualOnly ? 'true' : undefined,
        },
      })
      return unwrap(res, 'Failed to load events')
    },
    staleTime: 30 * 1000,
  })
}

export const useNearbyEvents = (lat: number | undefined, lng: number | undefined, radius: number) => {
  return useQuery<{ items: Event[] }>({
    queryKey: ['events', 'nearby', lat, lng, radius],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ items: Event[] }>>('/events/nearby', {
        params: { lat, lng, radius },
      })
      return unwrap(res, 'Failed to load nearby events')
    },
    enabled: lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng),
    staleTime: 60 * 1000,
  })
}

export const useFeaturedEvents = () => {
  return useQuery<{ items: Event[] }>({
    queryKey: ['events', 'featured'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ items: Event[] }>>('/events/featured')
      return unwrap(res, 'Failed to load featured events')
    },
    staleTime: 120 * 1000,
  })
}

