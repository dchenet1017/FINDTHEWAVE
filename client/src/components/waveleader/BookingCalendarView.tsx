import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WaveLeaderBookingClient } from '@/types/booking'
import { cn } from '@/lib/utils'

function bookingStartMs(b: WaveLeaderBookingClient): number {
  const [y, m, d] = b.scheduledDate.split('-').map(Number)
  const [h, min] = b.scheduledTime.split(':').map(Number)
  return new Date(y, m - 1, d, h, min, 0, 0).getTime()
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-500/80',
  CONFIRMED: 'bg-emerald-500/80',
  IN_PROGRESS: 'bg-blue-500/80',
  COMPLETED: 'bg-gray-500/80',
  CANCELLED: 'bg-red-500/50',
  DECLINED: 'bg-red-500/50',
}

export interface BookingCalendarViewProps {
  bookings: WaveLeaderBookingClient[]
  onBookingClick: (booking: WaveLeaderBookingClient) => void
}

export function BookingCalendarView({ bookings, onBookingClick }: BookingCalendarViewProps) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const { calendarDays, monthLabel } = useMemo(() => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startPad = first.getDay()
    const daysInMonth = last.getDate()
    const days: { date: Date; isCurrentMonth: boolean; bookings: WaveLeaderBookingClient[] }[] = []

    for (let i = 0; i < startPad; i++) {
      const d = new Date(y, m, 1 - (startPad - i))
      days.push({
        date: d,
        isCurrentMonth: false,
        bookings: bookings.filter((b) => {
          const [by, bm, bd] = b.scheduledDate.split('-').map(Number)
          return by === d.getFullYear() && bm === d.getMonth() + 1 && bd === d.getDate()
        }),
      })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d)
      days.push({
        date,
        isCurrentMonth: true,
        bookings: bookings.filter((b) => {
          const [by, bm, bd] = b.scheduledDate.split('-').map(Number)
          return by === y && bm === m + 1 && bd === d
        }),
      })
    }
    const remaining = 42 - days.length
    for (let i = 0; i < remaining; i++) {
      const d = new Date(y, m + 1, i + 1)
      days.push({
        date: d,
        isCurrentMonth: false,
        bookings: bookings.filter((b) => {
          const [by, bm, bd] = b.scheduledDate.split('-').map(Number)
          return by === d.getFullYear() && bm === d.getMonth() + 1 && bd === d.getDate()
        }),
      })
    }

    return {
      calendarDays: days,
      monthLabel: viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    }
  }, [viewDate, bookings])

  const today = useMemo(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-white min-w-[160px] text-center">{monthLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className={cn(
              'px-3 py-1.5 rounded text-sm font-medium',
              viewMode === 'week' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={cn(
              'px-3 py-1.5 rounded text-sm font-medium',
              viewMode === 'month' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-xs text-gray-500 border-b border-gray-800">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 min-h-[320px]">
        {calendarDays.map(({ date, isCurrentMonth, bookings: dayBookings }) => {
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          const isToday = dateKey === today
          return (
            <div
              key={dateKey}
              className={cn(
                'min-h-[48px] border-b border-r border-gray-800/80 p-1',
                !isCurrentMonth && 'bg-gray-900/60',
                isToday && 'ring-1 ring-inset ring-primary/50'
              )}
            >
              <span className={cn('text-xs', isCurrentMonth ? 'text-gray-400' : 'text-gray-600')}>
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayBookings.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={cn(
                      'w-full text-left truncate rounded px-1.5 py-0.5 text-xs text-white',
                      STATUS_COLOR[b.status] ?? 'bg-gray-600'
                    )}
                    title={`${b.user?.displayName ?? 'Client'} · ${b.scheduledTime}`}
                    onClick={() => onBookingClick(b)}
                  >
                    {b.scheduledTime} {b.user?.displayName?.split(' ')[0] ?? ''}
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <span className="text-xs text-gray-500">+{dayBookings.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
