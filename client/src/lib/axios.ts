import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

/**
 * API root, e.g. https://wavefinder-server.onrender.com/api
 *
 * Baked in at BUILD time by Vite, so the static site has to be rebuilt after
 * changing it on Render - restarting is not enough. Falls back to the relative
 * /api, which is what local dev uses through the Vite proxy.
 */
function resolveBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim()
  if (!raw) return '/api'

  // A trailing slash would produce '//auth/me' against the server.
  const normalized = raw.replace(/\/+$/, '')

  if (import.meta.env.PROD && !/\/api$/.test(normalized)) {
    // Every service call is written relative to the /api prefix, so a base URL
    // without it 404s on every request.
    console.warn(
      `[api] VITE_API_URL is "${normalized}" — it usually needs to end in /api, ` +
        `e.g. https://your-server.onrender.com/api`
    )
  }

  return normalized
}

export const API_BASE_URL = resolveBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
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
          `${API_BASE_URL}/auth/refresh`,
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

