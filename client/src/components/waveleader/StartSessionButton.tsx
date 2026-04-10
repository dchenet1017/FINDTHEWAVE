import { useState } from 'react'
import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { WaveLeaderBookingClient } from '@/types/booking'
import { useStartSession, useEndSession } from '@/hooks/useWaveLeaderBookings'
import { formatTimeRange } from '@/utils/booking'

function bookingStartMs(scheduledDate: string, scheduledTime: string): number {
  const [y, m, d] = scheduledDate.split('-').map(Number)
  const [h, min] = scheduledTime.split(':').map(Number)
  return new Date(y, m - 1, d, h, min, 0, 0).getTime()
}

const FIFTEEN_MIN_MS = 15 * 60 * 1000

export interface StartSessionButtonProps {
  booking: WaveLeaderBookingClient
  onStarted?: () => void
  onEnded?: () => void
}

export function StartSessionButton({ booking, onStarted, onEnded }: StartSessionButtonProps) {
  const [localStatus, setLocalStatus] = useState(booking.status)
  const startMutation = useStartSession()
  const endMutation = useEndSession()

  const startMs = bookingStartMs(booking.scheduledDate, booking.scheduledTime)
  const endMs = startMs + booking.duration * 60 * 60 * 1000
  const now = Date.now()
  const windowStart = startMs - FIFTEEN_MIN_MS
  const canStart = now >= windowStart && now < startMs
  const isInProgress = localStatus === 'IN_PROGRESS' || booking.status === 'IN_PROGRESS'
  const isPast = now >= endMs
  const availableAt = new Date(windowStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(booking.id)
      setLocalStatus('IN_PROGRESS')
      onStarted?.()
    } catch {
      //
    }
  }

  const handleEnd = async () => {
    try {
      await endMutation.mutateAsync(booking.id)
      setLocalStatus('COMPLETED')
      onEnded?.()
    } catch {
      //
    }
  }

  if (booking.status !== 'CONFIRMED' && !isInProgress) return null
  if (isPast && !isInProgress) return null

  if (isInProgress) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-blue-400 font-medium">Session in progress</p>
        <p className="text-xs text-gray-500">
          Ends {formatTimeRange(booking.scheduledTime, booking.duration).split(' - ')[1] ?? '—'}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleEnd}
          disabled={endMutation.isPending}
          loading={endMutation.isPending}
        >
          <Square className="h-4 w-4 mr-2" />
          End session
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      disabled={!canStart || startMutation.isPending}
      loading={startMutation.isPending}
      onClick={handleStart}
      className="bg-emerald-600 hover:bg-emerald-700"
    >
      <Play className="h-4 w-4 mr-2" />
      {canStart ? 'Start session' : `Available ${availableAt}`}
    </Button>
  )
}
