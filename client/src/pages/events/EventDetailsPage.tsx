import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Share2,
  Star,
  Video,
} from 'lucide-react'
import { formatDuration, intervalToDuration } from 'date-fns'
import { toast } from 'sonner'
import { MapContainer } from '@/components/map/MapContainer'
import { MapMarker } from '@/components/map/MapMarker'
import { EventCard } from '@/components/events/EventCard'
import { EventRegistrationCard } from '@/components/events/EventRegistrationCard'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import {
  useEventDetails,
  useSimilarEvents,
  useMyEventRegistration,
} from '@/hooks/useEventRegistration'
import type { EventWaveLeaderDetail } from '@/types/event'
import { EVENT_CATEGORY_ICONS, categoryColor } from '@/components/events/eventMapConfig'
import { formatEventWhen, formatTicketPrice } from '@/utils/formatEvent'

const DESC_COLLAPSE_LEN = 480

function stripHtml(html: string) {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, '')
  const d = document.createElement('div')
  d.innerHTML = html
  return d.textContent || ''
}

function sanitizeDescription(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  })
}

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()
  const { data: event, isLoading, error } = useEventDetails(id)
  const { data: similarData } = useSimilarEvents(id)
  const { data: registration, isLoading: regLoading } = useMyEventRegistration(
    id,
    isAuthenticated
  )
  const [descExpanded, setDescExpanded] = useState(false)

  const wl = event?.featuredWaveLeader as EventWaveLeaderDetail | null | undefined

  const plainDescLen = useMemo(
    () => (event ? stripHtml(event.description).length : 0),
    [event]
  )
  const needsReadMore = plainDescLen > DESC_COLLAPSE_LEN

  const durationLabel = useMemo(() => {
    if (!event) return ''
    const d = intervalToDuration({
      start: new Date(event.startDate),
      end: new Date(event.endDate),
    })
    return formatDuration(d, { format: ['hours', 'minutes'] }) || '—'
  }, [event])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  const mapsUrl =
    event && !event.isVirtual
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : ''

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-dark-bg">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-white">
        <p className="text-gray-400">Event not found or unavailable.</p>
        <Link
          to="/events"
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 inline-flex border-gray-600')}
        >
          Back to events
        </Link>
      </div>
    )
  }

  const safeHtml = sanitizeDescription(event.description)
  const locationLine =
    event.venueName || event.address || event.business?.name || 'Location announced later'

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Hero */}
      <div className="relative h-[min(50vh,420px)] w-full overflow-hidden bg-gray-900">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full items-center justify-center text-8xl opacity-40"
            style={{ color: categoryColor(event.category) }}
          >
            {EVENT_CATEGORY_ICONS[event.category]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />
        <div className="absolute left-4 top-4 z-10">
          <Link
            to="/events"
            className={cn(
              buttonVariants({ variant: 'secondary', size: 'sm' }),
              'gap-2 bg-dark-card/90 backdrop-blur'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Events
          </Link>
        </div>
        <div className="absolute bottom-6 left-4 right-4 flex flex-wrap gap-2">
          <Badge
            className="border-0"
            style={{ backgroundColor: categoryColor(event.category) }}
          >
            {EVENT_CATEGORY_ICONS[event.category]} {event.category.replace(/_/g, ' ')}
          </Badge>
          {event.isFeatured && (
            <Badge className="gap-1 border-amber-500/50 bg-amber-500/20 text-amber-200">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
          {event.isVirtual && (
            <Badge className="gap-1 bg-cyan-600/80">
              <Video className="h-3 w-3" />
              Virtual
            </Badge>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-10 lg:col-span-2">
            <header className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{event.title}</h1>
              {event.business?.id && (
                <p className="text-lg text-gray-400">
                  Hosted by{' '}
                  <Link
                    to={`/business/${event.business.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {event.business.name}
                  </Link>
                </p>
              )}
              <p className="text-gray-300">{formatEventWhen(event.startDate)}</p>
              <div className="flex flex-wrap items-start gap-2 text-gray-400">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                <span>
                  {locationLine}
                  {!event.isVirtual && mapsUrl && (
                    <>
                      {' · '}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Open in Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </span>
              </div>
              {event.isVirtual && event.virtualLink && (
                <a
                  href={event.virtualLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:underline"
                >
                  <Video className="h-4 w-4" />
                  Join link
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </header>

            <section>
              <h2 className="mb-3 text-lg font-semibold">About</h2>
              <div
                className={cn(
                  'max-w-none space-y-3 text-gray-300 [&_a]:text-primary [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-white [&_li]:ml-4 [&_ol]:list-decimal [&_p]:leading-relaxed [&_ul]:list-disc',
                  !descExpanded && needsReadMore && 'max-h-[14rem] overflow-hidden'
                )}
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
              {needsReadMore && (
                <Button
                  type="button"
                  variant="link"
                  className="mt-2 h-auto p-0 text-primary"
                  onClick={() => setDescExpanded((e) => !e)}
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </Button>
              )}
            </section>

            {wl && (
              <section className="rounded-xl border border-gray-800 bg-dark-card p-6">
                <h2 className="mb-4 text-lg font-semibold">Featured WaveLeader</h2>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gray-700 bg-gray-800">
                    {wl.user?.avatar ? (
                      <img src={wl.user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-gray-500">
                        {(wl.displayName || '?').slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xl font-semibold">{wl.displayName}</p>
                    <p className="text-sm text-primary">{wl.specialty}</p>
                    <p className="text-sm text-gray-400">
                      ★ {Number(wl.rating ?? 0).toFixed(1)} · {wl.totalReviews ?? 0} reviews
                    </p>
                    {wl.description && (
                      <p className="line-clamp-3 text-sm text-gray-400">{wl.description}</p>
                    )}
                    <Link
                      to={`/waveleader/${wl.id}/profile`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3 border-gray-600')}
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {(event.highlights?.length ||
              event.whatsIncluded?.length ||
              event.whatToBring?.length) && (
              <section className="grid gap-6 sm:grid-cols-3">
                {!!event.highlights?.length && (
                  <div>
                    <h3 className="mb-2 font-semibold text-white">What to expect</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
                      {event.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!!event.whatsIncluded?.length && (
                  <div>
                    <h3 className="mb-2 font-semibold text-white">What&apos;s included</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
                      {event.whatsIncluded.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!!event.whatToBring?.length && (
                  <div>
                    <h3 className="mb-2 font-semibold text-white">What to bring</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
                      {event.whatToBring.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            <section>
              <h2 className="mb-4 text-lg font-semibold">Location</h2>
              <div className="space-y-3 rounded-xl border border-gray-800 bg-dark-card p-4">
                <p className="font-medium">{event.venueName || event.business?.name}</p>
                <p className="text-sm text-gray-400">{event.address || event.business?.address}</p>
                {!event.isVirtual && (
                  <>
                    <div className="h-56 overflow-hidden rounded-lg border border-gray-800">
                      <MapContainer
                        className="h-full rounded-none border-0"
                        showControls={false}
                        showStyleSwitcher={false}
                        showUserLocation={false}
                        initialCenter={[event.longitude, event.latitude]}
                        initialZoom={14}
                      >
                        {(map) => (
                          <MapMarker map={map} position={[event.longitude, event.latitude]} type="OTHER" />
                        )}
                      </MapContainer>
                    </div>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: 'default' }), 'inline-flex w-full sm:w-auto')}
                      >
                        Get directions
                      </a>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <EventRegistrationCard
              event={event}
              registration={registration}
              registrationLoading={regLoading}
              isAuthenticated={isAuthenticated}
            />

            <div className="rounded-xl border border-gray-800 bg-dark-card p-5 space-y-3">
              <h3 className="font-semibold text-white">Quick info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Category</dt>
                  <dd>{event.category.replace(/_/g, ' ')}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Starts</dt>
                  <dd className="text-right">{formatEventWhen(event.startDate)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Duration</dt>
                  <dd>{durationLabel}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Price</dt>
                  <dd>{formatTicketPrice(event.ticketPrice)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Capacity</dt>
                  <dd>
                    {event.maxAttendees == null ? 'Unlimited' : `${event.maxAttendees} max`}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Format</dt>
                  <dd>{event.isVirtual ? 'Virtual' : 'In person'}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-gray-800 bg-dark-card p-5 space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Share2 className="h-4 w-4" />
                Share
              </h3>
              <div className="flex flex-col gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full border-gray-600')}
                >
                  Share on X
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full border-gray-600')}
                >
                  Share on Facebook
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-600"
                  onClick={copyLink}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </Button>
                <a
                  href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Check out this event: ${shareUrl}`)}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full border-gray-600')}
                >
                  <Mail className="mr-2 inline h-4 w-4" />
                  Email a friend
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Similar */}
        {similarData?.items && similarData.items.length > 0 && (
          <section className="mt-16 border-t border-gray-800 pt-12">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Similar events</h2>
              <Link to="/events" className="text-sm text-primary hover:underline">
                View all events
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similarData.items.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
