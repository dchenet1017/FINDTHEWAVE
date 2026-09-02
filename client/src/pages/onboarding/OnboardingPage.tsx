import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useAuthStore } from '@/store/authStore'
import { AboutYouStep } from '@/components/onboarding/steps/AboutYouStep'
import { ExperienceStep } from '@/components/onboarding/steps/ExperienceStep'
import { JoinTheWaveStep } from '@/components/onboarding/steps/JoinTheWaveStep'
import { PreferencesStep } from '@/components/onboarding/steps/PreferencesStep'
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep'
import { YoureInStep } from '@/components/onboarding/steps/YoureInStep'

/** Where the wizard hands off to the app */
const MAP_ROUTE = '/dashboard/map'
const MISSIONS_ROUTE = '/dashboard/rewards'

export default function OnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const {
    draft,
    patch,
    step,
    next,
    back,
    complete,
    isLoading,
    isCompleting,
    alreadyCompleted,
  } = useOnboarding()

  // Full-screen takeover: stop the page behind the overlay from scrolling.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Which page step 6 is heading for, and whether the save has landed yet.
  // Claimed before completing so that marking onboarding done cannot outrace
  // the hand-off and bounce "View Missions" to the map instead.
  const [handoff, setHandoff] = useState<{ target: string; saved: boolean } | null>(
    null
  )

  /** Finish, then hand off. Stays put if the save fails so nothing is lost. */
  const finish = useCallback(
    async (target: string) => {
      setHandoff({ target, saved: false })
      try {
        await complete()
        setHandoff({ target, saved: true })
      } catch {
        // useOnboarding already surfaced the error toast.
        setHandoff(null)
      }
    },
    [complete]
  )

  if (handoff?.saved) {
    return <Navigate to={handoff.target} replace />
  }

  // Someone who has already been through this goes straight to the app.
  if (!handoff && (alreadyCompleted || user?.onboardingCompleted)) {
    return <Navigate to={MAP_ROUTE} replace />
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-dark-bg text-white">
      <div className="mx-auto min-h-full w-full max-w-lg">
        {isLoading ? (
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {step === 1 && <WelcomeStep onNext={() => next()} />}

            {step === 2 && (
              <AboutYouStep
                draft={draft}
                patch={patch}
                onBack={back}
                onNext={() =>
                  next({
                    firstName: draft.firstName || undefined,
                    interests: draft.interests,
                    locationLat: draft.location?.lat ?? null,
                    locationLng: draft.location?.lng ?? null,
                    locationLabel: draft.location?.label ?? null,
                  })
                }
              />
            )}

            {step === 3 && (
              <ExperienceStep
                draft={draft}
                patch={patch}
                onBack={back}
                onNext={() =>
                  next({ experienceGoal: draft.experienceGoal ?? undefined })
                }
              />
            )}

            {step === 4 && (
              <PreferencesStep
                draft={draft}
                patch={patch}
                onBack={back}
                onNext={() =>
                  next({
                    nightVibe: draft.nightVibe,
                    maxDistanceMiles: draft.maxDistanceMiles,
                    notificationsEnabled: draft.notificationsEnabled,
                  })
                }
              />
            )}

            {step === 5 && (
              <JoinTheWaveStep
                draft={draft}
                patch={patch}
                onBack={back}
                onNext={(update) => next(update)}
              />
            )}

            {step === 6 && (
              <YoureInStep
                draft={draft}
                isCompleting={isCompleting}
                onOpenMap={() => finish(MAP_ROUTE)}
                onViewMissions={() => finish(MISSIONS_ROUTE)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
