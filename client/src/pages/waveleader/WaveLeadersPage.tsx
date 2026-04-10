import { useState, useCallback } from 'react'
import { LayoutGrid, List, Loader2, Search } from 'lucide-react'
import { WaveLeaderSearchBar } from '@/components/waveleader/WaveLeaderSearchBar'
import { WaveLeaderFilters } from '@/components/waveleader/WaveLeaderFilters'
import { WaveLeaderCard } from '@/components/waveleader/WaveLeaderCard'
import { Button } from '@/components/ui/Button'
import { useWaveLeaders } from '@/hooks/useWaveLeaders'
import { getCurrentPosition } from '@/lib/mapbox'
import { cn } from '@/lib/utils'

const DEFAULT_FILTERS = {
  page: 1,
  limit: 12,
  sortBy: 'rating' as const,
  sortOrder: 'desc' as const,
  minRate: 25,
  maxRate: 500,
}

export default function WaveLeadersPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const hasLocation = !!(userCoords || locationQuery.trim())
  const queryFilters = {
    ...filters,
    search: searchTerm.trim() || undefined,
    lat: userCoords?.lat,
    lng: userCoords?.lng,
    radiusMiles: filters.radiusMiles ?? (hasLocation ? 25 : undefined),
  }

  const { data, isLoading, isFetching } = useWaveLeaders(queryFilters)
  const waveLeaders = data?.waveLeaders ?? []
  const pagination = data?.pagination

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, page: 1 }))
  }, [])

  const handleUseMyLocation = useCallback(async () => {
    try {
      const pos = await getCurrentPosition()
      setUserCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      })
      setFilters((f) => ({ ...f, page: 1 }))
    } catch {
      setUserCoords(null)
    }
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSearchTerm('')
    setLocationQuery('')
    setUserCoords(null)
  }, [])

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero */}
      <section className="border-b border-gray-800 bg-dark-card/50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Find Your Perfect WaveLeader
          </h1>
          <p className="text-gray-400 text-center mb-6 max-w-xl mx-auto">
            Browse verified guides by specialty, rate, and location. Book a session that fits your goals.
          </p>
          <WaveLeaderSearchBar
            searchTerm={searchTerm}
            locationQuery={locationQuery}
            onSearchChange={setSearchTerm}
            onLocationChange={setLocationQuery}
            onUseMyLocation={handleUseMyLocation}
            onSearch={handleSearch}
            isLoading={isFetching}
            className="max-w-3xl mx-auto"
          />
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        <WaveLeaderFilters
          filters={filters}
          onChange={(partial) =>
            setFilters((f) => ({ ...f, ...partial, page: 1 }))
          }
          onClear={handleClearFilters}
          hasLocation={hasLocation}
        />

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              {pagination
                ? `${pagination.total} WaveLeader${pagination.total !== 1 ? 's' : ''} found`
                : 'Loading...'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-800 bg-dark-card p-4 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="h-14 w-14 rounded-full bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-700 rounded w-1/2" />
                      <div className="h-3 bg-gray-700 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : waveLeaders.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-dark-card p-12 text-center">
              <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">
                No WaveLeaders found
              </h2>
              <p className="text-gray-400 mb-4 max-w-md mx-auto">
                Try adjusting your filters or search terms. You can broaden specialty, increase distance, or remove the location to see all verified WaveLeaders.
              </p>
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'gap-4',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'flex flex-col'
                )}
              >
                {waveLeaders.map((wl) => (
                  <WaveLeaderCard
                    key={wl.id}
                    waveLeader={wl}
                    showDistance={hasLocation && (wl.distance != null)}
                    distance={wl.distance}
                  />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setFilters((f) => ({ ...f, page: f.page! - 1 }))
                    }
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-400 px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setFilters((f) => ({ ...f, page: f.page! + 1 }))
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
