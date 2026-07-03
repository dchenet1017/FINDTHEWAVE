import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, MapPinned, Plus, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button, buttonVariants } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useCrawls } from '@/hooks/useCrawls'
import { defaultCrawlDiscoveryFilters, type Crawl, type CrawlSortOption } from '@/types/crawl'

function useDebouncedValue<T>(value: T, ms: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return d
}

function CrawlCard({ crawl }: { crawl: Crawl }) {
  return (
    <Link
      to={`/crawls/${crawl.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-dark-card transition hover:border-primary/50"
    >
      <div className="h-36 w-full bg-gray-900">
        {crawl.imageUrl ? (
          <img src={crawl.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-700">
            <MapPinned className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-white">{crawl.title}</h3>
        <p className="text-sm text-gray-400">
          {(() => {
            try {
              return format(parseISO(crawl.startDate), 'PPp')
            } catch {
              return crawl.startDate
            }
          })()}
        </p>
        <p className="line-clamp-2 text-sm text-gray-500">{crawl.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Badge variant="secondary">{crawl.stops.length} stops</Badge>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            +{crawl.bonusPoints} bonus pts
          </Badge>
        </div>
      </div>
    </Link>
  )
}

export default function CrawlsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [filters, setFilters] = useState(defaultCrawlDiscoveryFilters)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  useEffect(() => {
    setFilters((f) => ({ ...f, search: debouncedSearch, page: 1 }))
  }, [debouncedSearch])

  const { data, isLoading, error, refetch } = useCrawls(filters)
  const items = data?.items ?? []
  const hasMore = data ? items.length < data.total : false
  const isBusiness = isAuthenticated && user?.role === 'BUSINESS'

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-dark-bg text-white">
      <div className="border-b border-gray-800 bg-dark-card/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bar Crawls</h1>
            <p className="text-sm text-gray-400">Hit multiple spots in one night, earn a bonus for finishing</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search crawls…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-gray-700 bg-dark-bg pl-10"
              />
            </div>
            <Select
              value={filters.sort}
              onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as CrawlSortOption, page: 1 }))}
            >
              <SelectTrigger className="w-full border-gray-700 bg-dark-bg sm:w-[180px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soon">Happening Soon</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
            {isBusiness && (
              <Link
                to="/business/crawls/create"
                className={cn(buttonVariants({ variant: 'default' }), 'inline-flex shrink-0 gap-1')}
              >
                <Plus className="h-4 w-4" />
                Create Crawl
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 p-4">
        <p className="text-sm text-gray-400">{isLoading ? 'Loading…' : `${data?.total ?? 0} crawls`}</p>

        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            Could not load crawls.{' '}
            <button type="button" className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((c) => (
              <CrawlCard key={c.id} crawl={c} />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && !error && (
          <p className="py-16 text-center text-gray-500">No crawls match your search.</p>
        )}

        {hasMore && (
          <div className="flex justify-center pb-8">
            <Button
              variant="outline"
              className="border-gray-600"
              onClick={() => setFilters((f) => ({ ...f, limit: f.limit + 24 }))}
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
