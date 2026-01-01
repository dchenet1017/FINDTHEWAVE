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

      const businesses: Business[] = Array.isArray(bizRes.data?.items)
        ? bizRes.data.items
        : Array.isArray(bizRes.data)
        ? bizRes.data
        : (bizRes.data?.businesses as Business[]) || []

      const waveleaders = (waveRes as any)?.data?.waveLeaders || (waveRes as any)?.data || []

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

