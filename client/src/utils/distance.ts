/**
 * Distance calculation utilities using Haversine formula
 */

const EARTH_RADIUS_METERS = 6371000 // Earth radius in meters
const EARTH_RADIUS_MILES = 3958.8 // Earth radius in miles

/**
 * Calculate distance between two points using Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

/**
 * Check if user is within radius of target location
 * @param userLat User latitude
 * @param userLng User longitude
 * @param targetLat Target latitude
 * @param targetLng Target longitude
 * @param radiusMeters Radius in meters (default: 100m)
 * @returns true if within radius
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number = 100
): boolean {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng)
  return distance <= radiusMeters
}

/**
 * Format distance in a human-readable way
 * @param meters Distance in meters
 * @returns Formatted string like "50m away" or "1.2km away"
 */
export function formatDistance(meters: number): string {
  if (Number.isNaN(meters) || meters < 0) return 'Unknown distance'

  if (meters < 1000) {
    return `${Math.round(meters)}m away`
  }

  const km = meters / 1000
  return `${km.toFixed(1)}km away`
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.34
}

/**
 * Convert miles to meters
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.34
}

