import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import type { WaveLeaderBookingClient } from '@/types/booking'
import { formatCurrency, formatTimeRange } from '@/utils/booking'

interface AcceptBookingModalProps {
  booking: WaveLeaderBookingClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (booking: WaveLeaderBookingClient) => void
  isAccepting: boolean
}

export function AcceptBookingModal({
  booking,
  open,
  onOpenChange,
  onConfirm,
  isAccepting,
}: AcceptBookingModalProps) {
  const [addToCalendar, setAddToCalendar] = useState(true)
  const [sendWelcome, setSendWelcome] = useState(true)

  if (!booking) return null

  const client = booking.user
  const dateLabel = (() => {
    const [y, m, d] = booking.scheduledDate.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-dark-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Accept booking</DialogTitle>
          <DialogDescription className="text-gray-400">
            Confirm this booking and add it to your schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Booking summary</h3>
            <p className="text-gray-300">
              {dateLabel} · {formatTimeRange(booking.scheduledTime, booking.duration)}
            </p>
            <p className="text-gray-400">{booking.duration}h · {booking.serviceType || 'Session'}</p>
            <p className="text-white font-semibold mt-1">{formatCurrency(booking.totalAmount)}</p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Client</h3>
            <p className="text-gray-300">{client?.displayName ?? 'Client'}</p>
          </section>

          <div className="space-y-3 pt-2">
            <Checkbox
              checked={addToCalendar}
              onCheckedChange={(v) => setAddToCalendar(!!v)}
              label="Add to my calendar"
            />
            <Checkbox
              checked={sendWelcome}
              onCheckedChange={(v) => setSendWelcome(!!v)}
              label="Send welcome message to client"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(booking)}
            disabled={isAccepting}
            loading={isAccepting}
          >
            Confirm & accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
