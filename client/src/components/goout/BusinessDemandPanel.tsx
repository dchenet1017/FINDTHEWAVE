import { useState } from 'react'
import { Loader2, Radio, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useActiveDemand } from '@/hooks/useGoOut'
import { vibeEmoji, vibeLabel, type Vibe } from '@/types/goOut'
import { SendWaveOfferDialog } from './SendWaveOfferDialog'

interface BusinessDemandPanelProps {
  className?: string
  radiusMiles?: number
}

/**
 * Live demand near the venue.
 *
 * Everything here is an aggregate by design - the API never returns who is
 * raising a hand, only how many and what they're after.
 */
export function BusinessDemandPanel({
  className,
  radiusMiles = 10,
}: BusinessDemandPanelProps) {
  const { data, isLoading, isError } = useActiveDemand(radiusMiles)
  const [offerOpen, setOfferOpen] = useState(false)
  const [presetVibe, setPresetVibe] = useState<Vibe | null>(null)

  const openOffer = (vibe: Vibe | null = null) => {
    setPresetVibe(vibe)
    setOfferOpen(true)
  }

  const topVibeCount = Math.max(1, ...(data?.byVibe.map((v) => v.count) ?? [1]))
  const hasDemand = (data?.totalIntents ?? 0) > 0

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-800 bg-dark-card p-6 text-white',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            Live demand
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Hands up within {radiusMiles} miles, updating every 30 seconds.
          </p>
        </div>

        <Button size="sm" onClick={() => openOffer(null)}>
          <Send className="mr-2 h-3.5 w-3.5" />
          Send Wave Offer
        </Button>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-danger">
          Could not load demand right now.
        </p>
      ) : !hasDemand ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-700 px-6 py-12 text-center">
          <Radio className="mx-auto h-10 w-10 text-gray-600" />
          <p className="mt-4 font-medium">No hands up right now</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-500">
            When people nearby say they want to go out, the crowd shows up here —
            counts only, never names.
          </p>
        </div>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-3xl font-bold tabular-nums">{data!.totalIntents}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-light">
                Hands raised
              </p>
            </div>
            <div className="rounded-xl border border-gray-700 bg-dark-bg p-4">
              <p className="flex items-center gap-2 text-3xl font-bold tabular-nums">
                <Users className="h-5 w-5 text-gray-500" />
                {data!.totalPeople}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                People total
              </p>
            </div>
          </div>

          {/* By vibe */}
          {data!.byVibe.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                What they want
              </h3>
              <ul className="mt-3 space-y-2">
                {data!.byVibe
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map(({ vibe, count }) => (
                    <li key={vibe}>
                      <button
                        type="button"
                        onClick={() => openOffer(vibe)}
                        title={`Send a ${vibeLabel(vibe)} offer`}
                        className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="w-28 shrink-0 truncate text-sm text-gray-300">
                          <span className="mr-1.5" aria-hidden>
                            {vibeEmoji(vibe)}
                          </span>
                          {vibeLabel(vibe)}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-dark-bg">
                          <span
                            className="block h-full rounded-full bg-primary transition-all group-hover:bg-primary-light"
                            style={{ width: `${(count / topVibeCount) * 100}%` }}
                          />
                        </span>
                        <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums">
                          {count}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Party sizes + distance */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {data!.byPartySize.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Party sizes
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {data!.byPartySize.map(({ partySize, label, count }) => (
                    <li
                      key={partySize}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-400">{label}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data!.byDistance.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  How close
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {data!.byDistance.map(({ label, count }) => (
                    <li
                      key={label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-400">{label}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      <SendWaveOfferDialog
        key={presetVibe ?? 'all'}
        open={offerOpen}
        onOpenChange={setOfferOpen}
        initialVibe={presetVibe}
      />
    </div>
  )
}
