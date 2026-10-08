import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Navigate, Outlet } from 'react-router-dom'
import api from '@/lib/axios'
import { useMyBusiness } from '@/hooks/useMyBusiness'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/layout/LoadingScreen'

/**
 * Picking "business" or "wave leader" at sign-up only sets the account role;
 * the venue or leader profile every dashboard reads is created afterwards.
 * These gates send an account that has not done that yet to the flow that does,
 * instead of leaving it on a dashboard where every request 404s.
 */

export function RequireBusinessProfile() {
  const { data: business, isLoading, isError } = useMyBusiness()

  if (isLoading) return <LoadingScreen />
  // A failed lookup (server down) should not bounce an existing venue into
  // onboarding - let the dashboard render and show its own errors.
  if (!isError && business === null) return <Navigate to="/business/onboarding" replace />
  return <Outlet />
}

export function RequireWaveLeaderProfile() {
  // Admins open these pages to support leaders and have no profile of their own
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN')
  const { data: exists, isLoading } = useQuery({
    queryKey: ['waveleader', 'me', 'exists'],
    enabled: !isAdmin,
    queryFn: async () => {
      try {
        await api.get('/waveleader/me')
        return true
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return false
        return true
      }
    },
    staleTime: 60_000,
  })

  if (isAdmin) return <Outlet />
  if (isLoading) return <LoadingScreen />
  if (exists === false) return <Navigate to="/waveleader/register" replace />
  return <Outlet />
}
