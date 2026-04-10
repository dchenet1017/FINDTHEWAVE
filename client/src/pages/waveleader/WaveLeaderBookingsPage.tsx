import { useMemo, useState } from 'react'
import { Calendar, List, Star, DollarSign, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { BookingRequestCard } from '@/components/waveleader/BookingRequestCard'
import { UpcomingBookingCard } from '@/components/waveleader/UpcomingBookingCard'
import { AcceptBookingModal } from '@/components/waveleader/AcceptBookingModal'
import { DeclineBookingModal } from '@/components/waveleader/DeclineBookingModal'
import { ProposeTimeModal } from '@/components/waveleader/ProposeTimeModal'
import { BookingCalendarView } from '@/components/waveleader/BookingCalendarView'
import {
  useWaveLeaderBookings,
  useWaveLeaderBookingsStats,
  useAcceptBooking,
  useDeclineBooking,
  useProposeNewTime,
} from '@/hooks/useWaveLeaderBookings'
import type { WaveLeaderBookingClient } from '@/types/booking'
import { formatCurrency } from '@/utils/booking'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'

type TabKey = 'requests' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled'

export default function WaveLeaderBookingsPage() {
  const [tab, setTab] = useState<TabKey>('requests')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const [acceptModalBooking, setAcceptModalBooking] = useState<WaveLeaderBookingClient | null>(null)
  const [declineModalBooking, setDeclineModalBooking] = useState<WaveLeaderBookingClient | null>(null)
  const [proposeModalBooking, setProposeModalBooking] = useState<WaveLeaderBookingClient | null>(null)
  const [detailBooking, setDetailBooking] = useState<WaveLeaderBookingClient | null>(null)

  const { data: stats, isLoading: statsLoading } = useWaveLeaderBookingsStats()
  const { data: allBookings = [], isLoading: bookingsLoading, refetch } = useWaveLeaderBookings()

  const acceptMutation = useAcceptBooking()
  const declineMutation = useDeclineBooking()
  const proposeMutation = useProposeNewTime()

  const byTab = useMemo(() => {
    const requests = allBookings.filter((b) => b.status === 'PENDING')
    const upcoming = allBookings.filter((b) => b.status === 'CONFIRMED')
    const inProgress = allBookings.filter((b) => b.status === 'IN_PROGRESS')
    const completed = allBookings.filter((b) => b.status === 'COMPLETED')
    const cancelled = allBookings.filter((b) => b.status === 'CANCELLED' || b.status === 'DECLINED')
    return { requests, upcoming, inProgress, completed, cancelled }
  }, [allBookings])

  const handleAcceptConfirm = async (booking: WaveLeaderBookingClient) => {
    try {
      await acceptMutation.mutateAsync(booking.id)
      setAcceptModalBooking(null)
      refetch()
    } catch {
      //
    }
  }

  const handleDeclineConfirm = async (
    booking: WaveLeaderBookingClient,
    reason: string,
    message?: string
  ) => {
    try {
      await declineMutation.mutateAsync({ bookingId: booking.id, reason, message })
      setDeclineModalBooking(null)
      refetch()
    } catch {
      //
    }
  }

  const handleProposeConfirm = async (
    booking: WaveLeaderBookingClient,
    newDate: string,
    newTime: string,
    message?: string
  ) => {
    try {
      await proposeMutation.mutateAsync({ bookingId: booking.id, newDate, newTime, message })
      setProposeModalBooking(null)
      refetch()
    } catch {
      //
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Bookings</h1>
        <p className="text-gray-400 mt-1">Manage requests, upcoming sessions, and history.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">This week</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {statsLoading ? '—' : stats?.thisWeekBookings ?? 0}
          </p>
          <p className="text-xs text-gray-500">bookings</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <DollarSign className="h-5 w-5" />
            <span className="text-sm font-medium">This week</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {statsLoading ? '—' : formatCurrency(stats?.thisWeekRevenue ?? 0)}
          </p>
          <p className="text-xs text-gray-500">revenue</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 relative">
          <div className="flex items-center gap-2 text-gray-400">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {statsLoading ? '—' : stats?.pendingCount ?? 0}
          </p>
          {(stats?.pendingCount ?? 0) > 0 && (
            <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500" />
          )}
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Star className="h-5 w-5" />
            <span className="text-sm font-medium">Rating</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {statsLoading ? '—' : (stats?.averageRating ?? 0).toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">{stats?.totalReviews ?? 0} reviews</p>
        </div>
      </div>

      {/* List / Calendar toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'list' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('calendar')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Calendar
        </Button>
      </div>

      {viewMode === 'calendar' ? (
        <BookingCalendarView
          bookings={allBookings.filter(
            (b) => !['CANCELLED', 'DECLINED'].includes(b.status)
          )}
          onBookingClick={setDetailBooking}
        />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-900/80 border border-gray-800">
            <TabsTrigger value="requests">
              Requests
              {(byTab.requests.length > 0) && (
                <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                  {byTab.requests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="in_progress">In progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            <TabsContent value="requests" className="mt-0">
              {bookingsLoading && <p className="text-gray-500 py-8 text-center">Loading…</p>}
              {!bookingsLoading && byTab.requests.length === 0 && (
                <p className="text-gray-500 py-12 text-center">No pending requests.</p>
              )}
              {!bookingsLoading &&
                byTab.requests.map((b) => (
                  <BookingRequestCard
                    key={b.id}
                    booking={b}
                    onAccept={setAcceptModalBooking}
                    onDecline={setDeclineModalBooking}
                    onPropose={setProposeModalBooking}
                  />
                ))}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0">
              {bookingsLoading && <p className="text-gray-500 py-8 text-center">Loading…</p>}
              {!bookingsLoading && byTab.upcoming.length === 0 && (
                <p className="text-gray-500 py-12 text-center">No upcoming bookings.</p>
              )}
              {!bookingsLoading &&
                byTab.upcoming.map((b) => (
                  <UpcomingBookingCard
                    key={b.id}
                    booking={b}
                    onViewDetails={setDetailBooking}
                  />
                ))}
            </TabsContent>

            <TabsContent value="in_progress" className="mt-0">
              {bookingsLoading && <p className="text-gray-500 py-8 text-center">Loading…</p>}
              {!bookingsLoading && byTab.inProgress.length === 0 && (
                <p className="text-gray-500 py-12 text-center">No sessions in progress.</p>
              )}
              {!bookingsLoading &&
                byTab.inProgress.map((b) => (
                  <UpcomingBookingCard
                    key={b.id}
                    booking={b}
                    onViewDetails={setDetailBooking}
                  />
                ))}
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              {bookingsLoading && <p className="text-gray-500 py-8 text-center">Loading…</p>}
              {!bookingsLoading && byTab.completed.length === 0 && (
                <p className="text-gray-500 py-12 text-center">No completed bookings yet.</p>
              )}
              {!bookingsLoading &&
                byTab.completed.map((b) => (
                  <UpcomingBookingCard
                    key={b.id}
                    booking={b}
                    onViewDetails={setDetailBooking}
                  />
                ))}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-0">
              {bookingsLoading && <p className="text-gray-500 py-8 text-center">Loading…</p>}
              {!bookingsLoading && byTab.cancelled.length === 0 && (
                <p className="text-gray-500 py-12 text-center">No cancelled bookings.</p>
              )}
              {!bookingsLoading &&
                byTab.cancelled.map((b) => (
                  <UpcomingBookingCard
                    key={b.id}
                    booking={b}
                    onViewDetails={setDetailBooking}
                  />
                ))}
            </TabsContent>
          </div>
        </Tabs>
      )}

      <AcceptBookingModal
        booking={acceptModalBooking}
        open={!!acceptModalBooking}
        onOpenChange={(open) => !open && setAcceptModalBooking(null)}
        onConfirm={handleAcceptConfirm}
        isAccepting={acceptMutation.isPending}
      />

      <DeclineBookingModal
        booking={declineModalBooking}
        open={!!declineModalBooking}
        onOpenChange={(open) => !open && setDeclineModalBooking(null)}
        onConfirm={handleDeclineConfirm}
        isDeclining={declineMutation.isPending}
      />

      <ProposeTimeModal
        booking={proposeModalBooking}
        open={!!proposeModalBooking}
        onOpenChange={(open) => !open && setProposeModalBooking(null)}
        onConfirm={handleProposeConfirm}
        isSubmitting={proposeMutation.isPending}
      />

      <Dialog open={!!detailBooking} onOpenChange={(open) => !open && setDetailBooking(null)}>
        <DialogContent className="border-gray-800 bg-dark-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Booking details</DialogTitle>
          </DialogHeader>
          {detailBooking && (
            <div className="text-sm space-y-2">
              <p className="font-mono text-gray-400">{detailBooking.reference}</p>
              <p className="text-white">{detailBooking.user?.displayName ?? 'Client'}</p>
              <p className="text-gray-400">
                {detailBooking.scheduledDate} · {detailBooking.scheduledTime} · {detailBooking.duration}h
              </p>
              <p className="text-gray-400">{detailBooking.serviceType ?? 'Session'}</p>
              {detailBooking.location && (
                <p className="text-gray-500">{detailBooking.location}</p>
              )}
              <p className="font-semibold text-white">{formatCurrency(detailBooking.totalAmount)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
