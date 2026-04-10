import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import type { UserBooking } from '@/types/booking'
import { useCancelBooking, useBookingDetails } from '@/hooks/useBookings'

function hoursUntilBooking(booking: Pick<UserBooking, 'scheduledDate' | 'scheduledTime'>): number {
  const [y, m, d] = booking.scheduledDate.split('-').map(Number)
  const [h, min] = booking.scheduledTime.split(':').map(Number)
  const start = new Date(y, m - 1, d, h, min, 0, 0).getTime()
  return (start - Date.now()) / (1000 * 60 * 60)
}

const REASONS = [
  'Change of plans',
  'Found another WaveLeader',
  'WaveLeader not responsive',
  'Other',
] as const

interface CancelBookingModalProps {
  bookingId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CancelBookingModal({
  bookingId,
  open,
  onOpenChange,
  onSuccess,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState<string>(REASONS[0])
  const [confirmed, setConfirmed] = useState(false)
  const cancelMutation = useCancelBooking()
  const { data: booking, isLoading } = useBookingDetails(open && bookingId ? bookingId : null)

  const refundInfo = useMemo(() => {
    if (!booking) return null
    const h = hoursUntilBooking(booking)
    if (h > 24) return { label: 'Full refund', detail: 'You are cancelling more than 24 hours in advance.' }
    if (h >= 12) return { label: '50% refund', detail: 'Cancellations 12–24 hours before receive a 50% refund.' }
    return { label: 'No refund', detail: 'Cancellations within 12 hours are not eligible for a refund.' }
  }, [booking])

  const handleCancel = async () => {
    if (!bookingId || !confirmed) return
    try {
      await cancelMutation.mutateAsync({ bookingId, reason })
      onOpenChange(false)
      setConfirmed(false)
      onSuccess()
    } catch {
      //
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setConfirmed(false)
      }}
    >
      <DialogContent className="border-gray-800 bg-dark-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Cancel booking</DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}

        {!isLoading && booking && (
          <>
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-200/90">
              <p className="font-medium text-amber-100 mb-1">Refund policy</p>
              {refundInfo && (
                <p>
                  <strong>{refundInfo.label}</strong> — {refundInfo.detail}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Reason (optional)</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="bg-dark-bg border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(!!v)}
              label="I understand the cancellation and refund terms"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Keep booking
              </Button>
              <Button
                variant="destructive"
                disabled={!confirmed || cancelMutation.isPending}
                loading={cancelMutation.isPending}
                onClick={handleCancel}
              >
                Cancel booking
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
