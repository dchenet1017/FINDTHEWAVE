import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, MapPinned, MoreVertical, Trophy, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useBusinessCrawlStats,
  useBusinessCrawls,
  useDeleteCrawl,
  useCancelCrawl,
  useDuplicateCrawl,
  type BusinessCrawlsTab,
} from '@/hooks/useBusinessCrawls'
import type { Crawl } from '@/types/crawl'
import { cn } from '@/lib/utils'

function statusBadge(crawl: Crawl) {
  if (crawl.status === 'CANCELLED') {
    return <Badge variant="destructive">Cancelled</Badge>
  }
  if (crawl.status === 'DRAFT' || !crawl.isPublished) {
    return <Badge variant="warning">Draft</Badge>
  }
  return <Badge className="bg-primary/20 text-primary border-primary/30">Published</Badge>
}

function CrawlRow({ crawl, onAction }: { crawl: Crawl; onAction: (action: string, c: Crawl) => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-dark-card p-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 gap-4 min-w-0">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-900">
          {crawl.imageUrl ? (
            <img src={crawl.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600">
              <MapPinned className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white truncate">{crawl.title}</h3>
            {statusBadge(crawl)}
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {(() => {
              try {
                return format(parseISO(crawl.startDate), 'PPp')
              } catch {
                return crawl.startDate
              }
            })()}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {crawl.currentAttendees}
              {crawl.maxAttendees != null ? ` / ${crawl.maxAttendees}` : ''} registered
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPinned className="h-3.5 w-3.5" />
              {crawl.stops.length} stops
            </span>
            <span className="inline-flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              {crawl.bonusPoints} bonus pts
            </span>
          </div>
        </div>
      </div>
      <DropdownMenu
        align="right"
        trigger={
          <Button variant="outline" size="icon" className="shrink-0 self-start sm:self-center">
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
      >
        <DropdownMenuItem onClick={() => onAction('view', crawl)}>View details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('edit', crawl)}>Edit crawl</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('attendees', crawl)}>View attendees</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('checkin', crawl)}>Check in attendees</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('duplicate', crawl)}>Duplicate crawl</DropdownMenuItem>
        {crawl.status !== 'CANCELLED' && crawl.status !== 'DRAFT' && (
          <DropdownMenuItem onClick={() => onAction('cancel', crawl)}>Cancel crawl</DropdownMenuItem>
        )}
        {crawl.status === 'DRAFT' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onClick={() => onAction('delete', crawl)}
            >
              Delete crawl
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenu>
    </div>
  )
}

export default function CrawlsManagementPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<BusinessCrawlsTab>('upcoming')
  const { data: stats, isLoading: statsLoading } = useBusinessCrawlStats()
  const { data: crawls = [], isLoading: listLoading } = useBusinessCrawls(tab)
  const deleteMut = useDeleteCrawl()
  const cancelMut = useCancelCrawl()
  const dupMut = useDuplicateCrawl()

  const onAction = (action: string, c: Crawl) => {
    switch (action) {
      case 'view':
        window.open(`/crawls/${c.id}`, '_blank', 'noopener,noreferrer')
        break
      case 'edit':
        navigate(`/business/crawls/${c.id}/edit`)
        break
      case 'attendees':
        navigate(`/business/crawls/${c.id}/attendees`)
        break
      case 'checkin':
        navigate(`/business/crawls/${c.id}/check-in`)
        break
      case 'duplicate':
        dupMut.mutate(c.id, { onSuccess: (copy) => navigate(`/business/crawls/${copy.id}/edit`) })
        break
      case 'cancel':
        if (window.confirm('Cancel this crawl? It will be unpublished.')) cancelMut.mutate(c.id)
        break
      case 'delete':
        if (window.confirm('Permanently delete this draft?')) deleteMut.mutate(c.id)
        break
      default:
        break
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bar Crawls</h1>
          <p className="mt-1 text-sm text-gray-400">
            Host a multi-stop crawl across participating businesses.
          </p>
        </div>
        <Link
          to="/business/crawls/create"
          className={cn(buttonVariants({ size: 'lg' }), 'shrink-0 text-center')}
        >
          Create Crawl
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Crawls', value: stats?.totalCrawls, icon: MapPinned },
          { label: 'Upcoming', value: stats?.upcomingCrawls, icon: CalendarDays },
          { label: 'Drafts', value: stats?.draftCrawls, icon: MoreVertical },
          { label: 'Total Attendees', value: stats?.totalAttendees, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-800 bg-dark-card p-4 flex flex-col gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-semibold">{statsLoading ? '—' : value ?? 0}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as BusinessCrawlsTab)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 sm:flex-none">
            Past
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex-1 sm:flex-none">
            Drafts
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {listLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : crawls.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-dark-card/50 px-6 py-20 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <MapPinned className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-white">No crawls yet</h2>
              <p className="mt-2 max-w-sm text-sm text-gray-400">
                Team up with other businesses to host a multi-stop bar crawl for your customers.
              </p>
              <Link to="/business/crawls/create" className={cn(buttonVariants({ size: 'lg' }), 'mt-6')}>
                Create your first crawl
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {crawls.map((c) => (
                <li key={c.id}>
                  <CrawlRow crawl={c} onAction={onAction} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
