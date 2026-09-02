import { motion } from 'framer-motion'
import { Check, Map, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { OnboardingState } from '@/types/onboarding'
import { OnboardingShell } from '../OnboardingShell'

interface YoureInStepProps {
  draft: OnboardingState
  isCompleting: boolean
  onOpenMap: () => void
  onViewMissions: () => void
}

export function YoureInStep({
  draft,
  isCompleting,
  onOpenMap,
  onViewMissions,
}: YoureInStepProps) {
  const name = draft.firstName?.trim()

  return (
    <OnboardingShell
      step={6}
      showProgress={false}
      footer={
        <>
          <Button
            size="lg"
            className="w-full"
            loading={isCompleting}
            onClick={onOpenMap}
          >
            {!isCompleting && <Map className="mr-2 h-4 w-4" />}
            Open Live Map
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={isCompleting}
            onClick={onViewMissions}
          >
            <Target className="mr-2 h-4 w-4" />
            View Missions
          </Button>
        </>
      }
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/15"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Check className="h-8 w-8 text-white" strokeWidth={3} />
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 text-4xl font-bold tracking-tight text-white"
        >
          {name ? `You're in, ${name}!` : "You're in!"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-4 max-w-sm text-base leading-relaxed text-gray-400"
        >
          Your wave is set up. Go see where the energy is tonight.
        </motion.p>
      </div>
    </OnboardingShell>
  )
}
