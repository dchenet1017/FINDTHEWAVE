import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { Navbar } from '@/components/layout/Navbar'

/** Navbar + auth gate + outlet (same shell as MainLayout) for booking payment, etc. */
export function RequireAuthMainLayout() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Navbar />
      <Outlet />
    </div>
  )
}
