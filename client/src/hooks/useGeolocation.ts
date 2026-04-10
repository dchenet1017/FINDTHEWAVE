import { useState, useEffect, useCallback } from 'react'
import { isWithinRadius, calculateDistance } from '@/utils/distance'

interface GeolocationState {
  location: { lat: number; lng: number } | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  })

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          loading: false,
        })
      },
      (error) => {
        let errorMessage = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        setState({
          location: null,
          error: errorMessage,
          loading: false,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }))
      return () => {}
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          loading: false,
        })
      },
      (error) => {
        let errorMessage = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const checkWithinRange = useCallback(
    (
      targetLat: number,
      targetLng: number,
      radiusMeters: number = 100
    ): { withinRange: boolean; distance?: number } => {
      if (!state.location) {
        return { withinRange: false }
      }

      const distance = calculateDistance(
        state.location.lat,
        state.location.lng,
        targetLat,
        targetLng
      )

      return {
        withinRange: isWithinRadius(
          state.location.lat,
          state.location.lng,
          targetLat,
          targetLng,
          radiusMeters
        ),
        distance,
      }
    },
    [state.location]
  )

  // Auto-fetch location on mount
  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  return {
    location: state.location,
    error: state.error,
    loading: state.loading,
    getCurrentLocation,
    watchLocation,
    isWithinRange: checkWithinRange,
  }
}

