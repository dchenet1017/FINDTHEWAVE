import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOnboardingLocation } from '@/hooks/useOnboardingLocation'
import type { OnboardingState, OnboardingUpdate } from '@/types/onboarding'
import { MiniPulseMap } from '../MiniPulseMap'
import { OnboardingShell } from '../OnboardingShell'

interface JoinTheWaveStepProps {
  draft: OnboardingState
  patch: (changes: Partial<OnboardingState>) => void
  onNext: (update: OnboardingUpdate) => void
  onBack: () => void
}

export function JoinTheWaveStep({
  draft,
  patch,
  onNext,
  onBack,
}: JoinTheWaveStepProps) {
  const { request, error, isRequesting } = useOnboardingLocation()

  const enableLocation = async () => {
    const location = await request()
    if (location) {
      patch({ location, locationSharingEnabled: true })
      onNext({
        locationSharingEnabled: true,
        locationLat: location.lat,
        locationLng: location.lng,
        locationLabel: location.label,
      })
    }
    // On denial we hold the step so the user can read the error and pick
    // "Not Now" deliberately, rather than being bounced forward.
  }

  const skip = () => {
    patch({ locationSharingEnabled: false })
    onNext({ locationSharingEnabled: false })
  }

  return (
    <OnboardingShell
      step={5}
      onBack={onBack}
      title="Join the wave"
      subtitle="Turn on location to see what's happening around you right now."
      footer={
        <>
          <Button
            size="lg"
            className="w-full"
            loading={isRequesting}
            onClick={enableLocation}
          >
            {!isRequesting && <MapPin className="mr-2 h-4 w-4" />}
            Enable Location
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full text-gray-400"
            disabled={isRequesting}
            onClick={skip}
          >
            Not Now
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <MiniPulseMap />

        <p className="text-center text-sm text-gray-500">
          {draft.location
            ? 'Location on — showing activity near you.'
            : 'We only use your location to find nearby venues and activity.'}
        </p>

        {error && (
          <p className="text-center text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </OnboardingShell>
  )
}
