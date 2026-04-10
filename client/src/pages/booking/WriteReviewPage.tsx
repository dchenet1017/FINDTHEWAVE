import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { StarRating } from '@/components/review/StarRating'
import { ReviewTags } from '@/components/review/ReviewTags'
import { useBookingDetails } from '@/hooks/useBookings'
import { useSubmitReview } from '@/hooks/useReviews'
import { formatTimeRange } from '@/utils/booking'

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

export default function WriteReviewPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { data: booking, isLoading } = useBookingDetails(bookingId ?? null)
  const submitMutation = useSubmitReview()

  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [anonymous, setAnonymous] = useState(false)

  const [photos, setPhotos] = useState<File[]>([])

  const remaining = 1000 - text.length

  const canSubmit = rating >= 1 && rating <= 5 && !submitMutation.isPending

  const summary = useMemo(() => {
    if (!booking) return null
    const wl = booking.waveLeader
    const avatar =
      wl?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.waveLeaderId}`
    const [y, m, d] = booking.scheduledDate.split('-').map(Number)
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return {
      avatar,
      name: wl?.displayName ?? 'WaveLeader',
      dateLabel,
      serviceType: booking.serviceType || 'Session',
      durationHours: booking.duration,
      timeRange: formatTimeRange(booking.scheduledTime, booking.duration),
    }
  }, [booking])

  const onPickPhotos = (files: FileList | null) => {
    if (!files) return
    const next = [...photos]
    for (const f of Array.from(files)) {
      if (next.length >= 3) break
      if (f.size > 5 * 1024 * 1024) continue
      next.push(f)
    }
    setPhotos(next)
  }

  const submit = async () => {
    if (!bookingId || !canSubmit) return
    await submitMutation.mutateAsync({
      bookingId,
      rating,
      review: text.trim() || undefined,
      tags,
      anonymous,
    })
    navigate(`/dashboard/bookings?booking=${bookingId}`, { replace: true })
  }

  if (!bookingId) return null

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-10 max-w-[600px]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Write a review</h1>
          <Link to="/dashboard/bookings" className="text-sm text-gray-400 hover:text-gray-300">
            Skip for now
          </Link>
        </div>

        <Card className="border-gray-800 bg-gray-900/50 mb-6">
          <CardContent className="p-5">
            {isLoading || !summary ? (
              <p className="text-gray-400 text-sm">Loading booking…</p>
            ) : (
              <div className="flex gap-4 items-start">
                <img
                  src={summary.avatar}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover border border-gray-700"
                />
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{summary.name}</p>
                  <p className="text-sm text-gray-400">
                    {summary.dateLabel} · {summary.timeRange}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.serviceType} · {summary.durationHours}h
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">How was your experience?</h2>
            <div className="flex items-center gap-4">
              <StarRating value={rating} onChange={setRating} size="large" />
              <span className="text-sm font-medium text-gray-300">
                {rating ? RATING_LABELS[rating] : 'Select a rating'}
              </span>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Tell us more</h2>
              <span className="text-xs text-gray-500">{remaining} left</span>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder="Share details about your experience..."
              className="bg-dark-bg border-gray-700 min-h-[140px]"
              maxLength={1000}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Quick tags (optional)</h2>
            <ReviewTags selected={tags} onChange={setTags} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add photos (optional)</h2>
              <span className="text-xs text-gray-500">Up to 3 · 5MB each</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {photos.map((f, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover border border-gray-700"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-black/70 border border-gray-700 flex items-center justify-center"
                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4 text-gray-200" />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="h-20 w-20 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 flex items-center justify-center cursor-pointer hover:border-gray-500">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onPickPhotos(e.target.files)}
                  />
                  <ImagePlus className="h-6 w-6 text-gray-500" />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Photo upload is shown here, but saving photos server-side will be added next.
            </p>
          </section>

          <section className="space-y-2">
            <Checkbox
              checked={anonymous}
              onCheckedChange={(v) => setAnonymous(!!v)}
              label="Make review anonymous"
            />
            <p className="text-xs text-gray-500">
              Your first name and initial will be shown unless anonymous.
            </p>
          </section>

          <section className="space-y-3">
            <Button
              className="w-full py-6 text-base font-semibold"
              disabled={!canSubmit}
              loading={submitMutation.isPending}
              onClick={submit}
            >
              Submit review
            </Button>
            <div className="text-center">
              <Link to={`/dashboard/bookings?booking=${bookingId}`} className="text-sm text-gray-400 hover:text-gray-300">
                Back to booking details
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

