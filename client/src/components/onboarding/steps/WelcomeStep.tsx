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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/25 blur-2xl" />
          <Waves className="h-20 w-20 text-primary" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl"
        >
          WaveFinder
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-4 text-lg text-gray-400"
        >
          Find your wave. Anywhere.
        </motion.p>
      </div>
    </OnboardingShell>
  )
}
