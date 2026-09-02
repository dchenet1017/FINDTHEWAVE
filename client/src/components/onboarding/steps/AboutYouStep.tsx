import { useState } from 'react'
import { Check, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useOnboardingLocation } from '@/hooks/useOnboardingLocation'
import { INTERESTS, type Interest, type OnboardingState } from '@/types/onboarding'
import { OnboardingShell } from '../OnboardingShell'

interface AboutYouStepProps {
  draft: OnboardingState
  patch: (changes: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

export function AboutYouStep({ draft, patch, onNext, onBack }: AboutYouStepProps) {
  const [touched, setTouched] = useState(false)
  const { request, error, isRequesting } = useOnboardingLocation()

  const name = draft.firstName ?? ''
  const nameError = touched && !name.trim() ? 'Tell us what to call you' : undefined

  const toggleInterest = (value: Interest) => {
    const next = draft.interests.includes(value)
      ? draft.interests.filter((i) => i !== value)
      : [...draft.interests, value]
    patch({ interests: next })
  }

  const detectLocation = async () => {
    const location = await request()
    if (location) patch({ location })
  }

  const handleNext = () => {
    setTouched(true)
    if (!name.trim()) return
    onNext()
  }

  return (
    <OnboardingShell
      step={2}
      onBack={onBack}
      title="Tell us about you"
      subtitle="So we can point you at the right kind of night."
      footer={
        <Button size="lg" className="w-full" onClick={handleNext}>
          Continue
        </Button>
      }
    >
      <div className="space-y-8">
        <Input
          label="Your name"
          placeholder="What should we call you?"
          value={name}
          error={nameError}
          autoComplete="given-name"
          onChange={(e) => patch({ firstName: e.target.value })}
          onBlur={() => setTouched(true)}
        />

        {/* Current location */}
        <div>
          <span className="mb-2 block text-sm font-medium text-gray-300">
            Current location
          </span>
          <button
            type="button"
            onClick={detectLocation}
            disabled={isRequesting}
            className={cn(
              'flex w-full items-center gap-3 rounded-md border bg-dark-card px-3 py-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              draft.location
                ? 'border-primary/50'
                : 'border-gray-600 hover:border-gray-500',
              isRequesting && 'opacity-60'
            )}
          >
            {isRequesting ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <MapPin
                className={cn(
                  'h-4 w-4 shrink-0',
                  draft.location ? 'text-primary' : 'text-gray-400'
                )}
              />
            )}
            <span className="min-w-0 flex-1 truncate text-sm">
              {isRequesting ? (
                <span className="text-gray-400">Finding you…</span>
              ) : draft.location ? (
                <span className="text-white">
                  {draft.location.label ??
                    `${draft.location.lat.toFixed(3)}, ${draft.location.lng.toFixed(3)}`}
                </span>
              ) : (
                <span className="text-gray-500">Use my current location</span>
              )}
            </span>
            {draft.location && !isRequesting && (
              <Check className="h-4 w-4 shrink-0 text-success" />
            )}
          </button>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>

        {/* Vibes */}
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-300">
            Your vibes
          </span>
          <p className="mb-3 text-xs text-gray-500">Pick as many as you like.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {INTERESTS.map(({ value, label, icon: Icon }) => {
              const selected = draft.interests.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selected
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-gray-700 bg-dark-card text-gray-400 hover:border-gray-600 hover:text-gray-200'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      selected ? 'text-primary' : 'text-gray-500'
                    )}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </OnboardingShell>
  )
}
