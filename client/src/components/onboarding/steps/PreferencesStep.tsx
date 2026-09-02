import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import {
  MAX_DISTANCE_MILES,
  MIN_DISTANCE_MILES,
  formatDistanceLabel,
  formatNightVibeLabel,
  type OnboardingState,
} from '@/types/onboarding'
import { OnboardingShell } from '../OnboardingShell'

interface PreferencesStepProps {
  draft: OnboardingState
  patch: (changes: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

export function PreferencesStep({
  draft,
  patch,
  onNext,
  onBack,
}: PreferencesStepProps) {
  return (
    <OnboardingShell
      step={4}
      onBack={onBack}
      title="Set your preferences"
      subtitle="Dial in the kind of night you're after."
      footer={
        <Button size="lg" className="w-full" onClick={onNext}>
          Continue
        </Button>
      }
    >
      <div className="space-y-10">
        {/* Night vibes */}
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-sm font-medium text-gray-300">Night vibes</span>
            <span className="text-sm font-semibold text-primary">
              {formatNightVibeLabel(draft.nightVibe)}
            </span>
          </div>
          <Slider
            value={[draft.nightVibe]}
            min={0}
            max={100}
            step={1}
            aria-label="Night vibes, from chill to turnt"
            onValueChange={([value]) => patch({ nightVibe: value })}
          />
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Chill</span>
            <span>Turnt</span>
          </div>
        </div>

        {/* Distance */}
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-sm font-medium text-gray-300">Distance</span>
            <span className="text-sm font-semibold text-primary">
              {formatDistanceLabel(draft.maxDistanceMiles)}
            </span>
          </div>
          <Slider
            value={[draft.maxDistanceMiles]}
            min={MIN_DISTANCE_MILES}
            max={MAX_DISTANCE_MILES}
            step={1}
            aria-label="How far to search"
            onValueChange={([value]) => patch({ maxDistanceMiles: value })}
          />
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Near me</span>
            <span>15+ miles</span>
          </div>
        </div>

        {/* Notifications */}
        <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-700 bg-dark-card p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-primary">
            <Bell className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-white">Notifications</span>
            <span className="mt-0.5 block text-sm text-gray-400">
              Stay updated on live activity and invites
            </span>
          </span>
          <Switch
            checked={draft.notificationsEnabled}
            onCheckedChange={(checked) => patch({ notificationsEnabled: checked })}
            aria-label="Enable notifications"
          />
        </label>
      </div>
    </OnboardingShell>
  )
}
