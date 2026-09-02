import { useState } from 'react'
import { Inbox, KeyRound, Loader2, Sparkles, Store } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useMyIntent, useMyOffers, useRespondToOffer } from '@/hooks/useGoOut'
import { timeLeftLabel, type BusinessOffer } from '@/types/goOut'
import { AcceptedOfferCelebration } from './AcceptedOfferCelebration'

interface OffersInboxProps {
  className?: string
}

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'outline' | 'destructive' }
> = {
  ACCEPTED: { label: "You're in", variant: 'success' },
  DECLINED: { label: 'Declined', variant: 'outline' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
}

/** Offers that arrived while the user's hand is up. */
export function OffersInbox({ className }: OffersInboxProps) {
  const { data: intentData } = useMyIntent()
  const hasIntent = Boolean(intentData?.intent)
  const { data, isLoading } = useMyOffers(hasIntent)
  const respond = useRespondToOffer()

  // Which offer the celebration is showing, if any.
  const [accepted, setAccepted] = useState<BusinessOffer | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  if (!hasIntent) return null

  const offers = data?.offers ?? []
  const live = offers.filter((o) => o.status === 'PENDING')
  const settled = offers.filter((o) => o.status !== 'PENDING')

  const act = (offer: BusinessOffer, action: 'ACCEPT' | 'DECLINE') => {
    setPendingId(offer.id)
    respond.mutate(
      { offerId: offer.id, action },
      {
        onSuccess: (result) => {
          if (action === 'ACCEPT') setAccepted(result.offer)
        },
        onSettled: () => setPendingId(null),
      }
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Inbox className="h-5 w-5 text-primary" />
          Offers for you
        </h2>
        {live.length > 0 && <Badge>{live.length} new</Badge>}
      </div>

      {isLoading && offers.length === 0 ? (
        <div className="mt-4 flex items-center justify-center rounded-2xl border border-gray-800 bg-dark-card py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : offers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-700 bg-dark-card/50 px-6 py-10 text-center">
          <Store className="mx-auto h-8 w-8 text-gray-600" />
          <p className="mt-3 font-medium text-white">Waiting on venues…</p>
          <p className="mt-1 text-sm text-gray-500">
            Nearby spots are seeing your hand right now. Offers land here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {[...live, ...settled].map((offer) => {
            const badge = STATUS_BADGE[offer.status]
            const busy = pendingId === offer.id && respond.isPending
            const isPending = offer.status === 'PENDING'

            return (
              <li
                key={offer.id}
                className={cn(
                  'rounded-2xl border p-5 transition-colors',
                  isPending
                    ? 'border-gray-700 bg-dark-card'
                    : 'border-gray-800 bg-dark-card/50'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {offer.business?.name ?? 'A nearby venue'}
                    </p>
                    {offer.business?.address && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {offer.business.address}
                      </p>
                    )}
                  </div>
                  {badge ? (
                    <Badge variant={badge.variant} className="shrink-0">
                      {badge.label}
                    </Badge>
                  ) : (
                    <span className="shrink-0 text-xs tabular-nums text-gray-500">
                      {timeLeftLabel(offer.expiresAt)}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  {offer.message}
                </p>

                <p className="mt-3 flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary-light">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{offer.perkDescription}</span>
                </p>

                {offer.status === 'ACCEPTED' && offer.doorCode && (
                  <p className="mt-2 flex items-center gap-2 rounded-xl border border-primary/30 px-3 py-2.5 text-sm text-white">
                    <KeyRound className="h-4 w-4 shrink-0 text-primary" />
                    Door code
                    <span className="ml-auto font-mono text-base font-bold tracking-[0.2em]">
                      {offer.doorCode}
                    </span>
                  </p>
                )}

                {isPending && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      loading={busy}
                      disabled={respond.isPending}
                      onClick={() => act(offer, 'ACCEPT')}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                      disabled={respond.isPending}
                      onClick={() => act(offer, 'DECLINE')}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <AcceptedOfferCelebration offer={accepted} onClose={() => setAccepted(null)} />
    </div>
  )
}
