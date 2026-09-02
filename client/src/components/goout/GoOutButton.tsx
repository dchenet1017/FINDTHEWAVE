import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useMyIntent } from '@/hooks/useGoOut'
import { ActiveIntentBanner } from './ActiveIntentBanner'
import { GoOutSheet } from './GoOutSheet'

interface GoOutButtonProps {
  className?: string
}

/**
 * The headline CTA. Swaps itself for the broadcasting banner once a hand is up,
 * so the map/home screen only ever shows one go-out control.
 */
export function GoOutButton({ className }: GoOutButtonProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { data } = useMyIntent()

  const intent = data?.intent
  const isLive = intent?.status === 'ACTIVE'

  if (isLive) {
    return <ActiveIntentBanner className={className} />
  }

  return (
    <>
      <div className={className}>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            'group relative w-full overflow-hidden rounded-2xl bg-primary px-6 py-5 text-left shadow-lg shadow-primary/25 transition-all',
            'hover:bg-primary/90 hover:shadow-primary/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg'
          )}
        >
          {/* Sheen that sweeps across on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-12 bg-white/10 transition-all duration-700 group-hover:left-[150%]"
          />
          <span className="relative flex items-center justify-between gap-4">
            <span>
              <span className="block text-lg font-bold text-white">
                I want to go out 🙋
              </span>
              <span className="mt-1 block text-sm text-white/70">
                No searching. Venues come to you.
              </span>
            </span>
          </span>
        </button>
      </div>

      <GoOutSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
