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
      const waveleaders = rawWave?.waveLeaders || (Array.isArray(rawWave) ? rawWave : [])

      return {
        businesses,
        waveleaders,
        events: [],
      }
    },
    enabled: true,
    staleTime: 30 * 1000,
  })
}

