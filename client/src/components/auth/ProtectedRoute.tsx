import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { LoadingScreen } from '@/components/layout/LoadingScreen'

interface ProtectedRouteProps {
  allowedRoles?: ('USER' | 'WAVELEADER' | 'BUSINESS' | 'ADMIN')[]
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  // Ensures auth state is initialized (verifies token on page refresh)
  useAuth()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

