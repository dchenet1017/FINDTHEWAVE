import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useLowerHand, useMyIntent } from '@/hooks/useGoOut'
import { partySizeLabel, timeLeftLabel, vibeEmoji, vibeLabel } from '@/types/goOut'

interface ActiveIntentBannerProps {
  className?: string
}

/** Shown in place of the CTA while the user is broadcasting. */
export function ActiveIntentBanner({ className }: ActiveIntentBannerProps) {
  const { data } = useMyIntent()
  const lowerHand = useLowerHand()

  const intent = data?.intent
  if (!intent) return null

  const nearbyCount = data?.nearbyCount ?? 0

  return (
    <div
      className={cn(
        'rounded-2xl border border-primary/40 bg-primary/10 p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Pulsing broadcast indicator */}
          <span className="relative flex h-3 w-3 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <div>
            <p className="font-semibold text-white">Broadcasting your intent…</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Venues nearby can see your intent right now
            </p>
          </div>
        </div>

        <span className="shrink-0 text-xs font-medium tabular-nums text-gray-400">
          {timeLeftLabel(intent.expiresAt)}
        </span>
      </div>

      {/* What we're broadcasting */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {intent.vibes.map((vibe) => (
          <span
            key={vibe}
            className="rounded-full border border-primary/30 bg-dark-bg/60 px-2.5 py-1 text-xs font-medium text-gray-200"
          >
            <span className="mr-1" aria-hidden>
              {vibeEmoji(vibe)}
            </span>
            {vibeLabel(vibe)}
          </span>
        ))}
        <span className="rounded-full border border-gray-700 bg-dark-bg/60 px-2.5 py-1 text-xs font-medium text-gray-300">
          {partySizeLabel(intent.partySize)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-primary/20 pt-4">
        <p className="flex items-center gap-2 text-sm text-gray-300">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          {nearbyCount === 0 ? (
            <span>You&apos;re first on this wave</span>
          ) : (
            <span>
              <span className="font-semibold text-white">{nearbyCount}</span>{' '}
              {nearbyCount === 1 ? 'other hand' : 'other hands'} up nearby
            </span>
          )}
        </p>

        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-gray-400 hover:text-white"
          loading={lowerHand.isPending}
          onClick={() => lowerHand.mutate()}
        >
          Put my hand down
        </Button>
      </div>
    </div>
  )
}
