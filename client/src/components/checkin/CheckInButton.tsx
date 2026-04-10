import { useState, useEffect } from 'react'
import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useCheckIn } from '@/hooks/useCheckIn'
import { formatDistance, calculateDistance } from '@/utils/distance'
import { CheckInModal } from './CheckInModal'

interface CheckInButtonProps {
  businessId: string
  businessName: string
  businessLatitude?: number | null
  businessLongitude?: number | null
  userLocation?: { lat: number; lng: number } | null
  onSuccess?: () => void
  variant?: 'default' | 'large'
  className?: string
  radiusMeters?: number
}

type CheckInState = 'ready' | 'too-far' | 'already-checked-in' | 'loading' | 'success' | 'error'

export function CheckInButton({
  businessId,
  businessName,
  businessLatitude,
  businessLongitude,
  userLocation,
  onSuccess,
  variant = 'default',
  className,
  radiusMeters = 100,
}: CheckInButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)

  const { checkIn, isLoading, isSuccess, data, canCheckIn, canCheckInReason, distance: apiDistance } = useCheckIn(
    businessId,
    userLocation
  )

  // Update distance when API returns it
  useEffect(() => {
    if (apiDistance) {
      setDistance(apiDistance)
    }
  }, [apiDistance])

  // Calculate distance locally if needed
  useEffect(() => {
    if (userLocation && businessLatitude && businessLongitude && !apiDistance) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        businessLatitude,
        businessLongitude
      )
      setDistance(dist)
    }
  }, [userLocation, businessLatitude, businessLongitude, apiDistance])

  // Show modal when check-in succeeds
  useEffect(() => {
    if (isSuccess && data) {
      setShowModal(true)
      if (onSuccess) {
        onSuccess()
      }
    }
  }, [isSuccess, data, onSuccess])

  // Determine current state
  const currentState: CheckInState = (() => {
    if (isLoading) return 'loading'
    if (isSuccess) return 'success'
    if (!canCheckIn) {
      if (canCheckInReason?.includes('already') || canCheckInReason?.includes('today')) {
        return 'already-checked-in'
      }
      if (canCheckInReason?.includes('far') && distance) {
        return 'too-far'
      }
      return 'error'
    }
    if (!userLocation) return 'ready' // Will show error on click
    if (!businessLatitude || !businessLongitude) return 'ready' // Will show error on click

    if (distance && distance > radiusMeters) {
      return 'too-far'
    }

    return 'ready'
  })()

  const handleCheckIn = async () => {
    // Validate location
    if (!userLocation) {
      return
    }

    if (!businessLatitude || !businessLongitude) {
      return
    }

    // Check distance
    const dist = distance || calculateDistance(
      userLocation.lat,
      userLocation.lng,
      businessLatitude,
      businessLongitude
    )

    if (dist > radiusMeters) {
      setDistance(dist)
      return
    }

    // Perform check-in
    checkIn(businessId)
  }

  const getButtonContent = () => {
    switch (currentState) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking in...</span>
          </>
        )
      case 'success':
        return (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Checked In!</span>
          </>
        )
      case 'too-far':
        return (
          <>
            <MapPin className="h-4 w-4" />
            <span>{distance ? formatDistance(distance) : 'Too far away'}</span>
          </>
        )
      case 'already-checked-in':
        return (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Already Checked In</span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Error</span>
          </>
        )
      default:
        return (
          <>
            <MapPin className="h-4 w-4" />
            <span>Check In</span>
          </>
        )
    }
  }

  const isDisabled = currentState === 'loading' || currentState === 'success' || currentState === 'already-checked-in'

  return (
    <>
      <Button
        size={variant === 'large' ? 'lg' : 'default'}
        variant={currentState === 'success' ? 'secondary' : 'default'}
        onClick={handleCheckIn}
        disabled={isDisabled}
        className={cn(
          'flex items-center gap-2',
          currentState === 'too-far' && 'bg-warning/10 text-warning border-warning/20',
          currentState === 'already-checked-in' && 'bg-gray-700 text-gray-400 cursor-not-allowed',
          className
        )}
      >
        {getButtonContent()}
      </Button>

      {showModal && data && (
        <CheckInModal
          open={showModal}
          onClose={() => setShowModal(false)}
          businessName={businessName}
          pointsEarned={data.pointsEarned}
          totalPoints={data.totalPoints}
          streak={data.streak}
          businessId={businessId}
        />
      )}
    </>
  )
}

