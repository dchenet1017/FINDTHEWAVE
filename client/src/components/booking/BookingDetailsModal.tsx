import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useBookingDetails } from '@/hooks/useBookings'
import { formatCurrency, formatTimeRange } from '@/utils/booking'
import { MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingDetailsModalProps {
  bookingId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel?: () => void
  onReschedule?: () => void
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
  COMPLETED: 'bg-gray-500/20 text-gray-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
  DECLINED: 'bg-red-500/20 text-red-400',
}

export function BookingDetailsModal({
  bookingId,
  open,
  onOpenChange,
  onCancel,
  onReschedule,
}: BookingDetailsModalProps) {
  const { data: b, isLoading } = useBookingDetails(open && bookingId ? bookingId : null)

  if (!bookingId) return null

  const dateLabel = b
    ? (() => {
        const [y, m, d] = b.scheduledDate.split('-').map(Number)
        return new Date(y, m - 1, d).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      })()
    : ''

  const mapsUrl = b?.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.location)}`
    : null

  const canCancel =
    b && ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)
  const canReschedule = b?.status === 'CONFIRMED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-gray-800 bg-dark-card">
        <DialogHeader>
          <DialogTitle className="text-white">Booking details</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}
        {!isLoading && b && (
          <div className="space-y-6 text-sm">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Booking info
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-white">{b.reference}</span>
                <Badge
                  variant="outline"
                  className={cn('capitalize', STATUS_CLASS[b.status] ?? '')}
                >
                  {b.status.replace('_', ' ').toLowerCase()}
                </Badge>
              </div>
              <p className="text-gray-300">
                {dateLabel} · {formatTimeRange(b.scheduledTime, b.duration)}
              </p>
              <p className="text-gray-400">{b.duration}h · {b.serviceType || 'Session'}</p>
              {b.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                  <span className="text-gray-300">{b.location}</span>
                </div>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                >
                  Get directions <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <p className="text-lg font-semibold text-white pt-2">
                Total paid {formatCurrency(b.totalAmount)}
              </p>
            </section>

            {b.waveLeader && (
              <section className="space-y-2 border-t border-gray-800 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  WaveLeader
                </h3>
                <div className="flex items-center gap-3">
                  <img
                    src={
                      b.waveLeader.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.waveLeader.id}`
                    }
                    alt=""
                    className="h-12 w-12 rounded-full border border-gray-700"
                  />
                  <div>
                    <p className="font-medium text-white">{b.waveLeader.displayName}</p>
                    <p className="text-gray-500 text-xs">{b.waveLeader.specialty}</p>
                    <p className="text-amber-400 text-xs">
                      ★ {b.waveLeader.rating.toFixed(1)} ({b.waveLeader.totalReviews} reviews)
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-2 border-t border-gray-800 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Payment
              </h3>
              <p className="text-gray-400">
                {b.paymentIntentId
                  ? 'Paid securely via Stripe.'
                  : b.status === 'PENDING'
                    ? 'Payment pending.'
                    : '—'}
              </p>
            </section>

            <section className="border-t border-gray-800 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Cancellation policy
              </h3>
              <ul className="text-gray-400 text-xs space-y-1 list-disc pl-4">
                <li>Full refund if cancelled 24+ hours before start.</li>
                <li>50% refund if cancelled 12–24 hours before.</li>
                <li>No refund within 12 hours of start.</li>
              </ul>
            </section>

            <div className="flex flex-wrap gap-2 pt-2">
              {canReschedule && onReschedule && (
                <Button type="button" variant="secondary" onClick={onReschedule}>
                  Reschedule
                </Button>
              )}
              {canCancel && onCancel && (
                <Button type="button" variant="destructive" onClick={onCancel}>
                  Cancel booking
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
