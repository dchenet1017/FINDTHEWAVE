import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface WaveLeaderDiscovery {
  id: string
  displayName: string
  specialty: string
  description: string
  hourlyRate: number
  rating: number
  totalReviews: number
  isAvailable: boolean
  isVerified: boolean
  location: string | null
  latitude: number | null
  longitude: number | null
  avatar: string | null
  distance?: number
}

export interface WaveLeaderFilters {
  page?: number
  limit?: number
  specialty?: string
  minRate?: number
  maxRate?: number
  minRating?: number
  availableNow?: boolean
  availableThisWeek?: boolean
  radiusMiles?: number
  verifiedOnly?: boolean
  sortBy?: 'rating' | 'hourlyRate' | 'createdAt' | 'distance'
  sortOrder?: 'asc' | 'desc'
  search?: string
  lat?: number
  lng?: number
}

export interface ListWaveLeadersResponse {
  waveLeaders: WaveLeaderDiscovery[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useWaveLeaders(filters: WaveLeaderFilters) {
  return useQuery({
    queryKey: ['waveleaders', filters],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {}
      if (filters.page != null) params.page = filters.page
      if (filters.limit != null) params.limit = filters.limit
      if (filters.specialty) params.specialty = filters.specialty
      if (filters.minRate != null) params.minRate = filters.minRate
      if (filters.maxRate != null) params.maxRate = filters.maxRate
      if (filters.minRating != null) params.minRating = filters.minRating
      if (filters.availableNow) params.availableNow = 'true'
      if (filters.verifiedOnly) params.verifiedOnly = 'true'
      if (filters.radiusMiles != null) params.radiusMiles = filters.radiusMiles
      if (filters.sortBy) params.sortBy = filters.sortBy
      if (filters.sortOrder) params.sortOrder = filters.sortOrder
      if (filters.search) params.search = filters.search
      if (filters.lat != null) params.lat = filters.lat
      if (filters.lng != null) params.lng = filters.lng

      const { data } = await api.get<{ success: boolean; data: ListWaveLeadersResponse }>(
        '/waveleader',
        { params }
      )
      const result = data.success ? data.data : data
      return result ?? { waveLeaders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
    },
  })
}

export function useNearbyWaveLeaders(
  lat: number | undefined,
  lng: number | undefined,
  radiusMiles: number,
  enabled = true
) {
  return useQuery({
    queryKey: ['waveleaders', 'nearby', lat, lng, radiusMiles],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: WaveLeaderDiscovery[] }>(
        '/waveleader/nearby',
        { params: { lat, lng, radius: radiusMiles, limit: 50 } }
      )
      const result = data.success ? data.data : data
      return Array.isArray(result) ? result : []
    },
    enabled: !!lat && !!lng && radiusMiles > 0 && enabled,
    // lat/lng recompute from the map bounds on every pan when the user's
    // location isn't available, so keep showing the previous results while
    // the next fetch is in flight instead of flashing the layer empty.
    placeholderData: keepPreviousData,
  })
}

export function useSearchWaveLeaders(searchTerm: string, enabled = true) {
  return useQuery({
    queryKey: ['waveleaders', 'search', searchTerm],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: WaveLeaderDiscovery[] }>(
        '/waveleader/search',
        { params: { q: searchTerm, limit: 20 } }
      )
      const result = data.success ? data.data : []
      return Array.isArray(result) ? result : []
    },
    enabled: searchTerm.trim().length >= 2 && enabled,
  })
}
