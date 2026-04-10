import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { MapPin, ExternalLink, CalendarPlus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { useBookingDetails } from '@/hooks/useBookings'
import { generateICSFile } from '@/utils/calendar'
import { formatCurrency, formatTimeRange } from '@/utils/booking'
import { toast } from 'sonner'

const STEPS = [
  'WaveLeader will contact you within 24 hours',
  'Confirm final details together',
  'Meet at the scheduled time',
  'Leave a review after your session',
]

export default function BookingConfirmationPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { data: booking, isLoading, isError } = useBookingDetails(bookingId ?? null)
  const [showConfetti, setShowConfetti] = useState(true)
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    const t = setTimeout(() => setShowConfetti(false), 8000)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (!bookingId) navigate('/waveleaders', { replace: true })
  }, [bookingId, navigate])

  if (!bookingId) return null

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-400">
        Loading confirmation…
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 mb-4">Booking not found.</p>
        <Link to="/dashboard/bookings">
          <Button>My bookings</Button>
        </Link>
      </div>
    )
  }

  const wl = booking.waveLeader
  const avatarUrl =
    wl?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.waveLeaderId}`

  const dateLabel = (() => {
    const [y, m, d] = booking.scheduledDate.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  })()

  const mapsUrl = booking.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`
    : null

  const icsPayload = {
    id: booking.id,
    reference: booking.reference,
    waveLeaderId: booking.waveLeaderId,
    waveLeader: booking.waveLeader,
    scheduledDate: booking.scheduledDate,
    scheduledTime: booking.scheduledTime,
    duration: booking.duration,
    serviceType: booking.serviceType,
    location: booking.location,
    totalAmount: booking.totalAmount,
    serviceFee: booking.serviceFee,
    status: booking.status,
    notes: booking.notes,
    rating: booking.rating,
    review: booking.review,
    cancelReason: booking.cancelReason,
    createdAt: booking.createdAt,
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-16 relative overflow-hidden">
      {showConfetti && (
        <Confetti
          width={dims.w}
          height={dims.h}
          recycle={false}
          numberOfPieces={280}
          gravity={0.22}
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}
        />
      )}

      <div className="container mx-auto px-4 py-10 max-w-2xl relative z-20">
        <div className="flex flex-col items-center mb-8">
          <motion.div
            className="rounded-full bg-emerald-500/20 p-6 mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <motion.svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            </motion.svg>
          </motion.div>
          <motion.h1
            className="text-3xl font-bold text-white text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Booking confirmed!
          </motion.h1>
        </div>

        <Card className="border-gray-800 bg-gray-900/50 mb-8">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-lg text-white">{booking.reference}</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Confirmed
              </Badge>
            </div>

            {wl && (
              <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-16 w-16 rounded-full border border-gray-700 object-cover"
                />
                <div>
                  <p className="text-lg font-semibold text-white">{wl.displayName}</p>
                  <p className="text-sm text-gray-400">{wl.specialty}</p>
                  <p className="text-sm text-amber-400 mt-0.5">
                    ★ {wl.rating.toFixed(1)} ({wl.totalReviews} reviews)
                  </p>
                </div>
              </div>
            )}

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Date & time</dt>
                <dd className="text-white text-right">
                  {dateLabel}
                  <br />
                  {formatTimeRange(booking.scheduledTime, booking.duration)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Duration</dt>
                <dd className="text-white">{booking.duration}h</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Service</dt>
                <dd className="text-white text-right">{booking.serviceType || '—'}</dd>
              </div>
              {booking.location && (
                <div className="flex flex-col gap-2">
                  <dt className="text-gray-500">Location</dt>
                  <dd className="text-white flex flex-wrap items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
                    {booking.location}
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                      >
                        Get directions <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </dd>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <dt className="text-gray-400 font-medium">Total paid</dt>
                <dd className="text-xl font-bold text-white">
                  {formatCurrency(booking.totalAmount)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">What&apos;s next?</h2>
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-gray-300 pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-sm text-gray-500 text-center mb-6">
          Confirmation email sent to{' '}
          <span className="text-gray-300">{booking.userEmail}</span>
        </p>

        <div className="flex flex-col gap-3">
          <Link to={`/dashboard/bookings?booking=${booking.id}`} className="block w-full">
            <Button className="w-full py-6 text-base">View booking details</Button>
          </Link>
          <Button
            variant="secondary"
            className="w-full"
            type="button"
            onClick={() => generateICSFile(icsPayload)}
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Add to calendar
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            type="button"
            onClick={() => toast.info('Messaging will be available in a future update.')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message WaveLeader
          </Button>
          <Link to="/dashboard" className="block w-full">
            <Button variant="ghost" className="w-full text-gray-400">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
