import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Shield, Lock } from 'lucide-react'
import { StripePaymentForm } from '@/components/payment/StripePaymentForm'
import { Button } from '@/components/ui/Button'
import type { BookingPaymentDraft } from '@/types/booking-payment'
import { calculateBookingPrice, formatCurrency, formatTimeRange } from '@/utils/booking'

export default function PaymentPage() {
  const { waveLeaderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const stateDraft = location.state?.bookingDraft as BookingPaymentDraft | undefined
  const storedDraft =
    waveLeaderId && !stateDraft ? loadBookingDraft(waveLeaderId) : null
  const draft = stateDraft ?? storedDraft ?? undefined

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

  useEffect(() => {
    if (!draft || draft.waveLeaderId !== waveLeaderId) {
      navigate(`/booking/${waveLeaderId}`, { replace: true })
    }
  }, [draft, waveLeaderId, navigate])

  const pricing = useMemo(() => {
    if (!draft) return { subtotal: 0, serviceFee: 0, total: 0 }
    return calculateBookingPrice(draft.hourlyRate, draft.durationHours)
  }, [draft])

  if (!draft || draft.waveLeaderId !== waveLeaderId) {
    return (
      <div className="container mx-auto px-4 py-12 text-gray-400">
        Redirecting…
      </div>
    )
  }

  const dateLabel = (() => {
    const [y, m, d] = draft.scheduledDate.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  })()

  const avatarUrl =
    draft.waveLeaderAvatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${draft.waveLeaderId}`

  return (
    <div className="min-h-screen bg-dark-bg pb-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-white mb-2">Complete payment</h1>
        <p className="text-gray-400 text-sm mb-8">
          Secure checkout powered by Stripe.
        </p>

        {!publishableKey && (
          <div className="mb-6 rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-amber-200 text-sm">
            Set <code className="text-amber-100">VITE_STRIPE_PUBLISHABLE_KEY</code> in{' '}
            <code className="text-amber-100">client/.env</code> to enable card payments.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Payment details</h2>

              {error && (
                <div
                  className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {publishableKey ? (
                <StripePaymentForm
                  bookingDraft={draft}
                  onSuccess={(bookingId) => {
                    clearBookingDraft()
                    navigate(`/booking/confirmation/${bookingId}`, { replace: true })
                  }}
                  onError={setError}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                />
              ) : (
                <p className="text-gray-500 text-sm">Card payment is unavailable until Stripe is configured.</p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-6 pt-6 border-t border-gray-800">
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-gray-400 font-medium"
                >
                  Stripe secure checkout
                </a>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  <span>Your payment information is encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>SSL encrypted</span>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-lg font-semibold text-white">Booking summary</h2>

              <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover border border-gray-700"
                />
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{draft.waveLeaderName}</p>
                  <p className="text-xs text-gray-500">WaveLeader</p>
                </div>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Date & time</dt>
                  <dd className="text-white text-right">
                    {dateLabel} · {formatTimeRange(draft.scheduledTime, draft.durationHours)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Duration</dt>
                  <dd className="text-white">{draft.durationHours}h</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Service</dt>
                  <dd className="text-white text-right">{draft.serviceType}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-400">Location</dt>
                  <dd className="text-white text-right line-clamp-2">{draft.location}</dd>
                </div>
              </dl>

              <div className="rounded-lg border border-gray-800 bg-dark-bg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{formatCurrency(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Service fee (15%)</span>
                  <span className="text-white">{formatCurrency(pricing.serviceFee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-800 font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-xl text-white">{formatCurrency(pricing.total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                form="booking-payment-form"
                className="w-full py-6 text-lg font-semibold"
                disabled={!publishableKey || isSubmitting}
              >
                {isSubmitting ? 'Processing…' : `Confirm & pay ${formatCurrency(pricing.total)}`}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => navigate(`/booking/${waveLeaderId}`)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
