import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { calculateBookingPrice, formatCurrency, formatTimeRange } from '@/utils/booking'

type WaveLeaderLike = {
  hourlyRate: number
}

interface BookingSummaryProps {
  waveLeader: WaveLeaderLike
  selectedDate: Date | null
  selectedTime: string | null
  durationHours: number
  serviceType: string
  location: string
  onContinue: () => void
}

export function BookingSummary({
  waveLeader,
  selectedDate,
  selectedTime,
  durationHours,
  serviceType,
  location,
  onContinue,
}: BookingSummaryProps) {
  const [agreed, setAgreed] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)

  const missing = useMemo(() => {
    const issues: string[] = []
    if (!selectedDate || !selectedTime) issues.push('Select a date and time')
    if (!durationHours) issues.push('Select a duration')
    if (!serviceType) issues.push('Select a service type')
    if (!location) issues.push('Enter a location')
    if (!agreed) issues.push('Accept terms')
    return issues
  }, [selectedDate, selectedTime, durationHours, serviceType, location, agreed])

  const pricing = useMemo(() => {
    return calculateBookingPrice(waveLeader.hourlyRate, durationHours)
  }, [waveLeader.hourlyRate, durationHours])

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : null

  return (
    <>
      <Card className="sticky top-4 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Date & time</span>
              <span className="text-white">
                {dateLabel && selectedTime
                  ? `${dateLabel} · ${formatTimeRange(selectedTime, durationHours)}`
                  : 'Select date/time'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">{durationHours}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Service</span>
              <span className="text-white">{serviceType || '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-400">Location</span>
              <span className="text-white text-right line-clamp-2">
                {location || '—'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-800 bg-dark-bg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Base price
              </span>
              <span className="text-white">
                {formatCurrency(waveLeader.hourlyRate)} × {durationHours} = {formatCurrency(pricing.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Service fee (15%)</span>
              <span className="text-white">{formatCurrency(pricing.serviceFee)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <span className="font-semibold text-white">Total</span>
              <span className="text-xl font-bold text-white">{formatCurrency(pricing.total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Checkbox
              checked={agreed}
              onCheckedChange={setAgreed}
              label="I agree to the cancellation policy and terms"
            />
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setPolicyOpen(true)}
            >
              View cancellation policy
            </button>
          </div>

          {missing.length > 0 && (
            <div className="space-y-2">
              <Badge variant="outline" className="text-gray-300 border-gray-700">
                Complete to continue
              </Badge>
              <ul className="text-xs text-gray-500 list-disc pl-5">
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            className="w-full"
            disabled={missing.length > 0}
            onClick={onContinue}
          >
            Continue to Payment
          </Button>
        </CardContent>
      </Card>

      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancellation policy</DialogTitle>
            <DialogDescription>
              This is a placeholder policy for Milestone 5.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              - Full refund if cancelled 24+ hours before the booking start time.
            </p>
            <p>
              - 50% refund if cancelled 6–24 hours before.
            </p>
            <p>
              - No refund for cancellations within 6 hours of start time.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

