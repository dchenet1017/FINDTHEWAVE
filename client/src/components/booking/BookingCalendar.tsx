import { useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { addMonths, format, isBefore, isSameDay, startOfDay } from 'date-fns'
import { useWaveLeaderAvailability } from '@/hooks/useWaveLeaderAvailability'
import { Skeleton } from '@/components/ui/Skeleton'

interface BookingCalendarProps {
  waveLeaderId: string
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  month?: string // YYYY-MM
}

function isDateAvailable(date: Date, available: Date[]) {
  return available.some((d) => isSameDay(d, date))
}

export function BookingCalendar({
  waveLeaderId,
  selectedDate,
  onDateSelect,
  month,
}: BookingCalendarProps) {
  const { data, isLoading } = useWaveLeaderAvailability(waveLeaderId, month)

  const availableDays = useMemo(() => {
    const list = data?.availableDates ?? []
    return list.map((d) => new Date(d))
  }, [data?.availableDates])

  const today = startOfDay(new Date())
  const toMonth = addMonths(new Date(), 2)

  if (isLoading) {
    return <Skeleton className="h-[320px] w-full" />
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-dark-bg p-3">
      <DayPicker
        mode="single"
        selected={selectedDate ?? undefined}
        onSelect={(d) => d && onDateSelect(d)}
        fromDate={today}
        toMonth={toMonth}
        disabled={[
          { before: today },
          (date) => isBefore(date, today) || !isDateAvailable(date, availableDays),
        ]}
        modifiers={{
          available: availableDays,
          today,
        }}
        modifiersStyles={{
          available: { border: '2px solid #10B981', borderRadius: 8 },
          today: { outline: '2px solid rgba(108,92,231,0.6)', borderRadius: 8 },
          selected: { backgroundColor: 'rgba(108,92,231,0.25)', borderRadius: 8 },
        }}
        captionLayout="dropdown"
        className="rdp-dark"
        footer={
          selectedDate ? (
            <p className="text-xs text-gray-400 pt-2">
              Selected: {format(selectedDate, 'PPP')}
            </p>
          ) : (
            <p className="text-xs text-gray-500 pt-2">Pick a date to see time slots.</p>
          )
        }
      />
    </div>
  )
}

