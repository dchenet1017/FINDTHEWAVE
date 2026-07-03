import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, MapPinned, Trophy, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button, buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useCrawlDetails, useMyCrawlRegistration, useRegisterForCrawl, useCancelCrawlRegistration } from '@/hooks/useCrawls'

function formatWhen(iso: string) {
  try {
    return format(parseISO(iso), 'PPPp')
  } catch {
    return iso
  }
}

export default function CrawlDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()
  const { data: crawl, isLoading, error } = useCrawlDetails(id)
  const { data: registration, isLoading: regLoading } = useMyCrawlRegistration(id, isAuthenticated)
  const registerMut = useRegisterForCrawl()
  const cancelMut = useCancelCrawlRegistration()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-dark-bg">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !crawl) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-white">
        <p className="text-gray-400">Crawl not found or unavailable.</p>
        <Link to="/crawls" className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 inline-flex border-gray-600')}>
          Back to crawls
        </Link>
      </div>
    )
  }

  const isActive = !!registration && registration.status !== 'CANCELLED'
  const isComplete = registration?.bonusAwarded
  const spotsLeft = crawl.maxAttendees != null ? Math.max(0, crawl.maxAttendees - crawl.currentAttendees) : null
  const soldOut = spotsLeft != null && spotsLeft <= 0 && !isActive

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="relative h-[min(40vh,320px)] w-full overflow-hidden bg-gray-900">
        {crawl.imageUrl ? (
          <img src={crawl.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-700">
            <MapPinned className="h-20 w-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />
        <div className="absolute left-4 top-4 z-10">
          <Link
            to="/crawls"
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'gap-2 bg-dark-card/90 backdrop-blur')}
          >
            <ArrowLeft className="h-4 w-4" />
            Crawls
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <header className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{crawl.title}</h1>
              {crawl.hostBusiness?.name && (
                <p className="text-lg text-gray-400">
                  Hosted by <span className="font-medium text-primary">{crawl.hostBusiness.name}</span>
                </p>
              )}
              <p className="text-gray-300">{formatWhen(crawl.startDate)}</p>
            </header>

            {crawl.description && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">About</h2>
                <p className="whitespace-pre-line text-gray-300">{crawl.description}</p>
              </section>
            )}

            <section>
              <h2 className="mb-4 text-lg font-semibold">Stops</h2>
              <ol className="space-y-3">
                {crawl.stops
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((stop, i) => (
                    <li
                      key={stop.id}
                      className="flex items-center gap-4 rounded-xl border border-gray-800 bg-dark-card p-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{stop.business?.name || 'Business'}</p>
                        <p className="text-sm text-gray-500">
                          {stop.business?.address}
                          {stop.business?.city ? `, ${stop.business.city}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
              </ol>
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-gray-800 bg-dark-card p-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <Users className="h-4 w-4" />
                  {crawl.currentAttendees}
                  {crawl.maxAttendees != null ? ` / ${crawl.maxAttendees}` : ''} registered
                </span>
                <span className="inline-flex items-center gap-1 text-primary">
                  <Trophy className="h-4 w-4" />+{crawl.bonusPoints} pts
                </span>
              </div>

              {!isAuthenticated ? (
                <Link to="/login" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
                  Log in to register
                </Link>
              ) : regLoading ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : isActive ? (
                <div className="space-y-2">
                  {isComplete ? (
                    <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                      You completed this crawl! Bonus awarded.
                    </p>
                  ) : (
                    <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                      You're registered. Check in at each stop to earn the bonus.
                    </p>
                  )}
                  {!isComplete && (
                    <Button
                      variant="outline"
                      className="w-full border-gray-600"
                      loading={cancelMut.isPending}
                      onClick={() => id && cancelMut.mutate(id)}
                    >
                      Cancel registration
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={soldOut}
                  loading={registerMut.isPending}
                  onClick={() => id && registerMut.mutate(id)}
                >
                  {soldOut ? 'Sold out' : 'Register for this crawl'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
