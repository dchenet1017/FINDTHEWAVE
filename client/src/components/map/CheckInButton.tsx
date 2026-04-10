import { CheckInButton as EnhancedCheckInButton } from '@/components/checkin/CheckInButton'
import { cn } from '@/lib/utils'

interface CheckInButtonProps {
  business: { id: string; name?: string; latitude?: number | null; longitude?: number | null; location?: { latitude?: number; longitude?: number } }
  userLocation?: { lat: number; lng: number } | null
  radiusMiles?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Wrapper component for the enhanced CheckInButton
 * Maintains backward compatibility with the old interface
 */
export function CheckInButton({
  business,
  userLocation,
  radiusMiles = 0.25,
  size = 'sm',
  className,
}: CheckInButtonProps) {
  const lat = business.latitude ?? business.location?.latitude
  const lng = business.longitude ?? business.location?.longitude

  // Convert miles to meters (1 mile = 1609.34 meters)
  const radiusMeters = radiusMiles * 1609.34

  return (
    <EnhancedCheckInButton
      businessId={business.id}
      businessName={business.name || 'Unknown Business'}
      businessLatitude={lat ?? undefined}
      businessLongitude={lng ?? undefined}
      userLocation={userLocation}
      variant={size === 'lg' ? 'large' : 'default'}
      className={cn(className)}
      radiusMeters={radiusMeters}
    />
  )
}

