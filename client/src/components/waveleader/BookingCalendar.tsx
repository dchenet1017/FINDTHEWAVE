import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface BookingCalendarProps {
  availableDates?: Date[]
  bookedDates?: Date[]
  onDateSelect?: (date: Date) => void
  waveLeaderId?: string
  className?: string
}

export function BookingCalendar({
  availableDates = [],
  bookedDates = [],
  onDateSelect,
  waveLeaderId,
  className,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const isAvailable = (d: Date) => {
    if (availableDates.length === 0) return true
    return availableDates.some(
      (ad) =>
        ad.getFullYear() === d.getFullYear() &&
        ad.getMonth() === d.getMonth() &&
        ad.getDate() === d.getDate()
    )
  }

  const isBooked = (d: Date) =>
    bookedDates.some(
      (bd) =>
        bd.getFullYear() === d.getFullYear() &&
        bd.getMonth() === d.getMonth() &&
        bd.getDate() === d.getDate()
    )

  return (
    <div className={cn('rounded-lg border border-gray-800 bg-dark-card p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Availability</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-300 w-24 text-center">
            {format(currentMonth, 'MMM yyyy')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = isSameMonth(d, monthStart)
          const today = isToday(d)
          const available = isAvailable(d)
          const booked = isBooked(d)

          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onDateSelect?.(d)}
              disabled={!inMonth || booked}
              className={cn(
                'aspect-square rounded-md text-xs font-medium transition-colors',
                !inMonth && 'text-gray-600',
                inMonth && available && !booked && 'text-white hover:bg-primary/20',
                inMonth && booked && 'text-gray-500 bg-gray-800/50 cursor-not-allowed',
                today && 'ring-2 ring-primary'
              )}
            >
              {format(d, 'd')}
            </button>
          )
        })}
      </div>

      {waveLeaderId && (
        <Link
          to={`/waveleader/${waveLeaderId}/book`}
          className="block mt-4 text-center text-sm text-primary hover:text-primary/80"
        >
          View Full Calendar
        </Link>
      )}
    </div>
  )
}
