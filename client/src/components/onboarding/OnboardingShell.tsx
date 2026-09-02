import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TOTAL_STEPS } from '@/types/onboarding'

interface OnboardingShellProps {
  step: number
  onBack?: () => void
  /** Step 1 and 6 are bookends and hide the progress chrome */
  showProgress?: boolean
  title?: string
  subtitle?: string
  children: ReactNode
  /** Pinned to the bottom of the viewport, above the safe area */
  footer?: ReactNode
}

export function OnboardingShell({
  step,
  onBack,
  showProgress = true,
  title,
  subtitle,
  children,
  footer,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-6 sm:px-8">
      {/* Header: back + progress */}
      <div className="flex items-center gap-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="h-9 w-9 shrink-0" aria-hidden />
        )}

        {showProgress && (
          <div className="flex flex-1 items-center gap-3">
            <div
              className="flex flex-1 gap-1.5"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-valuenow={step}
              aria-label={`Step ${step} of ${TOTAL_STEPS}`}
            >
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-300',
                    i < step ? 'bg-primary' : 'bg-white/10'
                  )}
                />
              ))}
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums text-gray-500">
              {step}/{TOTAL_STEPS}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-1 flex-col"
      >
        {(title || subtitle) && (
          <div className="mt-10 shrink-0">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-3 text-base leading-relaxed text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex-1">{children}</div>
      </motion.div>

      {footer && <div className="mt-8 shrink-0 space-y-3">{footer}</div>}
    </div>
  )
}
