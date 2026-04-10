import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatDate } from '@/lib/utils'
import { useUpcomingBookings } from '@/hooks/useUserDashboard'
import type { Booking } from '@/services/user.service'

const statusColors = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  CONFIRMED: 'bg-green-500/10 text-green-500 border-green-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  COMPLETED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  DECLINED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const statusLabels = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DECLINED: 'Declined',
}

interface UpcomingBookingsProps {
  limit?: number
  showViewAll?: boolean
}

export function UpcomingBookings({ limit = 3, showViewAll = true }: UpcomingBookingsProps) {
  const navigate = useNavigate()
  const { data: bookings = [], isLoading } = useUpcomingBookings(limit)

  if (isLoading) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400 mb-1">No upcoming bookings</p>
            <p className="text-xs text-gray-500">Book a WaveLeader to get started</p>
            {showViewAll && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/dashboard/bookings')}
              >
                View All Bookings
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-gray-200">Upcoming Bookings</CardTitle>
        {showViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/bookings')}
            className="text-xs"
          >
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {bookings.map((booking) => (
          <BookingItem key={booking.id} booking={booking} />
        ))}
      </CardContent>
    </Card>
  )
}

function BookingItem({ booking }: { booking: Booking }) {
  const navigate = useNavigate()
  const waveLeaderName = booking.waveLeader?.displayName || 'Unknown WaveLeader'
  const avatar = booking.waveLeader?.avatar || booking.waveLeader?.user?.avatar
  const initials = waveLeaderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const bookingDate = new Date(booking.scheduledDate)
  const isToday = bookingDate.toDateString() === new Date().toDateString()
  const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()

  let dateLabel = formatDate(booking.scheduledDate)
  if (isToday) dateLabel = 'Today'
  if (isTomorrow) dateLabel = 'Tomorrow'

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
      onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}
    >
      <Avatar src={avatar} fallback={initials} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-white truncate">{waveLeaderName}</p>
          <Badge
            variant="outline"
            className={cn('text-[10px] px-2 py-0', statusColors[booking.status])}
          >
            {statusLabels[booking.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{dateLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{booking.scheduledTime}</span>
          </div>
        </div>
        {booking.waveLeader?.specialty && (
          <p className="text-xs text-gray-500 mt-1">{booking.waveLeader.specialty}</p>
        )}
      </div>
    </div>
  )
}

