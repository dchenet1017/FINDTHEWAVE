import { useQuery } from '@tanstack/react-query'
import { businessService } from '@/services/business.service'
import { adminService } from '@/services/admin.service'
import type { MapBounds } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'

interface AdminMapData {
  businesses: Business[]
  waveleaders: any[]
  events: any[]
}

const DUMMY_WAVELEADERS = [
  { id: 'wl-1', displayName: 'James Rivera', specialty: 'Nightlife Guide', rating: 4.9, isAvailable: true, latitude: 40.7505, longitude: -73.9934 },
  { id: 'wl-2', displayName: 'Sofia Martinez', specialty: 'Food Tours', rating: 4.8, isAvailable: true, latitude: 40.741, longitude: -73.9896 },
  { id: 'wl-3', displayName: 'David Kim', specialty: 'Cultural Experiences', rating: 4.7, isAvailable: false, latitude: 40.7367, longitude: -73.99 },
  { id: 'wl-4', displayName: 'Aisha Johnson', specialty: 'Wellness & Yoga', rating: 4.6, isAvailable: true, latitude: 40.7589, longitude: -73.9851 },
  { id: 'wl-5', displayName: 'Marco Chen', specialty: 'Adventure Sports', rating: 4.5, isAvailable: true, latitude: 40.729, longitude: -73.9845 },
]

const DUMMY_EVENTS = [
  { id: 'ev-1', title: 'Rooftop Jazz Night', type: 'MUSIC', latitude: 40.7484, longitude: -73.9857, startDate: '2026-04-15' },
  { id: 'ev-2', title: 'Street Food Festival', type: 'FOOD', latitude: 40.732, longitude: -73.9927, startDate: '2026-04-18' },
  { id: 'ev-3', title: 'Comedy Showcase', type: 'COMEDY', latitude: 40.7549, longitude: -73.984, startDate: '2026-04-20' },
  { id: 'ev-4', title: 'Yoga in the Park', type: 'WELLNESS', latitude: 40.745, longitude: -73.982, startDate: '2026-04-22' },
  { id: 'ev-5', title: 'Craft Beer Tasting', type: 'DRINKS', latitude: 40.7425, longitude: -73.988, startDate: '2026-04-25' },
]

export const useAdminMapData = (bounds: MapBounds | null) => {
  return useQuery<AdminMapData>({
    queryKey: ['admin', 'map-data', bounds],
    queryFn: async () => {
      const [bizRes, waveRes] = await Promise.all([
        bounds ? businessService.getBusinessesForMap(bounds) : businessService.getBusinesses({ limit: 200, page: 1 }),
        adminService.getWaveLeaders ? adminService.getWaveLeaders({ page: 1, limit: 200 }) : Promise.resolve({ data: { waveLeaders: [] } } as any),
      ])

      const rawBiz = (bizRes.data as any)?.data ?? bizRes.data
      const businesses: Business[] = Array.isArray(rawBiz)
        ? rawBiz
        : Array.isArray(rawBiz?.items)
        ? rawBiz.items
        : []

      const rawWave = (waveRes as any)?.data?.data ?? (waveRes as any)?.data
      const apiWaveleaders = rawWave?.waveLeaders || (Array.isArray(rawWave) ? rawWave : [])
      const waveleaders = apiWaveleaders.length > 0 ? apiWaveleaders : DUMMY_WAVELEADERS

      return {
        businesses,
        waveleaders,
        events: DUMMY_EVENTS,
      }
    },
    enabled: true,
    staleTime: 30 * 1000,
  })
}

