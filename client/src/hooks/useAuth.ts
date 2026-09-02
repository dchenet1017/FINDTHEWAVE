import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import type { LoginCredentials, RegisterData, User } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'

/**
 * Consumer sign-ups land in the onboarding wizard instead of the dashboard.
 * Businesses, wave leaders and admins have their own flows, so they skip it.
 */
const needsOnboarding = (user: User) =>
  user.role === 'USER' && !user.onboardingCompleted

/** Landing route for a user who is not being sent into onboarding */
const homeRouteFor = (user: User) => {
  switch (user.role) {
    case 'ADMIN':
      return '/admin'
    case 'BUSINESS':
      return '/business/dashboard'
    case 'WAVELEADER':
      return '/waveleader/dashboard'
    default:
      return '/dashboard'
  }
}

export const useAuth = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { setUser, setTokens, clearAuth, user, isAuthenticated } = useAuthStore()

  // Get current user on mount
  const { isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        clearAuth()
        return null
      }

      try {
        const { data } = await authService.getCurrentUser()
        if (data.success && data.data?.user) {
          setUser(data.data.user)
          return data.data.user
        }
        console.warn('[useAuth] getCurrentUser returned success:false', data)
        clearAuth()
        return null
      } catch (error: any) {
        console.error('[useAuth] getCurrentUser error', error?.response?.status, error?.response?.data)
        clearAuth()
        return null
      }
    },
    retry: false,
    enabled: !!localStorage.getItem('accessToken'),
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ data }) => {
      if (data.success && data.data) {
        setTokens(data.data.accessToken, data.data.refreshToken)
        setUser(data.data.user)
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })

        // An unfinished wizard resumes ahead of any saved destination
        if (needsOnboarding(data.data.user)) {
          navigate('/onboarding', { replace: true })
          toast.success('Welcome back!')
          return
        }

        const from = (location.state as { from?: { pathname: string; search?: string } })?.from
        if (from?.pathname) {
          navigate(`${from.pathname}${from.search || ''}`, { replace: true })
          toast.success('Welcome back!')
          return
        }

        navigate(homeRouteFor(data.data.user))
        toast.success('Welcome back!')
      } else {
        toast.error(data.error?.message || 'Login failed')
      }
    },
    onError: (error: any) => {
      console.error('[useAuth] login error', error?.response?.status, error?.response?.data)
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Login failed'
      toast.error(message)
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: ({ data }) => {
      if (data.success && data.data) {
        setTokens(data.data.accessToken, data.data.refreshToken)
        setUser(data.data.user)
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })

        // New consumers go through onboarding instead of straight to the
        // dashboard (email verification skipped for now)
        if (needsOnboarding(data.data.user)) {
          navigate('/onboarding', { replace: true })
          toast.success('Account created successfully!')
          return
        }

        navigate(homeRouteFor(data.data.user))
        toast.success('Account created successfully!')
      } else {
        toast.error(data.error?.message || 'Registration failed')
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Registration failed'
      toast.error(message)
    },
  })

  // Logout
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      // Continue logout even if API fails
    } finally {
      clearAuth()
      queryClient.clear()
      navigate('/login')
      toast.success('Logged out successfully')
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  }
}

