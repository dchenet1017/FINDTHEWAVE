import { useCallback, useState } from 'react'
import { getCurrentPosition, isGeolocationAvailable, reverseGeocode } from '@/lib/mapbox'

export interface CapturedLocation {
  lat: number
  lng: number
  label: string | null
}

type Status = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'

/**
 * Explicit-request geolocation for the onboarding wizard.
 *
 * Deliberately does NOT fetch on mount (unlike `useGeolocation`): onboarding
 * asks for location twice - optionally on step 2, then properly on step 5 - and
 * the browser prompt should only ever appear on a user gesture.
 */
export function useOnboardingLocation() {
  const [status, setStatus] = useState<Status>(
    isGeolocationAvailable() ? 'idle' : 'unsupported'
  )
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async (): Promise<CapturedLocation | null> => {
    if (!isGeolocationAvailable()) {
      setStatus('unsupported')
      setError('Location is not supported by your browser')
      return null
    }

    setStatus('requesting')
    setError(null)

    try {
      const position = await getCurrentPosition()
      const { latitude: lat, longitude: lng } = position.coords

      // Best-effort label; a missing Mapbox token just leaves it null.
      let label: string | null = null
      try {
        label = (await reverseGeocode(lng, lat)) || null
      } catch {
        label = null
      }

      setStatus('granted')
      return { lat, lng, label }
    } catch (err: any) {
      const denied = err?.code === 1 // PERMISSION_DENIED
      setStatus(denied ? 'denied' : 'idle')
      setError(
        denied
          ? 'Location access denied. You can enable it later in settings.'
          : 'We could not get your location. Try again or skip for now.'
      )
      return null
    }
  }, [])

  return { request, status, error, isRequesting: status === 'requesting' }
}
