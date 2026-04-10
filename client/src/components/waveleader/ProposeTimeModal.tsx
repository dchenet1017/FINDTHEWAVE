import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { WaveLeaderBookingClient } from '@/types/booking'

interface ProposeTimeModalProps {
  booking: WaveLeaderBookingClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (booking: WaveLeaderBookingClient, newDate: string, newTime: string, message?: string) => void
  isSubmitting: boolean
}

export function ProposeTimeModal({
  booking,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: ProposeTimeModalProps) {
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('10:00')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open && booking) {
      setNewDate(booking.scheduledDate)
      setNewTime(booking.scheduledTime)
      setMessage('')
    }
  }, [open, booking])

  if (!booking) return null

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(newDate) && /^\d{2}:\d{2}$/.test(newTime)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-dark-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Propose new time</DialogTitle>
          <DialogDescription className="text-gray-400">
            Suggest an alternative date and time. The client can accept or decline.
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
          <div>
            <label className="block text-sm text-gray-300 mb-2">Message to client (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="e.g. I have an opening at this time instead."
              className="bg-dark-bg border-gray-700 min-h-[80px]"
              maxLength={500}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(booking, newDate, newTime, message.trim() || undefined)}
            disabled={!valid || isSubmitting}
            loading={isSubmitting}
          >
            Send proposal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
