import mapboxgl from 'mapbox-gl'

// Set access token from env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

export const defaultMapConfig = {
  center: [-74.006, 40.7128] as [number, number], // NYC
  zoom: 13,
  style: 'mapbox://styles/mapbox/dark-v11',
}

export const mapStyles = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

export const markerColors: Record<string, string> = {
  BAR: '#FF5E7D',
  RESTAURANT: '#01D1A2',
  ENTERTAINMENT: '#9C6BFF',
  FITNESS: '#0396FF',
  WELLNESS: '#FF9F43',
  HOTEL: '#74B9FF',
  OTHER: '#6C5CE7',
  WAVELEADER: '#6C5CE7',
  USER: '#00D2D3',
}

export const isGeolocationAvailable = () =>
  typeof navigator !== 'undefined' && 'geolocation' in navigator

export const getCurrentPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('Geolocation not available'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  })

// Haversine distance in miles
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8 // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistance(miles: number) {
  if (Number.isNaN(miles)) return ''
  const feet = miles * 5280
  if (feet < 1000) {
    return `${Math.round(feet)} ft`
  }
  return `${miles.toFixed(1)} mi`
}

export { mapboxgl }

/**
 * Mapbox Geocoding API - search for addresses
 */
export async function geocodeAddress(query: string): Promise<
  Array<{
    id: string
    place_name: string
    center: [number, number]
    text: string
  }>
> {
  const token = mapboxgl.accessToken
  if (!token) return []

  const encoded = encodeURIComponent(query)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=5&types=address,place`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.features) return []
  return data.features.map((f: any) => ({
    id: f.id,
    place_name: f.place_name,
    center: f.center,
    text: f.text,
  }))
}

/**
 * Generate GeoJSON polygon approximating a circle
 * @param center [lng, lat]
 * @param radiusMiles radius in miles
 * @param points number of points (default 64)
 */
export function createCircleGeoJSON(
  center: [number, number],
  radiusMiles: number,
  points = 64
): { type: 'Polygon'; coordinates: [number, number][][] } {
  const [lng, lat] = center
  const kmPerMile = 1.60934
  const radiusKm = radiusMiles * kmPerMile
  const coords: [number, number][] = []

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const dx = (radiusKm / 111.32) * Math.cos(angle)
    const dy = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
    coords.push([lng + dx, lat + dy])
  }

  return {
    type: 'Polygon',
    coordinates: [coords],
  }
}

/**
 * Reverse geocode: get address from coordinates
 */
export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<string> {
  const token = mapboxgl.accessToken
  if (!token) return ''

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.features?.length) return ''
  return data.features[0].place_name || ''
}
