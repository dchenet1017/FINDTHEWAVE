import { useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { TIME_SLOTS, formatTimeRange } from '@/utils/booking'
import { useTimeSlots } from '@/hooks/useWaveLeaderAvailability'

interface TimeSlotSelectorProps {
  waveLeaderId: string
  selectedDate: Date
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  durationHours: number
}

export function TimeSlotSelector({
  waveLeaderId,
  selectedDate,
  selectedTime,
  onTimeSelect,
  durationHours,
}: TimeSlotSelectorProps) {
  const dateStr = useMemo(() => {
    const d = new Date(selectedDate)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [selectedDate])

  const { data, isLoading } = useTimeSlots(waveLeaderId, dateStr)

  const slotStatus = useMemo(() => {
    const map = new Map<string, 'available' | 'booked'>()
    ;(data?.slots ?? []).forEach((s) => map.set(s.time, s.status))
    return map
  }, [data?.slots])

  const slots = TIME_SLOTS.map((t) => ({
    time: t,
    status: slotStatus.get(t) ?? 'available',
  }))

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!slots.length) {
    return (
      <div className="rounded-lg border border-gray-800 bg-dark-bg p-6 text-center text-sm text-gray-500">
        No time slots available for this date.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {slots.map((s) => {
        const isBooked = s.status === 'booked'
        const isSelected = selectedTime === s.time
        return (
          <Button
            key={s.time}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'h-auto justify-between py-3 px-3 border-gray-800',
              isBooked && 'opacity-60 cursor-not-allowed'
            )}
            disabled={isBooked}
            onClick={() => onTimeSelect(s.time)}
          >
            <div className="text-left">
              <div className="text-sm font-medium">
                {formatTimeRange(s.time, durationHours)}
              </div>
              <div className="text-xs text-gray-400">{s.time}</div>
            </div>
            <Badge variant={isBooked ? 'outline' : 'success'} className="ml-2">
              {isBooked ? 'Booked' : 'Available'}
            </Badge>
          </Button>
        )
      })}
    </div>
  )
}

