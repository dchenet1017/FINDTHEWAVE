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

// Pages that need a signed-in user. When the session can't be renewed we only
// send people to /login from these; on public pages (landing, map, events...)
// a stale token is simply dropped so the visitor keeps browsing.
// (/business/:id, /waveleader/:id/profile and /booking/:id are public.)
const PROTECTED_PATHS = [
  /^\/(dashboard|admin|onboarding)(\/|$)/,
  /^\/business\/?$/,
  /^\/business\/(dashboard|analytics|map|ads|events|crawls|go-out|onboarding|promotions|reviews|customers|revenue|profile|settings)(\/|$)/,
  /^\/waveleader\/(register|dashboard|bookings|map|communities|earnings|analytics|profile|settings)(\/|$)/,
  /^\/booking\/(confirmation\/|[^/]+\/(payment|review)$)/,
]

function isProtectedPath(path: string) {
  return PROTECTED_PATHS.some((re) => re.test(path))
}

function endSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  const path = window.location.pathname
  if (isProtectedPath(path) && path !== '/login') {
    window.location.href = `/login?redirect=${encodeURIComponent(path + window.location.search)}`
  }
}

// One refresh at a time. A dashboard fires several requests at once; when the
// 15-minute access token expires they all get 401 together. The server rotates
// the refresh token on use, so if each request refreshed on its own, the first
// would win and the rest would fail and log the user out. They share this
// promise instead.
let refreshInFlight: Promise<string | null> | null = null

function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return Promise.resolve(null)

  refreshInFlight = axios
    .post<{ success: boolean; data?: { accessToken: string; refreshToken: string } }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    )
    .then((response) => {
      if (!response.data.success || !response.data.data) return null
      const { accessToken, refreshToken: newRefreshToken } = response.data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      return accessToken
    })
    .catch(() => {
      // Another tab may have rotated the token a moment ago; if so it left a
      // fresh pair in localStorage, which we can use.
      const current = localStorage.getItem('refreshToken')
      return current && current !== refreshToken ? localStorage.getItem('accessToken') : null
    })
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}

// Response interceptor - handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }

    const isAuthCall = /\/auth\/(login|register|refresh)$/.test(originalRequest?.url ?? '')

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true

      // If a newer token arrived while this request was in flight (another
      // request or tab refreshed), just retry with it.
      const sentWith = String(originalRequest.headers?.Authorization ?? '').replace(/^Bearer /, '')
      const stored = localStorage.getItem('accessToken')
      const accessToken = stored && stored !== sentWith ? stored : await refreshAccessToken()

      if (!accessToken) {
        endSession()
        return Promise.reject(error)
      }

      originalRequest.headers = { ...(originalRequest.headers ?? {}), Authorization: `Bearer ${accessToken}` }
      return api(originalRequest)
    }

    return Promise.reject(error)
  }
)

export default api

