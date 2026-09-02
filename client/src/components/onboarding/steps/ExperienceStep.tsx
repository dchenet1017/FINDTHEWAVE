import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { EXPERIENCES, type OnboardingState } from '@/types/onboarding'
import { OnboardingShell } from '../OnboardingShell'

interface ExperienceStepProps {
  draft: OnboardingState
  patch: (changes: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

export function ExperienceStep({
  draft,
  patch,
  onNext,
  onBack,
}: ExperienceStepProps) {
  return (
    <OnboardingShell
      step={3}
      onBack={onBack}
      title="Choose your experience"
      subtitle="You can change this any time."
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={!draft.experienceGoal}
          onClick={onNext}
        >
          Continue
        </Button>
      }
    >
      <div className="space-y-3">
        {EXPERIENCES.map(({ value, title, description, icon: Icon }) => {
          const selected = draft.experienceGoal === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => patch({ experienceGoal: value })}
              className={cn(
                'flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 bg-dark-card hover:border-gray-600'
              )}
            >
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                  selected ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'
                )}
              >
                <Icon className="h-6 w-6" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">{title}</span>
                <span className="mt-0.5 block text-sm text-gray-400">
                  {description}
                </span>
              </span>

              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                  selected
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-600'
                )}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          )
        })}
      </div>
    </OnboardingShell>
  )
}
