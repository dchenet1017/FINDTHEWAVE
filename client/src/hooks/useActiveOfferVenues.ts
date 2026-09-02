import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import api from '@/lib/axios'
import { GO_OUT_POLL_MS } from '@/hooks/useGoOut'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } }

/**
 * Business ids currently running a live Go Out offer, for the map's 🕺 badge.
 *
 * The endpoint is public (ids only, no user or offer detail) because /map is
 * reachable while logged out.
 */
export function useActiveOfferVenues(enabled = true) {
  const query = useQuery<string[]>({
    queryKey: ['go-out', 'active-venues'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ businessIds: string[] }>>(
        '/go-out/active-venues'
      )
      return res.data.data?.businessIds ?? []
    },
    enabled,
    refetchInterval: enabled ? GO_OUT_POLL_MS : false,
    staleTime: 10_000,
    // A badge is decoration - never surface a failure here to the user.
    retry: false,
  })

  const activeVenueIds = useMemo(
    () => new Set(query.data ?? []),
    [query.data]
  )

  return { activeVenueIds }
}
