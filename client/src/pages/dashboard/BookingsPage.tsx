import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { BookingCard } from '@/components/booking/BookingCard'
import { BookingDetailsModal } from '@/components/booking/BookingDetailsModal'
import { CancelBookingModal } from '@/components/booking/CancelBookingModal'
import { RescheduleBookingModal } from '@/components/booking/RescheduleBookingModal'
import { useUserBookings, type BookingsTab } from '@/hooks/useBookings'
import type { UserBooking } from '@/types/booking'

const SORT_OPTIONS = [
  { value: 'date_asc', label: 'Date (soonest first)' },
  { value: 'date_desc', label: 'Date (latest first)' },
  { value: 'price_asc', label: 'Price (low to high)' },
  { value: 'price_desc', label: 'Price (high to low)' },
] as const

function TabPanel({
  tab,
  active,
  isLoading,
  bookings,
  emptyTitle,
  emptyBody,
  emptyCta,
  emptyTo,
  onTab,
  onAction,
}: {
  tab: BookingsTab
  active: boolean
  isLoading: boolean
  bookings: UserBooking[]
  emptyTitle: string
  emptyBody: string
  emptyCta: string
  emptyTo: string | null
  onTab: () => void
  onAction: (a: string, b: UserBooking) => void
}) {
  if (!active) return null
  if (isLoading) {
    return <p className="text-gray-500 text-center py-12">Loading…</p>
  }
  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-xl border border-gray-800 bg-gray-900/30">
        <p className="text-white font-medium mb-2">{emptyTitle}</p>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">{emptyBody}</p>
        {emptyTo ? (
          <Link to={emptyTo}>
            <Button>{emptyCta}</Button>
          </Link>
        ) : (
          <Button variant="secondary" onClick={onTab}>
            {emptyCta}
          </Button>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} variant={tab} onAction={onAction} />
      ))}
    </div>
  )
}

export default function BookingsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<BookingsTab>('upcoming')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<string>('date_asc')

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data: bookings = [], isLoading, refetch } = useUserBookings(
    tab,
    sort,
    debouncedSearch || undefined
  )

  useEffect(() => {
    const id = searchParams.get('booking')
    if (id) {
      setDetailId(id)
      setDetailOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('booking')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open deep link once
  }, [])

  const handleAction = useCallback(
    (action: string, booking: UserBooking) => {
      switch (action) {
        case 'view':
          setDetailId(booking.id)
          setDetailOpen(true)
          break
        case 'cancel':
          setCancelId(booking.id)
          break
        case 'reschedule':
          setRescheduleId(booking.id)
          break
        case 'rebook':
          navigate(`/booking/${booking.waveLeaderId}`)
          break
        case 'review':
          navigate(`/booking/${booking.id}/review`)
          break
        default:
          break
      }
    },
    [navigate]
  )

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">My bookings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage upcoming sessions and history</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by WaveLeader name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-dark-bg border-gray-700"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-gray-500 hidden sm:block" />
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-[200px] bg-dark-bg border-gray-700">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as BookingsTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900/80 border border-gray-800">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="upcoming" className="mt-0">
            <TabPanel
              tab="upcoming"
              active={tab === 'upcoming'}
              isLoading={isLoading}
              bookings={bookings}
              emptyTitle="No upcoming bookings"
              emptyBody="Explore WaveLeaders and book your first session."
              emptyCta="Browse WaveLeaders"
              emptyTo="/waveleaders"
              onTab={() => setTab('upcoming')}
              onAction={handleAction}
            />
          </TabsContent>
          <TabsContent value="past" className="mt-0">
            <TabPanel
              tab="past"
              active={tab === 'past'}
              isLoading={isLoading}
              bookings={bookings}
              emptyTitle="No past bookings yet"
              emptyBody="Your booking history will appear here after completed sessions."
              emptyCta="Find a WaveLeader"
              emptyTo="/waveleaders"
              onTab={() => setTab('upcoming')}
              onAction={handleAction}
            />
          </TabsContent>
          <TabsContent value="cancelled" className="mt-0">
            <TabPanel
              tab="cancelled"
              active={tab === 'cancelled'}
              isLoading={isLoading}
              bookings={bookings}
              emptyTitle="No cancelled bookings"
              emptyBody="Cancelled sessions will be listed here."
              emptyCta="Back to upcoming"
              emptyTo={null}
              onTab={() => setTab('upcoming')}
              onAction={handleAction}
            />
          </TabsContent>
        </div>
      </Tabs>

      <BookingDetailsModal
        bookingId={detailId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailId(null)
        }}
        onCancel={() => {
          if (detailId) {
            setDetailOpen(false)
            setCancelId(detailId)
          }
        }}
        onReschedule={() => {
          if (detailId) {
            setDetailOpen(false)
            setRescheduleId(detailId)
          }
        }}
      />

      <CancelBookingModal
        bookingId={cancelId}
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
        onSuccess={() => {
          setCancelId(null)
          refetch()
        }}
      />

      <RescheduleBookingModal
        bookingId={rescheduleId}
        open={!!rescheduleId}
        onOpenChange={(open) => !open && setRescheduleId(null)}
        onSuccess={() => {
          setRescheduleId(null)
          refetch()
        }}
      />
    </div>
  )
}
