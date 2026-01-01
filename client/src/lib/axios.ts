import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        // No refresh token, clear everything and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Attempt to refresh token
        const response = await axios.post<{
          success: boolean
          data?: {
            accessToken: string
            refreshToken: string
          }
        }>(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {
            refreshToken,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.data.success && response.data.data) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data

          // Store new tokens
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          // Update authorization header and retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }

          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

