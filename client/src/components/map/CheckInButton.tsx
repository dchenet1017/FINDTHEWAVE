import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { calculateDistance, formatDistance } from '@/lib/mapbox'

interface CheckInButtonProps {
  business: { id: string; name?: string; latitude?: number | null; longitude?: number | null; location?: { latitude?: number; longitude?: number } }
  userLocation?: { lat: number; lng: number } | null
  radiusMiles?: number
}

export function CheckInButton({ business, userLocation, radiusMiles = 0.25 }: CheckInButtonProps) {
  const handleCheckIn = () => {
    const lat = business.latitude ?? business.location?.latitude
    const lng = business.longitude ?? business.location?.longitude
    if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      toast.error('Location unavailable for this place')
      return
    }
    if (!userLocation) {
      toast.error('Turn on location to check in')
      return
    }

    const dist = calculateDistance(userLocation.lat, userLocation.lng, Number(lat), Number(lng))
    if (dist > radiusMiles) {
      toast.error(`You are too far away (${formatDistance(dist)}). Move closer to check in.`)
      return
    }

    toast.success(`Checked in at ${business.name || 'this place'}! +10 points`)
  }

  return (
    <Button size="sm" variant="default" onClick={handleCheckIn}>
      Check In
    </Button>
  )
}

