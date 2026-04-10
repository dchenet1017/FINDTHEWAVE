import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { num: 1, label: 'Basic Info' },
  { num: 2, label: 'Services & Rates' },
  { num: 3, label: 'Location' },
  { num: 4, label: 'Portfolio' },
  { num: 5, label: 'Communities' },
  { num: 6, label: 'Review' },
]

interface RegistrationStepsProps {
  currentStep: number
  onStepClick: (step: number) => void
  className?: string
}

export function RegistrationSteps({
  currentStep,
  onStepClick,
  className,
}: RegistrationStepsProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {STEPS.map((step, index) => {
          const isCompleted = step.num < currentStep
          const isCurrent = step.num === currentStep
          const isClickable = step.num <= currentStep

          return (
            <div
              key={step.num}
              className="flex flex-col items-center flex-shrink-0"
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.num)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all',
                  isCompleted &&
                    'bg-primary text-white cursor-pointer hover:bg-primary/90',
                  isCurrent &&
                    'bg-primary text-white ring-4 ring-primary/30 cursor-default',
                  !isCompleted &&
                    !isCurrent &&
                    'bg-gray-800 text-gray-500 cursor-not-allowed'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.num
                )}
              </button>
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center max-w-[60px]',
                  isCurrent ? 'text-primary' : 'text-gray-500',
                  isCompleted && 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex justify-center gap-2 sm:hidden">
        <span className="text-sm text-gray-500">
          Step {currentStep} of {STEPS.length}
        </span>
      </div>
    </div>
  )
}
