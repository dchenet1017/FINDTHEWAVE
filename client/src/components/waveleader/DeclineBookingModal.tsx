import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import type { WaveLeaderBookingClient } from '@/types/booking'

const DECLINE_REASONS = [
  'Not available at that time',
  'Outside service area',
  'Not my specialty',
  'Schedule conflict',
  'Other',
] as const

interface DeclineBookingModalProps {
  booking: WaveLeaderBookingClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (booking: WaveLeaderBookingClient, reason: string, message?: string) => void
  isDeclining: boolean
}

export function DeclineBookingModal({
  booking,
  open,
  onOpenChange,
  onConfirm,
  isDeclining,
}: DeclineBookingModalProps) {
  const [reason, setReason] = useState<string>(DECLINE_REASONS[0])
  const [message, setMessage] = useState('')
  const [suggestAlternative, setSuggestAlternative] = useState(false)

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-dark-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Decline booking</DialogTitle>
          <DialogDescription className="text-gray-400">
            This may affect your acceptance rate. The client will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-gray-300 mb-2">Reason (required)</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-dark-bg border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DECLINE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Message to client (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="e.g. Sorry, I'm fully booked that week."
              className="bg-dark-bg border-gray-700 min-h-[80px]"
              maxLength={500}
            />
          </div>

          <Checkbox
            checked={suggestAlternative}
            onCheckedChange={(v) => setSuggestAlternative(!!v)}
            label="Suggest alternative WaveLeader"
          />

          <p className="text-amber-200/90 text-xs">
            Note: Declining may affect your acceptance rate and visibility.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Keep request
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(booking, reason, message.trim() || undefined)}
            disabled={isDeclining || !reason.trim()}
            loading={isDeclining}
          >
            Decline booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
