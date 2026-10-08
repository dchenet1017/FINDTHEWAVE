import { useQuery } from '@tanstack/react-query'
import { businessService } from '@/services/business.service'
import { adminService } from '@/services/admin.service'
import api from '@/lib/axios'
import type { MapBounds } from '@/services/business.service'
import type { Business } from '../../../../shared/types/business'

interface AdminMapData {
  businesses: Business[]
  waveleaders: any[]
  events: any[]
}

export const useAdminMapData = (bounds: MapBounds | null) => {
  return useQuery<AdminMapData>({
    queryKey: ['admin', 'map-data', bounds],
    queryFn: async () => {
      const [bizRes, waveRes, eventRes] = await Promise.all([
        bounds ? businessService.getBusinessesForMap(bounds) : businessService.getBusinesses({ limit: 200, page: 1 }),
        adminService.getWaveLeaders({ page: 1, limit: 200 }),
        api.get('/events', { params: { limit: 200 } }),
      ])

      const rawBiz = (bizRes.data as any)?.data ?? bizRes.data
      const businesses: Business[] = Array.isArray(rawBiz)
        ? rawBiz
        : Array.isArray(rawBiz?.items)
        ? rawBiz.items
        : []

      const rawWave = (waveRes as any)?.data?.data ?? (waveRes as any)?.data
      const apiWaveleaders = rawWave?.waveLeaders || (Array.isArray(rawWave) ? rawWave : [])
      // Real rows only - an empty layer is the truth during a fresh pilot
      const waveleaders = apiWaveleaders.filter(
        (w: any) => w.latitude != null && w.longitude != null
      )

      const rawEvents = (eventRes.data as any)?.data?.items ?? []
      const events = rawEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        type: e.category,
        latitude: e.latitude,
        longitude: e.longitude,
        startDate: e.startDate,
      }))

      return { businesses, waveleaders, events }
    },
    enabled: true,
    staleTime: 30 * 1000,
  })
}

