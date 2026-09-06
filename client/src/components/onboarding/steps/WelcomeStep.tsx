import { motion } from 'framer-motion'
import { Waves } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { OnboardingShell } from '../OnboardingShell'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <OnboardingShell
      step={1}
      showProgress={false}
      footer={
        <Button size="lg" className="w-full" onClick={onNext}>
          Get Started
        </Button>
      }
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-2"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Waves className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold tracking-[0.2em] text-gray-400">
            WAVEFINDER
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl"
        >
          Find your wave.{' '}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Anywhere.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-4 max-w-xs text-base leading-relaxed text-gray-400"
        >
          Real-time energy. Real connections. Real nights out.
        </motion.p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          className="relative mt-10"
        >
          <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/25 blur-2xl" />
          <span className="absolute inset-0 -z-10 rounded-full border border-primary/30" />
          <span className="absolute -inset-4 -z-10 rounded-full border border-primary/10" />
          <span className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 backdrop-blur-sm">
            <Waves className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </span>
        </motion.div>
      </div>
    </OnboardingShell>
  )
}
