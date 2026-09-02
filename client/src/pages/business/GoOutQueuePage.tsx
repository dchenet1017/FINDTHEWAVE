import { useState } from 'react'
import { Clock, Sparkles, Store } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { BusinessDemandPanel } from '@/components/goout/BusinessDemandPanel'
import { useSentOffers } from '@/hooks/useGoOut'
import { timeLeftLabel } from '@/types/goOut'

const RADIUS_OPTIONS = [5, 10, 25]

const OFFER_STATUS: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'outline' | 'destructive' }
> = {
  PENDING: { label: 'Pending', variant: 'default' },
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  DECLINED: { label: 'Declined', variant: 'outline' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
}

export default function GoOutQueuePage() {
  const [radius, setRadius] = useState(10)
  const { data } = useSentOffers()
  const offers = data?.offers ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Go Out Demand</h1>
          <p className="mt-1 text-sm text-gray-400">
            See who wants to go out near you and send them a reason to pick you.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-dark-card p-1">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRadius(option)}
              className={
                option === radius
                  ? 'rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-white'
              }
            >
              {option} mi
            </button>
          ))}
        </div>
      </div>

      <BusinessDemandPanel radiusMiles={radius} />

      {/* Sent offers */}
      <div className="rounded-2xl border border-gray-800 bg-dark-card p-6">
        <h2 className="text-lg font-semibold">Offers you&apos;ve sent</h2>

        {offers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-700 px-6 py-10 text-center">
            <Store className="mx-auto h-8 w-8 text-gray-600" />
            <p className="mt-3 text-sm text-gray-500">
              Nothing sent yet. Use “Send Wave Offer” above.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {offers.map((offer) => {
              const badge = OFFER_STATUS[offer.status] ?? OFFER_STATUS.PENDING
              return (
                <li
                  key={offer.id}
                  className="rounded-xl border border-gray-800 bg-dark-bg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex min-w-0 items-start gap-2 text-sm font-medium text-primary-light">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="truncate">{offer.perkDescription}</span>
                    </p>
                    <Badge variant={badge.variant} className="shrink-0">
                      {badge.label}
                    </Badge>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-gray-400">
                    {offer.message}
                  </p>

                  <p className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {offer.status === 'PENDING'
                        ? timeLeftLabel(offer.expiresAt)
                        : new Date(offer.createdAt).toLocaleString()}
                    </span>
                    {offer.intentId === null && <span>Broadcast</span>}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
