import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRescheduleBooking, useBookingDetails } from '@/hooks/useBookings'

interface RescheduleBookingModalProps {
  bookingId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RescheduleBookingModal({
  bookingId,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleBookingModalProps) {
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('10:00')
  const rescheduleMutation = useRescheduleBooking()
  const { data: booking } = useBookingDetails(open && bookingId ? bookingId : null)

  useEffect(() => {
    if (open && booking) {
      setNewDate(booking.scheduledDate)
      setNewTime(booking.scheduledTime)
    }
  }, [open, booking])

  const submit = async () => {
    if (!bookingId || !/^\d{4}-\d{2}-\d{2}$/.test(newDate) || !/^\d{2}:\d{2}$/.test(newTime)) {
      return
    }
    try {
      await rescheduleMutation.mutateAsync({
        bookingId,
        newDate,
        newTime,
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      //
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-dark-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Reschedule booking</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose a new date and time. The slot must be available on the WaveLeader calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            label="New date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="bg-dark-bg border-gray-700"
          />
          <Input
            label="New start time"
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value.slice(0, 5))}
            className="bg-dark-bg border-gray-700"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={rescheduleMutation.isPending || !bookingId}
            loading={rescheduleMutation.isPending}
          >
            Save new time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
